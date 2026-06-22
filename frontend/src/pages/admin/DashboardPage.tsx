export default function AdminDashboardPage() {
  const cards = [
    { label: 'Total Products', value: '—', color: 'bg-blue-500' },
    { label: 'Orders Today', value: '—', color: 'bg-green-500' },
    { label: 'Revenue Today', value: '—', color: 'bg-purple-500' },
    { label: 'Low Stock Items', value: '—', color: 'bg-amber-500' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary-900">Dashboard</h1>
        <p className="mt-1 text-sm text-secondary-500">Overview of your store</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-secondary-200 bg-white p-6">
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
        <p className="text-sm text-secondary-500">
          Detailed analytics and charts will appear here in a future update.
        </p>
      </div>
    </div>
  );
}
