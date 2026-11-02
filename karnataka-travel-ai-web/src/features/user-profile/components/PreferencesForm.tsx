import { FormEvent, useState } from 'react';
import { Button, Chip, Field, inputClass } from '../../../components/ui';
import { errorMessage } from '../../../services/http';
import { titleCase } from '../../../utils/format';
import type { BudgetTier, Dietary, TravelPace } from '../../itinerary-planner/types';
import type { Preferences } from '../types';

const DIETS: Dietary[] = ['NONE', 'VEGETARIAN', 'SATTVIC', 'JAIN', 'HALAL', 'COASTAL_VEGETARIAN', 'NON_VEGETARIAN'];

export function PreferencesForm({ initial, onSave }: { initial: Preferences; onSave: (p: Preferences) => Promise<void> }) {
  const [p, setP] = useState<Preferences>(initial);
  const [needs, setNeeds] = useState(initial.accessibility.join(', '));
  const [state, setState] = useState<{ busy: boolean; msg?: string; error?: string }>({ busy: false });
  const patch = (x: Partial<Preferences>) => setP((v) => ({ ...v, ...x }));
  const toggleChannel = (c: 'WHATSAPP' | 'EMAIL') => {
    const next = p.contactChannels.includes(c) ? p.contactChannels.filter((x) => x !== c) : [...p.contactChannels, c];
    if (next.length) patch({ contactChannels: next });
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setState({ busy: true });
    try {
      await onSave({ ...p, homeCity: p.homeCity || null, accessibility: needs.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 10) });
      setState({ busy: false, msg: 'Preferences saved.' });
    } catch (err) {
      setState({ busy: false, error: errorMessage(err, 'We could not save your preferences.') });
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Send trip alerts by</legend>
        <div className="flex gap-2"><Chip selected={p.contactChannels.includes('EMAIL')} onClick={() => toggleChannel('EMAIL')}>Email</Chip><Chip selected={p.contactChannels.includes('WHATSAPP')} onClick={() => toggleChannel('WHATSAPP')}>WhatsApp</Chip></div>
        <p className="mt-1 text-xs text-slate-500">WhatsApp needs a phone number on your account.</p>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Travel pace">
          <select className={inputClass} value={p.travelPace} onChange={(e) => patch({ travelPace: e.target.value as TravelPace })}><option value="RELAXED">Relaxed</option><option value="BALANCED">Balanced</option><option value="FAST">Fast-paced</option></select>
        </Field>
        <Field label="Usual budget">
          <select className={inputClass} value={p.defaultBudgetTier} onChange={(e) => patch({ defaultBudgetTier: e.target.value as BudgetTier })}><option value="BACKPACKER">Backpacker</option><option value="MODERATE">Moderate</option><option value="LUXURY">Luxury</option></select>
        </Field>
        <Field label="Food">
          <select className={inputClass} value={p.dietary} onChange={(e) => patch({ dietary: e.target.value as Dietary })}>{DIETS.map((d) => <option key={d} value={d}>{d === 'NONE' ? 'No restrictions' : titleCase(d)}</option>)}</select>
        </Field>
        <Field label="Home city"><input className={inputClass} value={p.homeCity ?? ''} onChange={(e) => patch({ homeCity: e.target.value })} maxLength={80} /></Field>
        <Field label="App language">
          <select className={inputClass} value={p.preferredLanguage} onChange={(e) => patch({ preferredLanguage: e.target.value as 'en' | 'kn' })}><option value="en">English</option><option value="kn">ಕನ್ನಡ (Kannada)</option></select>
        </Field>
      </div>
      <Field label="Accessibility needs" hint="Separate with commas, e.g. wheelchair access, limited stairs"><input className={inputClass} value={needs} onChange={(e) => setNeeds(e.target.value)} /></Field>
      {state.error && <p className="rounded-lg bg-alert-50 px-3 py-2 text-sm text-alert-600" role="alert">{state.error}</p>}
      {state.msg && <p className="text-sm font-medium text-ghats-700" role="status">{state.msg}</p>}
      <Button type="submit" loading={state.busy}>Save changes</Button>
    </form>
  );
}
