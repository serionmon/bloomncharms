import crypto from 'crypto';
import { config } from '../common/config.js';
import { getAdminSupabaseClient } from '../common/supabase.js';
import {
  ShippingStatus,
  ShipmentDetailsDTO,
  ShipmentTrackingDTO,
  CreateShipmentInput,
  TrackingCheckpoint,
} from './types.js';
import { ShiprocketClient, ShiprocketOrderPayload } from './shiprocket.js';

// In-memory fallback stores for test and offline environments
const offlineShipments = new Map<string, any>();
const processedWebhookEvents = new Set<string>();

export class ShippingService {
  /**
   * Creates a shipment with Shiprocket for a valid order.
   */
  public static async createShipment(
    orderId: string,
    input?: Partial<CreateShipmentInput>
  ): Promise<ShipmentDetailsDTO> {
    const hasSupabase = Boolean(
      config.SUPABASE_URL && (config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY)
    );

    let order: any = null;
    const client = hasSupabase ? getAdminSupabaseClient() : null;

    if (client) {
      const { data, error } = await client
        .from('orders')
        .select(`
          id,
          order_number,
          user_id,
          customer_name,
          customer_email,
          customer_phone,
          shipping_address,
          order_status,
          payment_status,
          payment_method,
          subtotal,
          discount_amount,
          shipping_fee,
          total_amount,
          shipping_provider,
          shipment_id,
          shiprocket_order_id,
          awb_code,
          courier_name,
          shipping_status,
          tracking_url,
          shipped_at,
          delivered_at,
          order_items (
            id,
            product_name_snapshot,
            product_sku_snapshot,
            quantity,
            unit_price,
            line_total
          )
        `)
        .eq('id', orderId)
        .maybeSingle();

      if (error || !data) {
        const err: any = new Error(`Order '${orderId}' not found.`);
        err.statusCode = 404;
        throw err;
      }
      order = data;
    } else {
      order = offlineShipments.get(orderId);
      if (!order) {
        // Fallback dummy order for offline tests
        order = {
          id: orderId,
          order_number: `BC-TEST-${orderId.substring(0, 8)}`,
          user_id: 'user-owner-123',
          customer_name: 'Mira Nair',
          customer_email: 'mira@example.com',
          customer_phone: '9876543210',
          shipping_address: {
            addressLine1: '88 Rose Garden Estate',
            city: 'Pune',
            state: 'Maharashtra',
            postalCode: '411001',
            country: 'IN',
          },
          order_status: 'confirmed',
          payment_status: 'paid',
          payment_method: 'full_online',
          subtotal: 1000,
          total_amount: 1000,
          shipping_status: 'unfulfilled',
          order_items: [
            {
              product_name_snapshot: 'Artisanal Rose Bouquet',
              product_sku_snapshot: 'BOUQ-ROSE-01',
              quantity: 1,
              unit_price: 1000,
            },
          ],
        };
      }
    }

    // 1. Duplicate shipment protection
    const currentShipmentId = order.shipment_id || order.shipmentId;
    const currentShippingStatus = order.shipping_status || order.shippingStatus || 'unfulfilled';
    if (currentShipmentId && currentShippingStatus !== 'unfulfilled' && currentShippingStatus !== 'cancelled') {
      const err: any = new Error(
        `Order '${order.order_number || order.orderNumber}' already has active shipment '${currentShipmentId}' (${currentShippingStatus}).`
      );
      err.statusCode = 400;
      throw err;
    }

    const addr = order.shipping_address as any;
    const nameParts = (order.customer_name || 'Customer').split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || 'Atelier';

    // 2. Authoritative payment method mapping for Shiprocket
    const isPrepaid = order.payment_method === 'full_online' || order.payment_status === 'paid';
    const isHybrid = order.payment_method === 'hybrid';
    const codPayable = isHybrid ? Math.floor(Number(order.total_amount) / 2) : Number(order.total_amount);

    const items = (order.order_items || []).map((item: any) => ({
      name: item.product_name_snapshot || 'Artisanal Flower',
      sku: item.product_sku_snapshot || 'SKU-BLOOM',
      units: item.quantity || 1,
      selling_price: Number(item.unit_price || 0),
    }));

    const payload: ShiprocketOrderPayload = {
      order_id: order.order_number,
      order_date: new Date().toISOString().split('T')[0],
      pickup_location: input?.pickupLocation || config.SHIPROCKET_PICKUP_LOCATION,
      billing_customer_name: firstName,
      billing_last_name: lastName,
      billing_address: addr?.addressLine1 || addr?.address || 'Studio Address',
      billing_address_2: addr?.addressLine2 || addr?.apartment || '',
      billing_city: addr?.city || 'Bengaluru',
      billing_pincode: addr?.postalCode || addr?.pinCode || '560001',
      billing_state: addr?.state || 'Karnataka',
      billing_country: addr?.country || 'India',
      billing_email: order.customer_email || 'orders@bloomncharms.com',
      billing_phone: order.customer_phone || '9999999999',
      shipping_is_billing: true,
      order_items: items.length > 0 ? items : [{ name: 'Floral Bouquet', sku: 'SKU-01', units: 1, selling_price: Number(order.total_amount) }],
      payment_method: isPrepaid ? 'Prepaid' : 'COD',
      sub_total: isPrepaid ? Number(order.total_amount) : codPayable,
      length: input?.lengthCm || 15,
      breadth: input?.breadthCm || 15,
      height: input?.heightCm || 10,
      weight: input?.weightKg || 0.5,
    };

    // 3. Call Shiprocket API
    const response = await ShiprocketClient.createOrder(payload);

    const shipmentIdStr = String(response.shipment_id);
    const shiprocketOrderIdStr = String(response.order_id);
    const shippedAt = new Date().toISOString();

    // 4. Automatically request AWB
    let awbCode = response.awb_code;
    let courierName = response.courier_name;
    let trackingUrl = response.awb_code ? `https://shiprocket.co/tracking/${response.awb_code}` : undefined;

    if (!awbCode) {
      try {
        const awbRes = await ShiprocketClient.assignAwb(response.shipment_id);
        awbCode = awbRes.awb_code;
        courierName = awbRes.courier_name;
        trackingUrl = awbRes.tracking_url;
      } catch (err: any) {
        console.warn(`[ShippingService] AWB auto-assignment deferred for shipment ${shipmentIdStr}:`, err?.message || err);
      }
    }

    const shippingStatus: ShippingStatus = 'manifested';

    // 5. Update database record
    if (client) {
      await (client.from as any)('orders')
        .update({
          shipping_provider: 'shiprocket',
          shipment_id: shipmentIdStr,
          shiprocket_order_id: shiprocketOrderIdStr,
          awb_code: awbCode || null,
          courier_name: courierName || null,
          shipping_status: shippingStatus,
          tracking_url: trackingUrl || null,
          shipped_at: shippedAt,
        })
        .eq('id', order.id);
    }

    const shipmentRecord: ShipmentDetailsDTO = {
      id: order.id,
      orderId: order.id,
      orderNumber: order.order_number,
      shippingProvider: 'shiprocket',
      shipmentId: shipmentIdStr,
      shiprocketOrderId: shiprocketOrderIdStr,
      awbCode,
      courierName,
      shippingStatus,
      trackingUrl,
      shippedAt,
    };

    const offlineRecord = {
      ...order,
      ...shipmentRecord,
      shipping_provider: 'shiprocket',
      shipment_id: shipmentIdStr,
      shiprocket_order_id: shiprocketOrderIdStr,
      awb_code: awbCode,
      courier_name: courierName,
      shipping_status: shippingStatus,
      tracking_url: trackingUrl,
      shipped_at: shippedAt,
    };

    offlineShipments.set(order.id, offlineRecord);
    offlineShipments.set(order.order_number, offlineRecord);

    return shipmentRecord;
  }

