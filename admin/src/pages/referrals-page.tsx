import { useCallback, useEffect, useState } from 'react';
import { AdminPageHeader } from '@/components/admin-page-header';
import { AdminPageState } from '@/components/admin-page-state';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api, type AdminReferralOverview, type AdminReferralRow } from '@/lib/api';
import { mn } from '@/lib/mn';

function statusVariant(status: AdminReferralRow['status']) {
  if (status === 'completed') return 'success';
  return 'warning';
}

function formatDate(value: string | null) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('mn-MN');
  } catch {
    return value;
  }
}

export function ReferralsPage() {
  const [data, setData] = useState<AdminReferralOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const onRefresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await api.referrals.adminOverview());
    } catch (e) {
      setError(e instanceof Error ? e.message : mn.loadError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    onRefresh();
  }, [onRefresh]);

  const summary = data?.summary;
  const rows = data?.referrals ?? [];

  return (
    <>
      <AdminPageHeader title={mn.pages.referrals} onRefresh={onRefresh} />
      <AdminPageState loading={loading} error={error}>
        {summary && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground">{mn.referrals.linkClicks}</p>
              <p className="text-2xl font-bold">{summary.linkClicks}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground">{mn.referrals.invitesTotal}</p>
              <p className="text-2xl font-bold">{summary.invitesRegistered}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground">{mn.referrals.pendingVerify}</p>
              <p className="text-2xl font-bold">{summary.invitesPendingPhoneVerify}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground">{mn.referrals.completed}</p>
              <p className="text-2xl font-bold">
                {summary.invitesCompleted}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  (+{summary.rewardPointsPerInvite} {mn.referrals.pointsEach})
                </span>
              </p>
            </div>
          </div>
        )}

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{mn.referrals.inviter}</TableHead>
                  <TableHead>{mn.referrals.invitee}</TableHead>
                  <TableHead>{mn.referrals.status}</TableHead>
                  <TableHead>{mn.referrals.phoneVerified}</TableHead>
                  <TableHead>{mn.referrals.registeredAt}</TableHead>
                  <TableHead>{mn.referrals.completedAt}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      {mn.noRecords}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="min-w-[160px]">
                          <p className="font-medium">{row.inviter?.name ?? '—'}</p>
                          <p className="text-xs text-muted-foreground">{row.inviter?.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {mn.referrals.code}: {row.inviter?.referralCode ?? '—'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-[160px]">
                          <p className="font-medium">{row.invitee?.name ?? '—'}</p>
                          <p className="text-xs text-muted-foreground">{row.invitee?.email}</p>
                          <p className="text-xs text-muted-foreground">{row.invitee?.phone || '—'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(row.status)}>
                          {row.status === 'completed'
                            ? mn.referrals.statusCompleted
                            : mn.referrals.statusPending}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {row.invitee?.phoneVerified ? (
                          <Badge variant="success">{mn.referrals.yes}</Badge>
                        ) : (
                          <Badge variant="secondary">{mn.referrals.no}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(row.registeredAt)}</TableCell>
                      <TableCell>{formatDate(row.completedAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </AdminPageState>
    </>
  );
}
