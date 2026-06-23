import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { fetchAdminCoupon, createCoupon, updateCoupon } from '../../api/adminCoupons';
import { useToastStore } from '../../stores/useToastStore';

const couponSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50),
  description: z.string().optional(),
  type: z.enum(['percentage', 'fixed_amount']),
  value: z.coerce.number().int().min(1, 'Value must be at least 1'),
  minimum_order_cents: z.coerce.number().int().min(0).optional().or(z.literal('')),
  usage_limit: z.coerce.number().int().min(1).optional().or(z.literal('')),
  per_customer_limit: z.coerce.number().int().min(1).optional().or(z.literal('')),
  starts_at: z.string().optional().or(z.literal('')),
  expires_at: z.string().optional().or(z.literal('')),
  is_active: z.boolean().optional(),
});

type CouponFormValues = z.infer<typeof couponSchema>;

export default function AdminCouponFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: '',
      description: '',
      type: 'percentage',
      value: '' as unknown as number,
      minimum_order_cents: '' as unknown as number,
      usage_limit: '' as unknown as number,
      per_customer_limit: '' as unknown as number,
      starts_at: '',
      expires_at: '',
      is_active: true,
    },
  });

  const { data: couponData } = useQuery({
    queryKey: ['admin-coupon', id],
    queryFn: () => fetchAdminCoupon(Number(id)),
    enabled: isEdit,
  });

  useEffect(() => {
    if (couponData) {
      reset({
        code: couponData.code || '',
        description: couponData.description || '',
        type: couponData.type,
        value: couponData.value,
        minimum_order_cents: couponData.minimum_order_cents ?? ('' as unknown as number),
        usage_limit: couponData.usage_limit ?? ('' as unknown as number),
        per_customer_limit: couponData.per_customer_limit ?? ('' as unknown as number),
        starts_at: couponData.starts_at ? couponData.starts_at.slice(0, 16) : '',
        expires_at: couponData.expires_at ? couponData.expires_at.slice(0, 16) : '',
        is_active: couponData.is_active,
      });
    }
  }, [couponData, reset]);

  const couponType = watch('type');

  async function onSubmit(data: CouponFormValues) {
    try {
      const payload = {
        code: data.code,
        description: data.description || null,
        type: data.type,
        value: data.value,
        minimum_order_cents: data.minimum_order_cents || null,
        usage_limit: data.usage_limit || null,
        per_customer_limit: data.per_customer_limit || null,
        starts_at: data.starts_at || null,
        expires_at: data.expires_at || null,
        is_active: data.is_active ?? true,
      };

      if (isEdit) {
        await updateCoupon(Number(id), payload);
        addToast('Coupon updated.', 'success');
      } else {
        await createCoupon(payload);
        addToast('Coupon created.', 'success');
      }

      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      navigate('/admin/coupons');
    } catch {
      addToast('Failed to save coupon.', 'error');
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary-900">
          {isEdit ? 'Edit Coupon' : 'Create Coupon'}
        </h1>
        <p className="mt-1 text-sm text-secondary-500">
          {isEdit ? 'Update coupon details' : 'Add a new discount coupon'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-lg border border-secondary-200 bg-white p-6">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-secondary-700">Code *</label>
              <input
                type="text"
                {...register('code')}
                placeholder="e.g. SUMMER20"
                className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              {errors.code && <p className="mt-1 text-xs text-danger-600">{errors.code.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-secondary-700">Description</label>
              <textarea
                {...register('description')}
                rows={2}
                placeholder="Internal description for this coupon"
                className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">Type *</label>
                <select
                  {...register('type')}
                  className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed_amount">Fixed Amount</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">
                  Value * {couponType === 'percentage' ? '(%)' : '(cents)'}
                </label>
                <input
                  type="number"
                  {...register('value')}
                  min={1}
                  max={couponType === 'percentage' ? 100 : undefined}
                  placeholder={couponType === 'percentage' ? 'e.g. 20' : 'e.g. 1999'}
                  className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                {errors.value && <p className="mt-1 text-xs text-danger-600">{errors.value.message}</p>}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-secondary-700">Minimum Order (cents)</label>
              <input
                type="number"
                {...register('minimum_order_cents')}
                min={0}
                placeholder="Leave empty for no minimum"
                className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">Usage Limit (total)</label>
                <input
                  type="number"
                  {...register('usage_limit')}
                  min={1}
                  placeholder="Leave empty for unlimited"
                  className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">Per-Customer Limit</label>
                <input
                  type="number"
                  {...register('per_customer_limit')}
                  min={1}
                  placeholder="Leave empty for unlimited"
                  className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">Start Date</label>
                <input
                  type="datetime-local"
                  {...register('starts_at')}
                  className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">Expiry Date</label>
                <input
                  type="datetime-local"
                  {...register('expires_at')}
                  className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                {errors.expires_at && (
                  <p className="mt-1 text-xs text-danger-600">{errors.expires_at.message}</p>
                )}
              </div>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('is_active')}
                className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-secondary-700">Active</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/coupons')}
            className="rounded-lg border border-secondary-300 px-4 py-2 text-sm font-medium text-secondary-600 hover:bg-secondary-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Coupon' : 'Create Coupon'}
          </button>
        </div>
      </form>
    </div>
  );
}
