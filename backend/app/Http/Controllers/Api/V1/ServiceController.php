<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ServiceController extends Controller
{
    /**
     * Public list of active services.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Service::with('category')->where('is_active', true);

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('category_slug')) {
            $query->whereHas('category', function ($q) use ($request) {
                $q->where('slug', $request->category_slug);
            });
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $services = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $services,
        ]);
    }

    /**
     * Public get service detail by ID or Slug.
     */
    public function show(string $idOrSlug): JsonResponse
    {
        $service = Service::with('category')
            ->where(function ($q) use ($idOrSlug) {
                if (is_numeric($idOrSlug)) {
                    $q->where('id', $idOrSlug);
                } else {
                    $q->where('slug', $idOrSlug);
                }
            })
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $service,
        ]);
    }

    /**
     * Admin: list all services with pagination.
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = Service::with('category');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        $services = $query->orderBy('id', 'desc')->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $services,
        ]);
    }

    /**
     * Admin: store a service.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:service_categories,id',
            'name' => 'required|string|max:150',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'duration_minutes' => 'required|integer|min:5|max:480',
            'capacity' => 'required|integer|min:1|max:100',
            'is_active' => 'boolean',
            'image' => 'nullable|image|max:2048', // 2MB max
        ]);

        $slug = Str::slug($validated['name']);
        $originalSlug = $slug;
        $counter = 1;
        while (Service::where('slug', $slug)->exists()) {
            $slug = "{$originalSlug}-{$counter}";
            $counter++;
        }

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('services', 'public');
        }

        $service = Service::create([
            'category_id' => $validated['category_id'],
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'image' => $imagePath,
            'price' => $validated['price'],
            'duration_minutes' => $validated['duration_minutes'],
            'capacity' => $validated['capacity'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Layanan berhasil dibuat.',
            'data' => $service->load('category'),
        ], 201);
    }

    /**
     * Admin: update a service.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $service = Service::findOrFail($id);

        $validated = $request->validate([
            'category_id' => 'required|exists:service_categories,id',
            'name' => 'required|string|max:150',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'duration_minutes' => 'required|integer|min:5|max:480',
            'capacity' => 'required|integer|min:1|max:100',
            'is_active' => 'boolean',
            'image' => 'nullable|image|max:2048',
        ]);

        if ($service->name !== $validated['name']) {
            $slug = Str::slug($validated['name']);
            $originalSlug = $slug;
            $counter = 1;
            while (Service::where('slug', $slug)->where('id', '!=', $service->id)->exists()) {
                $slug = "{$originalSlug}-{$counter}";
                $counter++;
            }
            $service->slug = $slug;
        }

        if ($request->hasFile('image')) {
            if ($service->image && Storage::disk('public')->exists($service->image)) {
                Storage::disk('public')->delete($service->image);
            }
            $service->image = $request->file('image')->store('services', 'public');
        }

        $service->category_id = $validated['category_id'];
        $service->name = $validated['name'];
        $service->description = $validated['description'] ?? null;
        $service->price = $validated['price'];
        $service->duration_minutes = $validated['duration_minutes'];
        $service->capacity = $validated['capacity'];
        if (isset($validated['is_active'])) {
            $service->is_active = $validated['is_active'];
        }
        $service->save();

        return response()->json([
            'success' => true,
            'message' => 'Layanan berhasil diperbarui.',
            'data' => $service->load('category'),
        ]);
    }

    /**
     * Admin: delete (soft delete or deactivate) service.
     */
    public function destroy(int $id): JsonResponse
    {
        $service = Service::findOrFail($id);

        // Check if service has any bookings
        if ($service->bookings()->exists()) {
            $service->is_active = false;
            $service->save();
            $service->delete(); // Soft delete

            return response()->json([
                'success' => true,
                'message' => 'Layanan memiliki riwayat pemesanan dan berhasil diarsipkan (soft deleted).',
            ]);
        }

        $service->forceDelete();

        return response()->json([
            'success' => true,
            'message' => 'Layanan berhasil dihapus secara permanen.',
        ]);
    }
}

