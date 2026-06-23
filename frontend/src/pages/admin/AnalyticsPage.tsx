import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  fetchRevenueSummary, fetchRevenueChart, fetchTopProducts,
  fetchAnalyticsCustomers, fetchCouponSummary,
} from '../../api/adminAnalytics';

type Preset = '7d' | '30d' | '90d' | 'custom';

function getPresetRange(preset: Preset): { from: string; to: string } {
  const to = new Date();
  let days: number;
  if (preset === '7d') days = 6;
  else if (preset === '30d') days = 29;
  else days = 89;

  const from = new Date(to);
  from.setDate(from.getDate() - days);
  return { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] };
}

function formatCents(cents: number): string {
  return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatChange(val: number, isPercent: boolean): string {
  const prefix = val > 0 ? '+' : '';
  return isPercent ? `${prefix}${val}%` : `${prefix}${val}`;
}

function ChangeBadge({ change, changePercent }: { change: number; changePercent: number }) {
  const isPositive = change >= 0;
  const colorClass = isPositive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
      {formatChange(changePercent, true)}
    </span>
  );
}

const COLORS = ['#6366f1', '#94a3b8'];

export default function AdminAnalyticsPage() {
  const [preset, setPreset] = useState<Preset>('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const range = useMemo(() => {
    if (preset === 'custom' && customFrom && customTo) {
      return { from: customFrom, to: customTo };
    }
    return getPresetRange(preset);
  }, [preset, customFrom, customTo]);

  const queryOptions = {
    staleTime: 5 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  };

  const summaryQuery = useQuery({
    queryKey: ['analytics-summary', range.from, range.to],
    queryFn: () => fetchRevenueSummary(range.from, range.to),
    ...queryOptions,
  });

  const revenueChartQuery = useQuery({
    queryKey: ['analytics-revenue-chart', range.from, range.to],
    queryFn: () => fetchRevenueChart(range.from, range.to),
    ...queryOptions,
  });

  const topProductsQuery = useQuery({
    queryKey: ['analytics-top-products', range.from, range.to],
    queryFn: () => fetchTopProducts(range.from, range.to),
    ...queryOptions,
  });

  const customersQuery = useQuery({
    queryKey: ['analytics-customers', range.from, range.to],
    queryFn: () => fetchAnalyticsCustomers(range.from, range.to),
    ...queryOptions,
  });

  const couponsQuery = useQuery({
    queryKey: ['analytics-coupons', range.from, range.to],
    queryFn: () => fetchCouponSummary(range.from, range.to),
    ...queryOptions,
  });

  const summary = summaryQuery.data;
  const dailyData = revenueChartQuery.data ?? [];
  const topProducts = topProductsQuery.data ?? [];
  const customers = customersQuery.data;
  const coupons = couponsQuery.data;

  const lastUpdated = summaryQuery.dataUpdatedAt
    ? new Date(summaryQuery.dataUpdatedAt).toLocaleTimeString()
    : '—';

  const customerPieData = customers
    ? [
        { name: 'New', value: customers.new_count },
        { name: 'Returning', value: customers.returning_count },
      ]
    : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Analytics</h1>
          <p className="mt-1 text-sm text-secondary-500">
            Last updated: {lastUpdated} &middot; Data may be up to 15 minutes stale
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d', 'custom'] as Preset[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPreset(p)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                preset === p
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-secondary-600 border border-secondary-300 hover:bg-secondary-50'
              }`}
            >
              {p === '7d' ? 'Last 7 days' : p === '30d' ? 'Last 30 days' : p === '90d' ? 'Last 90 days' : 'Custom'}
            </button>
          ))}
          {preset === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-lg border border-secondary-300 px-2 py-1.5 text-sm"
              />
              <span className="text-secondary-500">—</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-lg border border-secondary-300 px-2 py-1.5 text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-secondary-200 bg-white p-6">
          <p className="text-sm font-medium text-secondary-500">Total Revenue</p>
          <p className="mt-1 text-2xl font-bold text-secondary-900">
            {summary ? formatCents(summary.revenue_cents) : '—'}
          </p>
          {summary && (
            <div className="mt-2">
              <ChangeBadge change={summary.comparison.revenue_change_cents} changePercent={summary.comparison.revenue_change_percent} />
              <span className="ml-1 text-xs text-secondary-400">vs prev period</span>
            </div>
          )}
        </div>
        <div className="rounded-lg border border-secondary-200 bg-white p-6">
          <p className="text-sm font-medium text-secondary-500">Orders</p>
          <p className="mt-1 text-2xl font-bold text-secondary-900">
            {summary ? summary.order_count.toLocaleString() : '—'}
          </p>
          {summary && (
            <div className="mt-2">
              <ChangeBadge change={summary.comparison.order_count_change} changePercent={summary.comparison.order_count_change_percent} />
              <span className="ml-1 text-xs text-secondary-400">vs prev period</span>
            </div>
          )}
        </div>
        <div className="rounded-lg border border-secondary-200 bg-white p-6">
          <p className="text-sm font-medium text-secondary-500">Average Order Value</p>
          <p className="mt-1 text-2xl font-bold text-secondary-900">
            {summary ? formatCents(summary.average_order_value_cents) : '—'}
          </p>
          {summary && (
            <div className="mt-2">
              <ChangeBadge change={summary.comparison.aov_change_cents} changePercent={summary.comparison.aov_change_percent} />
              <span className="ml-1 text-xs text-secondary-400">vs prev period</span>
            </div>
          )}
        </div>
        <div className="rounded-lg border border-secondary-200 bg-white p-6">
          <p className="text-sm font-medium text-secondary-500">Coupons Used</p>
          <p className="mt-1 text-2xl font-bold text-secondary-900">
            {coupons ? coupons.total_usages.toLocaleString() : '—'}
          </p>
          {coupons && (
            <p className="mt-1 text-xs text-secondary-400">
              {formatCents(coupons.total_discount_cents)} in discounts
            </p>
          )}
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Revenue chart */}
        <div className="rounded-lg border border-secondary-200 bg-white p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-secondary-900">Daily Revenue</h2>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(d: string) => {
                  const parts = d.split('-');
                  return `${parts[1]}/${parts[2]}`;
                }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `$${(v / 100).toLocaleString()}`} />
                <Tooltip formatter={(value: number) => [formatCents(value), 'Revenue']} />
                <Line type="monotone" dataKey="revenue_cents" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-80 items-center justify-center text-sm text-secondary-400">
              No revenue data for this period
            </div>
          )}
        </div>

        {/* New vs Returning customers */}
        <div className="rounded-lg border border-secondary-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-secondary-900">Customers</h2>
          {customers && (customers.new_count > 0 || customers.returning_count > 0) ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={customerPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {customerPieData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[0] }} />
                  <span className="text-secondary-600">New: {customers.new_count}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[1] }} />
                  <span className="text-secondary-600">Returning: {customers.returning_count}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-60 items-center justify-center text-sm text-secondary-400">
              No customer data for this period
            </div>
          )}
        </div>
      </div>

      {/* Top products table */}
      <div className="mb-8 rounded-lg border border-secondary-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-secondary-900">Top Products</h2>
        {topProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-secondary-200">
                  <th className="pb-3 pr-4 font-medium text-secondary-500">Product</th>
                  <th className="pb-3 pr-4 font-medium text-secondary-500">SKU</th>
                  <th className="pb-3 pr-4 font-medium text-secondary-500 text-right">Units Sold</th>
                  <th className="pb-3 font-medium text-secondary-500 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p) => (
                  <tr key={p.product_id} className="border-b border-secondary-100 last:border-0">
                    <td className="py-3 pr-4 font-medium text-secondary-900">{p.product_name}</td>
                    <td className="py-3 pr-4 text-secondary-500">{p.product_sku}</td>
                    <td className="py-3 pr-4 text-right text-secondary-900">{p.units_sold}</td>
                    <td className="py-3 text-right font-medium text-secondary-900">{formatCents(p.revenue_cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-20 items-center justify-center text-sm text-secondary-400">
            No product sales data for this period
          </div>
        )}
      </div>

      {/* Coupon summary */}
      {coupons && coupons.coupons.length > 0 && (
        <div className="rounded-lg border border-secondary-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-secondary-900">Coupon Usage</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-secondary-200">
                  <th className="pb-3 pr-4 font-medium text-secondary-500">Coupon</th>
                  <th className="pb-3 pr-4 font-medium text-secondary-500 text-right">Times Used</th>
                  <th className="pb-3 font-medium text-secondary-500 text-right">Total Discount</th>
                </tr>
              </thead>
              <tbody>
                {coupons.coupons.map((c) => (
                  <tr key={c.coupon_code} className="border-b border-secondary-100 last:border-0">
                    <td className="py-3 pr-4 font-medium text-secondary-900">{c.coupon_code}</td>
                    <td className="py-3 pr-4 text-right text-secondary-900">{c.times_used}</td>
                    <td className="py-3 text-right font-medium text-secondary-900">{formatCents(c.total_discount_cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
