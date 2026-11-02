import { useCallback } from 'react';
import type { Translation } from '../services/cultureApi';

/** Plays synthesized audio from the server, or falls back to the browser's speech synthesis. */
export function useSpeak() {
  return useCallback(async (t: Pick<Translation, 'audio' | 'translation' | 'targetLang'>) => {
    if (t.audio) {
      await new Audio(`data:${t.audio.mimeType};base64,${t.audio.audioBase64}`).play().catch(() => undefined);
      return;
    }
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(t.translation);
      u.lang = t.targetLang === 'kn' ? 'kn-IN' : 'en-IN';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    }
  }, []);
}
