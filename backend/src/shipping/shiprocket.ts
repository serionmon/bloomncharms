import { config } from '../common/config.js';

export interface ShiprocketOrderPayload {
  order_id: string;
  order_date: string;
  pickup_location: string;
  channel_id?: string;
  comment?: string;
  billing_customer_name: string;
  billing_last_name: string;
  billing_address: string;
  billing_address_2?: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  order_items: Array<{
    name: string;
    sku: string;
    units: number;
    selling_price: number;
    discount?: number;
    tax?: number;
  }>;
  payment_method: 'Prepaid' | 'COD';
  shipping_charges?: number;
  giftwrap_charges?: number;
  transaction_charges?: number;
  total_discount?: number;
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}

export interface ShiprocketCreateOrderResponse {
  order_id: number;
  shipment_id: number;
  status: string;
  status_code: number;
  onboarding_completed_now: number;
  awb_code?: string;
  courier_company_id?: number;
  courier_name?: string;
}

export class ShiprocketClient {
  private static cachedToken: string | null = null;
  private static tokenExpiry: number = 0;

  public static isConfigured(): boolean {
    return Boolean(
      config.SHIPROCKET_API_TOKEN ||
        (config.SHIPROCKET_EMAIL && config.SHIPROCKET_PASSWORD && !config.SHIPROCKET_PASSWORD.includes('your_shiprocket'))
    );
  }

  public static async getAuthToken(): Promise<string | null> {
    if (config.SHIPROCKET_API_TOKEN) {
      return config.SHIPROCKET_API_TOKEN;
    }

    if (!config.SHIPROCKET_EMAIL || !config.SHIPROCKET_PASSWORD || config.SHIPROCKET_PASSWORD.includes('your_shiprocket')) {
      return null;
    }

    const now = Date.now();
    if (this.cachedToken && this.tokenExpiry > now + 60000) {
      return this.cachedToken;
    }

    try {
      const resp = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: config.SHIPROCKET_EMAIL,
          password: config.SHIPROCKET_PASSWORD,
        }),
      });

      if (!resp.ok) {
        console.error('[ShiprocketClient] Authentication failed:', resp.status, resp.statusText);
        return null;
      }

      const data = (await resp.json()) as any;
      if (data && data.token) {
        this.cachedToken = data.token;
        this.tokenExpiry = now + 9 * 24 * 3600 * 1000; // 9 days cache
        return this.cachedToken;
      }
    } catch (err: any) {
      console.error('[ShiprocketClient] Auth login network error:', err?.message || err);
    }

    return null;
  }

  /**
   * Creates an adhoc order in Shiprocket
   */
  public static async createOrder(payload: ShiprocketOrderPayload): Promise<ShiprocketCreateOrderResponse> {
    const token = await this.getAuthToken();

    // Offline / Mock fallback when credentials are not configured
    if (!token) {
      const mockShipmentId = Math.floor(10000000 + Math.random() * 90000000);
      const mockOrderId = Math.floor(1000000 + Math.random() * 9000000);
      return {
        order_id: mockOrderId,
        shipment_id: mockShipmentId,
        status: 'NEW',
        status_code: 1,
        onboarding_completed_now: 0,
      };
    }

    const resp = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      throw new Error(`Shiprocket createOrder failed (${resp.status}): ${errorText}`);
    }

    return (await resp.json()) as ShiprocketCreateOrderResponse;
  }

  /**
   * Assigns AWB and courier to a shipment
   */
  public static async assignAwb(shipmentId: number | string, courierId?: number): Promise<{ awb_code: string; courier_name: string; tracking_url?: string }> {
    const token = await this.getAuthToken();

    if (!token) {
      const mockAwb = `SR${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      return {
        awb_code: mockAwb,
        courier_name: 'Blue Dart Express',
        tracking_url: `https://shiprocket.co/tracking/${mockAwb}`,
      };
    }

    const body: any = { shipment_id: shipmentId };
    if (courierId) body.courier_id = courierId;

    const resp = await fetch('https://apiv2.shiprocket.in/v1/external/courier/assign/awb', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      throw new Error(`Shiprocket assignAwb failed (${resp.status}): ${errorText}`);
    }

    const data = (await resp.json()) as any;
    const responseData = data?.response?.data || data?.data || data;
    return {
      awb_code: responseData.awb_code || `SR${shipmentId}`,
      courier_name: responseData.courier_name || 'Shiprocket Courier Partner',
      tracking_url: `https://shiprocket.co/tracking/${responseData.awb_code || shipmentId}`,
    };
  }

  /**
   * Fetches real-time tracking details by AWB code
   */
  public static async trackByAwb(awbCode: string): Promise<any> {
    const token = await this.getAuthToken();

    if (!token) {
      return {
        tracking_data: {
          track_status: 1,
          shipment_status: 2,
          shipment_track: [
            {
              id: 1,
              awb_code: awbCode,
              current_status: 'IN_TRANSIT',
              status: 'IN TRANSIT',
              location: 'Bengaluru Hub',
              date: new Date().toISOString(),
              activity: 'Package processed at origin sorting facility',
            },
          ],
        },
      };
    }

    const resp = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/track/awb/${encodeURIComponent(awbCode)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      throw new Error(`Shiprocket trackByAwb failed (${resp.status}): ${errorText}`);
    }

    return await resp.json();
  }

  /**
   * Cancels a shipment order
   */
  public static async cancelOrder(shiprocketOrderId: number | string): Promise<{ success: boolean; message?: string }> {
    const token = await this.getAuthToken();

    if (!token) {
      return { success: true, message: 'Simulated shipment cancellation completed' };
    }

    const resp = await fetch('https://apiv2.shiprocket.in/v1/external/orders/cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ids: [shiprocketOrderId] }),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      throw new Error(`Shiprocket cancelOrder failed (${resp.status}): ${errorText}`);
    }

    return { success: true };
  }
}
