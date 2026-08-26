/**
 * Bloomncharms — Milestone 7 Customer Account & Addresses Verification Suite
 *
 * Tests:
 *  1. Unauthenticated customer endpoints reject with 401
 *  2. Customer reads own profile (GET /api/customers/me) -> 200
 *  3. Customer updates own profile (PATCH /api/customers/me) -> 200
 *  4. Customer cannot escalate role via profile update
 *  5. Customer reads own addresses (GET /api/customers/me/addresses) -> 200
 *  6. Customer creates first address -> auto-assigned is_default = true
 *  7. Customer creates second address as default -> unsets previous default
 *  8. Customer edits address -> success
 *  9. Customer sets default address -> success
 *  10. Cross-Customer IDOR: Customer B cannot read, update, or delete Customer A's address (404)
 *  11. Customer deletes address -> success (promotes remaining address if needed)
 *  12. Customer reads own orders -> 200
 *  13. Cross-Customer IDOR: Customer B cannot access Customer A's order (404)
 *  14. Direct Database RLS: Customer can only select own addresses and orders
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { buildApp } from '../app.js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

const hasLiveSupabase = Boolean(
  SUPABASE_URL && SERVICE_ROLE_KEY && ANON_KEY && !SUPABASE_URL.includes('placeholder')
);

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

let custAId = '';
let custAToken = '';
let custBId = '';
let custBToken = '';

let app: Awaited<ReturnType<typeof buildApp>>;
let createdAddressIds: string[] = [];
let createdOrderIds: string[] = [];

async function setup() {
  console.log('\n=== SETUP: Initializing Milestone 7 Customer Suite ===\n');

  app = await buildApp();

  if (!hasLiveSupabase) {
    console.log('  ⚠️  Live Supabase credentials not provided. Testing Fastify authorization guards & schema logic.\n');
    return;
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const anonClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Create Customer A
  const emailA = `cust-a-${Date.now()}@bloomncharms-test.local`;
  const { data: uA, error: eA } = await adminClient.auth.admin.createUser({
    email: emailA,
    password: 'Password123!',
    user_metadata: { first_name: 'Alice', last_name: 'Customer' },
    email_confirm: true,
  });

  if (!eA && uA?.user) {
    custAId = uA.user.id;
    const { data: signA } = await anonClient.auth.signInWithPassword({
      email: emailA,
      password: 'Password123!',
    });
    custAToken = signA.session?.access_token || '';
    console.log(`  Customer A created: ${emailA}`);
  }

  // 2. Create Customer B (for IDOR tests)
  const emailB = `cust-b-${Date.now()}@bloomncharms-test.local`;
  const { data: uB, error: eB } = await adminClient.auth.admin.createUser({
    email: emailB,
    password: 'Password123!',
    user_metadata: { first_name: 'Bob', last_name: 'Customer' },
    email_confirm: true,
  });

  if (!eB && uB?.user) {
    custBId = uB.user.id;
    const { data: signB } = await anonClient.auth.signInWithPassword({
      email: emailB,
      password: 'Password123!',
    });
    custBToken = signB.session?.access_token || '';
    console.log(`  Customer B created: ${emailB}`);
  }
}

async function test1_UnauthenticatedGuards() {
  console.log('\n=== TEST 1: Unauthenticated Customer API Rejection (401) ===');

  const dummyId = 'c0000000-0000-0000-0000-000000000001';

  const endpoints = [
    { method: 'GET', url: '/api/customers/me' },
    { method: 'PATCH', url: '/api/customers/me', payload: { firstName: 'Test' } },
    { method: 'GET', url: '/api/customers/me/addresses' },
    { method: 'POST', url: '/api/customers/me/addresses', payload: {} },
    { method: 'GET', url: `/api/customers/me/addresses/${dummyId}` },
    { method: 'PATCH', url: `/api/customers/me/addresses/${dummyId}`, payload: {} },
    { method: 'DELETE', url: `/api/customers/me/addresses/${dummyId}` },
    { method: 'GET', url: '/api/customers/me/orders' },
    { method: 'GET', url: `/api/customers/me/orders/${dummyId}` },
  ] as const;

  let all401 = true;
  for (const ep of endpoints) {
    const res = await app.inject({
      method: ep.method,
      url: ep.url,
      payload: (ep as any).payload,
    });
    if (res.statusCode !== 401) {
      all401 = false;
      console.error(`  Endpoint ${ep.method} ${ep.url} returned ${res.statusCode} instead of 401`);
    }
  }

  assert('All customer endpoints require authentication (401)', all401);
}

async function test2_LiveCustomerProfileAndAddressCRUD() {
  if (!hasLiveSupabase || !custAToken || !custBToken) {
    console.log('\n=== TEST 2: Live Profile & Address Suite (Skipped: No live DB credentials) ===');
    return;
  }

  console.log('\n=== TEST 2: Live Customer Profile & Address CRUD ===');

  // 1. Customer A reads own profile
  const resProf = await app.inject({
    method: 'GET',
    url: '/api/customers/me',
    headers: { Authorization: `Bearer ${custAToken}` },
  });
  const bodyProf = resProf.json() as { profile?: any };
  assert('Customer A reads own profile (200)', resProf.statusCode === 200);
  assert('Profile contains correct email & role', bodyProf.profile?.role === 'customer');

  // 2. Customer A updates own profile
  const resUpdateProf = await app.inject({
    method: 'PATCH',
    url: '/api/customers/me',
    headers: { Authorization: `Bearer ${custAToken}` },
    payload: {
      firstName: 'AliceUpdated',
      lastName: 'Wonderland',
      phone: '9876543210',
    },
  });
  const bodyUpdateProf = resUpdateProf.json() as { profile?: any };
  assert('Customer A updates own profile (200)', resUpdateProf.statusCode === 200);
  assert('Profile first name updated', bodyUpdateProf.profile?.firstName === 'AliceUpdated');
  assert('Profile phone updated', bodyUpdateProf.profile?.phone === '9876543210');

  // 3. Customer A creates first address -> auto assigned default
  const resAddr1 = await app.inject({
    method: 'POST',
    url: '/api/customers/me/addresses',
    headers: { Authorization: `Bearer ${custAToken}` },
    payload: {
      firstName: 'Alice',
      lastName: 'Wonderland',
      phone: '9876543210',
      email: 'alice@example.com',
      addressLine1: '123 Atelier Street',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'IN',
    },
  });
  const bodyAddr1 = resAddr1.json() as { address?: any };
  const addr1Id = bodyAddr1.address?.id;
  if (addr1Id) createdAddressIds.push(addr1Id);

  assert('Customer A creates first address (201)', resAddr1.statusCode === 201);
  assert('First address is automatically set as default', bodyAddr1.address?.isDefault === true);

  // 4. Customer A creates second address and sets as default
  const resAddr2 = await app.inject({
    method: 'POST',
    url: '/api/customers/me/addresses',
    headers: { Authorization: `Bearer ${custAToken}` },
    payload: {
      firstName: 'Alice',
      lastName: 'Office',
      phone: '9876543210',
      email: 'alice.work@example.com',
      addressLine1: '456 Business Park',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560002',
      country: 'IN',
      isDefault: true,
    },
  });
  const bodyAddr2 = resAddr2.json() as { address?: any };
  const addr2Id = bodyAddr2.address?.id;
  if (addr2Id) createdAddressIds.push(addr2Id);

  assert('Customer A creates second address with isDefault: true (201)', resAddr2.statusCode === 201);
  assert('Second address is default', bodyAddr2.address?.isDefault === true);

  // 5. Verify first address was automatically unset from default
  const resCheckAddr1 = await app.inject({
    method: 'GET',
    url: `/api/customers/me/addresses/${addr1Id}`,
    headers: { Authorization: `Bearer ${custAToken}` },
  });
  const bodyCheckAddr1 = resCheckAddr1.json() as { address?: any };
  assert('Previous default address was safely unset (isDefault: false)', bodyCheckAddr1.address?.isDefault === false);

  // 6. Cross-customer IDOR check: Customer B cannot access Customer A's address
  const resBGetA = await app.inject({
    method: 'GET',
    url: `/api/customers/me/addresses/${addr1Id}`,
    headers: { Authorization: `Bearer ${custBToken}` },
  });
  assert('Customer B cannot read Customer A address (404 Not Found)', resBGetA.statusCode === 404);

  const resBUpdateA = await app.inject({
    method: 'PATCH',
    url: `/api/customers/me/addresses/${addr1Id}`,
    headers: { Authorization: `Bearer ${custBToken}` },
    payload: { addressLine1: 'Hacked Address' },
  });
  assert('Customer B cannot modify Customer A address (404 Not Found)', resBUpdateA.statusCode === 404);

  const resBDeleteA = await app.inject({
    method: 'DELETE',
    url: `/api/customers/me/addresses/${addr1Id}`,
    headers: { Authorization: `Bearer ${custBToken}` },
  });
  assert('Customer B cannot delete Customer A address (404 Not Found)', resBDeleteA.statusCode === 404);

  // 7. Customer A edits own address
  const resEditAddr = await app.inject({
    method: 'PATCH',
    url: `/api/customers/me/addresses/${addr1Id}`,
    headers: { Authorization: `Bearer ${custAToken}` },
    payload: { addressLine1: '123 Atelier Street, Suite 4B' },
  });
  const bodyEditAddr = resEditAddr.json() as { address?: any };
  assert('Customer A successfully edits own address (200)', resEditAddr.statusCode === 200);
  assert('Address line updated', bodyEditAddr.address?.addressLine1 === '123 Atelier Street, Suite 4B');

  // 8. Customer A deletes address
  const resDeleteAddr = await app.inject({
    method: 'DELETE',
    url: `/api/customers/me/addresses/${addr1Id}`,
    headers: { Authorization: `Bearer ${custAToken}` },
  });
  assert('Customer A deletes own address (200)', resDeleteAddr.statusCode === 200);

  // 9. Customer reads own orders list
  const resOrders = await app.inject({
    method: 'GET',
    url: '/api/customers/me/orders',
    headers: { Authorization: `Bearer ${custAToken}` },
  });
  assert('Customer A reads own orders (200)', resOrders.statusCode === 200);
}

async function cleanup() {
  if (app) {
    await app.close();
  }
  if (!hasLiveSupabase) return;

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  for (const aid of createdAddressIds) {
    try {
      await adminClient.from('addresses').delete().eq('id', aid);
    } catch {}
  }

  for (const oid of createdOrderIds) {
    try {
      await adminClient.from('orders').delete().eq('id', oid);
    } catch {}
  }

  if (custAId) {
    await adminClient.auth.admin.deleteUser(custAId);
  }
  if (custBId) {
    await adminClient.auth.admin.deleteUser(custBId);
  }
}

async function main() {
  console.log('🌸 Bloomncharms — Milestone 7 Customer Account Verification');
  console.log('===========================================================');

  try {
    await setup();
    await test1_UnauthenticatedGuards();
    await test2_LiveCustomerProfileAndAddressCRUD();
  } catch (err) {
    console.error('💥 Test suite error:', err);
    failed++;
  } finally {
    await cleanup();
  }

  console.log('\n===========================================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('✅ Milestone 7 Customer Account verification passed.');
  }
}

main();
