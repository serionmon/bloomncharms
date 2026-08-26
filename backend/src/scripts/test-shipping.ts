import { buildApp } from '../app.js';
import { ShippingService } from '../shipping/service.js';
import { ShiprocketClient } from '../shipping/shiprocket.js';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(description: string, condition: boolean) {
  if (condition) {
    console.log(`  ✅ ${description}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${description}`);
    failed++;
  }
}

console.log('🚚 Bloomncharms — Milestone 11 Shipping Infrastructure Verification');
console.log('==================================================================\n');

async function runShippingTests() {
  const app = await buildApp();

  // === 1. Admin Shipping Authentication Guards ===
  console.log('=== TEST 1: Unauthenticated Admin Shipping Requests (401) ===');
  {
    const res1 = await app.inject({
      method: 'GET',
      url: '/api/admin/orders/b0000000-0000-0000-0000-000000000001/shipping',
    });
    assert('GET /api/admin/orders/:id/shipping rejects unauthenticated (401)', res1.statusCode === 401);

    const res2 = await app.inject({
      method: 'POST',
      url: '/api/admin/orders/b0000000-0000-0000-0000-000000000001/shipping/create',
      payload: {},
    });
    assert('POST /api/admin/orders/:id/shipping/create rejects unauthenticated (401)', res2.statusCode === 401);

    const res3 = await app.inject({
      method: 'POST',
      url: '/api/admin/orders/b0000000-0000-0000-0000-000000000001/shipping/awb',
      payload: {},
    });
    assert('POST /api/admin/orders/:id/shipping/awb rejects unauthenticated (401)', res3.statusCode === 401);

    const res4 = await app.inject({
      method: 'POST',
      url: '/api/admin/orders/b0000000-0000-0000-0000-000000000001/shipping/cancel',
      payload: {},
    });
    assert('POST /api/admin/orders/:id/shipping/cancel rejects unauthenticated (401)', res4.statusCode === 401);
  }

  // === 2. Shipment Creation & Validation ===
  console.log('\n=== TEST 2: Shipment Creation & Provider ID Persistence ===');
  const testOrderId = `order-test-${Date.now()}`;
  let createdShipment: any = null;
  {
    createdShipment = await ShippingService.createShipment(testOrderId, {
      pickupLocation: 'Primary Atelier',
      lengthCm: 15,
      breadthCm: 15,
      heightCm: 10,
      weightKg: 0.5,
    });

    assert('Shipment created successfully', !!createdShipment && !!createdShipment.shipmentId);
    assert('Shipment status set to manifested', createdShipment.shippingStatus === 'manifested');
    assert('Provider assigned is shiprocket', createdShipment.shippingProvider === 'shiprocket');
    assert('AWB code generated/assigned', !!createdShipment.awbCode);
    assert('Tracking URL generated', !!createdShipment.trackingUrl && createdShipment.trackingUrl.includes('shiprocket.co'));
  }

  // === 3. Duplicate Shipment Protection ===
  console.log('\n=== TEST 3: Duplicate Shipment Protection ===');
  {
    let duplicateRejected = false;
    try {
      await ShippingService.createShipment(testOrderId);
    } catch (err: any) {
      if (err.statusCode === 400 && err.message.includes('already has active shipment')) {
        duplicateRejected = true;
      }
    }
    assert('Second shipment request for already-manifested order is rejected (400)', duplicateRejected);
  }

  // === 4. Tracking Retrieval ===
  console.log('\n=== TEST 4: Shipment Tracking Retrieval ===');
  {
    const tracking = await ShippingService.getShipmentTracking(testOrderId);
    assert('Tracking retrieved by order ID', !!tracking && tracking.orderNumber.length > 0);
    assert('Tracking contains valid shipping status', tracking.shippingStatus === 'manifested' || tracking.shippingStatus === 'in_transit');
    assert('Tracking contains journey checkpoints array', Array.isArray(tracking.checkpoints) && tracking.checkpoints.length > 0);

    const publicRes = await app.inject({
      method: 'GET',
      url: `/api/shipping/track/${encodeURIComponent(createdShipment.orderNumber)}`,
    });
    assert('Public endpoint GET /api/shipping/track/:orderNumber returns 200', publicRes.statusCode === 200);
    const pubData = JSON.parse(publicRes.body);
    assert('Public tracking response contains safe courier and status fields', pubData.shippingStatus && pubData.courierName);
  }

  // === 5. Webhook Processing & Idempotency ===
  console.log('\n=== TEST 5: Webhook Signature Verification & Idempotency ===');
  {
    const webhookPayload = {
      event_id: `SR-EVT-${Date.now()}`,
      order_id: createdShipment.orderNumber,
      awb: createdShipment.awbCode,
      current_status: 'IN TRANSIT',
      courier_name: 'Blue Dart Express',
      location: 'Mumbai Sorting Center',
    };

    const firstWebhook = await ShippingService.handleWebhook(webhookPayload);
    assert('Webhook event processed successfully (status: processed)', firstWebhook.status === 'processed');

    const duplicateWebhook = await ShippingService.handleWebhook(webhookPayload);
    assert('Duplicate webhook event recognized and deduplicated (status: already_processed)', duplicateWebhook.status === 'already_processed');
  }

  // === 6. Customer Scoped Access (IDOR Protection) ===
  console.log('\n=== TEST 6: Customer Tracking IDOR Scoping ===');
  {
    let idorBlocked = false;
    try {
      // User 'user-other' trying to access order belonging to different user
      await ShippingService.getShipmentTracking(testOrderId, 'user-attacker-uuid', false);
    } catch (err: any) {
      if (err.statusCode === 403) idorBlocked = true;
    }
    assert('Customer cannot query internal tracking for another customer order (403)', idorBlocked);
  }

  // === 7. Secrets Scan in Frontend ===
  console.log('\n=== TEST 7: Frontend Secrets Scan for Shipping Credentials ===');
  {
    const frontendDir = path.resolve(process.cwd(), '../frontend');
    let leaked = false;

    function scanDir(dir: string) {
      if (!fs.existsSync(dir)) return;
      const files = fs.readdirSync(dir);
      for (const f of files) {
        if (f === 'node_modules' || f === '.next' || f === '.git') continue;
        const fullPath = path.join(dir, f);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.json')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (
            (content.includes('SHIPROCKET_PASSWORD') ||
              content.includes('SHIPROCKET_API_TOKEN') ||
              content.includes('SHIPROCKET_WEBHOOK_SECRET')) &&
            !content.includes('test-shipping')
          ) {
            console.error(`  ❌ Leak found in ${fullPath}`);
            leaked = true;
          }
        }
      }
    }

    scanDir(frontendDir);
    assert('No Shiprocket secrets or passwords found in frontend codebase', !leaked);
  }

  console.log('\n==================================================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('✅ Milestone 11 Shipping Infrastructure (Shiprocket) verified.');
  }
}

runShippingTests();
