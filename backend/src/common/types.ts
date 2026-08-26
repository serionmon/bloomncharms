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

export type PaymentMethod =
  | 'full_online'
  | 'hybrid'
  | 'cod'
  | 'unknown';

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
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          category_id: string | null;
          sku: string | null;
          slug: string;
          name: string;
          subtitle: string | null;
          description: string;
          price: number;
          currency: string;
          image_url: string | null;
          alt_text: string;
          badge: string | null;
          tag: string | null;
          is_customizable: boolean;
          is_featured: boolean;
          is_bestseller: boolean;
          is_active: boolean;
          processing_days: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          sku?: string | null;
          slug: string;
          name: string;
          subtitle?: string | null;
          description?: string;
          price: number;
          currency?: string;
          image_url?: string | null;
          alt_text?: string;
          badge?: string | null;
          tag?: string | null;
          is_customizable?: boolean;
          is_featured?: boolean;
          is_bestseller?: boolean;
          is_active?: boolean;
          processing_days?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          sku?: string | null;
          slug?: string;
          name?: string;
          subtitle?: string | null;
          description?: string;
          price?: number;
          currency?: string;
          image_url?: string | null;
          alt_text?: string;
          badge?: string | null;
          tag?: string | null;
          is_customizable?: boolean;
          is_featured?: boolean;
          is_bestseller?: boolean;
          is_active?: boolean;
          processing_days?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          storage_path: string;
          alt_text: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          storage_path: string;
          alt_text?: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          storage_path?: string;
          alt_text?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_images_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      inventory: {
        Row: {
          id: string;
          product_id: string;
          stock_quantity: number;
          low_stock_threshold: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          stock_quantity?: number;
          low_stock_threshold?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          stock_quantity?: number;
          low_stock_threshold?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inventory_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
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
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          razorpay_signature: string | null;
          amount_paid: number;
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
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          amount_paid?: number;
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
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          amount_paid?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payment_events: {
        Row: {
          id: string;
          event_id: string;
          event_type: string;
          order_id: string | null;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          payload: Json;
          processed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          event_type: string;
          order_id?: string | null;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          payload: Json;
          processed_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          event_type?: string;
          order_id?: string | null;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          payload?: Json;
          processed_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      payment_transactions: {
        Row: {
          id: string;
          order_id: string;
          razorpay_order_id: string;
          razorpay_payment_id: string | null;
          amount: number;
          currency: string;
          status: PaymentStatus;
          error_code: string | null;
          error_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          razorpay_order_id: string;
          razorpay_payment_id?: string | null;
          amount: number;
          currency?: string;
          status?: PaymentStatus;
          error_code?: string | null;
          error_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          razorpay_order_id?: string;
          razorpay_payment_id?: string | null;
          amount?: number;
          currency?: string;
          status?: PaymentStatus;
          error_code?: string | null;
          error_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_name_snapshot: string;
          product_sku_snapshot: string;
          unit_price: number;
          quantity: number;
          line_total: number;
          customization: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_name_snapshot: string;
          product_sku_snapshot: string;
          unit_price: number;
          quantity: number;
          line_total: number;
          customization?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          product_name_snapshot?: string;
          product_sku_snapshot?: string;
          unit_price?: number;
          quantity?: number;
          line_total?: number;
          customization?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      discounts: {
        Row: {
          id: string;
          code: string | null;
          name: string;
          description: string | null;
          discount_type: DiscountType;
          value: number;
          minimum_order_amount: number | null;
          maximum_discount_amount: number | null;
          usage_limit: number | null;
          per_customer_limit: number | null;
          starts_at: string;
          expires_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code?: string | null;
          name: string;
          description?: string | null;
          discount_type: DiscountType;
          value: number;
          minimum_order_amount?: number | null;
          maximum_discount_amount?: number | null;
          usage_limit?: number | null;
          per_customer_limit?: number | null;
          starts_at?: string;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string | null;
          name?: string;
          description?: string | null;
          discount_type?: DiscountType;
          value?: number;
          minimum_order_amount?: number | null;
          maximum_discount_amount?: number | null;
          usage_limit?: number | null;
          per_customer_limit?: number | null;
          starts_at?: string;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      discount_usage: {
        Row: {
          id: string;
          discount_id: string;
          user_id: string | null;
          order_id: string;
          amount_discounted: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          discount_id: string;
          user_id?: string | null;
          order_id: string;
          amount_discounted: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          discount_id?: string;
          user_id?: string | null;
          order_id?: string;
          amount_discounted?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'discount_usage_discount_id_fkey';
            columns: ['discount_id'];
            isOneToOne: false;
            referencedRelation: 'discounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'discount_usage_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      discount_type: DiscountType;
      order_status: OrderStatus;
      payment_status: PaymentStatus;
      payment_method: PaymentMethod;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
