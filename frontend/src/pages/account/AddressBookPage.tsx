import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
} from '../../hooks/useAccount';
import { useToastStore } from '../../stores/useToastStore';
import type { Address, AddressData } from '../../api/account';

const addressSchema = z.object({
  label: z.string().max(255).optional().or(z.literal('')),
  first_name: z.string().min(1, 'First name is required').max(255),
  last_name: z.string().min(1, 'Last name is required').max(255),
  line1: z.string().min(1, 'Address is required').max(255),
  line2: z.string().max(255).optional().or(z.literal('')),
  city: z.string().min(1, 'City is required').max(255),
  state: z.string().max(255).optional().or(z.literal('')),
  postal_code: z.string().max(20).optional().or(z.literal('')),
  country_code: z.string().length(2, 'Country code must be 2 characters').default('US'),
  is_default: z.boolean().optional(),
});

type AddressForm = z.infer<typeof addressSchema>;

function AddressFormModal({
  address,
  onClose,
}: {
  address?: Address | null;
  onClose: () => void;
}) {
  const createAddress = useCreateAddress();
  const updateAddressMutation = useUpdateAddress();
  const addToast = useToastStore((s) => s.addToast);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: address
      ? {
          label: address.label ?? '',
          first_name: address.first_name,
          last_name: address.last_name,
          line1: address.line1,
          line2: address.line2 ?? '',
          city: address.city,
          state: address.state ?? '',
          postal_code: address.postal_code ?? '',
          country_code: address.country_code,
          is_default: address.is_default,
        }
      : {
          label: '',
          first_name: '',
          last_name: '',
          line1: '',
          line2: '',
          city: '',
          state: '',
          postal_code: '',
          country_code: 'US',
          is_default: false,
        },
  });

  async function onSubmit(data: AddressForm) {
    setError(null);
    const payload: AddressData = {
      ...data,
      label: data.label || null,
      line2: data.line2 || null,
      state: data.state || null,
      postal_code: data.postal_code || null,
    };

    try {
      if (address) {
        await updateAddressMutation.mutateAsync({ id: address.id, data: payload });
        addToast('Address updated.', 'success');
      } else {
        await createAddress.mutateAsync(payload);
        addToast('Address added.', 'success');
      }
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr.response?.data?.message ?? 'Failed to save address.');
      } else {
        setError('An unexpected error occurred.');
      }
    }
  }

  const isLoading = createAddress.isPending || updateAddressMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-secondary-900">
          {address ? 'Edit Address' : 'Add Address'}
        </h3>

        {error && (
          <div className="mb-4 rounded-md bg-danger-50 p-3 text-sm text-danger-600">{error}</div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-secondary-700">Label</label>
              <input
                type="text"
                {...form.register('label')}
                placeholder="Home / Work"
                className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div />
            <div>
              <label className="block text-sm font-medium text-secondary-700">First Name</label>
              <input
                type="text"
                {...form.register('first_name')}
                className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              {form.formState.errors.first_name && (
                <p className="mt-1 text-xs text-danger-600">{form.formState.errors.first_name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700">Last Name</label>
              <input
                type="text"
                {...form.register('last_name')}
                className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              {form.formState.errors.last_name && (
                <p className="mt-1 text-xs text-danger-600">{form.formState.errors.last_name.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700">Street Address</label>
            <input
              type="text"
              {...form.register('line1')}
              className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            {form.formState.errors.line1 && (
              <p className="mt-1 text-xs text-danger-600">{form.formState.errors.line1.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700">Apt / Suite (optional)</label>
            <input
              type="text"
              {...form.register('line2')}
              className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-secondary-700">City</label>
              <input
                type="text"
                {...form.register('city')}
                className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              {form.formState.errors.city && (
                <p className="mt-1 text-xs text-danger-600">{form.formState.errors.city.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700">State</label>
              <input
                type="text"
                {...form.register('state')}
                className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700">ZIP Code</label>
              <input
                type="text"
                {...form.register('postal_code')}
                className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_default"
              {...form.register('is_default')}
              className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="is_default" className="text-sm text-secondary-700">Set as default address</label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-secondary-300 px-4 py-2 text-sm font-medium text-secondary-600 hover:bg-secondary-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : address ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AddressBookPage() {
  const { data: addresses, isLoading, isError } = useAddresses();
  const deleteAddressMutation = useDeleteAddress();
  const setDefaultMutation = useSetDefaultAddress();
  const addToast = useToastStore((s) => s.addToast);

  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete(id: number) {
    setDeleteError(null);
    try {
      await deleteAddressMutation.mutateAsync(id);
      addToast('Address deleted.', 'success');
      setDeletingId(null);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setDeleteError(axiosErr.response?.data?.message ?? 'Failed to delete address.');
      } else {
        setDeleteError('Failed to delete address.');
      }
    }
  }

  async function handleSetDefault(id: number) {
    try {
      await setDefaultMutation.mutateAsync(id);
      addToast('Default address updated.', 'success');
    } catch {
      addToast('Failed to update default address.', 'error');
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 rounded-lg border border-secondary-200 bg-white p-6">
            <div className="mb-3 h-4 w-48 rounded bg-secondary-200" />
            <div className="h-4 w-32 rounded bg-secondary-200" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-danger-200 bg-danger-50 p-4 text-sm text-danger-600">
        Failed to load addresses.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-secondary-900">Address Book</h2>
        <button
          type="button"
          onClick={() => {
            setEditingAddress(null);
            setShowForm(true);
          }}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Add Address
        </button>
      </div>

      {deleteError && (
        <div className="mb-4 rounded-md bg-danger-50 p-3 text-sm text-danger-600">{deleteError}</div>
      )}

      {addresses && addresses.length === 0 ? (
        <div className="rounded-lg border border-secondary-200 bg-white p-12 text-center">
          <p className="text-secondary-500">No addresses saved yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses?.map((address) => (
            <div
              key={address.id}
              className="relative rounded-lg border border-secondary-200 bg-white p-6"
            >
              {address.is_default && (
                <span className="absolute right-4 top-4 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
                  Default
                </span>
              )}

              <div className="space-y-1 text-sm text-secondary-700">
                {address.label && (
                  <p className="text-xs font-medium uppercase tracking-wider text-secondary-500">{address.label}</p>
                )}
                <p className="font-medium text-secondary-900">{address.first_name} {address.last_name}</p>
                <p>{address.line1}</p>
                {address.line2 && <p>{address.line2}</p>}
                <p>
                  {address.city}{address.state ? `, ${address.state}` : ''} {address.postal_code}
                </p>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingAddress(address);
                    setShowForm(true);
                  }}
                  className="text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  Edit
                </button>
                {!address.is_default && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(address.id)}
                    className="text-sm font-medium text-secondary-600 hover:text-secondary-500"
                  >
                    Set as Default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDeletingId(address.id)}
                  className="text-sm font-medium text-danger-600 hover:text-danger-500"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <AddressFormModal
          address={editingAddress}
          onClose={() => {
            setShowForm(false);
            setEditingAddress(null);
          }}
        />
      )}

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-secondary-900">Delete Address?</h3>
            <p className="text-sm text-secondary-600">This action cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="rounded-lg border border-secondary-300 px-4 py-2 text-sm font-medium text-secondary-600 hover:bg-secondary-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingId)}
                disabled={deleteAddressMutation.isPending}
                className="rounded-lg bg-danger-600 px-4 py-2 text-sm font-medium text-white hover:bg-danger-700 disabled:opacity-50"
              >
                {deleteAddressMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
