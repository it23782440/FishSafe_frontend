'use client';
import { useMemo, useState } from 'react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import AlertsPanel from '@/components/AlertsPanel';
import { EmptyState, ErrorState, Skeleton } from '@/components/Loading';
import HistoryChart from '@/components/HistoryChart';
import TimeRangeSelector from '@/components/TimeRangeSelector';
import { endpoints, DEVICE_ID } from '@/lib/api';
import { formatValue, SENSOR_KEYS, SENSORS } from '@/lib/sensorMeta';
import { useLiveData } from '@/lib/useLiveData';

const RANGE_LABELS = {
  '1h': 'Last hour',
  '6h': 'Last 6 hours',
  '24h': 'Last 24 hours',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
};

const STATUS_COLORS = {
  SAFE: '#16a34a',
  WARNING: '#d97706',
  DANGER: '#dc2626',
  UNKNOWN: '#94a3b8',
};

const SAFE_BANDS = {
  temperature: { low: 25, high: 32 },
  ph: { low: 6.5, high: 8.5 },
  turbidity: null,
  rain: null,
  conductivity: { low: 100, high: 800 },
};

const STATUS_KEYS = ['SAFE', 'WARNING', 'DANGER', 'UNKNOWN'];

export default function ReportsPage() {
  const [range, setRange] = useState('24h');
  const [selectedSensor, setSelectedSensor] = useState(SENSOR_KEYS[0]);
  const readingsResult = useLiveData(
    endpoints.history(range, DEVICE_ID, 5000),
    { interval: 30000 }
  );
  const alertsResult = useLiveData(
    endpoints.alerts({ range, limit: '1000' }),
    { interval: 30000 }
  );

  const readings = Array.isArray(readingsResult.data) ? readingsResult.data : [];
  const alerts = alertsResult.data?.alerts || [];

  const overallCounts = useMemo(() => {
    const counts = Object.fromEntries(STATUS_KEYS.map((status) => [status, 0]));
    readings.forEach((reading) => {
      const status = STATUS_KEYS.includes(reading.overallStatus)
        ? reading.overallStatus
        : 'UNKNOWN';
      counts[status] += 1;
    });
    return counts;
  }, [readings]);

  const sensorStats = useMemo(
    () =>
      SENSOR_KEYS.map((key) => {
        const values = readings
          .map((reading) => reading[key])
          .filter((value) => value !== null && value !== undefined && value !== '')
          .map(Number)
          .filter(Number.isFinite);
        const statuses = Object.fromEntries(
          STATUS_KEYS.map((status) => [status, 0])
        );
        readings.forEach((reading) => {
          const status = reading.statuses?.[key];
          statuses[STATUS_KEYS.includes(status) ? status : 'UNKNOWN'] += 1;
        });

        return {
          key,
          values,
          statuses,
          average: values.length
            ? values.reduce((sum, value) => sum + value, 0) / values.length
            : null,
          minimum: values.length ? Math.min(...values) : null,
          maximum: values.length ? Math.max(...values) : null,
          safePercent: values.length
            ? Math.round((statuses.SAFE / values.length) * 100)
            : null,
        };
      }),
    [readings]
  );

  if (readingsResult.error) {
    return <ErrorState message={readingsResult.error.message} />;
  }
  if (alertsResult.error) {
    return <ErrorState message={alertsResult.error.message} />;
  }
  if (
    (readingsResult.isLoading && !readingsResult.data) ||
    (alertsResult.isLoading && !alertsResult.data)
  ) {
    return <Skeleton className="h-[32rem] rounded-2xl" />;
  }

  const sensor = SENSORS[selectedSensor];
  const selectedSeries = readings
    .filter(
      (reading) =>
        reading[selectedSensor] !== null &&
        reading[selectedSensor] !== undefined &&
        reading[selectedSensor] !== '' &&
        Number.isFinite(Number(reading[selectedSensor]))
    )
    .map((reading) => ({
      timestamp: reading.timestamp,
      value: Number(reading[selectedSensor]),
    }));
  const statusData = STATUS_KEYS.map((status) => ({
    name: status,
    count: overallCounts[status],
  })).filter((item) => item.count > 0);
  const alertCounts = alerts.reduce(
    (counts, alert) => {
      if (alert.severity === 'DANGER') counts.DANGER += 1;
      if (alert.severity === 'WARNING') counts.WARNING += 1;
      return counts;
    },
    { DANGER: 0, WARNING: 0 }
  );
  const overallSafePercent = readings.length
    ? Math.round((overallCounts.SAFE / readings.length) * 100)
    : 0;

  function downloadCsv() {
    const csvRows = [
      ['FishSafe Water Quality Report'],
      ['Device', DEVICE_ID],
      ['Period', RANGE_LABELS[range]],
      ['Generated at', new Date().toLocaleString()],
      ['Reading cycles', readings.length],
      ['Alerts', alerts.length],
      [],
      [
        'Reading timestamp',
        ...SENSOR_KEYS.flatMap((key) => [
          `${SENSORS[key].label} (${SENSORS[key].unit || 'no unit'})`,
          `${SENSORS[key].label} status`,
        ]),
        'Overall status',
        'Signal (%)',
      ],
      ...readings.map((reading) => [
        reading.timestamp ? new Date(reading.timestamp).toISOString() : '',
        ...SENSOR_KEYS.flatMap((key) => [
          reading[key] ?? '',
          reading.statuses?.[key] || 'UNKNOWN',
        ]),
        reading.overallStatus || 'UNKNOWN',
        reading.signal ?? '',
      ]),
      [],
      ['Alert history'],
      [
        'Created at',
        'Sensor',
        'Severity',
        'Value',
        'Previous value',
        'Threshold',
        'Active',
        'Message',
      ],
      ...alerts.map((alert) => [
        alert.createdAt ? new Date(alert.createdAt).toISOString() : '',
        SENSORS[alert.sensor]?.label || alert.sensor,
        alert.severity,
        alert.value ?? '',
        alert.previousValue ?? '',
        alert.threshold || '',
        alert.active ? 'Yes' : 'No',
        alert.message || '',
      ]),
    ];
    const csv = csvRows
      .map((row) =>
        row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')
      )
      .join('\r\n');
    const file = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fishsafe-report-${range}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="report-page space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Water Quality Reports</h1>
          <p className="text-sm text-slate-500">
            Reading trends, sensor performance, and alert history for{' '}
            <span className="font-mono">{DEVICE_ID}</span>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <button
            onClick={downloadCsv}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Download CSV
          </button>
          <button
            onClick={() => window.print()}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            Print report
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Reporting period
          </p>
          <p className="text-sm font-medium text-ink">{RANGE_LABELS[range]}</p>
        </div>
        <div className="print:hidden">
          <TimeRangeSelector value={range} onChange={setRange} />
        </div>
      </div>

      {(readings.length === 5000 || alerts.length === 1000) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {readings.length === 5000 && alerts.length === 1000
            ? 'This report reached the API retrieval limits of 5,000 readings and 1,000 alerts.'
            : readings.length === 5000
              ? 'This report reached the API retrieval limit of 5,000 readings.'
              : 'This report reached the API retrieval limit of 1,000 alerts.'}{' '}
          Statistics and exports include the records returned and may not cover the full period.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard label="Readings included" value={readings.length} detail="In selected period" />
        <SummaryCard
          label="Overall safe readings"
          value={`${overallSafePercent}%`}
          detail={`${overallCounts.SAFE} of ${readings.length} cycles`}
          valueClass="text-green-700"
        />
        <SummaryCard
          label="Alerts"
          value={alerts.length}
          detail={`${alertCounts.DANGER} danger · ${alertCounts.WARNING} warning`}
          valueClass={alerts.length ? 'text-amber-700' : 'text-green-700'}
        />
        <SummaryCard
          label="Latest reading"
          value={
            readings.length
              ? new Date(readings[readings.length - 1].timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'
          }
          detail={
            readings.length
              ? new Date(readings[readings.length - 1].timestamp).toLocaleDateString()
              : 'No readings in period'
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-ink">Sensor trend</h2>
              <p className="text-xs text-slate-500">
                Historical values in the selected reporting period.
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600 print:hidden">
              Sensor
              <select
                value={selectedSensor}
                onChange={(event) => setSelectedSensor(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink"
              >
                {SENSOR_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {SENSORS[key].label}
                  </option>
                ))}
              </select>
            </label>
            <p className="hidden text-sm font-medium text-ink print:block">{sensor.label}</p>
          </div>
          {selectedSeries.length ? (
            <HistoryChart
              sensorKey={selectedSensor}
              data={selectedSeries}
              band={SAFE_BANDS[selectedSensor]}
            />
          ) : (
            <EmptyState message="No sensor readings are available in this period." />
          )}
        </section>

        <section className="card">
          <h2 className="font-semibold text-ink">Overall status distribution</h2>
          <p className="text-xs text-slate-500">
            Status for each reading cycle in this period.
          </p>
          {statusData.length ? (
            <>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="count"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={78}
                      paddingAngle={2}
                    >
                      {statusData.map((item) => (
                        <Cell key={item.name} fill={STATUS_COLORS[item.name]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {statusData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[item.name] }}
                      />
                      {item.name}
                    </span>
                    <span className="font-semibold tabular-nums text-ink">{item.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState message="No status data is available in this period." />
          )}
        </section>
      </div>

      <section className="card">
        <div className="mb-4">
          <h2 className="font-semibold text-ink">Sensor performance</h2>
          <p className="text-xs text-slate-500">
            Summary statistics use available numeric readings; safe percentage is calculated
            from readings with a value.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <th className="py-3 pr-4 font-medium">Sensor</th>
                <th className="py-3 px-3 font-medium">Safe range</th>
                <th className="py-3 px-3 font-medium">Average</th>
                <th className="py-3 px-3 font-medium">Minimum</th>
                <th className="py-3 px-3 font-medium">Maximum</th>
                <th className="py-3 px-3 font-medium">Safe</th>
                <th className="py-3 px-3 font-medium">Warning</th>
                <th className="py-3 px-3 font-medium">Danger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sensorStats.map((stats) => {
                const meta = SENSORS[stats.key];
                return (
                  <tr key={stats.key}>
                    <th className="py-3 pr-4 font-medium text-ink">
                      <span className="mr-2">{meta.icon}</span>
                      {meta.label}
                    </th>
                    <td className="px-3 py-3 text-slate-500">{meta.safe}</td>
                    <td className="px-3 py-3 tabular-nums text-ink">
                      {formatValue(stats.key, stats.average)}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-ink">
                      {formatValue(stats.key, stats.minimum)}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-ink">
                      {formatValue(stats.key, stats.maximum)}
                    </td>
                    <td className="px-3 py-3 font-medium text-green-700">
                      {stats.statuses.SAFE}
                      {stats.safePercent !== null && (
                        <span className="ml-1 text-xs text-slate-400">
                          ({stats.safePercent}%)
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 font-medium text-amber-700">
                      {stats.statuses.WARNING}
                    </td>
                    <td className="px-3 py-3 font-medium text-red-700">
                      {stats.statuses.DANGER}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-ink">Alert history</h2>
            <p className="text-xs text-slate-500">
              Alerts created during {RANGE_LABELS[range].toLowerCase()}.
            </p>
          </div>
          <a href="/alerts" className="text-sm text-sky-600 hover:underline print:hidden">
            Open alerts →
          </a>
        </div>
        <AlertsPanel
          alerts={alerts.slice(0, 6)}
          emptyText="No alerts were recorded during this reporting period."
        />
      </section>

      <p className="text-right text-xs text-slate-400">
        Generated {new Date().toLocaleString()} · Data refreshes every 30 seconds ·
        API limits: 5,000 readings and 1,000 alerts per report.
      </p>
    </div>
  );
}

function SummaryCard({ label, value, detail, valueClass = 'text-ink' }) {
  return (
    <div className="card">
      <p className="card-title">{label}</p>
      <p className={`mt-2 text-3xl font-bold tabular-nums ${valueClass}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-400">{detail}</p>
    </div>
  );
}
