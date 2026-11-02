<?php

namespace Database\Seeders;

use App\Models\BookingSlot;
use App\Models\BusinessHour;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Users
        $superAdmin = User::updateOrCreate(
            ['email' => 'admin@booking.com'],
            [
                'name' => 'Super Administrator',
                'phone' => '081234567890',
                'password' => Hash::make('password123'),
                'role' => 'super_admin',
                'email_verified_at' => now(),
            ]
        );

        $admin = User::updateOrCreate(
            ['email' => 'staff@booking.com'],
            [
                'name' => 'Staff Admin',
                'phone' => '081234567891',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );

        $customer = User::updateOrCreate(
            ['email' => 'customer@booking.com'],
            [
                'name' => 'Budi Santoso',
                'phone' => '081234567892',
                'password' => Hash::make('password123'),
                'role' => 'customer',
                'email_verified_at' => now(),
            ]
        );

        // 2. Business Hours (0 = Sunday to 6 = Saturday)
        $schedule = [
            0 => ['open' => null, 'close' => null, 'is_closed' => true],       // Minggu tutup
            1 => ['open' => '09:00:00', 'close' => '18:00:00', 'is_closed' => false], // Senin
            2 => ['open' => '09:00:00', 'close' => '18:00:00', 'is_closed' => false], // Selasa
            3 => ['open' => '09:00:00', 'close' => '18:00:00', 'is_closed' => false], // Rabu
            4 => ['open' => '09:00:00', 'close' => '18:00:00', 'is_closed' => false], // Kamis
            5 => ['open' => '09:00:00', 'close' => '18:00:00', 'is_closed' => false], // Jumat
            6 => ['open' => '09:00:00', 'close' => '17:00:00', 'is_closed' => false], // Sabtu
        ];

        foreach ($schedule as $day => $times) {
            BusinessHour::updateOrCreate(
                ['day_of_week' => $day],
                [
                    'open_time' => $times['open'],
                    'close_time' => $times['close'],
                    'is_closed' => $times['is_closed'],
                ]
            );
        }

        // 3. Categories & Services
        $categoriesData = [
            [
                'name' => 'Haircut & Grooming',
                'slug' => 'haircut-grooming',
                'description' => 'Layanan potong rambut pria & wanita, styling profesional dan perawatan kulit kepala.',
                'services' => [
                    [
                        'name' => 'Signature Haircut & Wash',
                        'slug' => 'signature-haircut-wash',
                        'description' => 'Potongan rambut presisi dengan konsultasi gaya, cuci rambut relaksasi, dan styling pomade.',
                        'price' => 75000,
                        'duration_minutes' => 45,
                        'capacity' => 2,
                    ],
                    [
                        'name' => 'Full Beard Trim & Hot Towel',
                        'slug' => 'full-beard-trim-hot-towel',
                        'description' => 'Rapikan jenggot dan kumis dengan razor tajam dilengkapi kompres handuk hangat minyak aromaterapi.',
                        'price' => 50000,
                        'duration_minutes' => 30,
                        'capacity' => 2,
                    ],
                ],
            ],
            [
                'name' => 'Face & Skincare',
                'slug' => 'face-skincare',
                'description' => 'Perawatan wajah menyeluruh untuk kesegaran dan kesehatan kulit.',
                'services' => [
                    [
                        'name' => 'Deep Cleansing Facial',
                        'slug' => 'deep-cleansing-facial',
                        'description' => 'Pembersihan pori mendalam, ekstraksi komedo ringan, serum anti-oksidan dan masker pendingin.',
                        'price' => 150000,
                        'duration_minutes' => 60,
                        'capacity' => 1,
                    ],
                    [
                        'name' => 'Hydrating Face Glow Therapy',
                        'slug' => 'hydrating-face-glow-therapy',
                        'description' => 'Terapi hidrasi kulit dengan serum hyaluronic acid dan pijat relaksasi titik limfatik wajah.',
                        'price' => 200000,
                        'duration_minutes' => 60,
                        'capacity' => 1,
                    ],
                ],
            ],
            [
                'name' => 'Body Relaxation & Spa',
                'slug' => 'body-relaxation-spa',
                'description' => 'Relaksasi tubuh total untuk melepas penat dan ketegangan otot.',
                'services' => [
                    [
                        'name' => 'Traditional Full Body Massage',
                        'slug' => 'traditional-full-body-massage',
                        'description' => 'Pijat tradisional seluruh tubuh dengan minyak esensial alami untuk melancarkan peredaran darah.',
                        'price' => 175000,
                        'duration_minutes' => 90,
                        'capacity' => 2,
                    ],
                ],
            ],
        ];

        foreach ($categoriesData as $catData) {
            $category = ServiceCategory::updateOrCreate(
                ['slug' => $catData['slug']],
                [
                    'name' => $catData['name'],
                    'description' => $catData['description'],
                    'is_active' => true,
                ]
            );

            foreach ($catData['services'] as $svcData) {
                $service = Service::updateOrCreate(
                    ['slug' => $svcData['slug']],
                    [
                        'category_id' => $category->id,
                        'name' => $svcData['name'],
                        'description' => $svcData['description'],
                        'price' => $svcData['price'],
                        'duration_minutes' => $svcData['duration_minutes'],
                        'capacity' => $svcData['capacity'],
                        'is_active' => true,
                    ]
                );

                // 4. Generate Slots for next 7 days for each service
                $this->generateSeedSlotsForService($service);
            }
        }
    }

    private function generateSeedSlotsForService(Service $service): void
    {
        $today = Carbon::today();

        for ($day = 0; $day < 7; $day++) {
            $date = $today->copy()->addDays($day);
            $dayOfWeek = $date->dayOfWeek; // 0 = Sunday

            // If Sunday, skip
            if ($dayOfWeek === 0) {
                continue;
            }

            // Open 09:00 to 17:00
            $startHour = 9;
            $endHour = ($dayOfWeek === 6) ? 17 : 18;

            $slotStart = $date->copy()->setTime($startHour, 0, 0);
            $dayEnd = $date->copy()->setTime($endHour, 0, 0);

            while ($slotStart->copy()->addMinutes($service->duration_minutes)->lte($dayEnd)) {
                $slotEnd = $slotStart->copy()->addMinutes($service->duration_minutes);

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

                // Move next slot
                $slotStart->addMinutes($service->duration_minutes);
            }
        }
    }
}
