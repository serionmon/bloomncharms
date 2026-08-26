import {
  fetchOrderPreview,
  createOrder,
  createRazorpayOrder,
} from '../lib/api';

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

async function runCheckoutApiTests() {
  console.log('🌸 Bloomncharms — Checkout API Integration & Error Resilience Verification');
  console.log('=========================================================================\n');

  // TEST 1: Backend Health Check
  console.log('=== TEST 1: Backend Service Health (http://localhost:4000/api/health) ===');
  try {
    const res = await fetch('http://localhost:4000/api/health');
    const data = await res.json();
    assert('Backend health endpoint returns HTTP 200', res.status === 200);
    assert('Backend service identifier is bloomncharms-backend', data.service === 'bloomncharms-backend');
  } catch (err) {
    assert('Backend is reachable', false);
  }

  // TEST 2: Order Preview (Full Online)
  console.log('\n=== TEST 2: Authoritative Order Preview — Full Online ===');
  try {
    const res = await fetchOrderPreview({
      items: [{ productId: 'b0000000-0000-0000-0000-000000000001', quantity: 1 }],
      paymentMethod: 'full_online',
    });

    assert('fetchOrderPreview succeeds (success = true)', res.success === true);
    assert('Preview returns calculated 10% online discount', (res.preview?.paymentMethodDiscount || 0) > 0);
    assert('Preview payNowAmount equals totalAmount', res.preview?.payNowAmount === res.preview?.totalAmount);
    assert('Preview codAmount is 0 for full_online', res.preview?.codAmount === 0);
  } catch (err: any) {
    assert(`fetchOrderPreview full_online threw error: ${err.message}`, false);
  }

  // TEST 3: Order Preview (Hybrid Split)
  console.log('\n=== TEST 3: Authoritative Order Preview — Hybrid 50/50 ===');
  try {
    const res = await fetchOrderPreview({
      items: [{ productId: 'b0000000-0000-0000-0000-000000000001', quantity: 1 }],
      paymentMethod: 'hybrid',
    });

    assert('fetchOrderPreview hybrid succeeds (success = true)', res.success === true);
    assert('Preview online discount is 0 for hybrid', res.preview?.paymentMethodDiscount === 0);
    assert('Preview payNow + codAmount === totalAmount exactly',
      (res.preview?.payNowAmount || 0) + (res.preview?.codAmount || 0) === (res.preview?.totalAmount || 0)
    );
  } catch (err: any) {
    assert(`fetchOrderPreview hybrid threw error: ${err.message}`, false);
  }

  // TEST 4: Authoritative Order Placement
  console.log('\n=== TEST 4: Authoritative Order Creation ===');
  let placedOrderNumber = '';
  try {
    const res = await createOrder({
      items: [{ productId: 'b0000000-0000-0000-0000-000000000001', quantity: 1 }],
      shippingAddress: {
        firstName: 'Aria',
        lastName: 'Sharma',
        phone: '9876543210',
        email: 'aria@example.com',
        addressLine1: '42 Atelier Lane, Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400050',
        country: 'IN',
      },
      paymentMethod: 'full_online',
    });

    assert('createOrder returns success = true', res.success === true);
    assert('Order contains valid Bloomncharms orderNumber', !!res.order?.orderNumber);
    if (res.order?.orderNumber) {
      placedOrderNumber = res.order.orderNumber;
    }
  } catch (err: any) {
    assert(`createOrder threw error: ${err.message}`, false);
  }

  // TEST 5: Razorpay Payment Initiation
  console.log('\n=== TEST 5: Secure Razorpay Order Initiation ===');
  if (placedOrderNumber) {
    try {
      const res = await createRazorpayOrder(placedOrderNumber);
      assert('createRazorpayOrder initiates successfully', res.success === true);
      assert('Razorpay order has valid payable amount in Paise', (res.razorpayOrder?.amount || 0) > 0);
    } catch (err: any) {
      assert(`createRazorpayOrder threw error: ${err.message}`, false);
    }
  } else {
    assert('Skipping Razorpay test because order placement did not return orderNumber', false);
  }

  // TEST 6: User-Facing Error Resilience
  console.log('\n=== TEST 6: User-Facing Error Messages (No Raw Network Exceptions) ===');
  {
    // Calling invalid payload should return clean validation error
    const res = await fetchOrderPreview({
      items: [],
      paymentMethod: 'full_online',
    });
    assert('Empty items rejected gracefully with safe message', res.success === false && typeof res.error === 'string');
    assert('Error message does NOT contain raw fetch syntax', !res.error?.includes('TypeError') && !res.error?.includes('NetworkError'));
  }

  console.log('\n=========================================================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('✅ All Checkout API integration tests passed.');
  }
}

runCheckoutApiTests();
