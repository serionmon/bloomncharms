export interface OrderItemEmailData {
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  customization?: Record<string, any>;
}

export interface OrderConfirmationEmailData {
  orderNumber: string;
  orderDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
  };
  items: OrderItemEmailData[];
  subtotal: number;
  couponCode?: string;
  couponDiscount?: number;
  paymentMethodDiscount?: number;
  totalDiscount?: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: 'full_online' | 'hybrid' | 'cod' | string;
  paymentStatus: string;
  amountPaid: number;
  amountDue: number;
}

export function renderOrderConfirmationHtml(data: OrderConfirmationEmailData): string {
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
        <td style="padding: 14px 0; color: #1C1B1F; font-size: 14px; font-family: 'Inter', Helvetica, Arial, sans-serif;">
          <div style="font-weight: 600; color: #1C1B1F;">${escapeHtml(item.name)}</div>
          ${item.sku ? `<div style="font-size: 11px; color: #767577; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px;">SKU: ${escapeHtml(item.sku)}</div>` : ''}
        </td>
        <td style="padding: 14px 12px; text-align: center; color: #49454E; font-size: 14px; font-family: 'Inter', Helvetica, Arial, sans-serif;">
          ${item.quantity}
        </td>
        <td style="padding: 14px 12px; text-align: right; color: #49454E; font-size: 14px; font-family: 'Inter', Helvetica, Arial, sans-serif;">
          ₹${item.unitPrice.toLocaleString('en-IN')}
        </td>
        <td style="padding: 14px 0; text-align: right; color: #1C1B1F; font-weight: 600; font-size: 14px; font-family: 'Inter', Helvetica, Arial, sans-serif;">
          ₹${item.lineTotal.toLocaleString('en-IN')}
        </td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation — ${escapeHtml(data.orderNumber)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F4F0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F4F4F0; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #E2E1DC; border-radius: 4px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #FAFAF8; padding: 36px 32px 28px; text-align: center; border-bottom: 1px solid #EAE9E4;">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #800020; font-weight: 700; margin-bottom: 8px;">
                Handcrafted Floral Creations
              </div>
              <h1 style="margin: 0; font-family: 'EB Garamond', Georgia, serif; font-size: 28px; font-weight: 500; letter-spacing: 0.5px; color: #1C1B1F;">
                Bloomncharms Atelier
              </h1>
              <div style="width: 40px; height: 1px; background-color: #800020; margin: 16px auto 0;"></div>
            </td>
          </tr>

          <!-- Order Confirmed Banner -->
          <tr>
            <td style="padding: 32px 32px 20px;">
              <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #800020; font-weight: 700; margin-bottom: 6px;">
                Order Confirmation
              </div>
              <h2 style="margin: 0 0 12px; font-family: 'EB Garamond', Georgia, serif; font-size: 22px; color: #1C1B1F; font-weight: 500;">
                Thank you for your order, ${escapeHtml(data.customerName)}
              </h2>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #49454E;">
                Your artisanal order has been received and registered at our studio. We are preparing your creations with utmost care and attention to detail.
              </p>
            </td>
          </tr>

          <!-- Metadata Box -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FAFAF8; border: 1px solid #EAE9E4; border-radius: 4px; padding: 16px 20px;">
                <tr>
                  <td style="font-size: 12px; color: #767577; text-transform: uppercase; letter-spacing: 1px; padding: 4px 0;">Order Reference</td>
                  <td style="font-size: 13px; color: #1C1B1F; font-weight: 700; text-align: right; padding: 4px 0; font-family: monospace;">${escapeHtml(data.orderNumber)}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #767577; text-transform: uppercase; letter-spacing: 1px; padding: 4px 0;">Date</td>
                  <td style="font-size: 13px; color: #1C1B1F; text-align: right; padding: 4px 0;">${escapeHtml(data.orderDate)}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #767577; text-transform: uppercase; letter-spacing: 1px; padding: 4px 0;">Payment Method</td>
                  <td style="font-size: 13px; color: #1C1B1F; font-weight: 600; text-align: right; padding: 4px 0;">${escapeHtml(paymentMethodLabel)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 2px solid #1C1B1F;">
                    <th align="left" style="padding: 8px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #1C1B1F; font-weight: 700;">Item</th>
                    <th align="center" style="padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #1C1B1F; font-weight: 700;">Qty</th>
                    <th align="right" style="padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #1C1B1F; font-weight: 700;">Price</th>
                    <th align="right" style="padding: 8px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #1C1B1F; font-weight: 700;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Totals Breakdown -->
          <tr>
            <td style="padding: 0 32px 28px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 1px solid #E5E5E2; padding-top: 16px;">
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #49454E;">Subtotal</td>
                  <td style="padding: 4px 0; font-size: 13px; color: #1C1B1F; text-align: right; font-weight: 500;">₹${data.subtotal.toLocaleString('en-IN')}</td>
                </tr>
                ${
                  data.couponDiscount && data.couponDiscount > 0
                    ? `<tr>
                    <td style="padding: 4px 0; font-size: 13px; color: #800020;">Promo Coupon (${escapeHtml(data.couponCode || 'APPLIED')})</td>
                    <td style="padding: 4px 0; font-size: 13px; color: #800020; text-align: right; font-weight: 500;">−₹${data.couponDiscount.toLocaleString('en-IN')}</td>
                  </tr>`
                    : ''
                }
                ${
                  data.paymentMethodDiscount && data.paymentMethodDiscount > 0
                    ? `<tr>
                    <td style="padding: 4px 0; font-size: 13px; color: #800020;">Online Atelier Savings (10%)</td>
                    <td style="padding: 4px 0; font-size: 13px; color: #800020; text-align: right; font-weight: 500;">−₹${data.paymentMethodDiscount.toLocaleString('en-IN')}</td>
                  </tr>`
                    : ''
                }
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #49454E;">Atelier Shipping</td>
                  <td style="padding: 4px 0; font-size: 13px; color: #1C1B1F; text-align: right; text-transform: uppercase; font-size: 11px; font-weight: 600; letter-spacing: 0.5px;">Complimentary</td>
                </tr>
                <tr style="border-top: 1px solid #1C1B1F;">
                  <td style="padding: 12px 0 4px; font-size: 15px; color: #1C1B1F; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Total Order</td>
                  <td style="padding: 12px 0 4px; font-size: 18px; color: #800020; font-weight: 700; text-align: right; font-family: 'EB Garamond', Georgia, serif;">₹${data.totalAmount.toLocaleString('en-IN')}</td>
                </tr>

                <!-- Split Breakdown for Hybrid / Paid Online -->
                <tr>
                  <td colspan="2" style="padding-top: 12px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FAFAF8; border: 1px solid #EAE9E4; border-radius: 4px; padding: 12px 16px;">
                      <tr>
                        <td style="font-size: 12px; color: #49454E; font-weight: 600;">Paid Online / Advance:</td>
                        <td style="font-size: 13px; color: #1C1B1F; font-weight: 700; text-align: right;">₹${data.amountPaid.toLocaleString('en-IN')}</td>
                      </tr>
                      ${
                        data.amountDue > 0
                          ? `<tr>
                        <td style="font-size: 12px; color: #800020; font-weight: 600; padding-top: 4px;">Due on Delivery (Doorstep):</td>
                        <td style="font-size: 13px; color: #800020; font-weight: 700; text-align: right; padding-top: 4px;">₹${data.amountDue.toLocaleString('en-IN')}</td>
                      </tr>`
                          : `<tr>
                        <td style="font-size: 12px; color: #49454E; padding-top: 4px;">Due on Delivery:</td>
                        <td style="font-size: 13px; color: #49454E; text-align: right; padding-top: 4px;">₹0</td>
                      </tr>`
                      }
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Shipping Address -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FAFAF8; border: 1px solid #EAE9E4; border-radius: 4px; padding: 16px 20px;">
                <tr>
                  <td style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #800020; font-weight: 700; padding-bottom: 8px;">
                    Delivery Address
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 13px; line-height: 1.5; color: #1C1B1F;">
                    <strong>${escapeHtml(data.customerName)}</strong><br>
                    ${escapeHtml(data.shippingAddress.addressLine1)}${data.shippingAddress.addressLine2 ? `<br>${escapeHtml(data.shippingAddress.addressLine2)}` : ''}<br>
                    ${escapeHtml(data.shippingAddress.city)}, ${escapeHtml(data.shippingAddress.state)} — ${escapeHtml(data.shippingAddress.postalCode)}<br>
                    <span style="color: #767577; font-size: 12px;">Contact: ${escapeHtml(data.customerPhone)}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #FAFAF8; padding: 24px 32px; text-align: center; border-top: 1px solid #EAE9E4; font-size: 12px; line-height: 1.6; color: #767577;">
              <p style="margin: 0 0 8px;">
                Need assistance with your artisanal order? Reply directly to this email or write to us at <a href="mailto:concierge@bloomncharms.com" style="color: #800020; text-decoration: none; font-weight: 600;">concierge@bloomncharms.com</a>.
              </p>
              <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9C9A9E;">
                Bloomncharms Atelier • Handcrafted with devotion
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderOrderConfirmationPlainText(data: OrderConfirmationEmailData): string {
  const isHybrid = data.paymentMethod === 'hybrid';
  const isOnline = data.paymentMethod === 'full_online';
  const paymentMethodLabel = isOnline
    ? 'Pay 100% Online'
    : isHybrid
    ? 'Pay 50% Online + 50% on Delivery'
    : 'Cash on Delivery';

  const itemsList = data.items
    .map(
      (item) =>
        `- ${item.name} (Qty: ${item.quantity}) × ₹${item.unitPrice.toLocaleString('en-IN')} = ₹${item.lineTotal.toLocaleString('en-IN')}`
    )
    .join('\n');

  return `BLOOMNCHARMS ATELIER
Order Confirmation

Thank you for your handcrafted order, ${data.customerName}!

==================================================
ORDER DETAILS
==================================================
Order Reference : ${data.orderNumber}
Order Date      : ${data.orderDate}
Payment Method  : ${paymentMethodLabel}
Payment Status  : ${data.paymentStatus.toUpperCase()}

==================================================
ITEMS
==================================================
${itemsList}

==================================================
FINANCIAL BREAKDOWN
==================================================
Subtotal        : ₹${data.subtotal.toLocaleString('en-IN')}
${data.couponDiscount ? `Coupon Discount : −₹${data.couponDiscount.toLocaleString('en-IN')}\n` : ''}${data.paymentMethodDiscount ? `Online Savings  : −₹${data.paymentMethodDiscount.toLocaleString('en-IN')}\n` : ''}Shipping        : Complimentary
--------------------------------------------------
Total Order     : ₹${data.totalAmount.toLocaleString('en-IN')}
Paid Online     : ₹${data.amountPaid.toLocaleString('en-IN')}
Due on Delivery : ₹${data.amountDue.toLocaleString('en-IN')}

==================================================
SHIPPING ADDRESS
==================================================
${data.customerName}
${data.shippingAddress.addressLine1}
${data.shippingAddress.addressLine2 ? data.shippingAddress.addressLine2 + '\n' : ''}${data.shippingAddress.city}, ${data.shippingAddress.state} — ${data.shippingAddress.postalCode}
Contact: ${data.customerPhone}

Need help? Contact concierge@bloomncharms.com
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
