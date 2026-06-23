<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\InventoryAdjustmentType;
use App\Enums\OrderStatus;
use App\Events\OrderPaid;
use App\Events\OrderStatusChanged;
use App\Listeners\SendLowStockNotification;
use App\Listeners\SendOrderConfirmationMail;
use App\Listeners\SendOrderShippedMail;
use App\Mail\OrderConfirmationMail;
use App\Mail\OrderShippedMail;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    private User $customer;
    private User $admin;
    private Order $order;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'customer', 'guard_name' => 'web']);
        Role::create(['name' => 'admin', 'guard_name' => 'web']);

        $this->customer = User::factory()->create([
            'email' => 'customer@example.com',
        ]);
        $this->customer->assignRole('customer');

        $this->admin = User::factory()->create([
            'email' => 'admin@example.com',
        ]);
        $this->admin->assignRole('admin');

        $this->product = Product::factory()->create([
            'price_cents' => 1999,
            'stock_quantity' => 10,
            'is_active' => true,
        ]);

        $this->order = Order::factory()->create([
            'user_id' => $this->customer->id,
            'status' => OrderStatus::Pending->value,
            'subtotal_cents' => 1999,
            'total_cents' => 1999,
        ]);
    }

    public function test_order_confirmation_mail_is_queued_on_order_paid_event(): void
    {
        Mail::fake();

        $this->order->markAsPaid();

        OrderPaid::dispatch($this->order);

        Mail::assertQueued(OrderConfirmationMail::class, function (OrderConfirmationMail $mail) {
            return $mail->order->id === $this->order->id
                && $mail->hasTo($this->customer->email);
        });
    }

    public function test_order_shipped_mail_is_queued_on_status_transition_to_shipped(): void
    {
        Mail::fake();

        $oldStatus = OrderStatus::from($this->order->status);
        $this->order->markAsShipped('TRACK123');

        OrderStatusChanged::dispatch($this->order, $oldStatus, OrderStatus::Shipped);

        Mail::assertQueued(OrderShippedMail::class, function (OrderShippedMail $mail) {
            return $mail->order->id === $this->order->id
                && $mail->hasTo($this->customer->email);
        });
    }

    public function test_order_shipped_mail_is_not_queued_on_non_shipped_transition(): void
    {
        Mail::fake();

        $oldStatus = OrderStatus::from($this->order->status);
        $this->order->markAsPaid();

        OrderStatusChanged::dispatch($this->order, $oldStatus, OrderStatus::Paid);

        Mail::assertNotQueued(OrderShippedMail::class);
    }

    public function test_admin_new_order_notification_sent_on_order_paid(): void
    {
        Notification::fake();

        OrderPaid::dispatch($this->order);

        Notification::assertSentTo(
            $this->admin,
            \App\Notifications\NewOrderNotification::class,
            function (string $channels, \App\Notifications\NewOrderNotification $notification) {
                return $notification->order->id === $this->order->id;
            }
        );
    }

    public function test_low_stock_notification_sent_to_admin(): void
    {
        Notification::fake();

        $product = Product::factory()->create([
            'stock_quantity' => 5,
            'is_active' => true,
        ]);

        $listener = app(SendLowStockNotification::class);
        $listener->handle(new \App\Events\LowStockDetected($product, 5));

        Notification::assertSentTo(
            $this->admin,
            \App\Notifications\LowStockNotification::class,
            function (string $channels, \App\Notifications\LowStockNotification $notification) use ($product) {
                return $notification->product->id === $product->id
                    && $notification->currentQuantity === 5;
            }
        );
    }

    public function test_admin_can_fetch_notifications(): void
    {
        $this->admin->notify(new \App\Notifications\NewOrderNotification($this->order));

        $response = $this->withToken($this->admin->createToken('test')->plainTextToken)
            ->getJson('/api/v1/admin/notifications');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'type', 'data', 'read_at', 'created_at', 'is_read'],
                ],
                'meta' => ['unread_count'],
            ]);

        $this->assertEquals(1, $response->json('meta.unread_count'));
    }

    public function test_admin_can_mark_notification_as_read(): void
    {
        $notification = $this->admin->notify(new \App\Notifications\NewOrderNotification($this->order));

        $notifications = $this->admin->notifications()->get();
        $dbNotification = $notifications->first();

        $response = $this->withToken($this->admin->createToken('test')->plainTextToken)
            ->patchJson("/api/v1/admin/notifications/{$dbNotification->id}/read");

        $response->assertOk();
        $this->assertNotNull($dbNotification->fresh()->read_at);
    }

    public function test_admin_can_mark_all_notifications_as_read(): void
    {
        $this->admin->notify(new \App\Notifications\NewOrderNotification($this->order));
        $this->admin->notify(new \App\Notifications\NewOrderNotification($this->order));

        $response = $this->withToken($this->admin->createToken('test')->plainTextToken)
            ->postJson('/api/v1/admin/notifications/read-all');

        $response->assertOk();
        $this->assertEquals(0, $this->admin->unreadNotifications()->count());
    }

    public function test_send_low_stock_notification_listener_is_registered(): void
    {
        Event::fake();

        $product = Product::factory()->create([
            'stock_quantity' => 5,
            'is_active' => true,
        ]);

        $listener = app(SendLowStockNotification::class);
        $listener->handle(new \App\Events\LowStockDetected($product, 5));

        Event::assertNotDispatched(\App\Events\LowStockDetected::class);

        Notification::assertSentTo($this->admin, \App\Notifications\LowStockNotification::class);
    }
}
