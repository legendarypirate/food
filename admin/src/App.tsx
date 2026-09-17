import {
  CreditCard,
  LayoutDashboard,
  Receipt,
  Soup,
  Store,
  Tags,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  api,
  type Category,
  type Dish,
  type Order,
  type QPayPayment,
  type Restaurant,
  type User,
} from '@/lib/api';
import { mn } from '@/lib/mn';
import { cn } from '@/lib/utils';
import { CategoriesPage } from '@/pages/categories-page';
import { DishesPage } from '@/pages/dishes-page';
import { PaymentsPage } from '@/pages/payments-page';
import { RestaurantsPage } from '@/pages/restaurants-page';
import { UsersPage } from '@/pages/users-page';

type Page =
  | 'dashboard'
  | 'users'
  | 'restaurants'
  | 'dishes'
  | 'orders'
  | 'categories'
  | 'payments';

const nav: { id: Page; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: mn.pages.dashboard, icon: LayoutDashboard },
  { id: 'users', label: mn.pages.users, icon: Users },
  { id: 'restaurants', label: mn.pages.restaurants, icon: Store },
  { id: 'dishes', label: mn.pages.dishes, icon: Soup },
  { id: 'orders', label: mn.pages.orders, icon: Receipt },
  { id: 'payments', label: mn.pages.payments, icon: CreditCard },
  { id: 'categories', label: mn.pages.categories, icon: Tags },
];

const pageTitles: Record<Page, string> = mn.pages;

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<QPayPayment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [u, r, d, o, p, c] = await Promise.all([
        api.users.list(),
        api.restaurants.list(),
        api.dishes.list(),
        api.orders.list(),
        api.payments.list(),
        api.categories.list(),
      ]);
      setUsers(u);
      setRestaurants(r);
      setDishes(d);
      setOrders(o);
      setPayments(p);
      setCategories(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : mn.loadError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="w-64 border-r bg-card p-4">
        <div className="mb-8 px-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{mn.admin}</p>
          <h1 className="text-xl font-bold text-primary">{mn.brand}</h1>
        </div>
        <nav className="space-y-1">
          {nav.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                page === id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{pageTitles[page]}</h2>
            <p className="text-sm text-muted-foreground">{mn.subtitle}</p>
          </div>
          <Button variant="outline" onClick={loadAll}>
            {mn.refresh}
          </Button>
        </div>

        {error && (
          <Card className="mb-4 border-red-200 bg-red-50">
            <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
          </Card>
        )}

        {loading ? (
          <p className="text-muted-foreground">{mn.loading}</p>
        ) : (
          <>
            {page === 'dashboard' && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <StatCard title={mn.pages.users} value={users.length} icon={Users} />
                <StatCard title={mn.pages.restaurants} value={restaurants.length} icon={Store} />
                <StatCard title={mn.pages.dishes} value={dishes.length} icon={UtensilsCrossed} />
                <StatCard title={mn.pages.orders} value={orders.length} icon={Receipt} />
                <StatCard title={mn.pages.payments} value={payments.length} icon={CreditCard} />
                <StatCard title={mn.pages.categories} value={categories.length} icon={Tags} />
              </div>
            )}

            {page === 'users' && <UsersPage users={users} onRefresh={loadAll} />}

            {page === 'restaurants' && (
              <RestaurantsPage restaurants={restaurants} onRefresh={loadAll} />
            )}

            {page === 'dishes' && (
              <DishesPage dishes={dishes} restaurants={restaurants} onRefresh={loadAll} />
            )}

            {page === 'categories' && (
              <CategoriesPage categories={categories} onRefresh={loadAll} />
            )}

            {page === 'payments' && (
              <PaymentsPage payments={payments} orders={orders} onRefresh={loadAll} />
            )}

            {page === 'orders' && (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id}>
                    <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-base">{order.orderNumber}</CardTitle>
                      <Badge
                        variant={
                          order.status === 'active'
                            ? 'warning'
                            : order.status === 'delivered'
                              ? 'success'
                              : 'secondary'
                        }
                      >
                        {mn.orderStatus[order.status as keyof typeof mn.orderStatus] ||
                          order.status}
                      </Badge>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      <p>{order.restaurantName}</p>
                      <p>
                        {order.date} • {order.total.toLocaleString()}₮
                      </p>
                      <p>{order.deliveryAddress}</p>
                      {order.status === 'active' && (
                        <Button
                          size="sm"
                          className="mt-3"
                          onClick={async () => {
                            await api.orders.updateStatus(order.id, 'delivered');
                            loadAll();
                          }}
                        >
                          {mn.markDelivered}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
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
