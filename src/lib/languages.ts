export const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
  { code: "hi", name: "Hindi" },
  { code: "ar", name: "Arabic" },
  { code: "ru", name: "Russian" },
  { code: "sv", name: "Swedish" },
  { code: "nl", name: "Dutch" },
  { code: "no", name: "Norwegian" },
  { code: "da", name: "Danish" },
  { code: "fi", name: "Finnish" },
  { code: "pl", name: "Polish" },
  { code: "tr", name: "Turkish" },
  { code: "th", name: "Thai" },
  { code: "vi", name: "Vietnamese" },
  { code: "el", name: "Greek" },
  { code: "cs", name: "Czech" },
  { code: "ro", name: "Romanian" },
  { code: "hu", name: "Hungarian" },
  { code: "uk", name: "Ukrainian" },
  { code: "he", name: "Hebrew" },
  { code: "id", name: "Indonesian" },
  { code: "ms", name: "Malay" },
  { code: "tl", name: "Filipino" },
  { code: "te", name: "Telugu" },
] as const;

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English", te: "Telugu", hi: "Hindi", ja: "Japanese",
  ko: "Korean", zh: "Chinese", fr: "French", de: "German",
  es: "Spanish", pt: "Portuguese", ru: "Russian", it: "Italian",
  ta: "Tamil", kn: "Kannada", ml: "Malayalam", bn: "Bengali",
  mr: "Marathi", pa: "Punjabi", gu: "Gujarati", ur: "Urdu",
  ar: "Arabic", tr: "Turkish", vi: "Vietnamese", th: "Thai",
  nl: "Dutch", pl: "Polish", sv: "Swedish", da: "Danish",
  fi: "Finnish", no: "Norwegian", cs: "Czech", el: "Greek",
  ro: "Romanian", hu: "Hungarian", uk: "Ukrainian", he: "Hebrew",
  id: "Indonesian", ms: "Malay", tl: "Filipino",
};

export function languageName(code: string | null | undefined): string | null | undefined {
  if (!code) return code;
  return LANGUAGE_NAMES[code] ?? code;
}
