import { Plus } from 'lucide-react';
import { useState } from 'react';
import { CrudTable } from '@/components/crud/crud-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, type Category } from '@/lib/api';
import { mn } from '@/lib/mn';

type Props = {
  categories: Category[];
  onRefresh: () => void;
};

export function CategoriesPage({ categories, onRefresh }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<Partial<Category>>({});

  function openCreate() {
    setEditing(null);
    setForm({ slug: '', name: '', icon: 'apps', sortOrder: 0, gradientStart: '#6B7280', gradientEnd: '#4B5563' });
    setOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setForm({ ...cat });
    setOpen(true);
  }

  async function handleDelete(cat: Category) {
    if (!window.confirm(mn.confirmDelete(cat.name))) return;
    await api.categories.remove(cat.id);
    onRefresh();
  }

  async function handleSave() {
    if (editing) {
      await api.categories.update(editing.id, form);
    } else {
      await api.categories.create(form);
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
        rows={categories}
        rowKey={(c) => String(c.id)}
        onEdit={openEdit}
        onDelete={handleDelete}
        columns={[
          { key: 'name', header: 'Нэр', render: (c) => c.name },
          { key: 'slug', header: 'Slug', render: (c) => c.slug },
          { key: 'sort', header: 'Эрэмбэ', render: (c) => String(c.sortOrder) },
          { key: 'icon', header: 'Icon', render: (c) => c.icon },
        ]}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? mn.dialogs.editCategory : mn.dialogs.newCategory}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>{mn.fields.name}</Label>
              <Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>{mn.fields.slug}</Label>
              <Input value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{mn.fields.sortOrder}</Label>
                <Input
                  type="number"
                  value={form.sortOrder ?? 0}
                  onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label>{mn.fields.icon}</Label>
                <Input value={form.icon || ''} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
              </div>
            </div>
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
