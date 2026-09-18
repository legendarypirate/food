import { Card, CardContent } from '@/components/ui/card';
import { mn } from '@/lib/mn';

type Props = {
  loading: boolean;
  error: string;
  children: React.ReactNode;
};

export function AdminPageState({ loading, error, children }: Props) {
  if (error) {
    return (
      <Card className="mb-4 border-red-200 bg-red-50">
        <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
      </Card>
    );
  }
  if (loading) {
    return <p className="text-muted-foreground">{mn.loading}</p>;
  }
  return <>{children}</>;
}
