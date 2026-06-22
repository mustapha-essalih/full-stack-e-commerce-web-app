import client from './client';
import type { Order } from './orders';

export interface AddressData {
  first_name: string;
  last_name: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country_code: string;
}

export interface CheckoutTotals {
  subtotal_cents: number;
  discount_cents: number;
  tax_cents: number;
  shipping_cents: number;
  total_cents: number;
}

export interface InitializeCheckoutResponse {
  order: Order;
  totals: CheckoutTotals;
}

export interface CreatePaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
}

export async function initializeCheckout(address: AddressData): Promise<InitializeCheckoutResponse> {
  const response = await client.post('/v1/checkout/initialize', { address });
  return response.data.data;
}

export async function fetchOrder(uuid: string): Promise<{ order: Order; totals: CheckoutTotals }> {
  const response = await client.get(`/v1/checkout/${uuid}`);
  return response.data.data;
}

export async function applyCoupon(orderUuid: string, code: string): Promise<{ order: Order; totals: CheckoutTotals; discount: number }> {
  const response = await client.post(`/v1/checkout/${orderUuid}/coupon`, { code });
  return response.data.data;
}

export async function removeCoupon(orderUuid: string): Promise<{ order: Order; totals: CheckoutTotals }> {
  const response = await client.delete(`/v1/checkout/${orderUuid}/coupon`);
  return response.data.data;
}

export async function createPaymentIntent(orderUuid: string): Promise<CreatePaymentIntentResponse> {
  const response = await client.post(`/v1/checkout/${orderUuid}/payment-intent`);
  return response.data.data;
}
