import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchProfile,
  updateProfile,
  updatePassword,
  fetchAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  fetchWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../api/account';
import type { ProfileData, PasswordData, AddressData } from '../api/account';
import { useAuthStore } from '../stores/useAuthStore';

export function useProfile() {
  return useQuery({
    queryKey: ['account', 'profile'],
    queryFn: fetchProfile,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (data: ProfileData) => updateProfile(data),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['account', 'profile'] });
      setUser(user);
    },
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (data: PasswordData) => updatePassword(data),
  });
}

export function useAddresses() {
  return useQuery({
    queryKey: ['account', 'addresses'],
    queryFn: fetchAddresses,
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddressData) => createAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account', 'addresses'] });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AddressData }) => updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account', 'addresses'] });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account', 'addresses'] });
    },
  });
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => setDefaultAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account', 'addresses'] });
    },
  });
}

export function useWishlist(page = 1) {
  return useQuery({
    queryKey: ['account', 'wishlist', page],
    queryFn: () => fetchWishlist(page),
  });
}

export function useAddToWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: number) => addToWishlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account', 'wishlist'] });
    },
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: number) => removeFromWishlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account', 'wishlist'] });
    },
  });
}
