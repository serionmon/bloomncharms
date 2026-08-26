/**
 * Bloomncharms Supabase Database type definitions.
 * Mirrors the public schema defined in supabase/migrations/20260825000000_initial_schema.sql
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'customer' | 'admin';
export type DiscountType = 'percentage' | 'fixed_amount';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'replacement_requested'
  | 'replacement_approved'
  | 'replacement_shipped'
  | 'refund_requested'
  | 'refund_approved'
  | 'rto';

export type PaymentStatus =
  | 'pending'
  | 'partially_paid'
  | 'paid'
  | 'failed'
  | 'refunded';

export type PaymentMethod = 'full_online' | 'hybrid' | 'cod' | 'unknown';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          phone: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          phone?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          phone?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          first_name: string;
          last_name: string;
          phone: string;
          email: string;
          address_line_1: string;
          address_line_2: string | null;
          city: string;
          state: string;
          postal_code: string;
          country: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name: string;
          last_name: string;
          phone: string;
          email: string;
          address_line_1: string;
          address_line_2?: string | null;
          city: string;
          state: string;
          postal_code: string;
          country?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          first_name?: string;
          last_name?: string;
          phone?: string;
          email?: string;
          address_line_1?: string;
          address_line_2?: string | null;
          city?: string;
          state?: string;
          postal_code?: string;
          country?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          user_id: string | null;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          shipping_address: Json;
          order_status: OrderStatus;
          payment_status: PaymentStatus;
          payment_method: PaymentMethod;
          subtotal: number;
          discount_amount: number;
          shipping_fee: number;
          tax_amount: number;
          total_amount: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          user_id?: string | null;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          shipping_address: Json;
          order_status?: OrderStatus;
          payment_status?: PaymentStatus;
          payment_method?: PaymentMethod;
          subtotal: number;
          discount_amount?: number;
          shipping_fee?: number;
          tax_amount?: number;
          total_amount: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          user_id?: string | null;
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string;
          shipping_address?: Json;
          order_status?: OrderStatus;
          payment_status?: PaymentStatus;
          payment_method?: PaymentMethod;
          subtotal?: number;
          discount_amount?: number;
          shipping_fee?: number;
          tax_amount?: number;
          total_amount?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
    };
    Enums: {
      user_role: UserRole;
      discount_type: DiscountType;
      order_status: OrderStatus;
      payment_status: PaymentStatus;
      payment_method: PaymentMethod;
    };
    CompositeTypes: { [_ in never]: never };
  };
}
