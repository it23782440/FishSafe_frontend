import { redirect } from 'next/navigation';

// Device health now lives on the Live Monitoring page; keep the old URL working.
export default function SystemRedirect() {
  redirect('/live');
}
