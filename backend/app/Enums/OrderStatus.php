<?php

declare(strict_types=1);

namespace App\Enums;

enum OrderStatus: string
{
    case Draft = 'draft';
    case Paid = 'paid';
    case Processing = 'processing';
    case Shipped = 'shipped';
    case Delivered = 'delivered';
    case Cancelled = 'cancelled';
    case Refunded = 'refunded';
}
