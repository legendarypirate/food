import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  onEdit: () => void;
  onDelete: () => void;
  editLabel?: string;
  deleteLabel?: string;
  className?: string;
};

export function IconActionButtons({
  onEdit,
  onDelete,
  editLabel = 'Засах',
  deleteLabel = 'Устгах',
  className,
}: Props) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <button
        type="button"
        onClick={onEdit}
        title={editLabel}
        aria-label={editLabel}
        className="inline-flex h-7 w-7 items-center justify-center rounded border border-input bg-background text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        title={deleteLabel}
        aria-label={deleteLabel}
        className="inline-flex h-7 w-7 items-center justify-center rounded bg-[#dc2626] text-white shadow-sm transition-colors hover:bg-[#b91c1c]"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
