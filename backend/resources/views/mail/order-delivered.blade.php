<x-mail-layout title="Your Order Has Been Delivered">
    <h2 style="margin-top: 0;">Your order has been delivered!</h2>

    <p>Hi {{ $order->user->name }},</p>
    <p>Your order <strong>#{{ $order->uuid }}</strong> has been delivered.</p>

    <p>We hope you love your purchase! If you have a moment, we'd appreciate a review.</p>

    <hr />

    <h3>Order Summary</h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <thead>
            <tr style="border-bottom: 1px solid #e4e4e7;">
                <th style="text-align: left; padding: 8px 4px;">Item</th>
                <th style="text-align: center; padding: 8px 4px;">Qty</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($order->items as $item)
                <tr style="border-bottom: 1px solid #e4e4e7;">
                    <td style="padding: 8px 4px;">{{ $item->product_name }}</td>
                    <td style="text-align: center; padding: 8px 4px;">{{ $item->quantity }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <p style="margin-bottom: 0;">
        <a href="{{ url('/orders/' . $order->uuid) }}" class="button">View Order</a>
    </p>
</x-mail-layout>
