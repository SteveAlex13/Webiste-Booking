<?php

namespace App\Services;

use App\Models\BookingSlot;
use App\Models\BusinessHour;
use App\Models\ScheduleException;
use App\Models\Service;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class AvailabilityService
{
    /**
     * Get available booking slots for a given service and date.
     */
    public function getAvailableSlots(Service $service, string $dateString): Collection
    {
        $date = Carbon::parse($dateString)->startOfDay();

        // 1. Check if the date is a holiday/closed in schedule exceptions
        $exception = ScheduleException::where('exception_date', $date->toDateString())->first();
        if ($exception && $exception->is_closed) {
            return collect([]);
        }

        // 2. Check business hours for the day of week
        $dayOfWeek = $date->dayOfWeek; // 0 = Sunday
        $businessHour = BusinessHour::where('day_of_week', $dayOfWeek)->first();

        if ($businessHour && $businessHour->is_closed && ! $exception) {
            return collect([]);
        }

        // 3. Ensure slots are generated for this service on this date
        $this->ensureSlotsExistForDate($service, $date, $businessHour, $exception);

        // 4. Retrieve slots for that date
        $slots = BookingSlot::where('service_id', $service->id)
            ->whereDate('start_at', $date->toDateString())
            ->orderBy('start_at', 'asc')
            ->get();

        // Filter out slots in the past if date is today
        $now = Carbon::now();
        return $slots->map(function (BookingSlot $slot) use ($now) {
            $isPast = $slot->start_at->lte($now);
            $hasCapacity = $slot->reserved_count < $slot->capacity;
            $isBookable = $slot->is_available && $hasCapacity && ! $isPast;

            return [
                'id' => $slot->id,
                'service_id' => $slot->service_id,
                'start_at' => $slot->start_at->toIso8601String(),
                'end_at' => $slot->end_at->toIso8601String(),
                'start_time_formatted' => $slot->start_at->format('H:i'),
                'end_time_formatted' => $slot->end_at->format('H:i'),
                'capacity' => $slot->capacity,
                'reserved_count' => $slot->reserved_count,
                'available_spots' => max(0, $slot->capacity - $slot->reserved_count),
                'is_available' => $isBookable,
                'is_past' => $isPast,
            ];
        });
    }

    /**
     * Generate slots for a service on a given date if they do not exist.
     */
    public function ensureSlotsExistForDate(
        Service $service,
        Carbon $date,
        ?BusinessHour $businessHour = null,
        ?ScheduleException $exception = null
    ): void {
        $existingCount = BookingSlot::where('service_id', $service->id)
            ->whereDate('start_at', $date->toDateString())
            ->count();

        if ($existingCount > 0) {
            return;
        }

        // Determine open and close time
        $openTimeStr = '09:00:00';
        $closeTimeStr = '17:00:00';

        if ($exception && $exception->start_time && $exception->end_time) {
            $openTimeStr = $exception->start_time;
            $closeTimeStr = $exception->end_time;
        } elseif ($businessHour && $businessHour->open_time && $businessHour->close_time) {
            $openTimeStr = $businessHour->open_time;
            $closeTimeStr = $businessHour->close_time;
        }

        $openTimeParts = explode(':', $openTimeStr);
        $closeTimeParts = explode(':', $closeTimeStr);

        $slotStart = $date->copy()->setTime((int) $openTimeParts[0], (int) $openTimeParts[1], 0);
        $dayEnd = $date->copy()->setTime((int) $closeTimeParts[0], (int) $closeTimeParts[1], 0);

        $duration = $service->duration_minutes ?: 30;

        while ($slotStart->copy()->addMinutes($duration)->lte($dayEnd)) {
            $slotEnd = $slotStart->copy()->addMinutes($duration);

            BookingSlot::firstOrCreate(
                [
                    'service_id' => $service->id,
                    'start_at' => $slotStart->format('Y-m-d H:i:s'),
                ],
                [
                    'end_at' => $slotEnd->format('Y-m-d H:i:s'),
                    'capacity' => $service->capacity,
                    'reserved_count' => 0,
                    'is_available' => true,
                ]
            );

            $slotStart->addMinutes($duration);
        }
    }
}

