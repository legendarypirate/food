import {
  CreditCard,
  LayoutDashboard,
  LogOut,
  Receipt,
  Soup,
  Store,
  Tags,
  Users,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearAuth, getAuth } from '@/lib/auth';
import { mn } from '@/lib/mn';
import { cn } from '@/lib/utils';

const nav = [
  { to: '/admin', label: mn.pages.dashboard, icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: mn.pages.users, icon: Users },
  { to: '/admin/restaurants', label: mn.pages.restaurants, icon: Store },
  { to: '/admin/dishes', label: mn.pages.dishes, icon: Soup },
  { to: '/admin/orders', label: mn.pages.orders, icon: Receipt },
  { to: '/admin/payments', label: mn.pages.payments, icon: CreditCard },
  { to: '/admin/categories', label: mn.pages.categories, icon: Tags },
] as const;

export function AdminLayout() {
  const navigate = useNavigate();
  const adminUser = getAuth()?.user;

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="w-64 shrink-0 border-r bg-card p-4">
        <div className="mb-8 px-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{mn.admin}</p>
          <h1 className="text-xl font-bold text-primary">{mn.brand}</h1>
          {adminUser && (
            <p className="mt-1 text-xs text-muted-foreground">{adminUser.name}</p>
          )}
        </div>
        <nav className="space-y-1">
          {nav.map(({ to, label, icon: Icon, ...rest }) => (
            <NavLink
              key={to}
              to={to}
              end={'end' in rest ? rest.end : false}
              className={({ isActive }: { isActive: boolean }) =>
                cn(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => {
            clearAuth();
            navigate('/login');
          }}
          className="mt-6 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
        >
          <LogOut className="h-4 w-4" />
          {mn.logout}
        </button>
      </aside>

      <main className="min-w-0 flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
