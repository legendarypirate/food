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
import { api, type Category, type Dish, type Restaurant } from '@/lib/api';
import { mn } from '@/lib/mn';

export function DishesPage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Dish | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [formError, setFormError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const onRefresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [d, r, c] = await Promise.all([
        api.dishes.list(),
        api.restaurants.list(),
        api.categories.list(),
      ]);
      setDishes(d);
      setRestaurants(r);
      setCategories(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : mn.loadError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    onRefresh();
  }, [onRefresh]);

  function imageList(): string[] {
    const urls = form.imageUrls;
    if (Array.isArray(urls)) return urls.filter((u): u is string => typeof u === 'string');
    if (typeof form.imageUrl === 'string' && form.imageUrl) return [form.imageUrl];
    return [];
  }

  function openCreate() {
    setEditing(null);
    setFormError('');
    setForm({
      slug: '',
      name: '',
      price: 0,
      categoryId: categories[0]?.id || '',
      restaurantId: restaurants[0]?.id || '',
      badge: '',
      badgeType: '',
      servings: '1',
      likes: 0,
      imageUrl: '',
      imageUrls: [],
      isActive: true,
    });
    setOpen(true);
  }

  function openEdit(d: Dish) {
    setEditing(d);
    setFormError('');
    setForm({
      ...d,
      categoryId: d.categoryId ?? '',
      imageUrls: d.imageUrls?.length ? d.imageUrls : d.imageUrl ? [d.imageUrl] : [],
    });
    setOpen(true);
  }

  async function handleDelete(d: Dish) {
    if (!window.confirm(mn.confirmDelete(d.name))) return;
    await api.dishes.remove(d.id);
    onRefresh();
  }

  async function handleImages(files: FileList | null) {
    const selected = [...(files ?? [])];
    if (!selected.length) return;
    setFormError('');
    setUploading(true);
    try {
      const { urls: uploaded } = await api.uploads.images(selected);
      const next = [...imageList(), ...uploaded];
      setForm((prev) => ({ ...prev, imageUrls: next, imageUrl: next[0] || '' }));
    } catch (e) {
      setFormError(e instanceof Error ? e.message : mn.loadError);
    } finally {
      setUploading(false);
    }
  }

  function removeImage(url: string) {
    const next = imageList().filter((u) => u !== url);
    setForm((prev) => ({ ...prev, imageUrls: next, imageUrl: next[0] || '' }));
  }

  async function handleSave() {
    const imageUrls = imageList();
    if (!form.categoryId) {
      setFormError(mn.fields.selectCategory);
      return;
    }
    if (!imageUrls.length) {
      setFormError('Зураг оруулна уу');
      return;
    }
    const { category, ...rest } = form;
    void category;
    const body = {
      ...rest,
      price: Number(form.price) || 0,
      likes: Number(form.likes) || 0,
      categoryId: Number(form.categoryId),
      imageUrls,
      imageUrl: imageUrls[0],
    };
    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        await api.dishes.update(editing.id, body);
      } else {
        await api.dishes.create(body);
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
      <AdminPageHeader title={mn.pages.dishes} onRefresh={onRefresh} />
      <AdminPageState loading={loading} error={error}>
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
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={String(form.categoryId || '')}
                  onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}
                >
                  <option value="">{mn.fields.selectCategory}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
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
            <Field label={mn.fields.images}>
              <p className="text-xs text-muted-foreground">{mn.fields.imagesHint}</p>
              <Input
                type="file"
                accept="image/*"
                multiple
                disabled={uploading}
                onChange={(e) => {
                  void handleImages(e.target.files);
                  e.target.value = '';
                }}
              />
              {uploading && <p className="text-xs text-muted-foreground">{mn.fields.imagesUploading}</p>}
              <div className="flex flex-wrap gap-2">
                {imageList().map((url, index) => (
                  <div key={url} className="relative h-20 w-20 overflow-hidden rounded-md border">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    {index === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 text-[10px] text-white">
                        Үндсэн
                      </span>
                    )}
                    <button
                      type="button"
                      className="absolute right-0.5 top-0.5 rounded-full bg-black/70 p-0.5 text-white"
                      onClick={() => removeImage(url)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </Field>
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
