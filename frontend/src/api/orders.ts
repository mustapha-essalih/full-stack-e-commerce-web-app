export interface AddressInfo {
  id: number;
  label: string | null;
  first_name: string;
  last_name: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postal_code: string | null;
  country_code: string;
  is_default: boolean;
}

export interface PaymentInfo {
  id: number;
  status: string;
  amount_cents: number;
  currency: string;
  stripe_charge_id: string | null;
  created_at: string;
}

export interface Order {
  uuid: string;
  user_id: number | null;
  status: string;
  subtotal_cents: number;
  tax_cents: number;
  shipping_cents: number;
  discount_cents: number;
  total_cents: number;
  currency: string;
  coupon_code: string | null;
  subtotal_formatted: string;
  tax_formatted: string;
  shipping_formatted: string;
  discount_formatted: string;
  total_formatted: string;
  paid_at: string | null;
  created_at: string;
  billing_address?: AddressInfo;
  shipping_address?: AddressInfo;
  payment?: PaymentInfo;
}

export async function fetchOrderByUuid(uuid: string): Promise<{ order: Order; totals: import('./checkout').CheckoutTotals }> {
  const { default: client } = await import('./client');
  const response = await client.get(`/v1/checkout/${uuid}`);
  return response.data.data;
}
