import { Plus, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { AdminPageHeader } from '@/components/admin-page-header';
import { AdminPageState } from '@/components/admin-page-state';
import { CrudTable } from '@/components/crud/crud-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, type Restaurant } from '@/lib/api';
import { mn } from '@/lib/mn';

export function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Restaurant | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [formError, setFormError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const onRefresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRestaurants(await api.restaurants.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : mn.loadError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    onRefresh();
  }, [onRefresh]);

  function imageUrl(): string {
    return typeof form.imageUrl === 'string' ? form.imageUrl : '';
  }

  function openCreate() {
    setEditing(null);
    setFormError('');
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
    setFormError('');
    setForm({ ...r });
    setOpen(true);
  }

  async function handleImage(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setFormError('');
    setUploading(true);
    try {
      const { urls: uploaded } = await api.uploads.images([file]);
      setForm((prev) => ({ ...prev, imageUrl: uploaded[0] || '' }));
    } catch (e) {
      setFormError(e instanceof Error ? e.message : mn.loadError);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(r: Restaurant) {
    if (!window.confirm(mn.confirmDelete(r.name))) return;
    await api.restaurants.remove(r.id);
    onRefresh();
  }

  async function handleSave() {
    const uploadedImage = imageUrl();
    if (!uploadedImage) {
      setFormError('Зураг оруулна уу');
      return;
    }
    const body = {
      ...form,
      deliveryFee: Number(form.deliveryFee) || 0,
      rating: Number(form.rating) || 0,
      reviewCount: Number(form.reviewCount) || 0,
      imageUrl: uploadedImage,
    };
    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        await api.restaurants.update(editing.id, body);
      } else {
        await api.restaurants.create(body);
      }
      setOpen(false);
      onRefresh();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : mn.loadError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminPageHeader title={mn.pages.restaurants} onRefresh={onRefresh} />
      <AdminPageState loading={loading} error={error}>
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
          {
            key: 'image',
            header: mn.fields.image,
            render: (r) =>
              r.imageUrl ? (
                <img src={r.imageUrl} alt="" className="h-10 w-10 rounded-md object-cover" />
              ) : (
                '—'
              ),
          },
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
            <Field label={mn.fields.image}>
              <p className="text-xs text-muted-foreground">{mn.fields.imageHint}</p>
              <Input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(e) => {
                  void handleImage(e.target.files);
                  e.target.value = '';
                }}
              />
              {uploading && <p className="text-xs text-muted-foreground">{mn.fields.imagesUploading}</p>}
              {imageUrl() ? (
                <div className="relative h-24 w-24 overflow-hidden rounded-md border">
                  <img src={imageUrl()} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    className="absolute right-0.5 top-0.5 rounded-full bg-black/70 p-0.5 text-white"
                    onClick={() => setForm((prev) => ({ ...prev, imageUrl: '' }))}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : null}
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
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>{mn.cancel}</Button>
              <Button onClick={handleSave} disabled={saving || uploading}>
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
