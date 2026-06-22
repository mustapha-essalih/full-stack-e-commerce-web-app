import client from './client';
import type { Product } from './products';

export interface UserProfile {
  uuid: string;
  name: string;
  email: string;
  roles: string[];
  email_verified_at: string | null;
  created_at: string;
}

export interface Address {
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

export interface WishlistItem {
  id: number;
  product: Product;
  created_at: string;
}

export interface ProfileData {
  name?: string;
  email?: string;
}

export interface PasswordData {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface AddressData {
  label?: string | null;
  first_name?: string;
  last_name?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string | null;
  postal_code?: string | null;
  country_code?: string;
  is_default?: boolean;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginatedWishlist {
  data: WishlistItem[];
  meta: PaginationMeta;
}

export async function fetchProfile(): Promise<UserProfile> {
  const response = await client.get('/v1/account/profile');
  return response.data.data;
}

export async function updateProfile(data: ProfileData): Promise<UserProfile> {
  const response = await client.patch('/v1/account/profile', data);
  return response.data.data;
}

export async function updatePassword(data: PasswordData): Promise<void> {
  await client.patch('/v1/account/password', data);
}

export async function fetchAddresses(): Promise<Address[]> {
  const response = await client.get('/v1/account/addresses');
  return response.data.data;
}

export async function createAddress(data: AddressData): Promise<Address> {
  const response = await client.post('/v1/account/addresses', data);
  return response.data.data;
}

export async function updateAddress(id: number, data: AddressData): Promise<Address> {
  const response = await client.put(`/v1/account/addresses/${id}`, data);
  return response.data.data;
}

export async function deleteAddress(id: number): Promise<void> {
  await client.delete(`/v1/account/addresses/${id}`);
}

export async function setDefaultAddress(id: number): Promise<Address> {
  const response = await client.patch(`/v1/account/addresses/${id}/default`);
  return response.data.data;
}

export async function fetchWishlist(page = 1, perPage = 15): Promise<PaginatedWishlist> {
  const response = await client.get('/v1/account/wishlist', { params: { page, per_page: perPage } });
  return response.data;
}

export async function addToWishlist(productId: number): Promise<WishlistItem> {
  const response = await client.post('/v1/account/wishlist', { product_id: productId });
  return response.data.data;
}

export async function removeFromWishlist(productId: number): Promise<void> {
  await client.delete('/v1/account/wishlist', { data: { product_id: productId } });
}
