import { Button } from '@/components/ui/button';
import { mn } from '@/lib/mn';

type Props = {
  title: string;
  onRefresh?: () => void;
};

export function AdminPageHeader({ title, onRefresh }: Props) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{mn.subtitle}</p>
      </div>
      {onRefresh && (
        <Button variant="outline" onClick={onRefresh}>
          {mn.refresh}
        </Button>
      )}
    </div>
  );
}
