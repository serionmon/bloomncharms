import { calculatePaymentOption } from '../lib/payment-calc';

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

console.log('💳 Bloomncharms — Payment Method Calculation Verification');
console.log('========================================================\n');

// CASE 1: subtotal = ₹249 with Online Selected
console.log('=== CASE 1: subtotal = ₹249 (Online Selected) ===');
{
  const subtotal = 249;
  const onlineCalc = calculatePaymentOption(subtotal, 'full_online');
  const hybridCalc = calculatePaymentOption(subtotal, 'hybrid');

  assert('Online discount is exactly ₹25 (10% of 249 rounded)', onlineCalc.onlineDiscount === 25);
  assert('Online total is exactly ₹224 (249 - 25)', onlineCalc.total === 224);
  assert('Online payNow is exactly ₹224', onlineCalc.payNowAmount === 224);
  assert('Online dueOnDelivery is exactly ₹0', onlineCalc.dueOnDelivery === 0);

  assert('Hybrid total is independently ₹249', hybridCalc.total === 249);
  assert('Hybrid onlineDiscount is independently ₹0', hybridCalc.onlineDiscount === 0);
  assert('Hybrid payNow is independently ₹125 (50% of 249 rounded)', hybridCalc.payNowAmount === 125);
  assert('Hybrid dueOnDelivery is independently ₹124 (249 - 125)', hybridCalc.dueOnDelivery === 124);
  assert('Hybrid payNow + dueOnDelivery equals ₹249', hybridCalc.payNowAmount + hybridCalc.dueOnDelivery === 249);
}

// CASE 2: subtotal = ₹249 with Hybrid Selected
console.log('\n=== CASE 2: subtotal = ₹249 (Hybrid Selected) ===');
{
  const subtotal = 249;
  const onlineCalc = calculatePaymentOption(subtotal, 'full_online');
  const hybridCalc = calculatePaymentOption(subtotal, 'hybrid');

  assert('Hybrid card retains total = ₹249', hybridCalc.total === 249);
  assert('Hybrid card retains payNow = ₹125', hybridCalc.payNowAmount === 125);
  assert('Hybrid card retains dueOnDelivery = ₹124', hybridCalc.dueOnDelivery === 124);

  assert('Online card retains independent discount = ₹25', onlineCalc.onlineDiscount === 25);
  assert('Online card retains independent total = ₹224', onlineCalc.total === 224);
  assert('Online card retains independent payNow = ₹224', onlineCalc.payNowAmount === 224);
  assert('Online card retains independent dueOnDelivery = ₹0', onlineCalc.dueOnDelivery === 0);
}

// CASE 3: subtotal = ₹1000
console.log('\n=== CASE 3: subtotal = ₹1000 (Standard Tier) ===');
{
  const subtotal = 1000;
  const onlineCalc = calculatePaymentOption(subtotal, 'full_online');
  const hybridCalc = calculatePaymentOption(subtotal, 'hybrid');

  assert('Online discount is ₹100', onlineCalc.onlineDiscount === 100);
  assert('Online total is ₹900', onlineCalc.total === 900);
  assert('Online payNow is ₹900', onlineCalc.payNowAmount === 900);
  assert('Online dueOnDelivery is ₹0', onlineCalc.dueOnDelivery === 0);

  assert('Hybrid discount is ₹0', hybridCalc.onlineDiscount === 0);
  assert('Hybrid total is ₹1000', hybridCalc.total === 1000);
  assert('Hybrid payNow is ₹500', hybridCalc.payNowAmount === 500);
  assert('Hybrid dueOnDelivery is ₹500', hybridCalc.dueOnDelivery === 500);
}

// CASE 4: Odd Amount = ₹101
console.log('\n=== CASE 4: Odd Amount = ₹101 (Sum Exactness) ===');
{
  const subtotal = 101;
  const hybridCalc = calculatePaymentOption(subtotal, 'hybrid');

  assert('Hybrid total is ₹101', hybridCalc.total === 101);
  assert('Hybrid payNow is ₹51', hybridCalc.payNowAmount === 51);
  assert('Hybrid dueOnDelivery is ₹50', hybridCalc.dueOnDelivery === 50);
  assert('Hybrid payNow + dueOnDelivery === ₹101 exactly', hybridCalc.payNowAmount + hybridCalc.dueOnDelivery === 101);
}

// CASE 5: Switching Simulation (ONLINE -> HYBRID -> ONLINE -> HYBRID)
console.log('\n=== CASE 5: Selection Switching Simulation ===');
{
  const subtotal = 1299;
  const methods = ['full_online', 'hybrid', 'full_online', 'hybrid'] as const;

  for (let i = 0; i < methods.length; i++) {
    const selected = methods[i];
    const online = calculatePaymentOption(subtotal, 'full_online');
    const hybrid = calculatePaymentOption(subtotal, 'hybrid');
    const active = selected === 'full_online' ? online : hybrid;

    assert(`Step ${i + 1} (${selected}): Online card always computes payNow = ₹1169`, online.payNowAmount === 1169);
    assert(`Step ${i + 1} (${selected}): Hybrid card always computes payNow = ₹650, due = ₹649`, hybrid.payNowAmount === 650 && hybrid.dueOnDelivery === 649);
    if (selected === 'full_online') {
      assert(`Step ${i + 1} Order Summary uses online payNow = ₹1169`, active.payNowAmount === 1169);
    } else {
      assert(`Step ${i + 1} Order Summary uses hybrid payNow = ₹650, due = ₹649`, active.payNowAmount === 650 && active.dueOnDelivery === 649);
    }
  }
}

// CASE 6: Applied Promo Coupon Interaction
console.log('\n=== CASE 6: Applied Promo Coupon Interaction ===');
{
  const subtotal = 1000;
  const couponDiscount = 200; // subtotalAfterCoupon = 800
  const onlineCalc = calculatePaymentOption(subtotal, 'full_online', couponDiscount);
  const hybridCalc = calculatePaymentOption(subtotal, 'hybrid', couponDiscount);

  assert('Online discount is 10% of subtotalAfterCoupon (10% of 800 = ₹80)', onlineCalc.onlineDiscount === 80);
  assert('Online total is ₹720 (800 - 80)', onlineCalc.total === 720);
  assert('Online payNow is ₹720', onlineCalc.payNowAmount === 720);
  assert('Hybrid total is ₹800', hybridCalc.total === 800);
  assert('Hybrid payNow is ₹400 and dueOnDelivery is ₹400', hybridCalc.payNowAmount === 400 && hybridCalc.dueOnDelivery === 400);
}

console.log('\n========================================================');
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('✅ All Payment Method calculation tests passed.');
}
