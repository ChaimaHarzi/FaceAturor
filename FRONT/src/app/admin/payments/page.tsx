'use client';

import { PageHeader } from '@/components/common/ui';
import PaymentsTable from '@/components/payments/PaymentsTable';
import { formatMoney } from '@/lib/format';
import { useApi } from '@/lib/hooks';
import type { Payment } from '@/types/models';

export default function AdminPaymentsPage() {
  const { data, isLoading } = useApi<Payment[]>('/payments');
  const total = (data ?? [])
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);
  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle="All payments made by parents to enrol their children."
        extra={
          <span className="rounded-xl bg-white px-4 py-2 font-semibold text-green-600 shadow-sm">
            Total: {formatMoney(total)}
          </span>
        }
      />
      <PaymentsTable data={data} loading={isLoading} showParent />
    </div>
  );
}
