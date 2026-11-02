<?php

namespace App\Console\Commands;

use App\Models\Booking;
use App\Services\BookingService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class ExpirePendingBookingsCommand extends Command
{
    protected $signature = 'bookings:expire-pending';
    protected $description = 'Expire pending bookings that have passed their expiration time and safely release slot capacity.';

    public function handle(BookingService $bookingService): int
    {
        $expiredBookings = Booking::where('status', Booking::STATUS_PENDING_PAYMENT)
            ->where('expires_at', '<=', Carbon::now())
            ->get();

        $count = 0;
        foreach ($expiredBookings as $booking) {
            $bookingService->expireBooking($booking);
            $count++;
        }

        $this->info("Successfully expired {$count} overdue bookings and released slot capacities.");

        return Command::SUCCESS;
    }
}

