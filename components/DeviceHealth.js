'use client';
import { formatDateTime, timeAgo, useNow } from '@/lib/time';
import { ChipIcon, SignalIcon, SensorIcon, WifiOffIcon, CheckIcon, ClockIcon } from './Icons';

function Tile({ icon: Icon, title, tone = 'ok', value, sub }) {
  const tones = {
    ok: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    bad: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
    warn: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
    off: 'bg-slate-200 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300',
  };
  return (
    <div className="card !p-4">
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}><Icon size={19} /></span>
        <div className="min-w-0">
          <div className="card-title">{title}</div>
          <div className="break-words text-base font-bold leading-tight text-fg">{value}</div>
        </div>
      </div>
      {sub && <p className="mt-2 text-xs text-muted">{sub}</p>}
    </div>
  );
}

const SENSOR_TEXT = {
  ok: ['ok', 'Sending data', 'Included in the latest transmission'],
  no_data: ['bad', 'No data', 'Missing from the latest transmission. Check wiring and calibration.'],
  unknown: ['off', 'Unknown', 'No readings received yet'],
};

/*
 * IoT device health. Online/offline comes from when data LAST ARRIVED, never
 * from old readings. The backend has no dedicated SIM800L status field, so the
 * GSM tile reports the signal strength the device uploads with each reading.
 */
export default function DeviceHealth({ device, events = [] }) {
  const now = useNow(1000);
  if (!device) return null;
  const online = device.online;
  const age = device.secondsSinceLastSeen;
  const limit = device.offlineAfterSeconds || 180;
  const signal = device.lastSignal;
  const t = SENSOR_TEXT[device.sensors?.temperature || 'unknown'];
  const p = SENSOR_TEXT[device.sensors?.ph || 'unknown'];
  const gsm = !online ? ['off', 'No recent contact'] : signal == null ? ['ok', 'Connected'] : signal >= 50 ? ['ok', `Good · ${signal}%`] : signal >= 25 ? ['warn', `Weak · ${signal}%`] : ['bad', `Very weak · ${signal}%`];
  const fresh = age == null ? 0 : Math.min(100, Math.round((age / limit) * 100));

  return (
    <section id="device" aria-label="Device health" className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile icon={online ? ChipIcon : WifiOffIcon} title="ESP32 connectivity" tone={online ? 'ok' : 'warn'} value={online ? 'Online' : 'Offline'}
          sub={device.lastSeen ? `Last heard from ${timeAgo(device.lastSeen, now)}` : 'Never connected'} />
        <Tile icon={ClockIcon} title="Last successful update" tone={online ? 'ok' : 'warn'} value={device.lastSeen ? timeAgo(device.lastSeen, now) : '—'} sub={formatDateTime(device.lastSeen)} />
        <Tile icon={SignalIcon} title="SIM800L / GSM link" tone={gsm[0]} value={gsm[1]} sub={signal == null ? 'Signal strength is not included in the uploads' : 'Signal strength reported by the device with each upload'} />
        <Tile icon={CheckIcon} title="Total readings stored" tone="ok" value={(device.totalReadings ?? 0).toLocaleString()} sub={device.firmware ? `Firmware ${device.firmware}` : undefined} />
        <Tile icon={() => <SensorIcon sensor="temperature" size={19} />} title="Temperature sensor" tone={t[0]} value={t[1]} sub={t[2]} />
        <Tile icon={() => <SensorIcon sensor="ph" size={19} />} title="pH sensor" tone={p[0]} value={p[1]} sub={p[2]} />
        <div className="card !p-4 sm:col-span-2">
          <div className="flex items-center justify-between">
            <div className="card-title">Data freshness</div>
            <div className="text-xs text-muted">Offline after {Math.round(limit / 60)} min without data</div>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={fresh} aria-label="Time since last data as a share of the offline limit">
            <div className={`h-full rounded-full ${fresh < 60 ? 'bg-emerald-500' : fresh < 100 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.max(fresh, 3)}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted">{age == null ? 'No data yet.' : `${age < 90 ? `${age} s` : `${Math.round(age / 60)} min`} since the last transmission.`}</p>
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-fg">Connection problems</h3>
        {events.length === 0 ? (
          <p className="mt-1 text-sm text-muted">No offline periods recorded. (Detailed modem error codes are not reported by the device.)</p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {events.map((e) => (
              <li key={e._id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
                <span className={`inline-flex items-center gap-1 font-semibold ${e.active ? 'text-red-600 dark:text-red-400' : 'text-muted'}`}>{e.active ? 'Offline now' : 'Recovered'}</span>
                <span className="text-muted">{formatDateTime(e.createdAt)}</span>
                <span className="basis-full text-xs text-muted sm:basis-auto">{e.reason}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
