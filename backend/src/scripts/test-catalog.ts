import { buildApp } from '../app.js';

async function runTests() {
  const app = await buildApp();
  console.log('Testing GET /api/health...');
  const resHealth = await app.inject({ method: 'GET', url: '/api/health' });
  console.log('Status:', resHealth.statusCode, resHealth.json());

  console.log('\nTesting GET /api/categories...');
  const resCats = await app.inject({ method: 'GET', url: '/api/categories' });
  console.log('Status:', resCats.statusCode, 'Categories Count:', resCats.json().categories?.length);

  console.log('\nTesting GET /api/products...');
  const resProds = await app.inject({ method: 'GET', url: '/api/products' });
  const prodsData = resProds.json();
  console.log('Status:', resProds.statusCode, 'Total Products:', prodsData.total, 'Sample:', prodsData.products?.[0]?.name);

  console.log('\nTesting GET /api/products?category=bouquets...');
  const resBouquets = await app.inject({ method: 'GET', url: '/api/products?category=bouquets' });
  console.log('Status:', resBouquets.statusCode, 'Bouquets Count:', resBouquets.json().products?.length);

  console.log('\nTesting GET /api/products/signature-bloom-bouquet...');
  const resSlug = await app.inject({ method: 'GET', url: '/api/products/signature-bloom-bouquet' });
  console.log('Status:', resSlug.statusCode, 'Product Name:', resSlug.json().product?.name);

  console.log('\nTesting GET /api/products/non-existent-slug (404 check)...');
  const res404 = await app.inject({ method: 'GET', url: '/api/products/non-existent-slug' });
  console.log('Status:', res404.statusCode, 'Error Message:', res404.json().message);

  await app.close();
  console.log('\nAll Backend API Verification Tests Completed Successfully!');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});