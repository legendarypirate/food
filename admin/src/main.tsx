import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminGuard } from './components/admin-guard';
import { AdminLayout } from './components/admin-layout';
import './index.css';
import { CategoriesPage } from './pages/categories-page';
import { CouriersPage } from './pages/couriers-page';
import { DashboardPage } from './pages/dashboard-page';
import { DishesPage } from './pages/dishes-page';
import { LandingPage } from './pages/landing-page';
import { LoginPage } from './pages/login-page';
import { OrdersPage } from './pages/orders-page';
import { PaymentsPage } from './pages/payments-page';
import { RestaurantsPage } from './pages/restaurants-page';
import { NotificationsPage } from './pages/notifications-page';
import { UsersPage } from './pages/users-page';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="restaurants" element={<RestaurantsPage />} />
          <Route path="dishes" element={<DishesPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="couriers" element={<CouriersPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
