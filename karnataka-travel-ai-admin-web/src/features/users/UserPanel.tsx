import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Badge, Button, Drawer, ErrorNote, Field, inputClass, Spinner, statusTone } from '../../components/ui';
import { errorMessage } from '../../services/http';
import { formatDateTime, titleCase } from '../../utils/format';
import { operationsApi } from '../operations/operationsApi';
import { AdminUser, usersApi, UserTrip } from './usersApi';

export function UserPanel({ userId, onClose, onChanged }: { userId: string | null; onClose: () => void; onChanged: () => void }) {
  const [data, setData] = useState<{ user: AdminUser; trips: UserTrip[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState({ subject: '', message: '' });
  const [noteState, setNoteState] = useState<{ busy: boolean; msg?: string; error?: string }>({ busy: false });

  const load = useCallback(async () => {
    if (!userId) return;
    try { setData(await usersApi.get(userId)); setError(null); } catch (e) { setError(errorMessage(e)); }
  }, [userId]);
  useEffect(() => { setData(null); setReason(''); setNoteState({ busy: false }); void load(); }, [load]);

  async function toggle(e?: FormEvent) {
    e?.preventDefault();
    if (!data) return;
    setBusy(true);
    setError(null);
    try {
      if (data.user.disabled) await usersApi.reactivate(data.user.id);
      else await usersApi.suspend(data.user.id, reason);
      setReason('');
      await load();
      onChanged();
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }

  async function notify(e: FormEvent) {
    e.preventDefault();
    if (!data) return;
    setNoteState({ busy: true });
    try {
      const r = await operationsApi.notify({ userId: data.user.id, subject: note.subject, message: note.message });
      const summary = r.results.map((x) => `${x.channel}: ${x.status.toLowerCase()}${x.detail ? ` (${x.detail})` : ''}`).join(', ');
      setNoteState({ busy: false, msg: summary || 'Sent.' });
      setNote({ subject: '', message: '' });
    } catch (err) { setNoteState({ busy: false, error: errorMessage(err) }); }
  }

  const u = data?.user;
  return (
    <Drawer open={!!userId} title={u?.fullName ?? u?.email ?? 'User'} onClose={onClose}>
      {error && <ErrorNote message={error} />}
      {!data && !error && <Spinner />}
      {u && data && (
        <div className="space-y-6">
          <dl className="grid grid-cols-[110px_1fr] gap-y-1.5 text-sm">
            <dt className="text-slate-500">Email</dt><dd className="break-all">{u.email}</dd>
            <dt className="text-slate-500">Phone</dt><dd>{u.phone ?? '-'}</dd>
            <dt className="text-slate-500">Registered</dt><dd>{formatDateTime(u.registeredAt)}</dd>
            <dt className="text-slate-500">Status</dt><dd><Badge tone={u.disabled ? 'bad' : 'good'}>{u.disabled ? 'Suspended' : 'Active'}</Badge></dd>
            {u.disabled && <><dt className="text-slate-500">Reason</dt><dd>{u.disabledReason}<span className="block text-xs text-slate-500">{formatDateTime(u.disabledAt)}</span></dd></>}
          </dl>

          <form onSubmit={toggle} className="space-y-2 rounded-xl border border-slate-200 p-3">
            <h3 className="font-display text-base font-bold">{u.disabled ? 'Reactivate account' : 'Suspend account'}</h3>
            {!u.disabled && (<>
              <p className="text-xs text-slate-500">Blocks sign-in, ends all sessions and rejects the traveller's current access token within seconds. The reason is saved in the audit log.</p>
              <Field label="Reason"><input className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} minLength={3} maxLength={300} required /></Field>
            </>)}
            <Button type="submit" variant={u.disabled ? 'secondary' : 'danger'} loading={busy}>{u.disabled ? 'Reactivate' : 'Suspend user'}</Button>
          </form>

          <form onSubmit={notify} className="space-y-2 rounded-xl border border-slate-200 p-3">
            <h3 className="font-display text-base font-bold">Send a notification</h3>
            <p className="text-xs text-slate-500">Goes through the traveller's preferred channels (email / WhatsApp).</p>
            <Field label="Subject"><input className={inputClass} value={note.subject} onChange={(e) => setNote({ ...note, subject: e.target.value })} maxLength={200} required /></Field>
            <Field label="Message"><textarea className={inputClass} rows={3} value={note.message} onChange={(e) => setNote({ ...note, message: e.target.value })} maxLength={2000} required /></Field>
            {noteState.error && <ErrorNote message={noteState.error} />}
            {noteState.msg && <p className="text-sm text-ghats-700" role="status">{noteState.msg}</p>}
            <Button type="submit" variant="ghost" loading={noteState.busy}>Send</Button>
          </form>

          <div>
            <h3 className="mb-2 font-display text-base font-bold">Recent trips ({data.trips.length})</h3>
            {data.trips.length === 0 ? <p className="text-sm text-slate-500">No trips yet.</p> : (
              <ul className="divide-y divide-slate-100 text-sm">
                {data.trips.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2 py-2">
                    <span>{t.origin} to {t.destinations.join(', ') || '-'}<span className="block text-xs text-slate-500">{t.startDate} - {t.endDate}</span></span>
                    <Badge tone={statusTone(t.status)}>{titleCase(t.status)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}
