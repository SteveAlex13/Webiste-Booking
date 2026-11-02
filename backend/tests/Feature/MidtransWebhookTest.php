<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\BookingSlot;
use App\Models\Payment;
use App\Models\Service;
use App\Models\ServiceCategory;
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
        $category = ServiceCategory::create(['name' => 'Spa', 'slug' => 'spa', 'is_active' => true]);
        $service = Service::create([
            'category_id' => $category->id,
            'name' => 'Massage',
            'slug' => 'massage',
            'price' => 100000,
            'duration_minutes' => 60,
            'capacity' => 2,
            'is_active' => true,
        ]);
        $slot = BookingSlot::create([
            'service_id' => $service->id,
            'start_at' => Carbon::tomorrow()->setTime(14, 0),
            'end_at' => Carbon::tomorrow()->setTime(15, 0),
            'capacity' => 2,
            'reserved_count' => 1,
            'is_available' => true,
        ]);

        $booking = Booking::create([
            'booking_code' => 'BK-TEST-001',
            'user_id' => $user->id,
            'service_id' => $service->id,
            'booking_slot_id' => $slot->id,
            'customer_name' => $user->name,
            'customer_phone' => '08123',
            'service_name' => $service->name,
            'service_price' => 100000,
            'total_amount' => 100000,
            'status' => Booking::STATUS_PENDING_PAYMENT,
        ]);

        $orderId = 'ORDER-TEST-001';
        $grossAmount = '100000.00';
        $statusCode = '200';
        $payment = Payment::create([
            'booking_id' => $booking->id,
            'order_id' => $orderId,
            'gross_amount' => 100000,
            'status' => Payment::STATUS_PENDING,
        ]);

        $signatureKey = hash('sha512', $orderId . $statusCode . $grossAmount . $serverKey);

        $response = $this->postJson('/api/v1/webhooks/midtrans', [
            'order_id' => $orderId,
            'status_code' => $statusCode,
            'gross_amount' => $grossAmount,
            'signature_key' => $signatureKey,
            'transaction_status' => 'settlement',
            'payment_type' => 'bank_transfer',
            'transaction_id' => 'midtrans-trx-123',
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

