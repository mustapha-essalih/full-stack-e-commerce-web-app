<x-mail-layout title="Your Order Has Shipped">
    <h2 style="margin-top: 0;">Your order is on its way!</h2>

    <p>Hi {{ $order->user->name }},</p>
    <p>Your order <strong>#{{ $order->uuid }}</strong> has been shipped.</p>

    @if ($order->tracking_number)
        <p><strong>Tracking Number:</strong> {{ $order->tracking_number }}</p>
    @endif

    <hr />

    <h3>Order Summary</h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <thead>
            <tr style="border-bottom: 1px solid #e4e4e7;">
                <th style="text-align: left; padding: 8px 4px;">Item</th>
                <th style="text-align: center; padding: 8px 4px;">Qty</th>
                <th style="text-align: right; padding: 8px 4px;">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($order->items as $item)
                <tr style="border-bottom: 1px solid #e4e4e7;">
                    <td style="padding: 8px 4px;">{{ $item->product_name }}</td>
                    <td style="text-align: center; padding: 8px 4px;">{{ $item->quantity }}</td>
                    <td style="text-align: right; padding: 8px 4px;">${{ number_format($item->total_cents / 100, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <p style="margin-bottom: 0;">
        <a href="{{ url('/orders/' . $order->uuid) }}" class="button">Track Order</a>
    </p>
</x-mail-layout>
