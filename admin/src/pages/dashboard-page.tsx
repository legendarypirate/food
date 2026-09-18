import {
  CreditCard,
  Receipt,
  Store,
  Tags,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { AdminPageHeader } from '@/components/admin-page-header';
import { AdminPageState } from '@/components/admin-page-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { mn } from '@/lib/mn';

export function DashboardPage() {
  const [stats, setStats] = useState({
    users: 0,
    restaurants: 0,
    dishes: 0,
    orders: 0,
    payments: 0,
    categories: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [users, restaurants, dishes, orders, payments, categories] = await Promise.all([
        api.users.list(),
        api.restaurants.list(),
        api.dishes.list(),
        api.orders.list(),
        api.payments.list(),
        api.categories.list(),
      ]);
      setStats({
        users: users.length,
        restaurants: restaurants.length,
        dishes: dishes.length,
        orders: orders.length,
        payments: payments.length,
        categories: categories.length,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : mn.loadError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <AdminPageHeader title={mn.pages.dashboard} onRefresh={load} />
      <AdminPageState loading={loading} error={error}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard title={mn.pages.users} value={stats.users} icon={Users} />
          <StatCard title={mn.pages.restaurants} value={stats.restaurants} icon={Store} />
          <StatCard title={mn.pages.dishes} value={stats.dishes} icon={UtensilsCrossed} />
          <StatCard title={mn.pages.orders} value={stats.orders} icon={Receipt} />
          <StatCard title={mn.pages.payments} value={stats.payments} icon={CreditCard} />
          <StatCard title={mn.pages.categories} value={stats.categories} icon={Tags} />
        </div>
      </AdminPageState>
    </>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
