<?php

declare(strict_types=1);

namespace App\Enums;

enum InventoryAdjustmentType: string
{
    case Restock = 'restock';
    case Adjustment = 'adjustment';
    case Sale = 'sale';
    case Cancellation = 'cancellation';
    case Correction = 'correction';
}
