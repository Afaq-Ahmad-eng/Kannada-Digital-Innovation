import { Mic, Square, Volume2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Button, Chip, inputClass } from '../../../components/ui';
import { errorMessage } from '../../../services/http';
import { useRecorder } from '../hooks/useRecorder';
import { useSpeak } from '../hooks/useSpeak';
import { cultureApi, Translation } from '../services/cultureApi';

const SITUATIONS = [
  { label: 'Auto-rickshaw', value: 'negotiating an auto-rickshaw fare' },
  { label: 'Restaurant', value: 'ordering food at a restaurant' },
  { label: 'Market', value: 'shopping at a local market' },
  { label: 'Directions', value: 'asking for directions' },
  { label: 'Temple', value: 'visiting a temple' },
];
const DIRECTIONS = [
  { id: 'auto', label: 'Auto-detect' },
  { id: 'en', label: 'I speak English' },
  { id: 'kn', label: 'They speak Kannada' },
] as const;

/** Two-way English/Kannada interpreter: record or type, read the translation, hear it spoken. */
export function VoiceAssistant() {
  const { supported, recording, error: micError, start, stop } = useRecorder();
  const speak = useSpeak();
  const [direction, setDirection] = useState<(typeof DIRECTIONS)[number]['id']>('auto');
  const [situation, setSituation] = useState(SITUATIONS[0].value);
  const [text, setText] = useState('');
  const [result, setResult] = useState<Translation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(input: { audio?: Blob; text?: string }) {
    setBusy(true);
    setError(null);
    try {
      const r = await cultureApi.translate({ ...input, sourceLang: direction, context: situation });
      setResult(r);
      void speak(r);
    } catch (e) {
      setError(errorMessage(e, 'We could not translate that. Please try again.'));
    } finally {
      setBusy(false);
    }
  }

  async function toggleRecording() {
    if (!recording) return start();
    const blob = await stop();
    if (blob && blob.size > 0) await run({ audio: blob });
  }

  function submitText(e: FormEvent) {
    e.preventDefault();
    if (text.trim()) void run({ text: text.trim() });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Who is speaking">
        {DIRECTIONS.map((d) => <Chip key={d.id} selected={direction === d.id} onClick={() => setDirection(d.id)}>{d.label}</Chip>)}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Situation">
        {SITUATIONS.map((s) => <Chip key={s.value} selected={situation === s.value} onClick={() => setSituation(s.value)}>{s.label}</Chip>)}
      </div>

      {supported && (
        <div className="flex flex-col items-center gap-2 py-2">
          <button type="button" onClick={toggleRecording} disabled={busy} aria-label={recording ? 'Stop recording' : 'Start recording'}
            className={`grid h-20 w-20 place-items-center rounded-full text-white shadow-lg transition-colors disabled:opacity-50 ${recording ? 'bg-alert-500 motion-safe:animate-pulse' : 'bg-ghats-600 hover:bg-ghats-700'}`}>
            {recording ? <Square className="h-7 w-7" /> : <Mic className="h-8 w-8" />}
          </button>
          <p className="text-sm text-slate-600" aria-live="polite">{recording ? 'Listening... tap to stop' : busy ? 'Translating...' : 'Tap and speak'}</p>
        </div>
      )}
      {micError && <p className="text-sm text-alert-600" role="alert">{micError}</p>}

      <form onSubmit={submitText} className="flex gap-2">
        <input className={inputClass} value={text} onChange={(e) => setText(e.target.value)} placeholder="Or type here, in English or Kannada" maxLength={500} aria-label="Text to translate" />
        <Button type="submit" variant="secondary" loading={busy && !recording}>Translate</Button>
      </form>
      {error && <p className="rounded-lg bg-alert-50 px-3 py-2 text-sm text-alert-600" role="alert">{error}</p>}

      {result && (
        <div className="space-y-2 rounded-xl border border-ghats-200 bg-ghats-50 p-4">
          <p className="text-sm text-slate-600">Heard: “{result.transcript}”</p>
          <p className="font-display text-2xl font-bold leading-snug text-ghats-800">{result.translation}</p>
          {result.phonetic && <p className="text-base text-slate-700">Say it like: <span className="font-semibold">{result.phonetic}</span></p>}
          {result.notes && <p className="text-sm text-slate-600">{result.notes}</p>}
          <Button variant="ghost" onClick={() => void speak(result)}><Volume2 className="h-4 w-4" aria-hidden />Play again</Button>
        </div>
      )}
    </div>
  );
}
