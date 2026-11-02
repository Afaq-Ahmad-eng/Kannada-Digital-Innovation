import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui';
import { errorMessage } from '../../../services/http';
import { useLiveStore } from '../../../store/live';
import { alertsApi } from '../services/alertsApi';
import { useInitialAdvisories } from '../hooks/useAdvisories';

/** Live advisory ribbon: weather, road and bandh alerts with one-click acceptance of the suggested alternative. */
export function AdvisoryRibbon() {
  useInitialAdvisories();
  const advisories = useLiveStore((s) => s.advisories);
  const proposals = useLiveStore((s) => s.proposals);
  const dismissAdvisory = useLiveStore((s) => s.dismissAdvisory);
  const removeProposal = useLiveStore((s) => s.removeProposal);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (advisories.length === 0) return null;
  const a = advisories[0];
  const proposal = proposals.find((p) => p.tripId === a.tripId);

  async function act(action: 'ACCEPT' | 'DISMISS') {
    if (!proposal) return;
    setBusy(action);
    setError(null);
    try {
      await alertsApi.modify(proposal.tripId, proposal.proposalId, action);
      removeProposal(proposal.proposalId);
      if (action === 'DISMISS') dismissAdvisory(a.id);
    } catch (e) {
      setError(errorMessage(e, 'Could not update the plan.'));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div role="alert" className="border-b border-alert-500/30 bg-alert-50">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 text-sm">
        <AlertTriangle className="h-5 w-5 shrink-0 text-alert-500" aria-hidden />
        <p className="min-w-0 flex-1 basis-64">
          <strong className="font-semibold text-alert-600">{a.headline}</strong> <span className="text-slate-700">in {a.region}.</span>{' '}
          {proposal ? <span className="text-slate-700">{proposal.summary}</span> : <span className="text-slate-700">{a.details}</span>}
          {advisories.length > 1 && <span className="ml-2 text-slate-500">+{advisories.length - 1} more</span>}
          {error && <span className="ml-2 text-alert-600">{error}</span>}
        </p>
        <div className="flex items-center gap-2">
          {proposal && <Button variant="secondary" className="min-h-[36px] px-3 py-1" loading={busy === 'ACCEPT'} onClick={() => act('ACCEPT')}>Use this plan</Button>}
          {proposal && <Button variant="ghost" className="min-h-[36px] px-3 py-1" loading={busy === 'DISMISS'} onClick={() => act('DISMISS')}>Keep original</Button>}
          <Link className="font-semibold text-ghats-700 underline" to={`/trips/${a.tripId}`}>View trip</Link>
          <button type="button" aria-label="Hide this alert" onClick={() => dismissAdvisory(a.id)} className="grid h-9 w-9 place-items-center rounded-md hover:bg-alert-500/10"><X className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}
