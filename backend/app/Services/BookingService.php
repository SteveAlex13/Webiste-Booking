<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\BookingSlot;
use App\Models\BookingStatusHistory;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BookingService
{
    /**
     * Create a booking with strict concurrency locking (Pencegahan Double Booking).
     */
    public function createBooking(User $user, int $serviceId, int $slotId, ?string $notes = null): Booking
    {
        return DB::transaction(function () use ($user, $serviceId, $slotId, $notes) {
            // 1. Lock the booking slot with FOR UPDATE
            $slot = BookingSlot::where('id', $slotId)
                ->lockForUpdate()
                ->firstOrFail();

            if (! $slot->is_available) {
                throw new Exception('Jadwal slot ini tidak tersedia.');
            }

            if ($slot->reserved_count >= $slot->capacity) {
                throw new Exception('Kapasitas untuk jadwal ini sudah penuh. Silakan pilih jadwal lain.');
            }

            if ($slot->start_at->lte(Carbon::now())) {
                throw new Exception('Jadwal sudah lewat, tidak dapat dipesan.');
            }

            // 2. Lock the service to get authoritative snapshot price
            $service = Service::where('id', $serviceId)->firstOrFail();
            if (! $service->is_active) {
                throw new Exception('Layanan saat ini sedang tidak aktif.');
            }

            // 3. Generate unique booking code
            $bookingCode = $this->generateUniqueBookingCode();

            // 4. Calculate expiration (default 15 minutes)
            $expirationMinutes = (int) config('midtrans.booking_expiration_minutes', 15);
            $expiresAt = Carbon::now()->addMinutes($expirationMinutes);

            // 5. Create booking record
            $booking = Booking::create([
                'booking_code' => $bookingCode,
                'user_id' => $user->id,
                'service_id' => $service->id,
                'booking_slot_id' => $slot->id,
                'customer_name' => $user->name,
                'customer_phone' => $user->phone ?? '-',
                'service_name' => $service->name,
                'service_price' => $service->price,
                'total_amount' => $service->price,
                'notes' => $notes,
                'status' => Booking::STATUS_PENDING_PAYMENT,
                'expires_at' => $expiresAt,
            ]);

            // 6. Increment slot reserved count atomically
            $slot->increment('reserved_count');

            // 7. Log status history
            BookingStatusHistory::create([
                'booking_id' => $booking->id,
                'old_status' => null,
                'new_status' => Booking::STATUS_PENDING_PAYMENT,
                'changed_by' => $user->id,
                'note' => 'Booking berhasil dibuat dan menunggu pembayaran.',
            ]);

            return $booking;
        });
    }

    /**
     * Cancel a booking and release capacity idempotently.
     */
    public function cancelBooking(Booking $booking, ?User $changedBy = null, ?string $reason = null): Booking
    {
        return DB::transaction(function () use ($booking, $changedBy, $reason) {
            // Lock booking
            $lockedBooking = Booking::where('id', $booking->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (in_array($lockedBooking->status, [Booking::STATUS_CANCELLED, Booking::STATUS_EXPIRED])) {
                return $lockedBooking; // Already cancelled/expired
            }

            $oldStatus = $lockedBooking->status;
            $lockedBooking->status = Booking::STATUS_CANCELLED;
            $lockedBooking->cancelled_at = Carbon::now();
            $lockedBooking->cancellation_reason = $reason ?? 'Dibatalkan oleh pengguna/admin.';
            $lockedBooking->save();

            // Release slot capacity only if booking was holding capacity
            if (in_array($oldStatus, [Booking::STATUS_PENDING_PAYMENT, Booking::STATUS_CONFIRMED])) {
                $this->releaseSlotCapacity($lockedBooking->booking_slot_id);
            }

            // Record status history
            BookingStatusHistory::create([
                'booking_id' => $lockedBooking->id,
                'old_status' => $oldStatus,
                'new_status' => Booking::STATUS_CANCELLED,
                'changed_by' => $changedBy?->id,
                'note' => $lockedBooking->cancellation_reason,
            ]);

            return $lockedBooking;
        });
    }

    /**
     * Expire a booking if payment was not completed before expires_at.
     */
    public function expireBooking(Booking $booking): bool
    {
        return DB::transaction(function () use ($booking) {
            $lockedBooking = Booking::where('id', $booking->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedBooking->status !== Booking::STATUS_PENDING_PAYMENT) {
                return false;
            }

            $oldStatus = $lockedBooking->status;
            $lockedBooking->status = Booking::STATUS_EXPIRED;
            $lockedBooking->save();

            // Release slot capacity
            $this->releaseSlotCapacity($lockedBooking->booking_slot_id);

            // Record history
            BookingStatusHistory::create([
                'booking_id' => $lockedBooking->id,
                'old_status' => $oldStatus,
                'new_status' => Booking::STATUS_EXPIRED,
                'changed_by' => null,
                'note' => 'Batas waktu pembayaran habis (Expired). Kapasitas jadwal dilepas.',
            ]);

            return true;
        });
    }

    /**
     * Release slot capacity safely (never below 0).
     */
    public function releaseSlotCapacity(int $slotId): void
    {
        $slot = BookingSlot::where('id', $slotId)->lockForUpdate()->first();
        if ($slot && $slot->reserved_count > 0) {
            $slot->decrement('reserved_count');
        }
    }

    /**
     * Generate unique booking code format BK-YYYYMMDD-XXXX.
     */
    protected function generateUniqueBookingCode(): string
    {
        $datePrefix = Carbon::now()->format('Ymd');
        do {
            $random = strtoupper(Str::random(5));
            $code = "BK-{$datePrefix}-{$random}";
        } while (Booking::where('booking_code', $code)->exists());

        return $code;
    }
}

