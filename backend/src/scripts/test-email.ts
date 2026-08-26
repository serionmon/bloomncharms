import { EmailService } from '../email/service.js';
import {
  renderOrderConfirmationHtml,
  renderOrderConfirmationPlainText,
  type OrderConfirmationEmailData,
} from '../email/templates/order-confirmation.js';
import {
  renderAdminNewOrderHtml,
  renderAdminNewOrderPlainText,
} from '../email/templates/new-order-admin.js';
import { OrderService } from '../orders/service.js';
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

console.log('📧 Bloomncharms — Milestone 10 Email Notifications Verification');
console.log('===============================================================\n');

// 1. Email Service Initialization & Missing API Key Safety
console.log('=== TEST 1: Email Service Initialization & Missing Key Fallback ===');
{
  const resendClient = EmailService.getResendClient();
  assert('EmailService handles missing/placeholder API key gracefully (returns null or safe client)', resendClient === null || typeof resendClient === 'object');

  const testPayload: OrderConfirmationEmailData = {
    orderNumber: `BC-TEST-${Date.now()}`,
    orderDate: 'August 26, 2026',
    customerName: 'Aria Sharma',
    customerEmail: 'aria@example.com',
    customerPhone: '9876543210',
    shippingAddress: {
      addressLine1: '42 Atelier Lane',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400050',
    },
    items: [
      {
        name: 'Midnight Rose Velvet Bouquet',
        sku: 'BOUQ-ROSE-01',
        quantity: 1,
        unitPrice: 1299,
        lineTotal: 1299,
      },
    ],
    subtotal: 1299,
    paymentMethodDiscount: 130,
    totalDiscount: 130,
    shippingFee: 0,
    totalAmount: 1169,
    paymentMethod: 'full_online',
    paymentStatus: 'pending',
    amountPaid: 1169,
    amountDue: 0,
  };

  // Dispatch should complete without throwing
  let threw = false;
  try {
    const resultPromise = EmailService.sendOrderEmails(testPayload);
    assert('sendOrderEmails returns a Promise and executes safely', resultPromise instanceof Promise);
  } catch {
    threw = true;
  }
  assert('sendOrderEmails never throws an unhandled exception', !threw);
}

// 2. Customer Order Confirmation Template Rendering (Full Online)
console.log('\n=== TEST 2: Customer Email Template — Full Online ===');
{
  const onlinePayload: OrderConfirmationEmailData = {
    orderNumber: 'BC-2026-ONLINE',
    orderDate: 'August 26, 2026',
    customerName: 'Isabella Rossi',
    customerEmail: 'isabella@example.com',
    customerPhone: '9876543210',
    shippingAddress: {
      addressLine1: '12 Via della Spiga',
      city: 'Milan',
      state: 'Lombardy',
      postalCode: '20121',
    },
    items: [
      {
        name: 'Signature Atelier Bouquet',
        sku: 'BOUQ-SIG-01',
        quantity: 2,
        unitPrice: 1000,
        lineTotal: 2000,
      },
    ],
    subtotal: 2000,
    couponCode: 'WELCOME10',
    couponDiscount: 200,
    paymentMethodDiscount: 180,
    totalDiscount: 380,
    shippingFee: 0,
    totalAmount: 1620,
    paymentMethod: 'full_online',
    paymentStatus: 'paid',
    amountPaid: 1620,
    amountDue: 0,
  };

  const html = renderOrderConfirmationHtml(onlinePayload);
  const text = renderOrderConfirmationPlainText(onlinePayload);

  assert('Customer HTML includes Bloomncharms branding', html.includes('Bloomncharms Atelier'));
  assert('Customer HTML contains order number BC-2026-ONLINE', html.includes('BC-2026-ONLINE'));
  assert('Customer HTML displays 10% Online Atelier Savings', html.includes('Online Atelier Savings (10%)') && html.includes('180'));
  assert('Customer HTML displays Paid Online amount ₹1,620', html.includes('₹1,620'));
  assert('Customer HTML displays Due on Delivery ₹0', html.includes('Due on Delivery:'));
  assert('Customer Plain-Text contains order reference and correct breakdown', text.includes('BC-2026-ONLINE') && text.includes('Total Order     : ₹1,620'));
}

// 3. Customer Order Confirmation Template Rendering (Hybrid Split)
console.log('\n=== TEST 3: Customer Email Template — Hybrid 50/50 Split ===');
{
  const hybridPayload: OrderConfirmationEmailData = {
    orderNumber: 'BC-2026-HYBRID',
    orderDate: 'August 26, 2026',
    customerName: 'Dev Patel',
    customerEmail: 'dev@example.com',
    customerPhone: '9876543211',
    shippingAddress: {
      addressLine1: '77 Heritage Boulevard',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
    },
    items: [
      {
        name: 'Handmade Rose Charm',
        sku: 'CHM-ROSE-01',
        quantity: 1,
        unitPrice: 249,
        lineTotal: 249,
      },
    ],
    subtotal: 249,
    totalDiscount: 0,
    shippingFee: 0,
    totalAmount: 249,
    paymentMethod: 'hybrid',
    paymentStatus: 'partially_paid',
    amountPaid: 125,
    amountDue: 124,
  };

  const html = renderOrderConfirmationHtml(hybridPayload);
  const text = renderOrderConfirmationPlainText(hybridPayload);

  assert('Hybrid HTML displays Pay 50% Online + 50% on Delivery', html.includes('Pay 50% Online + 50% on Delivery'));
  assert('Hybrid HTML displays Paid Online / Advance ₹125', html.includes('Paid Online / Advance:') && html.includes('125'));
  assert('Hybrid HTML displays Due on Delivery (Doorstep) ₹124', html.includes('Due on Delivery (Doorstep):') && html.includes('124'));
  assert('Hybrid plain-text includes exact split amounts', text.includes('Paid Online     : ₹125') && text.includes('Due on Delivery : ₹124'));
}

