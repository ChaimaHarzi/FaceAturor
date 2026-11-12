import dayjs from 'dayjs';
import type { MonthlyValue } from '@/types/models';

/** Small dependency-free monthly bar chart. */
export default function BarChart({
  data,
  format = (v) => String(v),
  color = '#4f46e5',
}: {
  data?: MonthlyValue[];
  format?: (value: number) => string;
  color?: string;
}) {
  const max = Math.max(1, ...(data ?? []).map((d) => d.value));
  return (
    <div
      className="flex h-44 items-end gap-3"
      role="img"
      aria-label="Monthly chart"
    >
      {(data ?? []).map((d) => (
        <div
          key={d.month}
          className="flex h-full flex-1 flex-col items-center justify-end gap-1"
        >
          <span className="text-xs text-gray-500">
            {d.value ? format(d.value) : ''}
          </span>
          <div
            className="w-full max-w-[42px] rounded-t-md transition-all"
            style={{
              height: `${Math.max(3, (d.value / max) * 100)}%`,
              background: d.value ? color : '#e5e7eb',
            }}
            title={`${dayjs(`${d.month}-01`).format('MMMM YYYY')}: ${format(d.value)}`}
          />
          <span className="text-xs text-gray-400">
            {dayjs(`${d.month}-01`).format('MMM')}
          </span>
        </div>
      ))}
    </div>
  );
}
