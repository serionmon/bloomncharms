import { z } from 'zod';

export const createRazorpayOrderSchema = z.object({
  orderNumber: z.string().trim().min(3, 'Order number is required.'),
});

export type CreateRazorpayOrderInput = z.infer<typeof createRazorpayOrderSchema>;

export const verifyPaymentSchema = z.object({
  orderNumber: z.string().trim().min(3, 'Order number is required.'),
  razorpay_order_id: z.string().trim().min(1, 'Razorpay order ID is required.'),
  razorpay_payment_id: z.string().trim().min(1, 'Razorpay payment ID is required.'),
  razorpay_signature: z.string().trim().min(1, 'Razorpay signature is required.'),
});

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
