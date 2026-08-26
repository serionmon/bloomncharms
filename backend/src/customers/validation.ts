import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required.')
    .max(100, 'First name cannot exceed 100 characters.')
    .regex(/^[A-Za-z\s'\-]+$/, 'First name contains invalid characters.')
    .optional(),
  lastName: z
    .string()
    .trim()
    .min(1, 'Last name is required.')
    .max(100, 'Last name cannot exceed 100 characters.')
    .regex(/^[A-Za-z\s'\-]+$/, 'Last name contains invalid characters.')
    .optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number.')
    .optional()
    .nullable(),
});

export const createAddressSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'Recipient first name is required.')
    .max(100),
  lastName: z
    .string()
    .trim()
    .min(1, 'Recipient last name is required.')
    .max(100),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number.'),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address.')
    .max(150),
  addressLine1: z
    .string()
    .trim()
    .min(5, 'Street address must be at least 5 characters.')
    .max(255),
  addressLine2: z
    .string()
    .trim()
    .max(255)
    .optional()
    .nullable(),
  city: z
    .string()
    .trim()
    .min(2, 'City name is required.')
    .max(100),
  state: z
    .string()
    .trim()
    .min(2, 'State name is required.')
    .max(100),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Postal PIN code must be exactly 6 digits.'),
  country: z
    .string()
    .trim()
    .default('IN'),
  isDefault: z
    .boolean()
    .optional()
    .default(false),
});

export const updateAddressSchema = createAddressSchema.partial();

export const addressIdParamSchema = z.object({
  id: z.string().uuid('Address ID must be a valid UUID.'),
});

export const orderIdParamSchema = z.object({
  id: z.string().uuid('Order ID must be a valid UUID.'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
