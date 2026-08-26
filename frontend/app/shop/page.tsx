import React, { Suspense } from 'react';
import ShopCatalogContent from './ShopCatalogContent';

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="p-xl text-center font-body-md">Loading catalog...</div>}>
      <ShopCatalogContent />
    </Suspense>
  );
}
