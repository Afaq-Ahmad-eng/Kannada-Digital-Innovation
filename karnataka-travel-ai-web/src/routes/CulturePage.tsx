import { CultureGuide } from '../features/culture-assistant/components/CultureGuide';

export default function CulturePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Know before you go</h1>
      <p className="mb-6 mt-2 text-slate-600">Temple dress, local food, manners and a few words of Kannada. For live conversations, tap the translate button at the bottom right.</p>
      <CultureGuide />
    </div>
  );
}
