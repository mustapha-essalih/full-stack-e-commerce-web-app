<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Collection;

class CategoryRepository
{
    public function findBySlug(string $slug): ?Category
    {
        return Category::with(['children' => fn ($q) => $q->where('is_active', true)])
            ->active()
            ->where('slug', $slug)
            ->first();
    }

    public function getActiveRootCategories(): Collection
    {
        return Category::with(['children' => fn ($q) => $q->where('is_active', true)])
            ->active()
            ->whereNull('parent_id')
            ->orderBy('sort_order')
            ->get();
    }

    public function getAllWithChildren(): Collection
    {
        return Category::with(['children' => fn ($q) => $q->where('is_active', true)])
            ->active()
            ->orderBy('sort_order')
            ->get();
    }

    public function getCategoryTree(): Collection
    {
        return Category::with('children')
            ->whereNull('parent_id')
            ->orderBy('sort_order')
            ->get();
    }

    public function getAll(): Collection
    {
        return Category::with('children')->orderBy('sort_order')->get();
    }
}
