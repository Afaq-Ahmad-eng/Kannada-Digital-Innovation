import { AnimatePresence, motion } from 'framer-motion';
import { Languages, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { VoiceAssistant } from './VoiceAssistant';

/** Floating action button that opens the Kannada voice assistant from any screen. */
export function VoiceFab() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Open Kannada voice assistant"
        className="fixed bottom-24 right-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-ochre-600 text-white shadow-lg hover:bg-ochre-700 lg:bottom-8 lg:right-8">
        <Languages className="h-6 w-6" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/40 sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
            <motion.div role="dialog" aria-modal="true" aria-label="Kannada voice assistant" onClick={(e) => e.stopPropagation()}
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 sm:max-w-md sm:rounded-3xl">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-xl font-bold">Talk with locals</h2>
                <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-sandal-100"><X className="h-5 w-5" /></button>
              </div>
              <VoiceAssistant />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
