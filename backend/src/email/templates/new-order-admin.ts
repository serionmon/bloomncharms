import { OrderConfirmationEmailData } from './order-confirmation.js';

export function renderAdminNewOrderHtml(data: OrderConfirmationEmailData): string {
  const isHybrid = data.paymentMethod === 'hybrid';
  const isOnline = data.paymentMethod === 'full_online';
  const paymentMethodLabel = isOnline
    ? 'Pay 100% Online'
    : isHybrid
    ? 'Pay 50% Online + 50% on Delivery'
    : 'Cash on Delivery';

  const itemsHtml = data.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #E5E5E2;">
        <td style="padding: 10px 0; font-size: 13px; color: #1C1B1F;">
          <strong>${escapeHtml(item.name)}</strong>
          ${item.sku ? `<div style="font-size: 11px; color: #767577;">SKU: ${escapeHtml(item.sku)}</div>` : ''}
        </td>
        <td style="padding: 10px 8px; text-align: center; font-size: 13px; color: #49454E;">${item.quantity}</td>
        <td style="padding: 10px 8px; text-align: right; font-size: 13px; color: #49454E;">₹${item.unitPrice.toLocaleString('en-IN')}</td>
        <td style="padding: 10px 0; text-align: right; font-size: 13px; font-weight: 600; color: #1C1B1F;">₹${item.lineTotal.toLocaleString('en-IN')}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>[New Order] ${escapeHtml(data.orderNumber)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F4F0; font-family: 'Inter', Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 24px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #D8D6CE; border-radius: 4px;">
          <!-- Header -->
          <tr>
            <td style="background-color: #1C1B1F; color: #FFFFFF; padding: 20px 24px; border-top-left-radius: 3px; border-top-right-radius: 3px;">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #E8B4B8;">Atelier Store Notification</div>
              <h2 style="margin: 4px 0 0; font-family: Georgia, serif; font-size: 20px; font-weight: 500;">
                New Order Received: ${escapeHtml(data.orderNumber)}
              </h2>
            </td>
          </tr>

          <!-- Summary Box -->
          <tr>
            <td style="padding: 24px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FAFAF8; border: 1px solid #EAE9E4; border-radius: 4px; padding: 14px 18px; margin-bottom: 20px;">
                <tr>
                  <td style="font-size: 13px; color: #767577; padding: 3px 0;">Customer</td>
                  <td style="font-size: 13px; color: #1C1B1F; font-weight: 600; text-align: right; padding: 3px 0;">${escapeHtml(data.customerName)}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #767577; padding: 3px 0;">Email</td>
                  <td style="font-size: 13px; color: #1C1B1F; text-align: right; padding: 3px 0;"><a href="mailto:${escapeHtml(data.customerEmail)}" style="color: #800020; text-decoration: none;">${escapeHtml(data.customerEmail)}</a></td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #767577; padding: 3px 0;">Phone</td>
                  <td style="font-size: 13px; color: #1C1B1F; text-align: right; padding: 3px 0;">${escapeHtml(data.customerPhone)}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #767577; padding: 3px 0;">Payment Method</td>
                  <td style="font-size: 13px; color: #1C1B1F; font-weight: 600; text-align: right; padding: 3px 0;">${escapeHtml(paymentMethodLabel)}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #767577; padding: 3px 0;">Payment Status</td>
                  <td style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #800020; text-align: right; padding: 3px 0;">${escapeHtml(data.paymentStatus)}</td>
                </tr>
              </table>

              <!-- Items Table -->
              <h3 style="margin: 0 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #1C1B1F;">Order Items</h3>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                  <tr style="border-bottom: 2px solid #1C1B1F;">
                    <th align="left" style="padding: 6px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Product</th>
                    <th align="center" style="padding: 6px 8px; font-size: 11px; text-transform: uppercase;">Qty</th>
                    <th align="right" style="padding: 6px 8px; font-size: 11px; text-transform: uppercase;">Rate</th>
                    <th align="right" style="padding: 6px 0; font-size: 11px; text-transform: uppercase;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Totals Breakdown -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 1px solid #E5E5E2; padding-top: 12px; margin-bottom: 20px;">
                <tr>
                  <td style="font-size: 13px; color: #49454E; padding: 3px 0;">Subtotal:</td>
                  <td style="font-size: 13px; color: #1C1B1F; text-align: right; font-weight: 600;">₹${data.subtotal.toLocaleString('en-IN')}</td>
                </tr>
                ${
                  data.totalDiscount && data.totalDiscount > 0
                    ? `<tr>
                  <td style="font-size: 13px; color: #800020; padding: 3px 0;">Total Discounts:</td>
                  <td style="font-size: 13px; color: #800020; text-align: right; font-weight: 600;">−₹${data.totalDiscount.toLocaleString('en-IN')}</td>
                </tr>`
                    : ''
                }
                <tr style="border-top: 1px solid #1C1B1F;">
                  <td style="font-size: 14px; font-weight: 700; text-transform: uppercase; padding: 8px 0 2px;">Total Order Value:</td>
                  <td style="font-size: 16px; font-weight: 700; color: #800020; text-align: right; padding: 8px 0 2px;">₹${data.totalAmount.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #49454E; padding: 2px 0;">Paid Advance:</td>
                  <td style="font-size: 13px; color: #1C1B1F; font-weight: 700; text-align: right;">₹${data.amountPaid.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #800020; padding: 2px 0;">Balance Due on Delivery:</td>
                  <td style="font-size: 13px; color: #800020; font-weight: 700; text-align: right;">₹${data.amountDue.toLocaleString('en-IN')}</td>
                </tr>
              </table>

              <!-- Shipping Info -->
              <h3 style="margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #1C1B1F;">Delivery Destination</h3>
              <div style="background-color: #FAFAF8; border: 1px solid #EAE9E4; border-radius: 4px; padding: 14px 18px; font-size: 13px; line-height: 1.5; color: #1C1B1F;">
                <strong>${escapeHtml(data.customerName)}</strong><br>
                ${escapeHtml(data.shippingAddress.addressLine1)}${data.shippingAddress.addressLine2 ? `<br>${escapeHtml(data.shippingAddress.addressLine2)}` : ''}<br>
                ${escapeHtml(data.shippingAddress.city)}, ${escapeHtml(data.shippingAddress.state)} — ${escapeHtml(data.shippingAddress.postalCode)}<br>
                <span style="color: #767577; font-size: 12px;">Phone: ${escapeHtml(data.customerPhone)}</span>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderAdminNewOrderPlainText(data: OrderConfirmationEmailData): string {
  const isHybrid = data.paymentMethod === 'hybrid';
  const isOnline = data.paymentMethod === 'full_online';
  const paymentMethodLabel = isOnline
    ? 'Pay 100% Online'
    : isHybrid
    ? 'Pay 50% Online + 50% on Delivery'
    : 'Cash on Delivery';

  const itemsList = data.items
    .map((item) => `- ${item.name} (Qty: ${item.quantity}) × ₹${item.unitPrice} = ₹${item.lineTotal}`)
    .join('\n');

  return `[ADMIN ALERT] New Order Received: ${data.orderNumber}
==================================================
CUSTOMER DETAILS
==================================================
Name  : ${data.customerName}
Email : ${data.customerEmail}
Phone : ${data.customerPhone}

==================================================
ORDER & PAYMENT
==================================================
Order Reference : ${data.orderNumber}
Payment Method  : ${paymentMethodLabel}
Payment Status  : ${data.paymentStatus.toUpperCase()}
Total Amount    : ₹${data.totalAmount}
Paid Advance    : ₹${data.amountPaid}
Due on Delivery : ₹${data.amountDue}

==================================================
ITEMS
==================================================
${itemsList}

==================================================
DELIVERY DESTINATION
==================================================
${data.customerName}
${data.shippingAddress.addressLine1}
${data.shippingAddress.addressLine2 ? data.shippingAddress.addressLine2 + '\n' : ''}${data.shippingAddress.city}, ${data.shippingAddress.state} — ${data.shippingAddress.postalCode}
Contact: ${data.customerPhone}
`;
}

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
