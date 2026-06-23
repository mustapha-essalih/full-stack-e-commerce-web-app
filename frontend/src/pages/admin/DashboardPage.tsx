import { useQuery } from '@tanstack/react-query';
import { fetchRevenueSummary } from '../../api/adminAnalytics';
import { useNavigate } from 'react-router-dom';

function getDateRange() {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 29);
  return { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] };
}

function formatCents(cents: number): string {
  return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { from, to } = getDateRange();

  const { data: summary } = useQuery({
    queryKey: ['dashboard-summary', from, to],
    queryFn: () => fetchRevenueSummary(from, to),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  });

  const cards = [
    {
      label: 'Revenue (30d)',
      value: summary ? formatCents(summary.revenue_cents) : '—',
      color: 'bg-purple-500',
    },
    {
      label: 'Orders (30d)',
      value: summary ? summary.order_count.toLocaleString() : '—',
      color: 'bg-green-500',
    },
    {
      label: 'Avg Order Value',
      value: summary ? formatCents(summary.average_order_value_cents) : '—',
      color: 'bg-blue-500',
    },
    {
      label: 'Low Stock Items',
      value: '—',
      color: 'bg-amber-500',
      link: '/admin/inventory',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary-900">Dashboard</h1>
        <p className="mt-1 text-sm text-secondary-500">Overview of your store</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`rounded-lg border border-secondary-200 bg-white p-6 ${card.link ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
            onClick={() => card.link && navigate(card.link)}
            role={card.link ? 'button' : undefined}
            tabIndex={card.link ? 0 : undefined}
            onKeyDown={(e) => card.link && e.key === 'Enter' && navigate(card.link)}
          >
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 rounded-lg ${card.color} flex items-center justify-center`}>
                <span className="text-xl font-bold text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-500">{card.label}</p>
                <p className="text-2xl font-bold text-secondary-900">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-secondary-200 bg-white p-12 text-center">
        <p className="mb-2 text-sm text-secondary-500">
          View detailed analytics with charts, customer breakdown, and more.
        </p>
        <button
          type="button"
          onClick={() => navigate('/admin/analytics')}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
        >
          Open Analytics Dashboard
        </button>
      </div>
    </div>
  );
}
