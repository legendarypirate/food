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
import { api, type User } from '@/lib/api';
import { mn } from '@/lib/mn';

const emptyUser = (): Partial<User> => ({
  name: '',
  phone: '',
  email: '',
  role: 'customer',
  membershipLevel: 'Gold',
  points: 0,
  orderCount: 0,
  avatarUrl: '',
  isActive: true,
});

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<Partial<User>>(emptyUser());
  const [saving, setSaving] = useState(false);

  const onRefresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setUsers(await api.users.list());
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
    setForm(emptyUser());
    setOpen(true);
  }

  function openEdit(user: User) {
    setEditing(user);
    setForm({ ...user });
    setOpen(true);
  }

  async function handleDelete(user: User) {
    if (!window.confirm(mn.confirmDelete(user.name))) return;
    await api.users.remove(user.id);
    onRefresh();
  }

  async function handleSave() {
    setSaving(true);
    try {
      const body = {
        ...form,
        points: Number(form.points) || 0,
        orderCount: Number(form.orderCount) || 0,
      };
      if (editing) {
        await api.users.update(editing.id, body);
      } else {
        await api.users.create(body);
      }
      setOpen(false);
      onRefresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminPageHeader title={mn.pages.users} onRefresh={onRefresh} />
      <AdminPageState loading={loading} error={error}>
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {mn.add}
        </Button>
      </div>

      <CrudTable
        rows={users}
        rowKey={(u) => String(u.id)}
        onEdit={openEdit}
        onDelete={handleDelete}
        columns={[
          {
            key: 'name',
            header: 'Нэр',
            render: (u) => (
              <div className="flex items-center gap-3">
                {u.avatarUrl ? (
                  <img
                    src={u.avatarUrl}
                    alt=""
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                    {u.name.charAt(0)}
                  </div>
                )}
                <span className="font-medium">{u.name}</span>
              </div>
            ),
          },
          { key: 'phone', header: 'Утас', render: (u) => u.phone },
          { key: 'email', header: 'И-мэйл', render: (u) => u.email },
          {
            key: 'role',
            header: 'Төрөл',
            render: (u) => (
              <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role}</Badge>
            ),
          },
          { key: 'membership', header: 'Гишүүнчлэл', render: (u) => u.membershipLevel },
          { key: 'points', header: 'Оноо', render: (u) => u.points.toLocaleString() },
          {
            key: 'status',
            header: 'Төлөв',
            render: (u) => (
              <Badge variant={u.isActive ? 'success' : 'secondary'}>
                {u.isActive ? mn.active : mn.inactive}
              </Badge>
            ),
          },
        ]}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? mn.dialogs.editUser : mn.dialogs.newUser}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label={mn.fields.name}>
              <Input
                value={form.name || ''}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label={mn.fields.phone}>
              <Input
                value={form.phone || ''}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <Field label={mn.fields.email}>
              <Input
                type="email"
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label={mn.fields.role}>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.role || 'customer'}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value as User['role'] })
                }
              >
                <option value="customer">customer</option>
                <option value="courier">courier</option>
                <option value="admin">admin</option>
              </select>
            </Field>
            <Field label={mn.fields.membership}>
              <Input
                value={form.membershipLevel || ''}
                onChange={(e) => setForm({ ...form, membershipLevel: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={mn.fields.points}>
                <Input
                  type="number"
                  value={form.points ?? 0}
                  onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
                />
              </Field>
              <Field label={mn.fields.orders}>
                <Input
                  type="number"
                  value={form.orderCount ?? 0}
                  onChange={(e) => setForm({ ...form, orderCount: Number(e.target.value) })}
                />
              </Field>
            </div>
            <Field label={mn.fields.avatarUrl}>
              <Input
                value={form.avatarUrl || ''}
                onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
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
