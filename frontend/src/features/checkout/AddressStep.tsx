import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const addressSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  line1: z.string().min(1, 'Street address is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country_code: z.string().min(1, 'Country is required'),
});

type AddressForm = z.infer<typeof addressSchema>;

interface AddressStepProps {
  user: { name: string; email: string } | null;
  isLoading: boolean;
  onSubmit: (data: AddressForm) => Promise<void>;
}

export default function AddressStep({ user, isLoading, onSubmit }: AddressStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: user ? {
      first_name: user.name.split(' ')[0] || '',
      last_name: user.name.split(' ').slice(1).join(' ') || '',
      country_code: 'US',
    } : {
      country_code: 'US',
    },
  });

  return (
    <div>
      <h2 className="mb-6 text-lg font-semibold text-secondary-900">Shipping Address</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-secondary-700">
              First Name
            </label>
            <input
              id="first_name"
              {...register('first_name')}
              className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            {errors.first_name && (
              <p className="mt-1 text-xs text-danger-600">{errors.first_name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-secondary-700">
              Last Name
            </label>
            <input
              id="last_name"
              {...register('last_name')}
              className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            {errors.last_name && (
              <p className="mt-1 text-xs text-danger-600">{errors.last_name.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="line1" className="block text-sm font-medium text-secondary-700">
            Street Address
          </label>
          <input
            id="line1"
            {...register('line1')}
            className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          {errors.line1 && (
            <p className="mt-1 text-xs text-danger-600">{errors.line1.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="line2" className="block text-sm font-medium text-secondary-700">
            Apartment, suite, etc. <span className="text-secondary-400">(optional)</span>
          </label>
          <input
            id="line2"
            {...register('line2')}
            className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-secondary-700">
              City
            </label>
            <input
              id="city"
              {...register('city')}
              className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            {errors.city && (
              <p className="mt-1 text-xs text-danger-600">{errors.city.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="state" className="block text-sm font-medium text-secondary-700">
              State <span className="text-secondary-400">(optional)</span>
            </label>
            <input
              id="state"
              {...register('state')}
              className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div>
            <label htmlFor="postal_code" className="block text-sm font-medium text-secondary-700">
              ZIP Code <span className="text-secondary-400">(optional)</span>
            </label>
            <input
              id="postal_code"
              {...register('postal_code')}
              className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="country_code" className="block text-sm font-medium text-secondary-700">
            Country
          </label>
          <select
            id="country_code"
            {...register('country_code')}
            className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
          </select>
          {errors.country_code && (
            <p className="mt-1 text-xs text-danger-600">{errors.country_code.message}</p>
          )}
        </div>

        <div className="flex justify-end border-t border-secondary-200 pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-primary-600 px-8 py-3 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : (
              'Continue to Review'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