  /**
   * Assigns or refreshes AWB code for a created shipment.
   */
  public static async assignAwb(
    orderId: string,
    courierId?: number
  ): Promise<{ awbCode: string; courierName: string; trackingUrl?: string }> {
    const hasSupabase = Boolean(
      config.SUPABASE_URL && (config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY)
    );
    const client = hasSupabase ? getAdminSupabaseClient() : null;

    let shipmentId = '';
    let dbOrderId = orderId;

    if (client) {
      const { data, error } = await (client.from as any)('orders')
        .select('id, order_number, shipment_id')
        .or(`id.eq.${orderId},order_number.eq.${orderId}`)
        .maybeSingle();

      if (error || !data || !data.shipment_id) {
        const err: any = new Error(`No active shipment found for order '${orderId}'.`);
        err.statusCode = 404;
        throw err;
      }
      shipmentId = data.shipment_id;
      dbOrderId = data.id;
    } else {
      const existing = offlineShipments.get(orderId);
      shipmentId = existing?.shipment_id || `SR${Date.now()}`;
    }

    const res = await ShiprocketClient.assignAwb(shipmentId, courierId);

    if (client) {
      await (client.from as any)('orders')
        .update({
          awb_code: res.awb_code,
          courier_name: res.courier_name,
          tracking_url: res.tracking_url || null,
          shipping_status: 'in_transit',
        })
        .eq('id', dbOrderId);
    }

    return {
      awbCode: res.awb_code,
      courierName: res.courier_name,
      trackingUrl: res.tracking_url,
    };
  }

