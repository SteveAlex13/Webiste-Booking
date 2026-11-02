<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Services\AvailabilityService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AvailabilityController extends Controller
{
    public function __construct(
        protected AvailabilityService $availabilityService
    ) {}

    /**
     * Get available booking slots for a service on a given date.
     */
    public function check(Request $request, int $serviceId): JsonResponse
    {
        $request->validate([
            'date' => 'nullable|date_format:Y-m-d|after_or_equal:today',
        ]);

        $service = Service::where('is_active', true)->findOrFail($serviceId);
        $date = $request->input('date', Carbon::today()->toDateString());

        $slots = $this->availabilityService->getAvailableSlots($service, $date);

        return response()->json([
            'success' => true,
            'data' => [
                'service' => [
                    'id' => $service->id,
                    'name' => $service->name,
                    'duration_minutes' => $service->duration_minutes,
                    'capacity' => $service->capacity,
                    'price' => (float) $service->price,
                ],
                'date' => $date,
                'slots' => $slots,
            ],
        ]);
    }
}

