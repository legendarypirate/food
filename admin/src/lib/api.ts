// Relative /api — proxied by Vite (dev) and server.js (prod). No CORS issues.
const API = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
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
  orders: {
    list: () => request<Order[]>('/orders'),
    updateStatus: (id: string, status: string) =>
      request<Order>(`/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
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
  badge: string;
  badgeType: string;
  servings: string;
  likes: number;
  category: string;
  restaurantId: string;
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

export type Order = {
  id: string;
  orderNumber: string;
  restaurantName: string;
  status: string;
  total: number;
  date: string;
  deliveryAddress: string;
  items: { name: string; quantity: number; price: number }[];
};
