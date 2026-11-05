<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Hotel;
use App\Models\RoomType;
use App\Models\User;
use App\Services\HotelBookingService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingEngineTest extends TestCase
{
    use RefreshDatabase;

    protected User $customer;
    protected Hotel $hotel;
    protected RoomType $roomType;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::factory()->create(['role' => 'customer']);

        $this->hotel = Hotel::create([
            'name' => 'Royal Resort Bali',
            'star_rating' => 5,
            'address' => 'Jl. Pantai Kuta',
            'city' => 'Bali',
            'phone' => '0361-12345',
            'email' => 'info@royal.com',
        ]);

        $this->roomType = RoomType::create([
            'hotel_id' => $this->hotel->id,
            'name' => 'Deluxe King',
            'slug' => 'deluxe-king',
            'base_price_per_night' => 500000,
            'max_adults' => 2,
            'max_children' => 1,
            'room_size_sqm' => 35,
            'bed_type' => '1 King Bed',
            'total_rooms' => 1, // Only 1 physical room exists for strict concurrency testing!
            'is_active' => true,
        ]);
    }

    public function test_hotel_booking_calculates_nights_and_taxes_accurately(): void
    {
        $token = $this->customer->createToken('test')->plainTextToken;

        $checkIn = Carbon::today()->addDays(5)->toDateString();
        $checkOut = Carbon::today()->addDays(7)->toDateString(); // 2 nights

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/bookings', [
                'room_type_id' => $this->roomType->id,
                'check_in_date' => $checkIn,
                'check_out_date' => $checkOut,
                'total_adults' => 2,
                'customer_name' => 'Budi Santoso',
                'customer_email' => 'budi@example.com',
                'customer_phone' => '0812345678',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.total_nights', 2)
            ->assertJsonPath('data.total_room_amount', '1000000.00') // 500k x 2 nights
            ->assertJsonPath('data.tax_and_service_amount', '100000.00') // 10% tax
            ->assertJsonPath('data.total_amount', '1100000.00') // 1M + 100k
            ->assertJsonPath('data.status', 'PENDING_PAYMENT');

        $this->assertDatabaseHas('bookings', [
            'room_type_id' => $this->roomType->id,
            'total_nights' => 2,
        ]);
    }

    public function test_overbooking_on_same_dates_is_rejected(): void
    {
        $bookingService = app(HotelBookingService::class);
        $checkIn = Carbon::today()->addDays(5)->toDateString();
        $checkOut = Carbon::today()->addDays(7)->toDateString();

        // First customer books the only available room
        $bookingService->createBooking($this->customer, [
            'room_type_id' => $this->roomType->id,
            'check_in_date' => $checkIn,
            'check_out_date' => $checkOut,
            'total_adults' => 2,
        ]);

        // Second customer tries to book overlapping stay -> MUST FAIL
        $anotherCustomer = User::factory()->create(['role' => 'customer']);
        $token = $anotherCustomer->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/bookings', [
                'room_type_id' => $this->roomType->id,
                'check_in_date' => $checkIn,
                'check_out_date' => $checkOut,
                'total_adults' => 1,
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_expired_booking_releases_room_inventory(): void
    {
        $bookingService = app(HotelBookingService::class);
        $checkIn = Carbon::today()->addDays(5)->toDateString();
        $checkOut = Carbon::today()->addDays(7)->toDateString();

        $booking = $bookingService->createBooking($this->customer, [
            'room_type_id' => $this->roomType->id,
            'check_in_date' => $checkIn,
            'check_out_date' => $checkOut,
            'total_adults' => 2,
        ]);

        $this->assertEquals(Booking::STATUS_PENDING_PAYMENT, $booking->status);

        // Expire booking
        $bookingService->expireBooking($booking);
        $booking->refresh();

        $this->assertEquals(Booking::STATUS_EXPIRED, $booking->status);

        // Now another customer CAN book those dates since inventory is released!
        $anotherCustomer = User::factory()->create(['role' => 'customer']);
        $newBooking = $bookingService->createBooking($anotherCustomer, [
            'room_type_id' => $this->roomType->id,
            'check_in_date' => $checkIn,
            'check_out_date' => $checkOut,
            'total_adults' => 1,
        ]);

        $this->assertNotNull($newBooking->id);
    }
}
