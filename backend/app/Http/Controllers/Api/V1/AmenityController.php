<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Amenity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AmenityController extends Controller
{
    /**
     * List all amenities.
     */
    public function index(): JsonResponse
    {
        $amenities = Amenity::orderBy('category')->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $amenities,
        ]);
    }

    /**
     * Store new amenity.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'icon' => 'nullable|string|max:50',
            'category' => 'required|in:room,bathroom,entertainment,hotel',
            'description' => 'nullable|string|max:255',
        ]);

        $amenity = Amenity::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Fasilitas berhasil ditambahkan.',
            'data' => $amenity,
        ], 201);
    }

    /**
     * Delete amenity.
     */
    public function destroy(int $id): JsonResponse
    {
        $amenity = Amenity::findOrFail($id);
        $amenity->delete();

        return response()->json([
            'success' => true,
            'message' => 'Fasilitas berhasil dihapus.',
        ]);
    }
}

