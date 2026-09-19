import { Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { AdminPageHeader } from '@/components/admin-page-header';
import { AdminPageState } from '@/components/admin-page-state';
import { CrudTable } from '@/components/crud/crud-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, type Courier } from '@/lib/api';
import { mn } from '@/lib/mn';

const emptyCourier = (): Partial<Courier> & { password?: string } => ({
  name: '',
  phone: '',
  password: '',
  isActive: true,
});

export function CouriersPage() {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Courier | null>(null);
  const [form, setForm] = useState<Partial<Courier> & { password?: string }>(emptyCourier());
  const [saving, setSaving] = useState(false);

  const onRefresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setCouriers(await api.couriers.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : mn.loadError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    onRefresh();
  }, [onRefresh]);

  function openCreate() {
    setEditing(null);
    setForm(emptyCourier());
    setOpen(true);
  }

  function openEdit(courier: Courier) {
    setEditing(courier);
    setForm({ ...courier, password: '' });
    setOpen(true);
  }

  async function handleDelete(courier: Courier) {
    if (!window.confirm(mn.confirmDelete(courier.name))) return;
    await api.couriers.remove(courier.id);
    onRefresh();
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      if (editing) {
        const body: Record<string, unknown> = {
          name: form.name,
          phone: form.phone,
          isActive: form.isActive,
        };
        if (form.password?.trim()) body.password = form.password;
        await api.couriers.update(editing.id, body);
      } else {
        if (!form.password?.trim()) {
          setError(mn.couriers.passwordRequired);
          return;
        }
        await api.couriers.create({
          name: form.name || '',
          phone: form.phone || '',
          password: form.password,
          isActive: form.isActive ?? true,
        });
      }
      setOpen(false);
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : mn.loadError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminPageHeader title={mn.pages.couriers} onRefresh={onRefresh} />
      <AdminPageState loading={loading} error={error}>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{mn.couriers.subtitle}</p>
          <div className="flex justify-end">
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {mn.couriers.add}
            </Button>
          </div>

          <CrudTable
            rows={couriers}
            rowKey={(c) => String(c.id)}
            onEdit={openEdit}
            onDelete={handleDelete}
            columns={[
              { key: 'name', header: mn.fields.name, render: (c) => <span className="font-medium">{c.name}</span> },
              { key: 'phone', header: mn.fields.phone, render: (c) => c.phone },
              {
                key: 'status',
                header: mn.fields.status,
                render: (c) => (
                  <Badge variant={c.isActive ? 'success' : 'secondary'}>
                    {c.isActive ? mn.active : mn.inactive}
                  </Badge>
                ),
              },
            ]}
          />

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? mn.dialogs.editCourier : mn.dialogs.newCourier}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4">
                <Field label={mn.fields.name}>
                  <Input
                    value={form.name || ''}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Б. Бат-Эрдэнэ"
                  />
                </Field>
                <Field label={mn.fields.phone}>
                  <Input
                    value={form.phone || ''}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="99001122"
                  />
                </Field>
                <Field label={editing ? mn.couriers.newPassword : mn.fields.password}>
                  <Input
                    type="password"
                    value={form.password || ''}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder={editing ? mn.couriers.passwordHint : ''}
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
      </AdminPageState>
    </>
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
