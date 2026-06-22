<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Category;
use App\Repositories\CategoryRepository;
use Illuminate\Database\Eloquent\Collection;

class CategoryService
{
    public function __construct(
        private readonly CategoryRepository $categoryRepository,
    ) {}

    /**
     * @param array<string, mixed> $data
     */
    public function createCategory(array $data): Category
    {
        return Category::create($data);
    }

    /**
     * @param array<string, mixed> $data
     */
    public function updateCategory(Category $category, array $data): Category
    {
        $category->update($data);

        return $category->fresh();
    }

    public function archiveCategory(Category $category): void
    {
        $category->delete();
    }

    public function getTree(): Collection
    {
        return $this->categoryRepository->getCategoryTree();
    }
}
