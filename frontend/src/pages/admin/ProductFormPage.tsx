import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  fetchAdminProduct,
  createProduct,
  updateProduct,
  uploadProductImages,
  deleteProductImage,
} from '../../api/adminProducts';
import { fetchAdminCategories } from '../../api/adminCategories';
import ImageUploadZone from '../../components/ImageUploadZone';
import RichTextEditor from '../../components/RichTextEditor';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().optional(),
  sku: z.string().min(1, 'SKU is required'),
  short_description: z.string().optional(),
  price_cents: z.coerce.number().int().min(0, 'Price must be positive'),
  compare_price_cents: z.coerce.number().int().min(0).optional().or(z.literal('')),
  stock_quantity: z.coerce.number().int().min(0).optional().or(z.literal('')),
  weight_grams: z.coerce.number().int().min(0).optional().or(z.literal('')),
  is_active: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  category_ids: z.array(z.coerce.number()).optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ImageItem {
  id?: number;
  url?: string;
  thumbnail_url?: string;
  is_primary: boolean;
  sort_order: number;
  file?: File;
  preview?: string;
}

export default function AdminProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<ImageItem[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      is_active: true,
      is_featured: false,
      category_ids: [],
    },
  });

  const { data: productData } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => fetchAdminProduct(Number(id)),
    enabled: isEdit,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: fetchAdminCategories,
  });

  const initialDescription = productData?.description || '';
  const initialImages: ImageItem[] = productData?.images
    ? productData.images.map(
        (img: {
          id: number;
          url: string;
          thumbnail_url: string;
          is_primary: boolean;
          sort_order: number;
        }) => ({
          id: img.id,
          url: img.url,
          thumbnail_url: img.thumbnail_url,
          is_primary: img.is_primary,
          sort_order: img.sort_order,
        }),
      )
    : [];

  async function handleFormSubmit(data: ProductFormValues) {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.slug) formData.append('slug', data.slug);
    formData.append('sku', data.sku);
    if (data.short_description) formData.append('short_description', data.short_description);
    formData.append('description', description);
    formData.append('price_cents', String(data.price_cents));
    if (data.compare_price_cents) formData.append('compare_price_cents', String(data.compare_price_cents));
    if (data.stock_quantity !== '' && data.stock_quantity !== undefined) {
      formData.append('stock_quantity', String(data.stock_quantity));
    }
    if (data.weight_grams !== '' && data.weight_grams !== undefined) {
      formData.append('weight_grams', String(data.weight_grams));
    }
    formData.append('is_active', data.is_active ? '1' : '0');
    formData.append('is_featured', data.is_featured ? '1' : '0');
    if (data.meta_title) formData.append('meta_title', data.meta_title);
    if (data.meta_description) formData.append('meta_description', data.meta_description);
    if (data.category_ids) {
      data.category_ids.forEach((catId: number) => {
        formData.append('category_ids[]', String(catId));
      });
    }

    try {
      let product;
      if (isEdit) {
        product = await updateProduct(Number(id), formData);
      } else {
        product = await createProduct(formData);
      }

      const currentImages = images;
      const existingIds = currentImages.filter((img) => img.id).map((img) => img.id!);
      const oldIds = (initialImages || []).filter((img) => img.id).map((img) => img.id!);
      const toDelete = oldIds.filter((oid) => !existingIds.includes(oid));
      for (const imageId of toDelete) {
        await deleteProductImage(product.id, imageId);
      }

      const newFiles = currentImages
        .filter((img): img is ImageItem & { file: File } => img.file !== undefined)
        .map((img) => img.file);
      if (newFiles.length > 0 && product?.id) {
        await uploadProductImages(product.id, newFiles);
      }

      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      navigate('/admin/products');
    } catch (err) {
      console.error('Failed to save product:', err);
    }
  }

  const handleDescriptionChange = useCallback((val: string) => {
    setDescription(val);
  }, []);

  const handleImagesChange = useCallback((newImages: ImageItem[]) => {
    setImages(newImages);
  }, []);

  const formKey = isEdit && productData ? `edit-${productData.id}` : 'create';

  const allCategories = categories.flatMap((cat: { id: number; name: string; children?: { id: number; name: string }[] }) => {
    const items: { id: number; name: string; depth: number }[] = [{ id: cat.id, name: cat.name, depth: 0 }];
    if (cat.children) {
      cat.children.forEach((child: { id: number; name: string }) => {
        items.push({ id: child.id, name: child.name, depth: 1 });
      });
    }
    return items;
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            {isEdit ? 'Edit Product' : 'Create Product'}
          </h1>
          <p className="mt-1 text-sm text-secondary-500">
            {isEdit ? 'Update product details and images' : 'Add a new product to your catalog'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
        {/* Basic Info */}
        <div className="rounded-lg border border-secondary-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-secondary-900">Basic Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
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
              <label className="mb-1 block text-sm font-medium text-secondary-700">SKU *</label>
              <input
                type="text"
                {...register('sku')}
                className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              {errors.sku && <p className="mt-1 text-xs text-danger-600">{errors.sku.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-secondary-700">Short Description</label>
              <textarea
                {...register('short_description')}
                rows={2}
                className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-secondary-700">Description</label>
              <RichTextEditor
                key={`desc-${formKey}`}
                value={description || initialDescription}
                onChange={handleDescriptionChange}
                placeholder="Enter product description..."
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="rounded-lg border border-secondary-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-secondary-900">Pricing</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-secondary-700">Price (cents) *</label>
              <input
                type="number"
                {...register('price_cents')}
                min={0}
                className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              {errors.price_cents && <p className="mt-1 text-xs text-danger-600">{errors.price_cents.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-secondary-700">Compare Price (cents)</label>
              <input
                type="number"
                {...register('compare_price_cents')}
                min={0}
                className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div className="rounded-lg border border-secondary-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-secondary-900">Inventory</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-secondary-700">Stock Quantity</label>
              <input
                type="number"
                {...register('stock_quantity')}
                min={0}
                className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-secondary-700">Weight (grams)</label>
              <input
                type="number"
                {...register('weight_grams')}
                min={0}
                className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="rounded-lg border border-secondary-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-secondary-900">Categories</h2>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-secondary-200 p-3">
            {allCategories.map((cat: { id: number; name: string; depth: number }) => (
              <label key={cat.id} className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  value={cat.id}
                  {...register('category_ids')}
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                  style={{ marginLeft: cat.depth * 20 }}
                />
                <span className="text-sm text-secondary-700">{cat.name}</span>
              </label>
            ))}
            {allCategories.length === 0 && (
              <p className="text-sm text-secondary-400">No categories available.</p>
            )}
          </div>
        </div>

        {/* SEO */}
        <div className="rounded-lg border border-secondary-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-secondary-900">SEO</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-secondary-700">Meta Title</label>
              <input
                type="text"
                {...register('meta_title')}
                className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-secondary-700">Meta Description</label>
              <textarea
                {...register('meta_description')}
                rows={2}
                className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="rounded-lg border border-secondary-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-secondary-900">Images</h2>
          <ImageUploadZone
            key={`img-${formKey}`}
            images={images.length > 0 ? images : initialImages}
            onChange={handleImagesChange}
          />
        </div>

        {/* Status toggles */}
        <div className="rounded-lg border border-secondary-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-secondary-900">Status</h2>
          <div className="flex items-center gap-8">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('is_active')}
                className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-secondary-700">Active</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('is_featured')}
                className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-secondary-700">Featured</span>
            </label>
          </div>
        </div>

        {/* Sticky save button */}
        <div className="sticky bottom-0 -mx-4 -mb-8 bg-white/95 backdrop-blur border-t border-secondary-200 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="rounded-lg border border-secondary-300 px-4 py-2 text-sm font-medium text-secondary-600 hover:bg-secondary-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isEdit ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
