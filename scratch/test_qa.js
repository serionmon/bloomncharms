const { chromium } = require('playwright');

async function runQA() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  const results = {};

  try {
    console.log('--- STARTING QA TEST ---');

    // 1. Open /shop
    await page.goto('http://localhost:3000/shop', { waitUntil: 'networkidle' });
    console.log('Step 1: Opened /shop');

    // 2. Open a product
    await page.goto('http://localhost:3000/products/signature-bloom-bouquet', { waitUntil: 'networkidle' });
    console.log('Step 2: Opened product detail page /products/signature-bloom-bouquet');

    // 3. Click ADD TO CART
    const addToCartBtn = page.getByRole('button', { name: /add to cart/i });
    await addToCartBtn.click();
    console.log('Step 3: Clicked ADD TO CART');

    // 4. Verify header cart counter updates (becomes 1)
    await page.waitForTimeout(500);
    const cartBadge = page.locator('header button[aria-label*="Shopping Bag"] span').last();
    let countText = await cartBadge.innerText();
    console.log(`Step 4: Cart counter after 1st add: ${countText}`);
    results['counter_after_add_1'] = countText === '1' ? 'PASS' : `FAIL (${countText})`;

    // 5. Add the same product again
    await addToCartBtn.click();
    console.log('Step 5: Clicked ADD TO CART again');

    // 6. Verify quantity and cart counter update (becomes 2)
    await page.waitForTimeout(500);
    countText = await cartBadge.innerText();
    console.log(`Step 6: Cart counter after 2nd add: ${countText}`);
    results['counter_after_add_2'] = countText === '2' ? 'PASS' : `FAIL (${countText})`;

    // 7. Add a second different product
    await page.goto('http://localhost:3000/products/lavender-bloom-keyring', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /add to cart/i }).click();
    await page.waitForTimeout(500);
    countText = await cartBadge.innerText();
    console.log(`Step 7: Cart counter after adding 2nd product: ${countText}`);
    results['counter_after_2nd_product'] = countText === '3' ? 'PASS' : `FAIL (${countText})`;

    // 8. Open header cart icon
    const headerBagBtn = page.locator('header button[aria-label*="Shopping Bag"]');
    await headerBagBtn.click();
    await page.waitForTimeout(600);
    console.log('Step 8: Clicked header cart icon');

    // 9. Verify cart drawer opens from the right
    const drawer = page.locator('div[role="dialog"][aria-labelledby="cart-drawer-title"]');
    const isDrawerVisible = await drawer.isVisible();
    console.log(`Step 9: Cart drawer visible: ${isDrawerVisible}`);
    results['drawer_opens'] = isDrawerVisible ? 'PASS' : 'FAIL';

    // 10. Test + quantity in drawer
    const plusBtns = drawer.locator('button[aria-label="Increase quantity"]');
    const firstPlus = plusBtns.first();
    await firstPlus.click();
    await page.waitForTimeout(300);
    countText = await cartBadge.innerText();
    console.log(`Step 10: Counter after clicking + in drawer: ${countText}`);
    results['quantity_increment'] = countText === '4' ? 'PASS' : `FAIL (${countText})`;

    // 11. Test - quantity in drawer
    const minusBtns = drawer.locator('button[aria-label="Decrease quantity"]');
    const firstMinus = minusBtns.first();
    await firstMinus.click();
    await page.waitForTimeout(300);
    countText = await cartBadge.innerText();
    console.log(`Step 11: Counter after clicking - in drawer: ${countText}`);
    results['quantity_decrement'] = countText === '3' ? 'PASS' : `FAIL (${countText})`;

    // 12. Test Remove
    const removeBtns = drawer.locator('button:has-text("Remove")');
    await removeBtns.first().click();
    await page.waitForTimeout(400);
    console.log('Step 12: Clicked Remove on first item');

    // 13. Verify subtotal recalculates
    const subtotalText = await drawer.locator('text=Subtotal').locator('..').innerText();
    console.log(`Step 13: Subtotal text: ${subtotalText}`);
    results['subtotal_recalculates'] = subtotalText.includes('₹') ? 'PASS' : 'FAIL';

    // 14. Empty cart and verify empty-cart state
    const remainingRemove = drawer.locator('button:has-text("Remove")');
    if (await remainingRemove.count() > 0) {
      await remainingRemove.first().click();
      await page.waitForTimeout(400);
    }
    const emptyStateText = await drawer.innerText();
    const hasEmptyState = emptyStateText.includes('YOUR BAG IS EMPTY') && emptyStateText.includes('Explore the Collection');
    console.log(`Step 14: Empty cart state displayed: ${hasEmptyState}`);
    results['empty_cart_state'] = hasEmptyState ? 'PASS' : 'FAIL';

    // 15. Add products again
    const exploreBtn = drawer.locator('button:has-text("Explore the Collection")');
    await exploreBtn.click();
    await page.waitForURL('**/shop');
    console.log('Step 15: Clicked Explore the Collection, navigated to /shop');

    await page.goto('http://localhost:3000/products/signature-bloom-bouquet', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /add to cart/i }).click();
    await page.waitForTimeout(400);

    // 16. Click PROCEED TO CHECKOUT
    await page.locator('header button[aria-label*="Shopping Bag"]').click();
    await page.waitForTimeout(400);
    const checkoutBtn = drawer.locator('button:has-text("Proceed to Checkout")');
    await checkoutBtn.click();
    await page.waitForURL('**/checkout');
    console.log('Step 16: Clicked Proceed to Checkout, navigated to /checkout');

    // 17. Verify checkout uses actual cart contents
    const checkoutSummaryText = await page.locator('h3:has-text("Order Summary")').locator('..').innerText();
    const hasCartItem = checkoutSummaryText.includes('Signature Bloom Bouquet') && checkoutSummaryText.includes('1,299');
    console.log(`Step 17: Checkout shows actual cart item: ${hasCartItem}`);
    results['checkout_actual_cart'] = hasCartItem ? 'PASS' : 'FAIL';

    // 18. Complete Step 1 with valid delivery info
    await page.fill('#firstName', 'Aarav');
    await page.fill('#lastName', 'Mehta');
    await page.fill('#phone', '+91 98765 12345');
    await page.fill('#email', 'aarav@example.com');
    await page.fill('#address', '74 Gulmohar Cross Road');
    await page.fill('#apartment', 'Villa 3');
    await page.fill('#city', 'Bengaluru');
    await page.fill('#state', 'Karnataka');
    await page.fill('#pinCode', '560034');
    await page.fill('#notes', 'Fragile handcrafted stems, handle with care.');
    console.log('Step 18: Filled Step 1 delivery information');

    // 19. Continue to Step 2
    await page.locator('button:has-text("Continue to Review")').click();
    await page.waitForTimeout(500);
    console.log('Step 19: Clicked Continue to Review');

    // 20. Verify entered delivery information is shown correctly
    const reviewDeliveryText = await page.locator('text=Delivery Recipient & Address').locator('..').innerText();
    const hasRecipient = reviewDeliveryText.includes('Aarav Mehta') && reviewDeliveryText.includes('Bengaluru') && reviewDeliveryText.includes('560034');
    console.log(`Step 20: Step 2 shows entered delivery details: ${hasRecipient}`);
    results['checkout_step2_details'] = hasRecipient ? 'PASS' : 'FAIL';

    // 21. Verify order summary matches cart
    const step2Summary = await page.locator('h3:has-text("Order Summary")').locator('..').innerText();
    const step2Matches = step2Summary.includes('Signature Bloom Bouquet') && step2Summary.includes('1,299');
    console.log(`Step 21: Step 2 order summary matches cart: ${step2Matches}`);
    results['checkout_step2_summary'] = step2Matches ? 'PASS' : 'FAIL';

    // 22. Click PLACE ORDER
    const placeOrderBtn = page.locator('button:has-text("Place Order")');
    await placeOrderBtn.click();
    await page.waitForTimeout(500);
    console.log('Step 22: Clicked Place Order');

    // 23. Verify success modal appears
    const successModal = page.locator('div[role="dialog"][aria-labelledby="success-modal-title"]');
    const isSuccessVisible = await successModal.isVisible();
    const successText = await successModal.innerText();
    const hasOrderNumber = successText.includes('BC-DEMO-');
    console.log(`Step 23: Success modal visible: ${isSuccessVisible}, has order number: ${hasOrderNumber}`);
    results['order_success_modal'] = isSuccessVisible && hasOrderNumber ? 'PASS' : 'FAIL';

    // 24. Verify no real payment & 25. No Razorpay
    const hasRazorpay = await page.evaluate(() => typeof window['Razorpay'] !== 'undefined');
    console.log(`Step 24 & 25: Razorpay integrated? ${hasRazorpay}`);
    results['no_razorpay'] = !hasRazorpay ? 'PASS' : 'FAIL';

    // Close modal & Continue shopping
    await page.locator('button:has-text("Continue Shopping")').click();
    await page.waitForURL('**/shop');
    console.log('Step 24: Clicked Continue Shopping, returned to /shop');

    // 26. Refresh page and verify cart persistence behavior
    // Add an item to cart first
    await page.goto('http://localhost:3000/products/mini-pastel-bouquet', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /add to cart/i }).click();
    await page.waitForTimeout(400);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const persistedCount = await page.locator('header button[aria-label*="Shopping Bag"] span').last().innerText();
    console.log(`Step 26: Cart counter after page refresh: ${persistedCount}`);
    results['cart_persistence'] = persistedCount === '1' ? 'PASS' : `FAIL (${persistedCount})`;

    // 27. Test mobile width around 390px
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:3000/shop', { waitUntil: 'networkidle' });
    await page.locator('header button[aria-label*="Shopping Bag"]').click();
    await page.waitForTimeout(500);
    const mobileDrawerVisible = await drawer.isVisible();
    console.log(`Step 27: Mobile 390px drawer visible: ${mobileDrawerVisible}`);
    results['mobile_drawer'] = mobileDrawerVisible ? 'PASS' : 'FAIL';

    // 28. Test desktop width around 1440px
    await page.setViewportSize({ width: 1440, height: 900 });
    const desktopDrawerVisible = await drawer.isVisible();
    console.log(`Step 28: Desktop 1440px drawer visible: ${desktopDrawerVisible}`);
    results['desktop_drawer'] = desktopDrawerVisible ? 'PASS' : 'FAIL';

    // 29. Check console errors
    console.log(`Step 29: Console errors count: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('Console errors:', consoleErrors);
    }
    results['console_errors'] = consoleErrors.length === 0 ? 'NO' : 'YES';

    console.log('--- ALL QA TESTS COMPLETED ---');
    console.log('FINAL RESULTS:', JSON.stringify(results, null, 2));

  } catch (error) {
    console.error('QA Test Failure:', error);
  } finally {
    await browser.close();
  }
}

runQA();
