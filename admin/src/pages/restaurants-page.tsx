import { Plus } from 'lucide-react';
import { useState } from 'react';
import { CrudTable } from '@/components/crud/crud-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, type Restaurant } from '@/lib/api';
import { mn } from '@/lib/mn';

type Props = {
  restaurants: Restaurant[];
  onRefresh: () => void;
};

export function RestaurantsPage({ restaurants, onRefresh }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Restaurant | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});

  function openCreate() {
    setEditing(null);
    setForm({
      slug: '',
      name: '',
      location: '',
      deliveryFee: 0,
      freeDelivery: false,
      rating: 4.5,
      reviewCount: 0,
      deliveryTime: '30-40 min',
      hours: '10:00 - 22:00',
      badge: '',
      imageUrl: '',
      categories: [],
      isActive: true,
    });
    setOpen(true);
  }

  function openEdit(r: Restaurant) {
    setEditing(r);
    setForm({ ...r });
    setOpen(true);
  }

  async function handleDelete(r: Restaurant) {
    if (!window.confirm(mn.confirmDelete(r.name))) return;
    await api.restaurants.remove(r.id);
    onRefresh();
  }

  async function handleSave() {
    const body = {
      ...form,
      deliveryFee: Number(form.deliveryFee) || 0,
      rating: Number(form.rating) || 0,
      reviewCount: Number(form.reviewCount) || 0,
    };
    if (editing) {
      await api.restaurants.update(editing.id, body);
    } else {
      await api.restaurants.create(body);
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
        rows={restaurants}
        rowKey={(r) => r.id}
        onEdit={openEdit}
        onDelete={handleDelete}
        columns={[
          { key: 'name', header: 'Нэр', render: (r) => r.name },
          { key: 'location', header: 'Байршил', render: (r) => r.location },
          {
            key: 'rating',
            header: 'Үнэлгээ',
            render: (r) => `${r.rating} (${r.reviewCount})`,
          },
          {
            key: 'delivery',
            header: 'Хүргэлт',
            render: (r) => (r.freeDelivery ? mn.free : `${r.deliveryFee}₮`),
          },
          {
            key: 'status',
            header: 'Төлөв',
            render: (r) => (
              <Badge variant={r.isActive ? 'success' : 'secondary'}>
                {r.isActive ? mn.active : mn.inactive}
              </Badge>
            ),
          },
        ]}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? mn.dialogs.editRestaurant : mn.dialogs.newRestaurant}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label={mn.fields.name}>
              <Input value={String(form.name || '')} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label={mn.fields.slug}>
              <Input value={String(form.slug || '')} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </Field>
            <Field label={mn.fields.location}>
              <Input value={String(form.location || '')} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={mn.fields.deliveryFee}>
                <Input
                  type="number"
                  value={Number(form.deliveryFee) || 0}
                  onChange={(e) => setForm({ ...form, deliveryFee: Number(e.target.value) })}
                />
              </Field>
              <Field label={mn.fields.rating}>
                <Input
                  type="number"
                  step="0.1"
                  value={Number(form.rating) || 0}
                  onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                />
              </Field>
            </div>
            <Field label={mn.fields.imageUrl}>
              <Input value={String(form.imageUrl || '')} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(form.freeDelivery)}
                onChange={(e) => setForm({ ...form, freeDelivery: e.target.checked })}
              />
              {mn.fields.freeDelivery}
            </label>
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
