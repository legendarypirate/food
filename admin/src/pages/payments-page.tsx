import { Plus } from 'lucide-react';
import { useState } from 'react';
import { CrudTable } from '@/components/crud/crud-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, type Order, type QPayPayment } from '@/lib/api';
import { mn } from '@/lib/mn';

type Props = {
  payments: QPayPayment[];
  orders: Order[];
  onRefresh: () => void;
};

const emptyPayment = (): Partial<QPayPayment> => ({
  invoiceId: '',
  senderInvoiceNo: '',
  orderId: null,
  amount: 0,
  description: '',
  status: 'pending',
  qpayShortUrl: '',
  qrText: '',
  callbackUrl: 'http://localhost:3001/api/payments/callback',
  isActive: true,
});

function statusVariant(status: QPayPayment['status']) {
  if (status === 'paid') return 'success';
  if (status === 'pending') return 'warning';
  return 'secondary';
}

export function PaymentsPage({ payments, orders, onRefresh }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<QPayPayment | null>(null);
  const [form, setForm] = useState<Partial<QPayPayment>>(emptyPayment());
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(emptyPayment());
    setOpen(true);
  }

  function openEdit(payment: QPayPayment) {
    setEditing(payment);
    setForm({ ...payment });
    setOpen(true);
  }

  async function handleDelete(payment: QPayPayment) {
    if (!window.confirm(mn.confirmDelete(payment.invoiceId))) return;
    await api.payments.remove(payment.id);
    onRefresh();
  }

  async function handleSave() {
    setSaving(true);
    try {
      const body = {
        ...form,
        amount: Number(form.amount) || 0,
        orderId: form.orderId ? Number(form.orderId) : null,
        paidAt: form.paidAt || null,
        expiresAt: form.expiresAt || null,
      };
      if (editing) {
        await api.payments.update(editing.id, body);
      } else {
        await api.payments.create(body);
      }
      setOpen(false);
      onRefresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {mn.add}
        </Button>
      </div>

      <CrudTable
        rows={payments}
        rowKey={(p) => String(p.id)}
        onEdit={openEdit}
        onDelete={handleDelete}
        columns={[
          { key: 'invoice', header: 'Нэхэмжлэх', render: (p) => p.invoiceId },
          { key: 'sender', header: 'Дотоод дугаар', render: (p) => p.senderInvoiceNo },
          {
            key: 'order',
            header: 'Захиалга',
            render: (p) => p.orderNumber || '—',
          },
          {
            key: 'amount',
            header: 'Дүн',
            render: (p) => `${p.amount.toLocaleString()}₮`,
          },
          { key: 'description', header: 'Тайлбар', render: (p) => p.description },
          {
            key: 'status',
            header: 'Төлөв',
            render: (p) => (
              <Badge variant={statusVariant(p.status)}>
                {mn.paymentStatus[p.status]}
              </Badge>
            ),
          },
          {
            key: 'active',
            header: 'Идэвх',
            render: (p) => (
              <Badge variant={p.isActive ? 'success' : 'secondary'}>
                {p.isActive ? mn.active : mn.inactive}
              </Badge>
            ),
          },
        ]}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? mn.dialogs.editPayment : mn.dialogs.newPayment}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label={mn.fields.invoiceId}>
              <Input
                value={form.invoiceId || ''}
                onChange={(e) => setForm({ ...form, invoiceId: e.target.value })}
              />
            </Field>
            <Field label={mn.fields.senderInvoiceNo}>
              <Input
                value={form.senderInvoiceNo || ''}
                onChange={(e) => setForm({ ...form, senderInvoiceNo: e.target.value })}
              />
            </Field>
            <Field label={mn.fields.orderId}>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.orderId ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    orderId: e.target.value ? Number(e.target.value) : null,
                  })
                }
              >
                <option value="">—</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={mn.fields.amount}>
              <Input
                type="number"
                value={form.amount ?? 0}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              />
            </Field>
            <Field label={mn.fields.description}>
              <Input
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>
            <Field label={mn.fields.status}>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.status || 'pending'}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as QPayPayment['status'] })
                }
              >
                <option value="pending">{mn.paymentStatus.pending}</option>
                <option value="paid">{mn.paymentStatus.paid}</option>
                <option value="expired">{mn.paymentStatus.expired}</option>
                <option value="cancelled">{mn.paymentStatus.cancelled}</option>
              </select>
            </Field>
            <Field label={mn.fields.qpayShortUrl}>
              <Input
                value={form.qpayShortUrl || ''}
                onChange={(e) => setForm({ ...form, qpayShortUrl: e.target.value })}
              />
            </Field>
            <Field label={mn.fields.qrText}>
              <Input
                value={form.qrText || ''}
                onChange={(e) => setForm({ ...form, qrText: e.target.value })}
              />
            </Field>
            <Field label={mn.fields.callbackUrl}>
              <Input
                value={form.callbackUrl || ''}
                onChange={(e) => setForm({ ...form, callbackUrl: e.target.value })}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive ?? true}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              {mn.active}
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                {mn.cancel}
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? mn.saving : mn.save}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
