<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SuspendCustomerRequest;
use App\Http\Resources\AdminCustomerDetailResource;
use App\Http\Resources\AdminCustomerResource;
use App\Models\User;
use App\Services\CustomerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function __construct(
        private readonly CustomerService $customerService,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->input('per_page', 15), 100);

        $filters = [
            'date_from' => $request->input('filter.date_from'),
            'date_to' => $request->input('filter.date_to'),
            'has_orders' => $request->input('filter.has_orders'),
            'search' => $request->input('filter.search'),
        ];

        $customers = $this->customerService->getAllCustomers(
            array_filter($filters, fn ($value) => $value !== null),
            $perPage,
        );

        return response()->json(
            AdminCustomerResource::collection($customers)->response()->getData(true)
        );
    }

    public function show(string $uuid): JsonResponse
    {
        $user = User::where('uuid', $uuid)->first();

        if (!$user) {
            return response()->json([
                'message' => 'Customer not found.',
            ], 404);
        }

        $detail = $this->customerService->getCustomerDetail($user);

        return response()->json([
            'data' => new AdminCustomerDetailResource(
                $detail['user'],
                $detail,
            ),
        ]);
    }

    public function suspend(SuspendCustomerRequest $request, string $uuid): JsonResponse
    {
        $user = User::where('uuid', $uuid)->first();

        if (!$user) {
            return response()->json([
                'message' => 'Customer not found.',
            ], 404);
        }

        if ($user->hasRole('admin')) {
            return response()->json([
                'message' => 'Cannot suspend an admin user.',
            ], 422);
        }

        if ($user->is_suspended) {
            return response()->json([
                'message' => 'Customer is already suspended.',
            ], 422);
        }

        $user = $this->customerService->suspendCustomer($user);

        return response()->json([
            'data' => new AdminCustomerResource($user),
            'message' => 'Customer suspended successfully.',
        ]);
    }

    public function reinstate(SuspendCustomerRequest $request, string $uuid): JsonResponse
    {
        $user = User::where('uuid', $uuid)->first();

        if (!$user) {
            return response()->json([
                'message' => 'Customer not found.',
            ], 404);
        }

        if (!$user->is_suspended) {
            return response()->json([
                'message' => 'Customer is not suspended.',
            ], 422);
        }

        $user = $this->customerService->reinstateCustomer($user);

        return response()->json([
            'data' => new AdminCustomerResource($user),
            'message' => 'Customer reinstated successfully.',
        ]);
    }
}
