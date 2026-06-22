import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  fetchAdminCategory,
  fetchCategoryTree,
  createCategory,
  updateCategory,
} from '../../api/adminCategories';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
  parent_id: z.coerce.number().nullable().optional(),
  is_active: z.boolean().optional(),
  sort_order: z.coerce.number().int().min(0).optional().or(z.literal('')),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function AdminCategoryFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      is_active: true,
      parent_id: null,
    },
  });

  const { data: categoryData } = useQuery({
    queryKey: ['admin-category', id],
    queryFn: () => fetchAdminCategory(Number(id)),
    enabled: isEdit,
  });

  const { data: treeData = [] } = useQuery({
    queryKey: ['admin-categories-tree'],
    queryFn: fetchCategoryTree,
  });

  useEffect(() => {
    if (categoryData) {
      reset({
        name: categoryData.name || '',
        slug: categoryData.slug || '',
        description: categoryData.description || '',
        parent_id: categoryData.parent_id || null,
        is_active: categoryData.is_active ?? true,
        sort_order: categoryData.sort_order ?? '',
      });
    }
  }, [categoryData, reset]);

  async function onSubmit(data: CategoryFormValues) {
    try {
      if (isEdit) {
        await updateCategory(Number(id), {
          ...data,
          parent_id: data.parent_id ?? null,
        });
      } else {
        await createCategory({
          ...data,
          parent_id: data.parent_id ?? null,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['admin-categories-tree'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      navigate('/admin/categories');
    } catch (err) {
      console.error('Failed to save category:', err);
    }
  }

  function flattenTree(
    nodes: { id: number; name: string; children?: { id: number; name: string }[] },
    depth = 0,
  ): { id: number; name: string; depth: number }[] {
    const result: { id: number; name: string; depth: number }[] = [];
    for (const node of nodes) {
      result.push({ id: node.id, name: node.name, depth });
      if (node.children) {
        result.push(...flattenTree(node.children, depth + 1));
      }
    }
    return result;
  }

  const allCategories = treeData ? flattenTree(treeData) : [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary-900">
          {isEdit ? 'Edit Category' : 'Create Category'}
        </h1>
        <p className="mt-1 text-sm text-secondary-500">
          {isEdit ? 'Update category details' : 'Add a new category'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-lg border border-secondary-200 bg-white p-6">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-secondary-700">Name *</label>
              <input
                type="text"
                {...register('name')}
                className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              {errors.name && <p className="mt-1 text-xs text-danger-600">{errors.name.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-secondary-700">Slug</label>
              <input
                type="text"
                {...register('slug')}
                className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-secondary-700">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-secondary-700">Parent Category</label>
              <select
                {...register('parent_id')}
                className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">None (root category)</option>
                {allCategories
                  .filter((cat) => (isEdit ? cat.id !== Number(id) : true))
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {'\u00A0'.repeat(cat.depth * 4)}{cat.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-secondary-700">Sort Order</label>
              <input
                type="number"
                {...register('sort_order')}
                min={0}
                className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
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
            onClick={() => navigate('/admin/categories')}
            className="rounded-lg border border-secondary-300 px-4 py-2 text-sm font-medium text-secondary-600 hover:bg-secondary-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Category' : 'Create Category'}
          </button>
        </div>
      </form>
    </div>
  );
}
