import { getAdminSupabaseClient } from '../common/supabase.js';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('Connecting to Supabase...');
  try {
    const supabase = getAdminSupabaseClient();

    // Test simple select on categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('sort_order', { ascending: true });

    if (catError) {
      console.log('Categories query response:', catError.message, catError.code);
    } else {
      console.log(`Categories found in database: ${categories ? categories.length : 0}`);
      if (categories && categories.length > 0) {
        console.log('Category slugs:', categories.map((c: { slug: string }) => c.slug).join(', '));
      }
    }

    // Check products
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('id, slug, name, price, is_active');

    if (prodError) {
      console.log('Products query response:', prodError.message, prodError.code);
    } else {
      console.log(`Products found in database: ${products ? products.length : 0}`);
    }

    // Check inventory
    const { data: inventory, error: invError } = await supabase
      .from('inventory')
      .select('id, product_id, stock_quantity, low_stock_threshold');

    if (invError) {
      console.log('Inventory query response:', invError.message, invError.code);
    } else {
      console.log(`Inventory records found in database: ${inventory ? inventory.length : 0}`);
    }

    // Check storage bucket
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
      console.log('Storage buckets check:', bucketError.message);
    } else {
      const productImagesBucket = buckets?.find((b) => b.name === 'product-images');
      console.log('product-images bucket exists:', !!productImagesBucket, productImagesBucket ? `(public: ${productImagesBucket.public})` : '');
    }

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Verification error:', message);
  }
}

main();
