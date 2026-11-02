import { Search } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Button, Card, Chip, inputClass } from '../../../components/ui';
import { errorMessage } from '../../../services/http';
import { cultureApi, Guide, GuideTopic } from '../services/cultureApi';

const TOPICS: { id: GuideTopic | undefined; label: string }[] = [
  { id: undefined, label: 'Anything' }, { id: 'TEMPLE', label: 'Temples' }, { id: 'FOOD', label: 'Food' },
  { id: 'PHRASES', label: 'Kannada phrases' }, { id: 'ETIQUETTE', label: 'Etiquette' }, { id: 'TRANSPORT', label: 'Getting around' },
];
const EXAMPLES = ['What should I wear at Chamundeshwari Temple?', 'How do I spot authentic Mysore Pak?', 'What is Mangaluru seafood etiquette?', 'Phrases for an auto-rickshaw ride'];

export function CultureGuide() {
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState<GuideTopic | undefined>();
  const [guide, setGuide] = useState<Guide | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(q: string) {
    if (q.trim().length < 3) return;
    setBusy(true);
    setError(null);
    try {
      setGuide(await cultureApi.guide(q.trim(), topic));
    } catch (e) {
      setError(errorMessage(e, 'We could not look that up right now.'));
    } finally {
      setBusy(false);
    }
  }
  const submit = (e: FormEvent) => { e.preventDefault(); void ask(query); };

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="flex gap-2">
        <input className={inputClass} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ask about temples, food, phrases, manners" maxLength={300} aria-label="Ask the cultural guide" />
        <Button type="submit" loading={busy}><Search className="h-4 w-4" aria-hidden />Ask</Button>
      </form>
      <div className="flex flex-wrap gap-2">{TOPICS.map((t) => <Chip key={t.label} selected={topic === t.id} onClick={() => setTopic(t.id)}>{t.label}</Chip>)}</div>
      {!guide && <div className="flex flex-wrap gap-2 text-sm">{EXAMPLES.map((ex) => <button key={ex} type="button" className="rounded-lg bg-sandal-100 px-3 py-2 text-left text-slate-700 hover:bg-sandal-200" onClick={() => { setQuery(ex); void ask(ex); }}>{ex}</button>)}</div>}
      {error && <p className="rounded-lg bg-alert-50 px-3 py-2 text-sm text-alert-600" role="alert">{error}</p>}
      {guide && (
        <Card className="space-y-4">
          <p className="text-base leading-relaxed">{guide.answer}</p>
          {guide.mode === 'RETRIEVAL_ONLY' && <p className="text-xs text-slate-500">Showing the closest saved guidance. Connect an AI key on the server for tailored answers.</p>}
          {guide.etiquetteTips.length > 0 && (
            <div><h3 className="font-display text-lg font-bold">Good to know</h3><ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">{guide.etiquetteTips.map((t, i) => <li key={i}>{t}</li>)}</ul></div>
          )}
          {guide.phrases.length > 0 && (
            <div>
              <h3 className="font-display text-lg font-bold">Useful phrases</h3>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {guide.phrases.map((p, i) => (
                  <li key={i} className="rounded-lg bg-sandal-50 p-3"><p className="text-lg font-semibold">{p.kannada}</p><p className="text-sm text-ghats-700">{p.phonetic}</p><p className="text-sm text-slate-600">{p.english}</p></li>
                ))}
              </ul>
            </div>
          )}
          {guide.sources.length > 0 && <p className="text-xs text-slate-500">Based on: {guide.sources.map((s) => s.title).join(' · ')}</p>}
        </Card>
      )}
    </div>
  );
}