  /**
   * Retrieves shipment tracking details (safe for customers and admin tracking).
   */
  public static async getShipmentTracking(
    orderIdentifier: string,
    requestingUserId?: string,
    isAdmin: boolean = false
  ): Promise<ShipmentTrackingDTO> {
    const hasSupabase = Boolean(
      config.SUPABASE_URL && (config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY)
    );
    const client = hasSupabase ? getAdminSupabaseClient() : null;

    let order: any = null;

    if (client) {
      const { data, error } = await client
        .from('orders')
        .select(`
          id,
          order_number,
          user_id,
          shipping_address,
          shipping_provider,
          shipment_id,
          awb_code,
          courier_name,
          shipping_status,
          tracking_url,
          shipped_at,
          delivered_at
        `)
        .or(`order_number.eq.${orderIdentifier.trim()},id.eq.${orderIdentifier.trim()}`)
        .maybeSingle();

      if (error || !data) {
        const err: any = new Error(`Order '${orderIdentifier}' not found.`);
        err.statusCode = 404;
        throw err;
      }
      order = data;
    } else {
      order = offlineShipments.get(orderIdentifier) || {
        order_number: orderIdentifier,
        user_id: requestingUserId || null,
        shipping_address: { city: 'Bengaluru', state: 'Karnataka' },
        shipping_status: 'in_transit',
        courier_name: 'Blue Dart Express',
        awb_code: `SR${Date.now()}`,
        tracking_url: `https://shiprocket.co/tracking/SR${Date.now()}`,
        shipped_at: new Date().toISOString(),
      };
    }

    const finalOrderNumber = order.order_number || order.orderNumber || orderIdentifier;
    const finalShippingStatus = (order.shipping_status || order.shippingStatus || 'unfulfilled') as ShippingStatus;
    const finalCourierName = order.courier_name || order.courierName || undefined;
    const finalAwbCode = order.awb_code || order.awbCode || undefined;
    const finalTrackingUrl = order.tracking_url || order.trackingUrl || undefined;
    const finalShippedAt = order.shipped_at || order.shippedAt || undefined;
    const finalDeliveredAt = order.delivered_at || order.deliveredAt || undefined;
    const finalUserId = order.user_id || order.userId;

    // Customer IDOR Protection: If authenticated non-admin queries by internal UUID, verify user_id
    if (requestingUserId && !isAdmin && finalUserId && finalUserId !== requestingUserId) {
      const err: any = new Error('Unauthorized to view tracking for this order.');
      err.statusCode = 403;
      throw err;
    }

    const addr = (order.shipping_address || {}) as any;
    const checkpoints: TrackingCheckpoint[] = [];

    // If AWB exists, attempt provider live tracking
    if (finalAwbCode) {
      try {
        const trackingData = await ShiprocketClient.trackByAwb(finalAwbCode);
        const activities =
          trackingData?.tracking_data?.shipment_track_activities ||
          trackingData?.tracking_data?.shipment_track ||
          [];

        for (const act of activities) {
          checkpoints.push({
            timestamp: act.date || act.timestamp || new Date().toISOString(),
            location: act.location || 'Hub',
            status: act.status || act.current_status || 'In Transit',
            activity: act.activity || 'Package in transit',
          });
        }
      } catch (err) {
        // Fallback default checkpoint
      }
    }

    if (checkpoints.length === 0) {
      checkpoints.push({
        timestamp: finalShippedAt || new Date().toISOString(),
        location: addr.city || 'Atelier Studio',
        status: finalShippingStatus || 'Manifested',
        activity:
          finalShippingStatus === 'delivered'
            ? 'Package delivered to recipient'
            : finalShippingStatus === 'in_transit'
            ? 'Package dispatched with courier partner'
            : 'Artisanal order crafted and manifested for dispatch',
      });
    }

    return {
      orderNumber: finalOrderNumber,
      shippingStatus: finalShippingStatus,
      courierName: finalCourierName,
      awbCode: finalAwbCode,
      trackingUrl: finalTrackingUrl,
      shippedAt: finalShippedAt,
      deliveredAt: finalDeliveredAt,
      destinationCity: addr.city || undefined,
      destinationState: addr.state || undefined,
      checkpoints,
    };
  }

