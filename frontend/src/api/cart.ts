import type { Product } from './products';
import client from './client';

export interface CartItem {
  id: number;
  product_id: number;
  product: Product;
  quantity: number;
  unit_price_cents: number;
  subtotal_cents: number;
}

export interface Cart {
  uuid: string;
  items: CartItem[];
  total_cents: number;
  item_count: number;
}

export async function fetchCart(): Promise<Cart> {
  const response = await client.get('/v1/cart');
  return response.data.data;
}

export async function addCartItem(
  productId: number,
  quantity: number,
): Promise<{ cart: Cart; item: CartItem }> {
  const response = await client.post('/v1/cart/items', {
    product_id: productId,
    quantity,
  });
  return response.data.data;
}

export async function updateCartItemQuantity(
  itemId: number,
  quantity: number,
): Promise<Cart> {
  const response = await client.patch(`/v1/cart/items/${itemId}`, {
    quantity,
  });
  return response.data.data;
}

export async function removeCartItem(itemId: number): Promise<Cart> {
  const response = await client.delete(`/v1/cart/items/${itemId}`);
  return response.data.data;
}

export async function clearCart(): Promise<Cart> {
  const response = await client.delete('/v1/cart');
  return response.data.data;
}
