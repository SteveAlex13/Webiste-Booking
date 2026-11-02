<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BookingSlot;
use App\Models\BusinessHour;
use App\Models\Payment;
use App\Models\ScheduleException;
use App\Models\Service;
use App\Models\User;
use App\Services\AvailabilityService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    public function __construct(
        protected AvailabilityService $availabilityService
    ) {}

    /**
     * Dashboard statistics and summary.
     */
    public function dashboard(): JsonResponse
    {
        $totalBookings = Booking::count();
        $totalCustomers = User::where('role', 'customer')->count();
        $totalActiveServices = Service::where('is_active', true)->count();
        $totalRevenue = Payment::where('status', Payment::STATUS_PAID)->sum('gross_amount');

        $pendingPayments = Booking::where('status', Booking::STATUS_PENDING_PAYMENT)->count();
        $confirmedBookings = Booking::where('status', Booking::STATUS_CONFIRMED)->count();
        $completedBookings = Booking::where('status', Booking::STATUS_COMPLETED)->count();
        $cancelledOrExpired = Booking::whereIn('status', [Booking::STATUS_CANCELLED, Booking::STATUS_EXPIRED])->count();

        // 7-day revenue and booking trend
        $sevenDaysAgo = Carbon::today()->subDays(6);
        $revenueTrend = [];
        for ($i = 0; $i < 7; $i++) {
            $date = $sevenDaysAgo->copy()->addDays($i);
            $dateStr = $date->toDateString();
            $dayRevenue = Payment::where('status', Payment::STATUS_PAID)
                ->whereDate('paid_at', $dateStr)
                ->sum('gross_amount');
            $dayBookings = Booking::whereDate('created_at', $dateStr)->count();

            $revenueTrend[] = [
                'date' => $dateStr,
                'label' => $date->format('d M'),
                'revenue' => (float) $dayRevenue,
                'bookings' => $dayBookings,
            ];
        }

        $recentBookings = Booking::with(['service', 'slot', 'latestPayment'])
            ->orderBy('id', 'desc')
            ->limit(5)
            ->get();

        $recentPayments = Payment::with('booking')
            ->orderBy('id', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'total_bookings' => $totalBookings,
                'total_customers' => $totalCustomers,
                'total_services' => $totalActiveServices,
                'total_revenue' => (float) $totalRevenue,
                'status_breakdown' => [
                    'pending_payment' => $pendingPayments,
                    'confirmed' => $confirmedBookings,
                    'completed' => $completedBookings,
                    'cancelled_or_expired' => $cancelledOrExpired,
                ],
                'revenue_trend' => $revenueTrend,
                'recent_bookings' => $recentBookings,
                'recent_payments' => $recentPayments,
            ],
        ]);
    }

    /**
     * Get business hours list.
     */
    public function businessHours(): JsonResponse
    {
        $hours = BusinessHour::orderBy('day_of_week')->get();

        return response()->json([
            'success' => true,
            'data' => $hours,
        ]);
    }

    /**
     * Update business hours.
     */
    public function updateBusinessHours(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'hours' => 'required|array',
            'hours.*.day_of_week' => 'required|integer|between:0,6',
            'hours.*.open_time' => 'nullable|string',
            'hours.*.close_time' => 'nullable|string',
            'hours.*.is_closed' => 'required|boolean',
        ]);

        foreach ($validated['hours'] as $hour) {
            BusinessHour::updateOrCreate(
                ['day_of_week' => $hour['day_of_week']],
                [
                    'open_time' => $hour['is_closed'] ? null : $hour['open_time'],
                    'close_time' => $hour['is_closed'] ? null : $hour['close_time'],
                    'is_closed' => $hour['is_closed'],
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Jam operasional berhasil disimpan.',
            'data' => BusinessHour::orderBy('day_of_week')->get(),
        ]);
    }

    /**
     * List schedule exceptions (holidays, special closures).
     */
    public function scheduleExceptions(): JsonResponse
    {
        $exceptions = ScheduleException::orderBy('exception_date', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $exceptions,
        ]);
    }

    /**
     * Store a schedule exception.
     */
    public function storeScheduleException(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'exception_date' => 'required|date',
            'start_time' => 'nullable|string',
            'end_time' => 'nullable|string',
            'is_closed' => 'required|boolean',
            'description' => 'nullable|string|max:255',
        ]);

        $exception = ScheduleException::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Pengecualian jadwal berhasil ditambahkan.',
            'data' => $exception,
        ], 201);
    }

    /**
     * Delete schedule exception.
     */
    public function destroyScheduleException(int $id): JsonResponse
    {
        ScheduleException::findOrFail($id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pengecualian jadwal berhasil dihapus.',
        ]);
    }

    /**
     * Get booking slots for admin view.
     */
    public function bookingSlots(Request $request): JsonResponse
    {
        $query = BookingSlot::with('service');

        if ($request->filled('service_id')) {
            $query->where('service_id', $request->service_id);
        }

        if ($request->filled('date')) {
            $query->whereDate('start_at', $request->date);
        }

        $slots = $query->orderBy('start_at', 'asc')->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $slots,
        ]);
    }

    /**
     * Generate slots for a service and date range.
     */
    public function generateSlots(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'service_id' => 'required|exists:services,id',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $service = Service::findOrFail($validated['service_id']);
        $start = Carbon::parse($validated['start_date']);
        $end = Carbon::parse($validated['end_date']);

        $generatedDays = 0;
        for ($date = $start->copy(); $date->lte($end); $date->addDay()) {
            $dayOfWeek = $date->dayOfWeek;
            $businessHour = BusinessHour::where('day_of_week', $dayOfWeek)->first();
            $exception = ScheduleException::where('exception_date', $date->toDateString())->first();

            if (($businessHour && $businessHour->is_closed) && ! $exception) {
                continue;
            }

            if ($exception && $exception->is_closed) {
                continue;
            }

            $this->availabilityService->ensureSlotsExistForDate($service, $date, $businessHour, $exception);
            $generatedDays++;
        }

        return response()->json([
            'success' => true,
            'message' => "Slot jadwal berhasil digenerate untuk {$generatedDays} hari operasional.",
        ]);
    }

    /**
     * List registered customers.
     */
    public function customers(Request $request): JsonResponse
    {
        $query = User::where('role', 'customer')->withCount('bookings');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $customers = $query->orderBy('id', 'desc')->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $customers,
        ]);
    }

    /**
     * Analytics Reports.
     */
    public function reports(Request $request): JsonResponse
    {
        $startDate = $request->input('start_date', Carbon::today()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::today()->toDateString());

        // Total bookings in period
        $bookingsQuery = Booking::whereBetween('created_at', [
            Carbon::parse($startDate)->startOfDay(),
            Carbon::parse($endDate)->endOfDay(),
        ]);

        if ($request->filled('service_id')) {
            $bookingsQuery->where('service_id', $request->service_id);
        }

        if ($request->filled('status')) {
            $bookingsQuery->where('status', $request->status);
        }

        $totalPeriodBookings = (clone $bookingsQuery)->count();

        // Revenue in period
        $revenuePeriod = Payment::where('status', Payment::STATUS_PAID)
            ->whereBetween('paid_at', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay(),
            ])
            ->sum('gross_amount');

        // Top ordered services
        $topServices = Service::withCount(['bookings' => function ($q) use ($startDate, $endDate) {
            $q->whereBetween('created_at', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay(),
            ]);
        }])
        ->orderBy('bookings_count', 'desc')
        ->limit(5)
        ->get();

        $bookingsList = (clone $bookingsQuery)
            ->with(['service', 'user', 'latestPayment'])
            ->orderBy('id', 'desc')
            ->limit(100)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'total_bookings' => $totalPeriodBookings,
                'total_revenue' => (float) $revenuePeriod,
                'top_services' => $topServices,
                'bookings' => $bookingsList,
            ],
        ]);
    }
}

