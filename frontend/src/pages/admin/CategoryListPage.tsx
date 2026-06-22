import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCategoryTree, archiveCategory } from '../../api/adminCategories';

interface CategoryNode {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: number | null;
  image_path: string | null;
  is_active: boolean;
  sort_order: number;
  products_count: number;
  children: CategoryNode[];
}

function TreeNode({
  node,
  onArchive,
  depth = 0,
}: {
  node: CategoryNode;
  onArchive: (id: number) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <li>
      <div
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-secondary-50"
        style={{ paddingLeft: `${12 + depth * 24}px` }}
      >
        {node.children?.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-secondary-400 hover:text-secondary-600"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            <svg
              className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        {(!node.children || node.children.length === 0) && <div className="w-4" />}

        <div className="flex-1 flex items-center gap-2">
          <span className={`text-sm font-medium ${node.is_active ? 'text-secondary-900' : 'text-secondary-400 line-through'}`}>
            {node.name}
          </span>
          {!node.is_active && (
            <span className="rounded bg-secondary-100 px-1.5 py-0.5 text-xs text-secondary-500">Archived</span>
          )}
          <span className="text-xs text-secondary-400">({node.products_count ?? 0} products)</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/admin/categories/${node.id}/edit`}
            className="text-xs font-medium text-primary-600 hover:text-primary-800"
          >
            Edit
          </Link>
          {node.is_active && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Archive "${node.name}"?`)) onArchive(node.id);
              }}
              className="text-xs font-medium text-danger-600 hover:text-danger-800"
            >
              Archive
            </button>
          )}
        </div>
      </div>

      {expanded && node.children?.length > 0 && (
        <ul className="border-l border-secondary-200 ml-4">
          {node.children
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((child) => (
              <TreeNode key={child.id} node={child} onArchive={onArchive} depth={depth + 1} />
            ))}
        </ul>
      )}
    </li>
  );
}

export default function AdminCategoryListPage() {
  const queryClient = useQueryClient();

  const { data: treeData, isLoading } = useQuery({
    queryKey: ['admin-categories-tree'],
    queryFn: fetchCategoryTree,
  });

  const archiveMutation = useMutation({
    mutationFn: (id: number) => archiveCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories-tree'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-secondary-200" />
          ))}
        </div>
      </div>
    );
  }

  const categories: CategoryNode[] = treeData || [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Categories</h1>
          <p className="mt-1 text-sm text-secondary-500">Manage your category hierarchy</p>
        </div>
        <Link
          to="/admin/categories/create"
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Add Category
        </Link>
      </div>

      {categories.length > 0 ? (
        <div className="rounded-lg border border-secondary-200 bg-white">
          <ul className="divide-y divide-secondary-100">
            {categories
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((category) => (
                <TreeNode key={category.id} node={category} onArchive={(id) => archiveMutation.mutate(id)} />
              ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-lg border border-secondary-200 bg-white p-12 text-center">
          <p className="text-sm text-secondary-500">No categories yet.</p>
          <Link
            to="/admin/categories/create"
            className="mt-4 inline-block text-sm font-medium text-primary-600 hover:text-primary-800"
          >
            Create your first category
          </Link>
        </div>
      )}
    </div>
  );
}
