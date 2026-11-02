<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\BookingSlot;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\User;
use App\Services\BookingService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingEngineTest extends TestCase
{
    use RefreshDatabase;

    protected User $customer;
    protected Service $service;
    protected BookingSlot $slot;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::factory()->create(['role' => 'customer']);

        $category = ServiceCategory::create([
            'name' => 'Haircut',
            'slug' => 'haircut',
            'is_active' => true,
        ]);

        $this->service = Service::create([
            'category_id' => $category->id,
            'name' => 'Classic Cut',
            'slug' => 'classic-cut',
            'price' => 50000,
            'duration_minutes' => 30,
            'capacity' => 1, // Only 1 spot!
            'is_active' => true,
        ]);

        $this->slot = BookingSlot::create([
            'service_id' => $this->service->id,
            'start_at' => Carbon::tomorrow()->setTime(10, 0, 0),
            'end_at' => Carbon::tomorrow()->setTime(10, 30, 0),
            'capacity' => 1,
            'reserved_count' => 0,
            'is_available' => true,
        ]);
    }

    public function test_booking_creation_increments_reserved_count(): void
    {
        $token = $this->customer->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/bookings', [
                'service_id' => $this->service->id,
                'booking_slot_id' => $this->slot->id,
                'notes' => 'Tolong tepat waktu',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.service_price', '50000.00')
            ->assertJsonPath('data.status', 'PENDING_PAYMENT');

        $this->slot->refresh();
        $this->assertEquals(1, $this->slot->reserved_count);
    }

    public function test_double_booking_or_overcapacity_is_rejected(): void
    {
        // First booking takes the only available spot
        $bookingService = app(BookingService::class);
        $bookingService->createBooking($this->customer, $this->service->id, $this->slot->id);

        $this->slot->refresh();
        $this->assertEquals(1, $this->slot->reserved_count);

        // Second booking attempt must fail
        $anotherCustomer = User::factory()->create(['role' => 'customer']);
        $token = $anotherCustomer->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/bookings', [
                'service_id' => $this->service->id,
                'booking_slot_id' => $this->slot->id,
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_booking_expiration_safely_releases_capacity(): void
    {
        $bookingService = app(BookingService::class);
        $booking = $bookingService->createBooking($this->customer, $this->service->id, $this->slot->id);

        $this->slot->refresh();
        $this->assertEquals(1, $this->slot->reserved_count);

        // Expire booking
        $bookingService->expireBooking($booking);

        $this->slot->refresh();
        $booking->refresh();

        $this->assertEquals(0, $this->slot->reserved_count);
        $this->assertEquals(Booking::STATUS_EXPIRED, $booking->status);
    }
}

