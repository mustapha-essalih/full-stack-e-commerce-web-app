<?php

declare(strict_types=1);

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Http\Requests\Account\StoreAddressRequest;
use App\Http\Requests\Account\UpdateAddressRequest;
use App\Http\Resources\AddressResource;
use App\Models\Address;
use App\Models\User;
use App\Services\AddressService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AddressController extends Controller
{
    public function __construct(
        private readonly AddressService $addressService,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $addresses = $this->addressService->getForUser($user);

        return response()->json([
            'data' => AddressResource::collection($addresses),
        ]);
    }

    public function store(StoreAddressRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $address = $this->addressService->create($user, $request->validated());

        return response()->json([
            'data' => new AddressResource($address),
        ], 201);
    }

    public function update(UpdateAddressRequest $request, Address $address): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($address->user_id !== $user->id) {
            return response()->json([
                'message' => 'Address not found.',
            ], 404);
        }

        $address = $this->addressService->update($address, $request->validated());

        return response()->json([
            'data' => new AddressResource($address),
            'message' => 'Address updated successfully.',
        ]);
    }

    public function destroy(Request $request, Address $address): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($address->user_id !== $user->id) {
            return response()->json([
                'message' => 'Address not found.',
            ], 404);
        }

        $this->addressService->delete($address);

        return response()->json([
            'message' => 'Address deleted successfully.',
        ]);
    }

    public function setDefault(Request $request, Address $address): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($address->user_id !== $user->id) {
            return response()->json([
                'message' => 'Address not found.',
            ], 404);
        }

        $address = $this->addressService->setDefault($address);

        return response()->json([
            'data' => new AddressResource($address),
            'message' => 'Default address updated.',
        ]);
    }
}
