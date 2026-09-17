import { ReactNode } from 'react';
import { IconActionButtons } from '@/components/crud/icon-action-buttons';
import { mn } from '@/lib/mn';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export type CrudColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

type Props<T> = {
  columns: CrudColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
  actionsLabel?: string;
};

export function CrudTable<T>({
  columns,
  rows,
  rowKey,
  onEdit,
  onDelete,
  actionsLabel = 'Үйлдэл',
}: Props<T>) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="border-b-2 border-border/80 bg-muted/70 hover:bg-muted/70">
              <TableHead className="w-[108px]">{actionsLabel}</TableHead>
              {columns.map((col) => (
                <TableHead key={col.key}>{col.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="py-2 text-center text-muted-foreground"
                >
                  {mn.noRecords}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={rowKey(row)}>
                  <TableCell>
                    <IconActionButtons
                      onEdit={() => onEdit(row)}
                      onDelete={() => onDelete(row)}
                    />
                  </TableCell>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
