/** Offline fallback used only when Gemini is not configured. */
const PAIRS: { en: string; kn: string; phonetic: string }[] = [
  { en: 'hello', kn: 'ನಮಸ್ಕಾರ', phonetic: 'na-mas-KAA-ra' },
  { en: 'thank you', kn: 'ಧನ್ಯವಾದಗಳು', phonetic: 'dhan-ya-VAA-da-ga-lu' },
  { en: 'how much', kn: 'ಇದು ಎಷ್ಟು?', phonetic: 'i-du ESH-tu' },
  { en: 'use the meter', kn: 'ಮೀಟರ್ ಹಾಕಿ', phonetic: 'ME-ter HAA-ki' },
  { en: 'stop here', kn: 'ಇಲ್ಲಿ ನಿಲ್ಲಿಸಿ', phonetic: 'IL-li nil-LI-si' },
  { en: 'water', kn: 'ನೀರು ಬೇಕು', phonetic: 'NEE-ru BE-ku' },
  { en: 'yes', kn: 'ಹೌದು', phonetic: 'HOW-du' },
  { en: 'no', kn: 'ಇಲ್ಲ', phonetic: 'IL-la' },
  { en: 'reduce', kn: 'ಸ್ವಲ್ಪ ಕಡಿಮೆ ಮಾಡಿ', phonetic: 'SWAL-pa ka-DI-me MAA-di' },
];

export function phrasebookLookup(text: string) {
  const t = text.toLowerCase();
  return PAIRS.find((p) => t.includes(p.en) || text.includes(p.kn)) ?? null;
}
