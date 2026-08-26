import { Resend } from 'resend';
import { config } from '../common/config.js';
import { getAdminSupabaseClient } from '../common/supabase.js';
import {
  OrderConfirmationEmailData,
  renderOrderConfirmationHtml,
  renderOrderConfirmationPlainText,
} from './templates/order-confirmation.js';
import {
  renderAdminNewOrderHtml,
  renderAdminNewOrderPlainText,
} from './templates/new-order-admin.js';

export interface EmailDeliveryResult {
  customerEmail: {
    sent: boolean;
    status: 'sent' | 'skipped' | 'failed' | 'already_sent';
    resendId?: string;
    error?: string;
  };
  adminEmail: {
    sent: boolean;
    status: 'sent' | 'skipped' | 'failed' | 'already_sent';
    resendId?: string;
    error?: string;
  };
}

// In-memory idempotency cache for duplicate request prevention
const sentEmailsCache = new Set<string>();

export class EmailService {
  public static getResendClient(): Resend | null {
    if (config.RESEND_API_KEY && config.RESEND_API_KEY.trim().length > 0 && !config.RESEND_API_KEY.includes('your_api_key')) {
      return new Resend(config.RESEND_API_KEY.trim());
    }
    return null;
  }

  /**
   * Dispatches both customer order confirmation and admin alert after order creation.
   * Guaranteed to be non-blocking and will never throw an exception that could abort the order.
   */
  public static async sendOrderEmails(
    data: OrderConfirmationEmailData,
    orderId?: string
  ): Promise<EmailDeliveryResult> {
    const result: EmailDeliveryResult = {
      customerEmail: { sent: false, status: 'skipped' },
      adminEmail: { sent: false, status: 'skipped' },
    };

    try {
      // 1. Send Customer Confirmation Email
      result.customerEmail = await this.sendCustomerConfirmation(data, orderId);

      // 2. Send Admin New Order Notification
      result.adminEmail = await this.sendAdminNewOrderAlert(data, orderId);
    } catch (err: any) {
      console.error('[EmailService] Unexpected error while processing order emails:', err?.message || err);
    }

    return result;
  }

  /**
   * Sends customer order confirmation email with idempotency and safe error handling.
   */
  public static async sendCustomerConfirmation(
    data: OrderConfirmationEmailData,
    orderId?: string
  ): Promise<{ sent: boolean; status: 'sent' | 'skipped' | 'failed' | 'already_sent'; resendId?: string; error?: string }> {
    const idempotencyKey = `${data.orderNumber}:customer_confirmation`;

    // Check in-memory idempotency
    if (sentEmailsCache.has(idempotencyKey)) {
      return { sent: false, status: 'already_sent' };
    }

    const resend = this.getResendClient();
    const recipient = data.customerEmail;

    if (!recipient) {
      return { sent: false, status: 'skipped', error: 'Customer email is missing.' };
    }

    if (!resend) {
      sentEmailsCache.add(idempotencyKey);
      await this.recordEmailLog(orderId, data.orderNumber, recipient, 'customer_confirmation', 'skipped');
      return { sent: false, status: 'skipped' };
    }

    try {
      const subject = `Order Confirmed: ${data.orderNumber} — Bloomncharms Atelier`;
      const html = renderOrderConfirmationHtml(data);
      const text = renderOrderConfirmationPlainText(data);

      const response = await resend.emails.send({
        from: config.RESEND_FROM_EMAIL,
        to: recipient,
        subject,
        html,
        text,
      });

      if (response.error) {
        console.error(`[EmailService] Resend delivery failed for ${data.orderNumber}:`, response.error.message);
        await this.recordEmailLog(orderId, data.orderNumber, recipient, 'customer_confirmation', 'failed', undefined, response.error.message);
        return { sent: false, status: 'failed', error: response.error.message };
      }

      sentEmailsCache.add(idempotencyKey);
      await this.recordEmailLog(orderId, data.orderNumber, recipient, 'customer_confirmation', 'sent', response.data?.id);
      return { sent: true, status: 'sent', resendId: response.data?.id };
    } catch (err: any) {
      console.error(`[EmailService] Customer email exception for ${data.orderNumber}:`, err?.message || err);
      await this.recordEmailLog(orderId, data.orderNumber, recipient, 'customer_confirmation', 'failed', undefined, err?.message);
      return { sent: false, status: 'failed', error: err?.message || 'Unknown transport error' };
    }
  }

  /**
   * Sends admin alert email for newly created orders.
   */
  public static async sendAdminNewOrderAlert(
    data: OrderConfirmationEmailData,
    orderId?: string
  ): Promise<{ sent: boolean; status: 'sent' | 'skipped' | 'failed' | 'already_sent'; resendId?: string; error?: string }> {
    const idempotencyKey = `${data.orderNumber}:admin_new_order`;

    if (sentEmailsCache.has(idempotencyKey)) {
      return { sent: false, status: 'already_sent' };
    }

    const resend = this.getResendClient();
    const adminEmail = config.STORE_ADMIN_EMAIL;

    if (!adminEmail) {
      return { sent: false, status: 'skipped', error: 'Store admin email not configured.' };
    }

    if (!resend) {
      sentEmailsCache.add(idempotencyKey);
      await this.recordEmailLog(orderId, data.orderNumber, adminEmail, 'admin_new_order', 'skipped');
      return { sent: false, status: 'skipped' };
    }

    try {
      const subject = `[New Order] ${data.orderNumber} — ₹${data.totalAmount.toLocaleString('en-IN')} (${data.customerName})`;
      const html = renderAdminNewOrderHtml(data);
      const text = renderAdminNewOrderPlainText(data);

      const response = await resend.emails.send({
        from: config.RESEND_FROM_EMAIL,
        to: adminEmail,
        subject,
        html,
        text,
      });

      if (response.error) {
        console.error(`[EmailService] Admin email delivery failed for ${data.orderNumber}:`, response.error.message);
        await this.recordEmailLog(orderId, data.orderNumber, adminEmail, 'admin_new_order', 'failed', undefined, response.error.message);
        return { sent: false, status: 'failed', error: response.error.message };
      }

      sentEmailsCache.add(idempotencyKey);
      await this.recordEmailLog(orderId, data.orderNumber, adminEmail, 'admin_new_order', 'sent', response.data?.id);
      return { sent: true, status: 'sent', resendId: response.data?.id };
    } catch (err: any) {
      console.error(`[EmailService] Admin email exception for ${data.orderNumber}:`, err?.message || err);
      await this.recordEmailLog(orderId, data.orderNumber, adminEmail, 'admin_new_order', 'failed', undefined, err?.message);
      return { sent: false, status: 'failed', error: err?.message || 'Unknown transport error' };
    }
  }

  private static async recordEmailLog(
    orderId: string | undefined,
    orderNumber: string,
    recipientEmail: string,
    emailType: string,
    status: string,
    resendId?: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      const hasSupabase = Boolean(
        config.SUPABASE_URL && (config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY)
      );
      if (!hasSupabase) return;

      const client = getAdminSupabaseClient();
      await (client.from as any)('email_notifications').insert({
        order_id: orderId || null,
        order_number: orderNumber,
        recipient_email: recipientEmail,
        email_type: emailType,
        status,
        resend_id: resendId || null,
        error_message: errorMessage || null,
      });
    } catch (err: any) {
      // Non-critical logging failure
      console.warn('[EmailService] Failed to record email log in DB:', err?.message || err);
    }
  }
}