  /**
   * Cancels a shipment order with Shiprocket.
   */
  public static async cancelShipment(orderId: string): Promise<{ success: boolean; message: string }> {
    const hasSupabase = Boolean(
      config.SUPABASE_URL && (config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY)
    );
    const client = hasSupabase ? getAdminSupabaseClient() : null;

    let order: any = null;

    if (client) {
      const { data, error } = await client
        .from('orders')
        .select('id, order_number, shiprocket_order_id, shipping_status')
        .or(`id.eq.${orderId},order_number.eq.${orderId}`)
        .maybeSingle();

      if (error || !data) {
        const err: any = new Error(`Order '${orderId}' not found.`);
        err.statusCode = 404;
        throw err;
      }
      order = data;
    } else {
      order = offlineShipments.get(orderId) || {
        id: orderId,
        order_number: orderId,
        shiprocket_order_id: '123456',
        shipping_status: 'manifested',
      };
    }

    if (order.shipping_status === 'delivered') {
      const err: any = new Error('Delivered orders cannot be cancelled.');
      err.statusCode = 400;
      throw err;
    }

    if (order.shiprocket_order_id) {
      await ShiprocketClient.cancelOrder(order.shiprocket_order_id);
    }

    if (client) {
      await (client.from as any)('orders')
        .update({
          shipping_status: 'cancelled',
        })
        .eq('id', order.id);
    }

    if (offlineShipments.has(orderId)) {
      const ex = offlineShipments.get(orderId);
      ex.shipping_status = 'cancelled';
    }

    return {
      success: true,
      message: `Shipment for order '${order.order_number}' cancelled successfully.`,
    };
  }

