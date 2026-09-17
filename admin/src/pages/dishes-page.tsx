import { Plus } from 'lucide-react';
import { useState } from 'react';
import { CrudTable } from '@/components/crud/crud-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, type Dish, type Restaurant } from '@/lib/api';
import { mn } from '@/lib/mn';

type Props = {
  dishes: Dish[];
  restaurants: Restaurant[];
  onRefresh: () => void;
};

export function DishesPage({ dishes, restaurants, onRefresh }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Dish | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});

  function openCreate() {
    setEditing(null);
    setForm({
      slug: '',
      name: '',
      price: 0,
      category: '',
      restaurantId: restaurants[0]?.id || '',
      badge: '',
      badgeType: '',
      servings: '1',
      likes: 0,
      imageUrl: '',
      isActive: true,
    });
    setOpen(true);
  }

  function openEdit(d: Dish) {
    setEditing(d);
    setForm({ ...d });
    setOpen(true);
  }

  async function handleDelete(d: Dish) {
    if (!window.confirm(mn.confirmDelete(d.name))) return;
    await api.dishes.remove(d.id);
    onRefresh();
  }

  async function handleSave() {
    const body = {
      ...form,
      price: Number(form.price) || 0,
      likes: Number(form.likes) || 0,
    };
    if (editing) {
      await api.dishes.update(editing.id, body);
    } else {
      await api.dishes.create(body);
    }
    setOpen(false);
    onRefresh();
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
        rows={dishes}
        rowKey={(d) => d.id}
        onEdit={openEdit}
        onDelete={handleDelete}
        columns={[
          { key: 'name', header: 'Нэр', render: (d) => d.name },
          { key: 'price', header: 'Үнэ', render: (d) => `${d.price.toLocaleString()}₮` },
          { key: 'category', header: 'Ангилал', render: (d) => d.category },
          { key: 'likes', header: 'Лайк', render: (d) => String(d.likes) },
          { key: 'badge', header: 'Badge', render: (d) => d.badge || '—' },
          {
            key: 'status',
            header: 'Төлөв',
            render: (d) => (
              <Badge variant={d.isActive ? 'success' : 'secondary'}>
                {d.isActive ? mn.active : mn.inactive}
              </Badge>
            ),
          },
        ]}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? mn.dialogs.editDish : mn.dialogs.newDish}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label={mn.fields.name}>
              <Input value={String(form.name || '')} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label={mn.fields.slug}>
              <Input value={String(form.slug || '')} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={mn.fields.price}>
                <Input
                  type="number"
                  value={Number(form.price) || 0}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                />
              </Field>
              <Field label={mn.fields.category}>
                <Input value={String(form.category || '')} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </Field>
            </div>
            <Field label={mn.fields.restaurant}>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={String(form.restaurantId || '')}
                onChange={(e) => setForm({ ...form, restaurantId: e.target.value })}
              >
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </Field>
            <Field label={mn.fields.imageUrl}>
              <Input value={String(form.imageUrl || '')} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive !== false}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              {mn.active}
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>{mn.cancel}</Button>
              <Button onClick={handleSave}>{mn.save}</Button>
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
