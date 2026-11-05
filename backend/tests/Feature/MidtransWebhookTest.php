<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Hotel;
use App\Models\Payment;
use App\Models\RoomType;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MidtransWebhookTest extends TestCase
{
    use RefreshDatabase;

    public function test_valid_webhook_marks_booking_confirmed(): void
    {
        $serverKey = 'test-server-key-12345';
        config(['midtrans.server_key' => $serverKey]);

        $user = User::factory()->create(['role' => 'customer']);
        $hotel = Hotel::create([
            'id' => 1,
            'name' => 'The Royal Nusantara Resort',
            'city' => 'Bali',
            'address' => 'Nusa Dua',
            'phone' => '0361-123456',
            'email' => 'info@hotel.com',
            'star_rating' => 5,
        ]);

        $roomType = RoomType::create([
            'hotel_id' => $hotel->id,
            'name' => 'Deluxe Suite',
            'slug' => 'deluxe-suite',
            'base_price_per_night' => 1000000,
            'total_rooms' => 5,
            'max_adults' => 2,
            'max_children' => 1,
            'room_size_sqm' => 45,
            'bed_type' => 'King Bed',
            'is_active' => true,
        ]);

        $checkIn = Carbon::tomorrow()->toDateString();
        $checkOut = Carbon::tomorrow()->addDays(2)->toDateString();

        $booking = Booking::create([
            'hotel_id' => $hotel->id,
            'user_id' => $user->id,
            'room_type_id' => $roomType->id,
            'booking_code' => 'HTL-TEST-001',
            'customer_name' => $user->name,
            'customer_email' => $user->email,
            'customer_phone' => '08123456789',
            'check_in_date' => $checkIn,
            'check_out_date' => $checkOut,
            'total_nights' => 2,
            'total_adults' => 2,
            'total_children' => 0,
            'room_price_per_night' => 1000000,
            'total_room_amount' => 2000000,
            'total_extras_amount' => 0,
            'tax_and_service_amount' => 200000,
            'total_amount' => 2200000,
            'status' => Booking::STATUS_PENDING_PAYMENT,
        ]);

        $orderId = 'HTL-ORDER-TEST-001';
        $grossAmount = '2200000.00';
        $statusCode = '200';
        $payment = Payment::create([
            'booking_id' => $booking->id,
            'order_id' => $orderId,
            'gross_amount' => 2200000,
            'status' => Payment::STATUS_PENDING,
        ]);

        $signatureKey = hash('sha512', $orderId . $statusCode . $grossAmount . $serverKey);

        $response = $this->postJson('/api/v1/webhooks/midtrans', [
            'order_id' => $orderId,
            'status_code' => $statusCode,
            'gross_amount' => $grossAmount,
            'signature_key' => $signatureKey,
            'transaction_status' => 'settlement',
            'payment_type' => 'qris',
            'transaction_id' => 'midtrans-trx-hotel-123',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $payment->refresh();
        $booking->refresh();

        $this->assertEquals(Payment::STATUS_PAID, $payment->status);
        $this->assertEquals(Booking::STATUS_CONFIRMED, $booking->status);
        $this->assertNotNull($booking->confirmed_at);
    }
}
