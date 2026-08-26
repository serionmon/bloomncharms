/**
 * Bloomncharms — Auth + RLS Verification Script (Milestone 3)
 *
 * Tests:
 *  G. Customer can read their own profile (RLS allows)
 *  H. Customer cannot read another user's profile (RLS blocks)
 *  I. Customer cannot self-promote to admin (trigger blocks)
 *  J. GET /api/auth/me → 401 (unauthenticated)
 *  K. GET /api/auth/me → 200 (authenticated)
 *
 * Prerequisites:
 *   - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY in backend/.env
 *   - Backend running on PORT (defaults to 4000)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.SUPABASE_ANON_KEY!;
const API_BASE = `http://localhost:${process.env.PORT ?? 4000}`;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ANON_KEY) {
  console.error('❌ Missing Supabase environment variables. Check backend/.env');
  process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Test user credentials — use unique emails to avoid collision
const testUser1 = {
  email: `test-auth-1-${Date.now()}@bloomncharms-test.local`,
  password: 'TestPass1!',
  first_name: 'Alice',
  last_name: 'Test',
};
const testUser2 = {
  email: `test-auth-2-${Date.now()}@bloomncharms-test.local`,
  password: 'TestPass2!',
  first_name: 'Bob',
  last_name: 'Test',
};

let user1Id = '';
let user2Id = '';
let user1Token = '';

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

async function setup() {
  console.log('\n=== SETUP: Creating test users ===\n');

  // Create user 1 via admin API (skips email confirmation)
  const { data: u1, error: e1 } = await adminClient.auth.admin.createUser({
    email: testUser1.email,
    password: testUser1.password,
    user_metadata: { first_name: testUser1.first_name, last_name: testUser1.last_name },
    email_confirm: true,
  });
  if (e1 || !u1.user) throw new Error(`Failed to create user 1: ${e1?.message}`);
  user1Id = u1.user.id;
  console.log(`  User 1: ${testUser1.email} (${user1Id})`);

  // Create user 2
  const { data: u2, error: e2 } = await adminClient.auth.admin.createUser({
    email: testUser2.email,
    password: testUser2.password,
    user_metadata: { first_name: testUser2.first_name, last_name: testUser2.last_name },
    email_confirm: true,
  });
  if (e2 || !u2.user) throw new Error(`Failed to create user 2: ${e2?.message}`);
  user2Id = u2.user.id;
  console.log(`  User 2: ${testUser2.email} (${user2Id})`);

  // Sign in as User 1 to get their token
  const anonClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: signIn, error: eSignIn } = await anonClient.auth.signInWithPassword({
    email: testUser1.email,
    password: testUser1.password,
  });
  if (eSignIn || !signIn.session) throw new Error(`Failed to sign in user 1: ${eSignIn?.message}`);
  user1Token = signIn.session.access_token;
  console.log(`  User 1 token acquired.\n`);
}

async function testG_OwnProfile() {
  console.log('=== TEST G: Customer reads their own profile ===');
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${user1Token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await userClient
    .from('profiles')
    .select('id, first_name, role')
    .eq('id', user1Id)
    .single();

  assert('User 1 can read own profile', !error && data?.id === user1Id, error?.message);
  assert('Profile role is customer', data?.role === 'customer', `Got: ${data?.role}`);
}

async function testH_OtherProfile() {
  console.log('\n=== TEST H: Customer cannot read another user\'s profile ===');
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${user1Token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await userClient
    .from('profiles')
    .select('id')
    .eq('id', user2Id)
    .single();

  // RLS should block — expect no data (null) or PGRST116 (not found due to policy)
  const blocked = !data || (error as { code?: string } | null)?.code === 'PGRST116';
  assert('User 1 cannot read User 2\'s profile (RLS blocks)', blocked,
    `data: ${JSON.stringify(data)}, error: ${error?.message}`);
}

async function testI_RoleEscalation() {
  console.log('\n=== TEST I: Customer cannot self-promote to admin ===');
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${user1Token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await userClient
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', user1Id);

  assert(
    'Role escalation to admin is rejected by trigger',
    !!error,
    error ? `Blocked with: ${error.message}` : 'No error — escalation succeeded (BAD!)'
  );
}

async function testJ_MeUnauthenticated() {
  console.log('\n=== TEST J: GET /api/auth/me → 401 (unauthenticated) ===');
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`);
    assert('GET /api/auth/me returns 401 without token', res.status === 401, `Got: ${res.status}`);
  } catch (err) {
    console.log(`  ⚠️  Backend not running — skipping J/K (start with npm run dev)`);
    failed++; // count as failed for accuracy
  }
}

async function testK_MeAuthenticated() {
  console.log('\n=== TEST K: GET /api/auth/me → 200 (authenticated) ===');
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const body = (await res.json()) as { user?: { id?: string; role?: string } };
    assert('GET /api/auth/me returns 200 with token', res.status === 200, `Got: ${res.status}`);
    assert('Response contains user object', !!body.user, JSON.stringify(body));
    assert('User id matches', body.user?.id === user1Id, `Got: ${body.user?.id}`);
    assert('User role is customer', body.user?.role === 'customer', `Got: ${body.user?.role}`);
  } catch (err) {
    console.log(`  ⚠️  Backend not running — skipping J/K (start with npm run dev)`);
    failed++;
  }
}

async function cleanup() {
  console.log('\n=== CLEANUP: Removing test users ===');
  if (user1Id) {
    await adminClient.auth.admin.deleteUser(user1Id);
    console.log(`  Deleted User 1: ${user1Id}`);
  }
  if (user2Id) {
    await adminClient.auth.admin.deleteUser(user2Id);
    console.log(`  Deleted User 2: ${user2Id}`);
  }
}

async function main() {
  console.log('🌸 Bloomncharms — Milestone 3 Auth + RLS Test Suite');
  console.log('====================================================');

  try {
    await setup();
    await testG_OwnProfile();
    await testH_OtherProfile();
    await testI_RoleEscalation();
    await testJ_MeUnauthenticated();
    await testK_MeAuthenticated();
  } catch (err) {
    console.error('\n💥 Fatal setup error:', err);
    failed++;
  } finally {
    await cleanup();
  }

  console.log('\n====================================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('✅ All tests passed.');
  }
}

main();
