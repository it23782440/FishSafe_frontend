'use client';
import HistoryChart from './HistoryChart';

/* pH line chart from a species-history series (real MongoDB readings). */
export default function PHChart({ series = [], thresholds, long }) {
  const data = series.map((p) => ({ timestamp: p.timestamp, value: p.ph, status: p.phStatus }));
  return <HistoryChart sensorKey="ph" data={data} thresholds={thresholds} long={long} />;
}
