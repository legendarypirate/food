import { Bell, Send } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { AdminPageHeader } from '@/components/admin-page-header';
import { AdminPageState } from '@/components/admin-page-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, type User } from '@/lib/api';
import { mn } from '@/lib/mn';

type Target = 'all' | 'user';
type NotificationType = 'promo' | 'system' | 'order';

export function NotificationsPage() {
  const [status, setStatus] = useState<{ configured: boolean; registeredDevices: number } | null>(
    null,
  );
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState<Target>('all');
  const [userId, setUserId] = useState('');
  const [type, setType] = useState<NotificationType>('promo');

  const onRefresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [pushStatus, userList] = await Promise.all([
        api.notifications.status(),
        api.users.list(),
      ]);
      setStatus(pushStatus);
      setUsers(userList.filter((u) => u.role === 'customer'));
    } catch (e) {
      setError(e instanceof Error ? e.message : mn.loadError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    onRefresh();
  }, [onRefresh]);

  async function handleSend() {
    setSending(true);
    setError('');
    setSuccess('');
    try {
      const result = await api.notifications.send({
        title,
        body,
        target,
        type,
        userId: target === 'user' ? Number(userId) : undefined,
      });
      setSuccess(
        `${result.successCount} төхөөрөмжид амжилттай илгээгдлээ` +
          (result.failureCount > 0 ? ` (${result.failureCount} алдаатай)` : ''),
      );
      setTitle('');
      setBody('');
    } catch (e) {
      setError(e instanceof Error ? e.message : mn.loadError);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <AdminPageHeader title={mn.pages.notifications} onRefresh={onRefresh} />
      <AdminPageState loading={loading} error={error}>
        {success && (
          <div className="mb-4 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-4 w-4" />
                {mn.notifications.serviceStatus}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{mn.notifications.fcmConfigured}</span>
                <Badge variant={status?.configured ? 'default' : 'secondary'}>
                  {status?.configured ? mn.active : mn.inactive}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{mn.notifications.registeredDevices}</span>
                <span className="font-medium">{status?.registeredDevices ?? 0}</span>
              </div>
              {!status?.configured && (
                <p className="text-xs text-muted-foreground">{mn.notifications.setupHint}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{mn.notifications.compose}</CardTitle>
              <p className="text-sm text-muted-foreground">{mn.notifications.composeHint}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">{mn.notifications.titleLabel}</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={mn.notifications.titlePlaceholder}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">{mn.notifications.bodyLabel}</Label>
                <textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={mn.notifications.bodyPlaceholder}
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type">{mn.notifications.typeLabel}</Label>
                  <select
                    id="type"
                    value={type}
                    onChange={(e) => setType(e.target.value as NotificationType)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="promo">{mn.notifications.types.promo}</option>
                    <option value="system">{mn.notifications.types.system}</option>
                    <option value="order">{mn.notifications.types.order}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target">{mn.notifications.targetLabel}</Label>
                  <select
                    id="target"
                    value={target}
                    onChange={(e) => setTarget(e.target.value as Target)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="all">{mn.notifications.targets.all}</option>
                    <option value="user">{mn.notifications.targets.user}</option>
                  </select>
                </div>
              </div>

              {target === 'user' && (
                <div className="space-y-2">
                  <Label htmlFor="userId">{mn.notifications.userLabel}</Label>
                  <select
                    id="userId"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">{mn.notifications.selectUser}</option>
                    {users.map((user) => (
                      <option key={user.id} value={String(user.id)}>
                        {user.name} ({user.email || user.phone || user.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <Button
                type="button"
                className="w-full sm:w-auto"
                disabled={sending || !title.trim() || !body.trim() || (target === 'user' && !userId)}
                onClick={handleSend}
              >
                <Send className="mr-2 h-4 w-4" />
                {sending ? mn.notifications.sending : mn.notifications.send}
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminPageState>
    </>
  );
}
