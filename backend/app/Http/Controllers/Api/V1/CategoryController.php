<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ServiceCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    /**
     * Public active categories.
     */
    public function index(): JsonResponse
    {
        $categories = ServiceCategory::where('is_active', true)
            ->withCount(['services' => function ($q) {
                $q->where('is_active', true);
            }])
            ->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    /**
     * Admin: list all categories with pagination and search.
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = ServiceCategory::withCount('services');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $categories = $query->orderBy('name')->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    /**
     * Admin: store a category.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $slug = Str::slug($validated['name']);
        // Ensure slug uniqueness
        $originalSlug = $slug;
        $counter = 1;
        while (ServiceCategory::where('slug', $slug)->exists()) {
            $slug = "{$originalSlug}-{$counter}";
            $counter++;
        }

        $category = ServiceCategory::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Kategori berhasil ditambahkan.',
            'data' => $category,
        ], 201);
    }

    /**
     * Admin: update a category.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $category = ServiceCategory::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        if ($category->name !== $validated['name']) {
            $slug = Str::slug($validated['name']);
            $originalSlug = $slug;
            $counter = 1;
            while (ServiceCategory::where('slug', $slug)->where('id', '!=', $category->id)->exists()) {
                $slug = "{$originalSlug}-{$counter}";
                $counter++;
            }
            $category->slug = $slug;
        }

        $category->name = $validated['name'];
        $category->description = $validated['description'] ?? null;
        if (isset($validated['is_active'])) {
            $category->is_active = $validated['is_active'];
        }
        $category->save();

        return response()->json([
            'success' => true,
            'message' => 'Kategori berhasil diperbarui.',
            'data' => $category,
        ]);
    }

    /**
     * Admin: delete or deactivate category.
     */
    public function destroy(int $id): JsonResponse
    {
        $category = ServiceCategory::withCount('services')->findOrFail($id);

        if ($category->services_count > 0) {
            // Safe deactivation instead of hard delete
            $category->is_active = false;
            $category->save();

            return response()->json([
                'success' => true,
                'message' => 'Kategori memiliki layanan terkait, status diubah menjadi non-aktif.',
                'data' => $category,
            ]);
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kategori berhasil dihapus.',
        ]);
    }
}

