<x-mail-layout title="Order Confirmation">
    <h2 style="margin-top: 0;">Thank you for your order!</h2>

    <p>Hi {{ $order->user->name }},</p>
    <p>Your order <strong>#{{ $order->uuid }}</strong> has been confirmed and is being processed.</p>

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
        <tfoot>
            <tr>
                <td colspan="2" style="text-align: right; padding: 8px 4px; font-weight: 600;">Subtotal</td>
                <td style="text-align: right; padding: 8px 4px;">${{ number_format($order->subtotal_cents / 100, 2) }}</td>
            </tr>
            @if ($order->discount_cents > 0)
                <tr>
                    <td colspan="2" style="text-align: right; padding: 8px 4px;">Discount</td>
                    <td style="text-align: right; padding: 8px 4px;">-${{ number_format($order->discount_cents / 100, 2) }}</td>
                </tr>
            @endif
            <tr>
                <td colspan="2" style="text-align: right; padding: 8px 4px;">Tax</td>
                <td style="text-align: right; padding: 8px 4px;">${{ number_format($order->tax_cents / 100, 2) }}</td>
            </tr>
            <tr>
                <td colspan="2" style="text-align: right; padding: 8px 4px;">Shipping</td>
                <td style="text-align: right; padding: 8px 4px;">${{ number_format($order->shipping_cents / 100, 2) }}</td>
            </tr>
            <tr style="font-weight: 700; font-size: 16px;">
                <td colspan="2" style="text-align: right; padding: 8px 4px; border-top: 2px solid #18181b;">Total</td>
                <td style="text-align: right; padding: 8px 4px; border-top: 2px solid #18181b;">${{ number_format($order->total_cents / 100, 2) }}</td>
            </tr>
        </tfoot>
    </table>

    <hr />

    <p style="color: #71717a; font-size: 14px;">
        You will receive a shipping confirmation with tracking information once your order ships.
    </p>

    <p style="margin-bottom: 0;">
        <a href="{{ url('/orders/' . $order->uuid) }}" class="button">View Order</a>
    </p>
</x-mail-layout>
