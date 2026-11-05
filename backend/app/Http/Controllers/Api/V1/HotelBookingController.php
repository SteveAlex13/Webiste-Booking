<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\ExtraService;
use App\Models\RoomType;
use App\Services\HotelBookingService;
use App\Services\RoomAvailabilityService;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HotelBookingController extends Controller
{
    public function __construct(
        protected HotelBookingService $bookingService,
        protected RoomAvailabilityService $availabilityService
    ) {}

    /**
     * Preview calculation of hotel stay cost with extras and tax.
     */
    public function calculatePrice(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'room_type_id' => 'required|exists:room_types,id',
            'check_in_date' => 'required|date|after_or_equal:today',
            'check_out_date' => 'required|date|after:check_in_date',
            'extras' => 'nullable|array',
            'extras.*.id' => 'exists:extra_services,id',
            'extras.*.quantity' => 'nullable|integer|min:1',
        ]);

        $roomType = RoomType::findOrFail($validated['room_type_id']);
        $checkIn = Carbon::parse($validated['check_in_date'])->startOfDay();
        $checkOut = Carbon::parse($validated['check_out_date'])->startOfDay();

        $costDetails = $roomType->calculateTotalRoomCost($checkIn, $checkOut);
        $totalRoomAmount = $costDetails['total_amount'];
        $nights = $costDetails['nights'];

        $totalExtras = 0;
        $extrasBreakdown = [];
        if (! empty($validated['extras'])) {
            foreach ($validated['extras'] as $item) {
                $extra = ExtraService::find($item['id']);
                if ($extra) {
                    $qty = max(1, (int) ($item['quantity'] ?? 1));
                    $unitPrice = (float) $extra->price;
                    $subtotal = ($extra->price_type === 'per_night')
                        ? ($unitPrice * $qty * $nights)
                        : ($unitPrice * $qty);

                    $totalExtras += $subtotal;
                    $extrasBreakdown[] = [
                        'id' => $extra->id,
                        'name' => $extra->name,
                        'price' => $unitPrice,
                        'quantity' => $qty,
                        'price_type' => $extra->price_type,
                        'subtotal' => $subtotal,
                    ];
                }
            }
        }

        $subtotal = $totalRoomAmount + $totalExtras;
        $tax = round($subtotal * 0.10, 2);
        $grandTotal = $subtotal + $tax;

        $availability = $this->availabilityService->checkRoomTypeAvailability($roomType, $checkIn, $checkOut);

        return response()->json([
            'success' => true,
            'data' => [
                'nights' => $nights,
                'check_in' => $checkIn->toDateString(),
                'check_out' => $checkOut->toDateString(),
                'room_cost' => $costDetails,
                'extras_total' => $totalExtras,
                'extras_breakdown' => $extrasBreakdown,
                'subtotal' => $subtotal,
                'tax_and_service' => $tax,
                'grand_total' => $grandTotal,
                'is_available' => $availability['is_available'],
                'available_rooms_count' => $availability['available_rooms_count'],
            ],
        ]);
    }

    /**
     * Customer: Create a hotel room booking.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'room_type_id' => 'required|exists:room_types,id',
            'check_in_date' => 'required|date|after_or_equal:today',
            'check_out_date' => 'required|date|after:check_in_date',
            'customer_name' => 'nullable|string|max:100',
            'customer_email' => 'nullable|email|max:150',
            'customer_phone' => 'nullable|string|max:30',
            'total_adults' => 'required|integer|min:1|max:10',
            'total_children' => 'nullable|integer|min:0|max:10',
            'special_requests' => 'nullable|string|max:1000',
            'extras' => 'nullable|array',
            'extras.*.id' => 'exists:extra_services,id',
            'extras.*.quantity' => 'nullable|integer|min:1',
        ]);

        try {
            $booking = $this->bookingService->createBooking($request->user(), $validated);

            return response()->json([
                'success' => true,
                'message' => 'Reservasi kamar berhasil dibuat. Silakan selesaikan pembayaran.',
                'data' => $booking->load(['roomType', 'extraItems']),
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Customer: View own bookings.
     */
    public function index(Request $request): JsonResponse
    {
        $bookings = Booking::with(['roomType', 'assignedRoom', 'extraItems', 'latestPayment', 'review'])
            ->where('user_id', $request->user()->id)
            ->orderBy('id', 'desc')
            ->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $bookings,
        ]);
    }

    /**
     * Customer: View booking detail.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $booking = Booking::with([
            'roomType.amenities',
            'assignedRoom',
            'extraItems',
            'payments',
            'statusHistories',
            'review',
        ])->findOrFail($id);

        if (! $request->user()->isAdmin() && $booking->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $booking,
        ]);
    }

    /**
     * Customer cancel booking.
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        $booking = Booking::findOrFail($id);

        if (! $request->user()->isAdmin() && $booking->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak.',
            ], 403);
        }

        if ($booking->status !== Booking::STATUS_PENDING_PAYMENT && ! $request->user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya booking yang belum dibayar yang dapat dibatalkan mandiri.',
            ], 422);
        }

        $reason = $request->input('reason', 'Dibatalkan oleh tamu.');
        $updated = $this->bookingService->cancelBooking($booking, $request->user(), $reason);

        return response()->json([
            'success' => true,
            'message' => 'Reservasi kamar berhasil dibatalkan.',
            'data' => $updated,
        ]);
    }

    /**
     * Admin: List all hotel bookings with filters.
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = Booking::with(['user', 'roomType', 'assignedRoom', 'latestPayment']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('room_type_id')) {
            $query->where('room_type_id', $request->room_type_id);
        }

        if ($request->filled('check_in_date')) {
            $query->where('check_in_date', $request->check_in_date);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('booking_code', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%")
                  ->orWhere('customer_phone', 'like', "%{$search}%")
                  ->orWhere('customer_email', 'like', "%{$search}%");
            });
        }

        $bookings = $query->orderBy('id', 'desc')->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $bookings,
        ]);
    }

    /**
     * Admin: Get available physical room units for assigning to a booking.
     */
    public function availableRoomsForBooking(int $id): JsonResponse
    {
        $booking = Booking::with('roomType')->findOrFail($id);
        $checkIn = Carbon::parse($booking->check_in_date);
        $checkOut = Carbon::parse($booking->check_out_date);

        $rooms = $this->availabilityService->getAvailablePhysicalRooms($booking->roomType, $checkIn, $checkOut);

        return response()->json([
            'success' => true,
            'data' => $rooms,
        ]);
    }

    /**
     * Admin: Check In guest & assign room.
     */
    public function checkIn(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'room_id' => 'required|exists:rooms,id',
        ]);

        $booking = Booking::findOrFail($id);

        try {
            $updated = $this->bookingService->checkIn($booking, (int) $validated['room_id'], $request->user());

            return response()->json([
                'success' => true,
                'message' => 'Tamu berhasil check-in ke kamar.',
                'data' => $updated->load(['roomType', 'assignedRoom']),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Admin: Check Out guest.
     */
    public function checkOut(Request $request, int $id): JsonResponse
    {
        $booking = Booking::findOrFail($id);

        try {
            $updated = $this->bookingService->checkOut($booking, $request->user());

            return response()->json([
                'success' => true,
                'message' => 'Tamu berhasil check-out. Kamar siap dibersihkan.',
                'data' => $updated->load(['roomType', 'assignedRoom']),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}

