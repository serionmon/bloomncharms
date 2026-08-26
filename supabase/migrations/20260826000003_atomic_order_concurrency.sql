-- =============================================================================
-- Bloomncharms — Atomic Order Creation & Inventory Concurrency Hardening
-- =============================================================================

CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_order jsonb,
  p_items jsonb,
  p_discount jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_rows_updated integer;
  v_inserted_items jsonb := '[]'::jsonb;
  v_line_item_id uuid;
  v_result jsonb;
BEGIN
  -- 1. Deduct inventory atomically for all items in deterministic order (prevents deadlocks)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) ORDER BY (value->>'productId')
  LOOP
    v_product_id := (v_item->>'productId')::uuid;
    v_quantity := (v_item->>'quantity')::integer;

    IF v_quantity <= 0 THEN
      RAISE EXCEPTION 'INVALID_QUANTITY: Quantity must be greater than zero.';
    END IF;

    -- Atomic decrement with stock threshold guard
    UPDATE public.inventory
    SET stock_quantity = stock_quantity - v_quantity
    WHERE product_id = v_product_id
      AND stock_quantity >= v_quantity;

    GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

    IF v_rows_updated = 0 THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK: Product % is out of stock or requested quantity exceeds available inventory.', v_product_id;
    END IF;
  END LOOP;

  -- 2. Insert Order record
  INSERT INTO public.orders (
    order_number,
    user_id,
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    order_status,
    payment_status,
    payment_method,
    subtotal,
    discount_amount,
    shipping_fee,
    tax_amount,
    total_amount,
    notes
  ) VALUES (
    p_order->>'orderNumber',
    NULLIF(p_order->>'userId', '')::uuid,
    p_order->>'customerName',
    p_order->>'customerEmail',
    p_order->>'customerPhone',
    p_order->'shippingAddress',
    (p_order->>'orderStatus')::public.order_status,
    (p_order->>'paymentStatus')::public.payment_status,
    (p_order->>'paymentMethod')::public.payment_method,
    (p_order->>'subtotal')::numeric,
    (p_order->>'discountAmount')::numeric,
    (p_order->>'shippingFee')::numeric,
    (p_order->>'taxAmount')::numeric,
    (p_order->>'totalAmount')::numeric,
    p_order->>'notes'
  )
  RETURNING id INTO v_order_id;

  -- 3. Insert Snapshot Line Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_name_snapshot,
      product_sku_snapshot,
      unit_price,
      quantity,
      line_total,
      customization
    ) VALUES (
      v_order_id,
      (v_item->>'productId')::uuid,
      v_item->>'name',
      v_item->>'sku',
      (v_item->>'unitPrice')::numeric,
      (v_item->>'quantity')::integer,
      (v_item->>'lineTotal')::numeric,
      v_item->'customization'
    )
    RETURNING id INTO v_line_item_id;

    v_inserted_items := v_inserted_items || jsonb_build_object(
      'id', v_line_item_id,
      'productId', v_item->>'productId',
      'productName', v_item->>'name',
      'productSku', v_item->>'sku',
      'unitPrice', (v_item->>'unitPrice')::numeric,
      'quantity', (v_item->>'quantity')::integer,
      'lineTotal', (v_item->>'lineTotal')::numeric,
      'customization', v_item->'customization'
    );
  END LOOP;

  -- 4. Record discount usage if applicable
  IF p_discount IS NOT NULL AND (p_discount->>'discountId') IS NOT NULL AND (p_discount->>'discountAmount')::numeric > 0 THEN
    INSERT INTO public.discount_usage (
      discount_id,
      order_id,
      user_id,
      amount_discounted
    ) VALUES (
      (p_discount->>'discountId')::uuid,
      v_order_id,
      NULLIF(p_order->>'userId', '')::uuid,
      (p_discount->>'discountAmount')::numeric
    );
  END IF;

  -- Build return payload
  v_result := jsonb_build_object(
    'orderId', v_order_id,
    'orderNumber', p_order->>'orderNumber',
    'items', v_inserted_items
  );

  RETURN v_result;
END;
$$;

-- Grant execution to authenticated & service_role
REVOKE ALL ON FUNCTION public.create_order_atomic(jsonb, jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_atomic(jsonb, jsonb, jsonb) TO service_role;