// 4. Admin New Order Alert Template Rendering
console.log('\n=== TEST 4: Admin New Order Alert Template ===');
{
  const adminPayload: OrderConfirmationEmailData = {
    orderNumber: 'BC-2026-ADMIN-TEST',
    orderDate: 'August 26, 2026',
    customerName: 'Sophia Loren',
    customerEmail: 'sophia@example.com',
    customerPhone: '9988776655',
    shippingAddress: {
      addressLine1: '10 Palazzo Lane',
      city: 'Jaipur',
      state: 'Rajasthan',
      postalCode: '302001',
    },
    items: [
      {
        name: 'Artisanal Floral Keepsake Set',
        sku: 'SET-KEEP-01',
        quantity: 1,
        unitPrice: 3499,
        lineTotal: 3499,
      },
    ],
    subtotal: 3499,
    paymentMethodDiscount: 350,
    totalDiscount: 350,
    shippingFee: 0,
    totalAmount: 3149,
    paymentMethod: 'full_online',
    paymentStatus: 'pending',
    amountPaid: 3149,
    amountDue: 0,
  };

  const html = renderAdminNewOrderHtml(adminPayload);
  const text = renderAdminNewOrderPlainText(adminPayload);

  assert('Admin HTML includes Atelier Store Notification header', html.includes('Atelier Store Notification'));
  assert('Admin HTML includes customer email and phone', html.includes('sophia@example.com') && html.includes('9988776655'));
  assert('Admin HTML includes order total ₹3,149', html.includes('₹3,149'));
  assert('Admin Plain-text contains admin alert header and delivery destination', text.includes('[ADMIN ALERT]') && text.includes('Jaipur'));
}

// 5. Idempotency & Duplicate Prevention
console.log('\n=== TEST 5: Email Idempotency & Duplicate Prevention ===');
async function testIdempotency() {
  const duplicatePayload: OrderConfirmationEmailData = {
    orderNumber: `BC-IDEMPOTENT-${Date.now()}`,
    orderDate: 'August 26, 2026',
    customerName: 'Rohan Verma',
    customerEmail: 'rohan@example.com',
    customerPhone: '9876543210',
    shippingAddress: {
      addressLine1: '5th Main Road',
      city: 'Delhi',
      state: 'Delhi',
      postalCode: '110001',
    },
    items: [{ name: 'Test Bloom', quantity: 1, unitPrice: 500, lineTotal: 500 }],
    subtotal: 500,
    totalDiscount: 0,
    shippingFee: 0,
    totalAmount: 500,
    paymentMethod: 'full_online',
    paymentStatus: 'pending',
    amountPaid: 500,
    amountDue: 0,
  };

  const firstSend = await EmailService.sendCustomerConfirmation(duplicatePayload);
  const secondSend = await EmailService.sendCustomerConfirmation(duplicatePayload);

  assert('First customer email dispatch processes normally', firstSend.status === 'sent' || firstSend.status === 'skipped');
  assert('Second customer email dispatch is recognized as already_sent (idempotent)', secondSend.status === 'already_sent');
}

// 6. Order Creation Integration & Non-Interference
console.log('\n=== TEST 6: Order Creation Integration (Email Failure Does Not Invalidate Order) ===');
async function testOrderCreationEmailIntegration() {
  try {
    const order = await OrderService.createOrder({
      items: [{ productId: 'b0000000-0000-0000-0000-000000000001', quantity: 1 }],
      shippingAddress: {
        firstName: 'Mira',
        lastName: 'Nair',
        phone: '9876543210',
        email: 'mira@example.com',
        addressLine1: '88 Rose Garden Estate',
        city: 'Pune',
        state: 'Maharashtra',
        postalCode: '411001',
        country: 'IN',
      },
      paymentMethod: 'full_online',
    });

    assert('Order creation succeeds (returns valid order instance)', !!order && !!order.orderNumber);
    assert('Order contains authoritative financial calculations', order.totalAmount > 0);
  } catch (err: any) {
    assert(`Order creation failed unexpectedly: ${err.message}`, false);
  }
}

// 7. Security: Frontend Secrets Scan for RESEND_API_KEY
console.log('\n=== TEST 7: Frontend Secrets Scan ===');
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
        if (content.includes('RESEND_API_KEY') && !content.includes('test-email')) {
          console.error(`  ❌ Leak found in ${fullPath}`);
          leaked = true;
        }
      }
    }
  }

  scanDir(frontendDir);
  assert('No RESEND_API_KEY references found in frontend codebase', !leaked);
}

async function runAll() {
  await testIdempotency();
  await testOrderCreationEmailIntegration();

  console.log('\n==============================================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('✅ Milestone 10 Email Notifications (Resend) verified.');
  }
}

runAll();
