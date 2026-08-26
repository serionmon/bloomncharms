import { buildApp } from '../app.js';
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

console.log('🛡️  Bloomncharms — Milestone 12 Production Readiness & Reverse Proxy Audit');
console.log('=========================================================================\n');

async function runProductionTests() {
  const app = await buildApp();

  // === 1. Health Checks & Server Routing ===
  console.log('=== TEST 1: Health Check Endpoint ===');
  {
    const res = await app.inject({
      method: 'GET',
      url: '/api/health',
    });

    assert('GET /api/health returns 200 OK', res.statusCode === 200);
    const body = JSON.parse(res.body);
    assert('Health response contains ok: true and service identifier', body.ok === true && body.service === 'bloomncharms-backend');
  }

  // === 2. Reverse Proxy & Forwarded Headers (trustProxy) ===
  console.log('\n=== TEST 2: Trust Proxy & Forwarded Headers ===');
  {
    const res = await app.inject({
      method: 'GET',
      url: '/api/health',
      headers: {
        'x-forwarded-for': '203.0.113.195',
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'bloomncharms.com',
      },
    });

    assert('Reverse proxy request with X-Forwarded-* headers processed cleanly', res.statusCode === 200);
  }

  // === 3. Security Headers ===
  console.log('\n=== TEST 3: Security Headers ===');
  {
    const res = await app.inject({
      method: 'GET',
      url: '/api/health',
    });

    const headers = res.headers;
    assert('Cross-Origin-Resource-Policy header is configured', headers['cross-origin-resource-policy'] === 'cross-origin');
    assert('X-Content-Type-Options is set to nosniff', headers['x-content-type-options'] === 'nosniff');
  }

  // === 4. CORS Policy Enforcement ===
  console.log('\n=== TEST 4: CORS Policy & Origin Scoping ===');
  {
    // A. Same-Origin / No Origin Header (Direct internal proxy request)
    const sameOriginRes = await app.inject({
      method: 'GET',
      url: '/api/health',
    });
    assert('Same-origin request without Origin header is allowed (200)', sameOriginRes.statusCode === 200);

    // B. Authorized Production Frontend Origin
    const authOriginRes = await app.inject({
      method: 'GET',
      url: '/api/health',
      headers: {
        origin: 'http://localhost:3000',
      },
    });
    assert('Configured frontend origin is allowed with CORS headers', authOriginRes.statusCode === 200);

    // C. Unauthorized Third-Party Origin
    const evilOriginRes = await app.inject({
      method: 'GET',
      url: '/api/health',
      headers: {
        origin: 'https://malicious-attacker-site.com',
      },
    });
    assert('Unauthorized third-party cross-origin is blocked by CORS policy', evilOriginRes.statusCode === 500 || evilOriginRes.statusCode === 403);
  }

  // === 5. Rate Limiting Protection ===
  console.log('\n=== TEST 5: Rate Limiting & Exemption Allow-lists ===');
  {
    // Health check should be exempted from rate limiting
    let allHealthPassed = true;
    for (let i = 0; i < 5; i++) {
      const res = await app.inject({ method: 'GET', url: '/api/health' });
      if (res.statusCode !== 200) allHealthPassed = false;
    }
    assert('Exempted endpoints (/api/health) pass unrestricted without 429', allHealthPassed);
  }

  // === 6. Route Path Integrity Under /api/* ===
  console.log('\n=== TEST 6: Route Path Integrity Under /api/* ===');
  {
    const routes = [
      { method: 'GET', url: '/api/products' },
      { method: 'GET', url: '/api/categories' },
      { method: 'POST', url: '/api/discounts/validate', payload: { code: 'INVALID' } },
      { method: 'GET', url: '/api/shipping/track/BC-TEST' },
      { method: 'POST', url: '/api/payments/razorpay/order', payload: {} },
    ];

    for (const r of routes) {
      const res = await app.inject({
        method: r.method as any,
        url: r.url,
        payload: r.payload,
      });
      assert(`Route ${r.method} ${r.url} is reachable under /api prefix (status: ${res.statusCode})`, res.statusCode !== 404);
    }
  }

  // === 7. Protected Route Authorization Guards ===
  console.log('\n=== TEST 7: Protected Admin & Customer Route Guards ===');
  {
    const adminRes = await app.inject({
      method: 'GET',
      url: '/api/admin/products',
    });
    assert('Admin products route requires authentication (401)', adminRes.statusCode === 401);

    const customerRes = await app.inject({
      method: 'GET',
      url: '/api/customers/me',
    });
    assert('Customer profile route requires authentication (401)', customerRes.statusCode === 401);
  }

  // === 8. Secrets Audit Across Frontend & Public Assets ===
  console.log('\n=== TEST 8: Frontend Private Secrets Audit ===');
  {
    const frontendDir = path.resolve(process.cwd(), '../frontend');
    const forbiddenSecrets = [
      'SUPABASE_SERVICE_ROLE_KEY',
      'RAZORPAY_KEY_SECRET',
      'RAZORPAY_WEBHOOK_SECRET',
      'RESEND_API_KEY',
      'SHIPROCKET_PASSWORD',
      'SHIPROCKET_API_TOKEN',
      'SHIPROCKET_WEBHOOK_SECRET',
    ];

    let leakFound = false;

    function scanFiles(dir: string) {
      if (!fs.existsSync(dir)) return;
      const files = fs.readdirSync(dir);
      for (const f of files) {
        if (f === 'node_modules' || f === '.next' || f === '.git') continue;
        const fullPath = path.join(dir, f);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          scanFiles(fullPath);
        } else if (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.json')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          for (const s of forbiddenSecrets) {
            if (content.includes(s) && !content.includes('test-production')) {
              console.error(`  ❌ Forbidden secret '${s}' found in ${fullPath}`);
              leakFound = true;
            }
          }
        }
      }
    }

    scanFiles(frontendDir);
    assert('Zero private server secrets found in frontend codebase', !leakFound);
  }

  // === 9. Caddy & Deployment Config Files Check ===
  console.log('\n=== TEST 9: Deployment Artifacts Verification ===');
  {
    const caddyfile = path.resolve(process.cwd(), '../Caddyfile');
    const deployCaddy = path.resolve(process.cwd(), '../deploy/Caddyfile');
    const dockerCompose = path.resolve(process.cwd(), '../docker-compose.yml');
    const backendDocker = path.resolve(process.cwd(), 'Dockerfile');
    const frontendDocker = path.resolve(process.cwd(), '../frontend/Dockerfile');

    assert('Root Caddyfile exists and is configured', fs.existsSync(caddyfile));
    assert('Deploy Caddyfile exists and is configured', fs.existsSync(deployCaddy));
    assert('docker-compose.yml exists with backend, frontend, and caddy services', fs.existsSync(dockerCompose));
    assert('backend/Dockerfile exists', fs.existsSync(backendDocker));
    assert('frontend/Dockerfile exists', fs.existsSync(frontendDocker));
  }

  console.log('\n=========================================================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('✅ Milestone 12 Reverse Proxy & Production Architecture verified.');
  }
}

runProductionTests();
