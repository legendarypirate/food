import { getAuth } from './auth';

// Relative /api — proxied by Vite (dev) and server.js (prod). No CORS issues.
const API = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

function authHeaders(): Record<string, string> {
  const token = getAuth()?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  health: () => request<{ ok: boolean }>('/health'),
  categories: {
    list: () => request<Category[]>('/categories'),
    create: (body: Partial<Category>) =>
      request<Category>('/categories', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: number, body: Partial<Category>) =>
      request<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: (id: number) => request<void>(`/categories/${id}`, { method: 'DELETE' }),
  },
  couriers: {
    list: () => request<Courier[]>('/couriers'),
    create: (body: { name: string; phone: string; password: string; isActive?: boolean }) =>
      request<Courier>('/couriers', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: number | string, body: Partial<{ name: string; phone: string; password: string; isActive: boolean }>) =>
      request<Courier>(`/couriers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: (id: number | string) => request<void>(`/couriers/${id}`, { method: 'DELETE' }),
  },
  users: {
    list: () => request<User[]>('/users'),
    create: (body: Partial<User>) =>
      request<User>('/users', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: number | string, body: Partial<User>) =>
      request<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: (id: number | string) => request<void>(`/users/${id}`, { method: 'DELETE' }),
  },
  restaurants: {
    list: () => request<Restaurant[]>('/restaurants?admin=1'),
    create: (body: Record<string, unknown>) =>
      request<Restaurant>('/restaurants', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Record<string, unknown>) =>
      request<Restaurant>(`/restaurants/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: (id: string) => request<void>(`/restaurants/${id}`, { method: 'DELETE' }),
  },
  dishes: {
    list: () => request<Dish[]>('/dishes?admin=1'),
    create: (body: Record<string, unknown>) =>
      request<Dish>('/dishes', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Record<string, unknown>) =>
      request<Dish>(`/dishes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: (id: string) => request<void>(`/dishes/${id}`, { method: 'DELETE' }),
  },
  uploads: {
    images: async (files: File[]) => {
      const data = new FormData();
      files.forEach((file) => data.append('files', file));
      const res = await fetch(`${API}/uploads`, {
        method: 'POST',
        headers: authHeaders(),
        body: data,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || res.statusText);
      return json as { urls: string[] };
    },
  },
  auth: {
    login: (phone: string, password: string) =>
      request<{ ok: boolean; token: string; user: { id: number; name: string; phone: string; role: string } }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify({ phone, password }) },
      ),
  },
  orders: {
    list: () => request<Order[]>('/orders'),
    updateStatus: (id: string, status: string) =>
      request<Order>(`/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    updateAction: (id: string, action: OrderAction) =>
      request<Order>(`/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      }),
    assignCourier: (id: string, courierId: number | string) =>
      request<Order>(`/orders/${id}/courier`, {
        method: 'PATCH',
        body: JSON.stringify({ courierId }),
      }),
  },
  notifications: {
    status: () =>
      request<{ configured: boolean; registeredDevices: number }>('/notifications/status'),
    send: (body: {
      title: string;
      body: string;
      target: 'all' | 'user';
      type?: 'promo' | 'system' | 'order';
      userId?: number;
    }) =>
      request<{
        ok: boolean;
        attempted: number;
        successCount: number;
        failureCount: number;
      }>('/notifications/send', { method: 'POST', body: JSON.stringify(body) }),
  },
  payments: {
    list: () => request<QPayPayment[]>('/payments'),
    create: (body: Partial<QPayPayment>) =>
      request<QPayPayment>('/payments', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: number | string, body: Partial<QPayPayment>) =>
      request<QPayPayment>(`/payments/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: (id: number | string) => request<void>(`/payments/${id}`, { method: 'DELETE' }),
  },
};

export type Category = {
  id: number;
  slug: string;
  name: string;
  icon: string;
  gradientStart: string;
  gradientEnd: string;
  sortOrder: number;
};

export type Restaurant = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  deliveryTime: string;
  hours: string;
  deliveryFee: number;
  badge: string;
  location: string;
  categories: string[];
  freeDelivery: boolean;
  isActive: boolean;
};

export type Dish = {
  id: string;
  slug: string;
  name: string;
  price: number;
  imageUrl: string;
  imageUrls: string[];
  badge: string;
  badgeType: string;
  servings: string;
  likes: number;
  category: string;
  categoryId?: number | null;
  restaurantId: string;
  isActive: boolean;
};

export type Courier = {
  id: number | string;
  name: string;
  phone: string;
  role: 'courier';
  isActive: boolean;
};

export type User = {
  id: number | string;
  name: string;
  phone: string;
  email: string;
  role: 'admin' | 'customer' | 'courier';
  membershipLevel: string;
  points: number;
  orderCount: number;
  avatarUrl: string | null;
  isActive: boolean;
};

export type QPayPayment = {
  id: number | string;
  invoiceId: string;
  senderInvoiceNo: string;
  orderId: number | null;
  orderNumber: string | null;
  amount: number;
  description: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  qpayShortUrl: string | null;
  qrText: string | null;
  callbackUrl: string | null;
  paidAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
};

export type OrderAction = 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';

export type TrackingStep = {
  label: string;
  icon: string;
  state: 'completed' | 'active' | 'pending';
  time?: string;
  subtitle?: string;
};

export type OrderCourier = {
  id: string;
  name: string;
  phone: string;
  avatarUrl: string | null;
};

export type Order = {
  id: string;
  orderNumber: string;
  restaurantName: string;
  status: string;
  total: number;
  date: string;
  deliveryAddress: string;
  fulfillmentType?: 'delivery' | 'pickup';
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  isPreOrder?: boolean;
  items: { name: string; quantity: number; price: number }[];
  courierId?: string | null;
  courier?: OrderCourier | null;
  tracking?: {
    steps: TrackingStep[];
    courier?: {
      name: string;
      phone?: string;
    };
  } | null;
};
