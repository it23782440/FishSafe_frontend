'use client';
import HistoryChart from './HistoryChart';

/* Temperature line chart from a species-history series (real MongoDB readings). */
export default function TemperatureChart({ series = [], thresholds, long }) {
  const data = series.map((p) => ({ timestamp: p.timestamp, value: p.temperature, status: p.temperatureStatus }));
  return <HistoryChart sensorKey="temperature" data={data} thresholds={thresholds} long={long} />;
}
