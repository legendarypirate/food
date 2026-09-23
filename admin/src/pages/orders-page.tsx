import { ChevronDown, ChevronUp, Truck, User } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { AdminPageHeader } from '@/components/admin-page-header';
import { AdminPageState } from '@/components/admin-page-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  api,
  type Courier,
  type Order,
  type OrderAction,
  type TrackingStep,
} from '@/lib/api';
import { formatUbRelativeDate } from '@/lib/datetime';
import { mn } from '@/lib/mn';

const DELIVERY_STEP_LABEL = 'Хүргэлтэнд гарсан';

function isDeliveryStep(step: TrackingStep) {
  return step.label === DELIVERY_STEP_LABEL;
}

function stepBadgeVariant(step: TrackingStep) {
  if (isDeliveryStep(step)) {
    if (step.state === 'active') return 'delivery' as const;
    if (step.state === 'completed') return 'success' as const;
    return 'secondary' as const;
  }
  if (step.state === 'completed') return 'success' as const;
  if (step.state === 'active') return 'warning' as const;
  return 'secondary' as const;
}

function getCurrentStepLabel(order: Order) {
  const steps = order.tracking?.steps;
  if (!steps?.length) return mn.orderStatus.active;
  const active = steps.find((s) => s.state === 'active');
  if (active) return active.label;
  if (order.status === 'delivered') return mn.orderActions.delivered;
  if (order.status === 'cancelled') return mn.orderActions.cancelled;
  const lastCompleted = [...steps].reverse().find((s) => s.state === 'completed');
  return lastCompleted?.label ?? mn.orderStatus.active;
}

function lineTotal(item: { price: number; quantity: number }) {
  return item.price * item.quantity;
}

function isPendingOrder(order: Order) {
  return order.status === 'active';
}

function fulfillmentLabel(type?: Order['fulfillmentType']) {
  return type === 'pickup' ? mn.preOrder.pickup : mn.preOrder.delivery;
}

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setOrders(await api.orders.list());
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
      <AdminPageHeader title={mn.pages.orders} onRefresh={load} />
      <AdminPageState loading={loading} error={error}>
        <div className="space-y-3">
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">{mn.noRecords}</p>
          ) : (
            orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                expanded={expandedId === order.id}
                onToggle={() =>
                  setExpandedId((id) => (id === order.id ? null : order.id))
                }
                onRefresh={load}
              />
            ))
          )}
        </div>
      </AdminPageState>
    </>
  );
}

