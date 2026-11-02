<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BookingStatusHistory;
use App\Services\BookingService;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class BookingController extends Controller
{
    public function __construct(
        protected BookingService $bookingService
    ) {}

    /**
     * Customer creates a booking.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'service_id' => 'required|exists:services,id',
            'booking_slot_id' => 'required|exists:booking_slots,id',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $booking = $this->bookingService->createBooking(
                $request->user(),
                (int) $validated['service_id'],
                (int) $validated['booking_slot_id'],
                $validated['notes'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'Booking berhasil dibuat. Silakan lanjutkan ke pembayaran.',
                'data' => $booking->load(['service', 'slot']),
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Customer views their own bookings.
     */
    public function index(Request $request): JsonResponse
    {
        $bookings = Booking::with(['service', 'slot', 'latestPayment'])
            ->where('user_id', $request->user()->id)
            ->orderBy('id', 'desc')
            ->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $bookings,
        ]);
    }

    /**
     * Customer views a specific booking.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $booking = Booking::with(['service', 'slot', 'payments', 'statusHistories'])
            ->findOrFail($id);

        if (! $request->user()->isAdmin() && $booking->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Akses tidak diizinkan.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $booking,
        ]);
    }

    /**
     * Customer cancels their booking.
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        $booking = Booking::findOrFail($id);

        if (! $request->user()->isAdmin() && $booking->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Akses tidak diizinkan.',
            ], 403);
        }

        if ($booking->status !== Booking::STATUS_PENDING_PAYMENT && ! $request->user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya booking yang belum dibayar yang dapat dibatalkan secara mandiri.',
            ], 422);
        }

        $reason = $request->input('reason', 'Dibatalkan oleh pelanggan.');
        $updated = $this->bookingService->cancelBooking($booking, $request->user(), $reason);

        return response()->json([
            'success' => true,
            'message' => 'Booking berhasil dibatalkan.',
            'data' => $updated,
        ]);
    }

    /**
     * Admin: list all bookings with filters.
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = Booking::with(['user', 'service', 'slot', 'latestPayment']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date')) {
            $query->whereHas('slot', function ($q) use ($request) {
                $q->whereDate('start_at', $request->date);
            });
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('booking_code', 'like', "%{$search}%")
                    ->orWhere('customer_name', 'like', "%{$search}%")
                    ->orWhere('customer_phone', 'like', "%{$search}%");
            });
        }

        $bookings = $query->orderBy('id', 'desc')->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $bookings,
        ]);
    }

    /**
     * Admin: update booking status manually.
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:CONFIRMED,COMPLETED,CANCELLED',
            'reason' => 'nullable|string|max:500',
        ]);

        $booking = Booking::findOrFail($id);
        $newStatus = $validated['status'];
        $oldStatus = $booking->status;

        if ($newStatus === Booking::STATUS_CANCELLED) {
            $this->bookingService->cancelBooking($booking, $request->user(), $validated['reason'] ?? 'Dibatalkan oleh admin.');
        } else {
            $booking->status = $newStatus;
            if ($newStatus === Booking::STATUS_CONFIRMED && ! $booking->confirmed_at) {
                $booking->confirmed_at = Carbon::now();
            } elseif ($newStatus === Booking::STATUS_COMPLETED && ! $booking->completed_at) {
                $booking->completed_at = Carbon::now();
            }
            $booking->save();

            BookingStatusHistory::create([
                'booking_id' => $booking->id,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'changed_by' => $request->user()->id,
                'note' => $validated['reason'] ?? "Status diubah menjadi {$newStatus} oleh admin.",
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => "Status booking berhasil diubah menjadi {$newStatus}.",
            'data' => $booking->refresh()->load(['service', 'slot', 'statusHistories']),
        ]);
    }
}