  /**
   * Handles inbound webhook updates from Shiprocket with token/HMAC verification & idempotency.
   */
  public static async handleWebhook(
    payload: any,
    webhookTokenOrSignature?: string
  ): Promise<{ status: string; eventId?: string }> {
    // 1. Signature / Token verification
    if (config.SHIPROCKET_WEBHOOK_SECRET && config.SHIPROCKET_WEBHOOK_SECRET.trim().length > 0) {
      if (!webhookTokenOrSignature) {
        const err: any = new Error('Missing Shiprocket webhook authorization header.');
        err.statusCode = 401;
        throw err;
      }

      // Check direct secret match or HMAC match
      const secret = config.SHIPROCKET_WEBHOOK_SECRET.trim();
      const directMatch = webhookTokenOrSignature === secret;

      let hmacMatch = false;
      try {
        const computedHmac = crypto
          .createHmac('sha256', secret)
          .update(typeof payload === 'string' ? payload : JSON.stringify(payload))
          .digest('hex');
        if (webhookTokenOrSignature.length === computedHmac.length) {
          hmacMatch = crypto.timingSafeEqual(
            Buffer.from(webhookTokenOrSignature, 'utf8'),
            Buffer.from(computedHmac, 'utf8')
          );
        }
      } catch {}

      if (!directMatch && !hmacMatch) {
        const err: any = new Error('Invalid Shiprocket webhook signature.');
        err.statusCode = 400;
        throw err;
      }
    }

    // 2. Extract Event Identifiers
    const eventId =
      payload.event_id ||
      payload.sr_event_id ||
      (payload.awb && payload.current_status ? `${payload.awb}:${payload.current_status}` : `EVT-${Date.now()}`);

    // 3. Webhook Idempotency Guard
    if (processedWebhookEvents.has(eventId)) {
      return { status: 'already_processed', eventId };
    }

    const orderNumber = payload.order_id || payload.order_number;
    const awbCode = payload.awb || payload.awb_code;
    const currentStatus = String(payload.current_status || payload.status || '').toUpperCase();
    const courierName = payload.courier_name || payload.courier;
    const location = payload.location || payload.current_location;

    // Map Shiprocket status string to Bloomncharms ShippingStatus
    let shippingStatus: ShippingStatus = 'in_transit';
    if (currentStatus.includes('DELIVERED')) {
      shippingStatus = 'delivered';
    } else if (currentStatus.includes('OUT FOR DELIVERY')) {
      shippingStatus = 'out_for_delivery';
    } else if (currentStatus.includes('CANCEL')) {
      shippingStatus = 'cancelled';
    } else if (currentStatus.includes('RTO')) {
      shippingStatus = 'rto';
    }

    const hasSupabase = Boolean(
      config.SUPABASE_URL && (config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY)
    );
    const client = hasSupabase ? getAdminSupabaseClient() : null;

    if (client && (orderNumber || awbCode)) {
      // Find matching order
      let query = (client.from as any)('orders').select('id, order_number');
      if (orderNumber) {
        query = query.eq('order_number', orderNumber);
      } else if (awbCode) {
        query = query.eq('awb_code', awbCode);
      }

      const { data: matchedOrder } = await query.maybeSingle();

      if (matchedOrder) {
        const updatePayload: any = {
          shipping_status: shippingStatus,
        };
        if (awbCode) updatePayload.awb_code = awbCode;
        if (courierName) updatePayload.courier_name = courierName;
        if (shippingStatus === 'delivered') {
          updatePayload.delivered_at = new Date().toISOString();
        }

        await (client.from as any)('orders').update(updatePayload).eq('id', matchedOrder.id);

        // Record in shipment_events table
        try {
          await (client.from as any)('shipment_events').insert({
            order_id: matchedOrder.id,
            order_number: matchedOrder.order_number,
            event_id: eventId,
            event_type: currentStatus,
            status: shippingStatus,
            location: location || null,
            courier_name: courierName || null,
            awb_code: awbCode || null,
            raw_payload: payload,
          });
        } catch (err: any) {
          // Ignore duplicate DB insert error
        }
      }
    }

    processedWebhookEvents.add(eventId);
    return { status: 'processed', eventId };
  }
}