function OrderCard({
  order,
  expanded,
  onToggle,
  onRefresh,
}: {
  order: Order;
  expanded: boolean;
  onToggle: () => void;
  onRefresh: () => void;
}) {
  const [updating, setUpdating] = useState(false);
  const [actionError, setActionError] = useState('');
  const [assignOpen, setAssignOpen] = useState(false);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [couriersLoading, setCouriersLoading] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const isPending = isPendingOrder(order);
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const currentStepLabel = getCurrentStepLabel(order);
  const isDeliveryActive = currentStepLabel === DELIVERY_STEP_LABEL;
  const assignedCourier = order.courier || order.tracking?.courier;

  async function handleAction(e: React.MouseEvent, action: OrderAction) {
    e.stopPropagation();
    setUpdating(true);
    setActionError('');
    try {
      await api.orders.updateAction(order.id, action);
      onRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : mn.loadError);
    } finally {
      setUpdating(false);
    }
  }

  async function openAssignDrawer(e: React.MouseEvent) {
    e.stopPropagation();
    setAssignOpen(true);
    setCouriersLoading(true);
    setActionError('');
    try {
      const list = await api.couriers.list();
      setCouriers(list.filter((c) => c.isActive));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : mn.loadError);
    } finally {
      setCouriersLoading(false);
    }
  }

  async function handleAssignCourier(courierId: number | string) {
    setAssigningId(String(courierId));
    setActionError('');
    try {
      await api.orders.assignCourier(order.id, courierId);
      setAssignOpen(false);
      onRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : mn.loadError);
    } finally {
      setAssigningId(null);
    }
  }

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 p-4 text-left transition-colors hover:bg-muted/40"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground">{order.orderNumber}</span>
            <Badge
              variant={
                order.status === 'active'
                  ? 'warning'
                  : order.status === 'delivered'
                    ? 'success'
                    : 'secondary'
              }
            >
              {mn.orderStatus[order.status as keyof typeof mn.orderStatus] || order.status}
            </Badge>
            {order.isPreOrder && (
              <Badge variant="warning">{mn.preOrder.badge}</Badge>
            )}
            {order.fulfillmentType === 'pickup' && (
              <Badge variant="secondary">{mn.preOrder.pickup}</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{order.restaurantName}</p>
          <p className="text-sm text-muted-foreground">
            {order.date} • {order.total.toLocaleString()}₮
            {itemCount > 0 ? ` • ${itemCount} зүйл` : ''}
          </p>
          {order.isPreOrder && order.scheduledDate && order.scheduledTime && (
            <p className="mt-1 text-sm font-medium text-primary">
              {mn.preOrder.scheduledFor}:{' '}
              {formatUbRelativeDate(order.scheduledDate, order.scheduledTime)} •{' '}
              {fulfillmentLabel(order.fulfillmentType)}
            </p>
          )}
          <p className="mt-1 text-sm font-medium">
            {mn.trackingStep}:{' '}
            <span className={isDeliveryActive ? 'text-blue-700' : 'text-foreground'}>
              {currentStepLabel}
            </span>
          </p>
          {assignedCourier && (
            <p className="mt-1 text-sm text-muted-foreground">
              {mn.ordersPage.assignedCourier}:{' '}
              <span className="font-medium text-foreground">{assignedCourier.name}</span>
              {'phone' in assignedCourier && assignedCourier.phone
                ? ` • ${assignedCourier.phone}`
                : ''}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center pt-1 text-muted-foreground">
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {isPending && (
        <div className="space-y-2 border-t bg-muted/20 px-4 py-3">
          {actionError && <p className="text-sm text-destructive">{actionError}</p>}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={updating}
              onClick={(e) => handleAction(e, 'preparing')}
            >
              {mn.orderActions.preparing}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={updating}
              className={
                isDeliveryActive
                  ? 'border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100'
                  : 'border-blue-200 text-blue-700 hover:bg-blue-50'
              }
              onClick={(e) => handleAction(e, 'out_for_delivery')}
            >
              {mn.orderActions.out_for_delivery}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={updating}
              onClick={openAssignDrawer}
            >
              <Truck className="mr-1.5 h-4 w-4" />
              {mn.ordersPage.assignCourier}
            </Button>
            <Button size="sm" disabled={updating} onClick={(e) => handleAction(e, 'delivered')}>
              {mn.orderActions.delivered}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={updating}
              onClick={(e) => handleAction(e, 'cancelled')}
            >
              {mn.orderActions.cancelled}
            </Button>
          </div>
        </div>
      )}

      {expanded && (
        <CardContent className="space-y-4 border-t pt-4">
          {order.isPreOrder && (
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {mn.preOrder.badge}
              </p>
              <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                <p>
                  <span className="text-muted-foreground">{mn.preOrder.scheduledFor}: </span>
                  <span className="font-medium text-foreground">
                    {formatUbRelativeDate(order.scheduledDate, order.scheduledTime)}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">{mn.preOrder.fulfillmentType}: </span>
                  <span className="font-medium text-foreground">
                    {fulfillmentLabel(order.fulfillmentType)}
                  </span>
                </p>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {order.fulfillmentType === 'pickup' ? 'Авах байршил' : 'Хүргэлтийн хаяг'}
            </p>
            <p className="mt-1 text-sm text-foreground">{order.deliveryAddress}</p>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Захиалсан хоол
            </p>
            {order.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Бүтээгдэхүүн байхгүй</p>
            ) : (
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Нэр</th>
                      <th className="px-3 py-2 text-right font-medium">Тоо</th>
                      <th className="px-3 py-2 text-right font-medium">Үнэ</th>
                      <th className="px-3 py-2 text-right font-medium">Нийт</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={`${item.name}-${item.quantity}-${item.price}`} className="border-t">
                        <td className="px-3 py-2">{item.name}</td>
                        <td className="px-3 py-2 text-right">{item.quantity}</td>
                        <td className="px-3 py-2 text-right">{item.price.toLocaleString()}₮</td>
                        <td className="px-3 py-2 text-right font-medium">
                          {lineTotal(item).toLocaleString()}₮
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t bg-muted/30">
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-right font-medium">
                        Нийт
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-primary">
                        {order.total.toLocaleString()}₮
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {order.tracking?.steps && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {mn.trackingStep}
              </p>
              <div className="flex flex-wrap gap-2">
                {order.tracking.steps.map((step) => (
                  <Badge key={step.label} variant={stepBadgeVariant(step)}>
                    {step.label}
                    {step.time ? ` (${step.time})` : ''}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{mn.ordersPage.selectCourier}</DialogTitle>
          </DialogHeader>
          <p className="mb-4 text-sm text-muted-foreground">
            {order.orderNumber} • {order.restaurantName}
          </p>

          {couriersLoading ? (
            <p className="text-sm text-muted-foreground">{mn.loading}</p>
          ) : couriers.length === 0 ? (
            <p className="text-sm text-muted-foreground">{mn.ordersPage.noCouriers}</p>
          ) : (
            <div className="space-y-2">
              {couriers.map((courier) => (
                <button
                  key={courier.id}
                  type="button"
                  disabled={assigningId !== null}
                  onClick={() => handleAssignCourier(courier.id)}
                  className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/60 disabled:opacity-60"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{courier.name}</p>
                    <p className="text-sm text-muted-foreground">{courier.phone}</p>
                  </div>
                  <span className="text-sm font-medium text-primary">
                    {assigningId === String(courier.id)
                      ? mn.ordersPage.assigning
                      : mn.ordersPage.assign}
                  </span>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
