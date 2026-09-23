/**
 * LANGUAGES CATALOG - Répertoire linguistique universel pour ACE-Step 1.5 & ComfyUI
 * 
 * Contient la totalité des 51 langues natives validées par ACE-Step 1.5 (acestep/constants.py)
 * enrichie des langues régionales africaines & créoles (Lingala, Yoruba, Zulu, Amharique)
 * indispensables pour les genres musicaux comme le Zouk, la Rumba Congolaise et l'Amapiano.
 */

export const LANGUAGE_CATEGORIES = [
  { id: "all", label: "Toutes les langues", icon: "Globe" },
  { id: "popular", label: "Populaires & Monde", icon: "Sparkles" },
  { id: "african_creole", label: "Africaines & Créoles", icon: "Heart" },
  { id: "european", label: "Européennes", icon: "Compass" },
  { id: "asian", label: "Asiatiques & Orient", icon: "Sun" },
  { id: "special", label: "Spécial / Instrumental", icon: "Music" }
];

export const ALL_LANGUAGES = [
  // ── POPULAIRES & MONDE (12 langues majeures) ──
  {
    code: "fr",
    label: "Français",
    nativeName: "Français",
    englishName: "French",
    flag: "🇫🇷",
    group: "popular",
    aceStepNative: true,
    description: "Chanson française, Pop, Variété, Zouk francophone"
  },
  {
    code: "en",
    label: "English",
    nativeName: "English",
    englishName: "English",
    flag: "🇬🇧",
    group: "popular",
    aceStepNative: true,
    description: "Global Pop, Rock, Hip-Hop, R&B, EDM, Jazz"
  },
  {
    code: "es",
    label: "Español",
    nativeName: "Español",
    englishName: "Spanish",
    flag: "🇪🇸",
    group: "popular",
    aceStepNative: true,
    description: "Reggaeton, Flamenco, Bachata, Salsa, Latin Pop"
  },
  {
    code: "pt",
    label: "Português",
    nativeName: "Português",
    englishName: "Portuguese",
    flag: "🇵🇹",
    group: "popular",
    aceStepNative: true,
    description: "Kizomba, Bossa Nova, Samba, Funk Carioca, Fado"
  },
  {
    code: "de",
    label: "Deutsch",
    nativeName: "Deutsch",
    englishName: "German",
    flag: "🇩🇪",
    group: "popular",
    aceStepNative: true,
    description: "Electro, Techno berlinois, Schlager, Neue Deutsche Welle"
  },
  {
    code: "it",
    label: "Italiano",
    nativeName: "Italiano",
    englishName: "Italian",
    flag: "🇮🇹",
    group: "popular",
    aceStepNative: true,
    description: "Italo Disco, Opéra, Canzone napoletana, Pop lyrique"
  },
  {
    code: "ja",
    label: "日本語 (Japanese)",
    nativeName: "日本語",
    englishName: "Japanese",
    flag: "🇯🇵",
    group: "popular",
    aceStepNative: true,
    description: "J-Pop, City Pop, Anime OST, Visual Kei, Vocaloid"
  },
  {
    code: "ko",
    label: "한국어 (Korean)",
    nativeName: "한국어",
    englishName: "Korean",
    flag: "🇰🇷",
    group: "popular",
    aceStepNative: true,
    description: "K-Pop, K-R&B, Trot, K-Indie, K-Hip-Hop"
  },
  {
    code: "zh",
    label: "中文 (Mandarin)",
    nativeName: "中文",
    englishName: "Chinese",
    flag: "🇨🇳",
    group: "popular",
    aceStepNative: true,
    description: "Mandopop, Guofeng, C-Pop, Ballades chinoises"
  },
  {
    code: "ar",
    label: "العربية (Arabic)",
    nativeName: "العربية",
    englishName: "Arabic",
    flag: "🇸🇦",
    group: "popular",
    aceStepNative: true,
    description: "Maqam, Raï, Tarab, Mahraganat, Khaliji, Shaabi"
  },
  {
    code: "hi",
    label: "हिन्दी (Hindi)",
    nativeName: "हिन्दी",
    englishName: "Hindi",
    flag: "🇮🇳",
    group: "popular",
    aceStepNative: true,
    description: "Bollywood, Ghazal, Sufi, Desi Pop, Indian Folk"
  },
  {
    code: "ru",
    label: "Русский (Russian)",
    nativeName: "Русский",
    englishName: "Russian",
    flag: "🇷🇺",
    group: "popular",
    aceStepNative: true,
    description: "Romance russe, Post-punk, Russian Pop, Chanson"
  },

  // ── AFRIQUE & CRÉOLES (Langues régionales & racines culturelles) ──
  {
    code: "ht",
    label: "Kreyòl Ayisyen (Haitian Creole)",
    nativeName: "Kreyòl Ayisyen",
    englishName: "Haitian Creole",
    flag: "🇭🇹",
    group: "african_creole",
    aceStepNative: true, // Officiellement dans VALID_LANGUAGES d'ACE-Step 1.5 !
    description: "Zouk Love, Kompa haïtien, Rabòday, Musique caribéenne"
  },
  {
    code: "ln",
    label: "Lingála (Lingala)",
    nativeName: "Lingála",
    englishName: "Lingala",
    flag: "🇨🇩",
    group: "african_creole",
    aceStepNative: false,
    description: "Rumba Congolaise, Soukous, Sebene, Ndombolo, Mutuashi"
  },
  {
    code: "sw",
    label: "Kiswahili (Swahili)",
    nativeName: "Kiswahili",
    englishName: "Swahili",
    flag: "🇰🇪",
    group: "african_creole",
    aceStepNative: true, // Officiellement dans VALID_LANGUAGES d'ACE-Step 1.5 !
    description: "Bongo Flava, Taarab, Afrobeats est-africain, Benga"
  },
  {
    code: "yo",
    label: "Èdè Yorùbá (Yoruba)",
    nativeName: "Yorùbá",
    englishName: "Yoruba",
    flag: "🇳🇬",
    group: "african_creole",
    aceStepNative: false,
    description: "Afrobeat (Fela), Fuji, Jùjú, Highlife, Gospel nigérian"
  },
  {
    code: "zu",
    label: "isiZulu (Zulu)",
    nativeName: "isiZulu",
    englishName: "Zulu",
    flag: "🇿🇦",
    group: "african_creole",
    aceStepNative: false,
    description: "Amapiano township chants, Maskandi, Isicathamiya, Kwaito"
  },
  {
    code: "am",
    label: "አማርኛ (Amharic)",
    nativeName: "አማርኛ",
    englishName: "Amharic",
    flag: "🇪🇹",
    group: "african_creole",
    aceStepNative: false,
    description: "Ethio-jazz, Tizita, Musique traditionnelle éthiopienne"
  },

  // ── EUROPÉENNES (Toutes les langues ACE-Step 1.5) ──
  {
    code: "nl",
    label: "Nederlands (Dutch)",
    nativeName: "Nederlands",
    englishName: "Dutch",
    flag: "🇳🇱",
    group: "european",
    aceStepNative: true,
    description: "EDM, Hardstyle, Nederpop, Chanson flamande"
  },
  {
    code: "pl",
    label: "Polski (Polish)",
    nativeName: "Polski",
    englishName: "Polish",
    flag: "🇵🇱",
    group: "european",
    aceStepNative: true,
    description: "Disco Polo, Hip-hop polonais, Musique symphonique"
  },
  {
    code: "tr",
    label: "Türkçe (Turkish)",
    nativeName: "Türkçe",
    englishName: "Turkish",
    flag: "🇹🇷",
    group: "european",
    aceStepNative: true,
    description: "Anatolian Rock, Arabesque, Türk Halk Müziği, Turkish Pop"
  },
  {
    code: "sv",
    label: "Svenska (Swedish)",
    nativeName: "Svenska",
    englishName: "Swedish",
    flag: "🇸🇪",
    group: "european",
    aceStepNative: true,
    description: "Scandipop, Melodic Metal, Dansband, Eurodance"
  },
  {
    code: "da",
    label: "Dansk (Danish)",
    nativeName: "Dansk",
    englishName: "Danish",
    flag: "🇩🇰",
    group: "european",
    aceStepNative: true,
    description: "Nordic Pop, Synth-pop danoise, Folk scandinave"
  },
  {
    code: "no",
    label: "Norsk (Norwegian)",
    nativeName: "Norsk",
    englishName: "Norwegian",
    flag: "🇳🇴",
    group: "european",
    aceStepNative: true,
    description: "Black Metal, Nordic Ambient, Pop acoustique norvégienne"
  },
  {
    code: "fi",
    label: "Suomi (Finnish)",
    nativeName: "Suomi",
    englishName: "Finnish",
    flag: "🇫🇮",
    group: "european",
    aceStepNative: true,
    description: "Tango finlandais, Metal symphonique, Iskelmä"
  },
  {
    code: "cs",
    label: "Čeština (Czech)",
    nativeName: "Čeština",
    englishName: "Czech",
    flag: "🇨🇿",
    group: "european",
    aceStepNative: true,
    description: "Polka classique, Folk bohémien, Rock tchèque"
  },
  {
    code: "ro",
    label: "Română (Romanian)",
    nativeName: "Română",
    englishName: "Romanian",
    flag: "🇷🇴",
    group: "european",
    aceStepNative: true,
    description: "Manele, Dance roumaine, Doina folklorique"
  },
  {
    code: "el",
    label: "Ελληνικά (Greek)",
    nativeName: "Ελληνικά",
    englishName: "Greek",
    flag: "🇬🇷",
    group: "european",
    aceStepNative: true,
    description: "Rebetiko, Laïko, Bouzouki, Électro méditerranéenne"
  },
  {
    code: "hu",
    label: "Magyar (Hungarian)",
    nativeName: "Magyar",
    englishName: "Hungarian",
    flag: "🇭🇺",
    group: "european",
    aceStepNative: true,
    description: "Csárdás, Musique tzigane hongroise, Magyar Pop"
  },
  {
    code: "bg",
    label: "Български (Bulgarian)",
    nativeName: "Български",
    englishName: "Bulgarian",
    flag: "🇧🇬",
    group: "european",
    aceStepNative: true,
    description: "Chœurs mystiques bulgares, Chalga, Polyphonies"
  },
  {
    code: "ca",
    label: "Català (Catalan)",
    nativeName: "Català",
    englishName: "Catalan",
    flag: "🇦🇩",
    group: "european",
    aceStepNative: true,
    description: "Nova Cançó, Rumba catalane, Pop-rock catalan"
  },
  {
    code: "hr",
    label: "Hrvatski (Croatian)",
    nativeName: "Hrvatski",
    englishName: "Croatian",
    flag: "🇭🇷",
    group: "european",
    aceStepNative: true,
    description: "Klapa dalmate, Tamburica, Pop adriatique"
  },
  {
    code: "sk",
    label: "Slovenčina (Slovak)",
    nativeName: "Slovenčina",
    englishName: "Slovak",
    flag: "🇸🇰",
    group: "european",
    aceStepNative: true,
    description: "Fujara traditionnelle, Folk slovaque, Pop-rock"
  },
  {
    code: "sr",
    label: "Српски (Serbian)",
    nativeName: "Српски",
    englishName: "Serbian",
    flag: "🇷🇸",
    group: "european",
    aceStepNative: true,
    description: "Balkan Brass, Turbo-folk, Starogradska muzika"
  },
  {
    code: "uk",
    label: "Українська (Ukrainian)",
    nativeName: "Українська",
    englishName: "Ukrainian",
    flag: "🇺🇦",
    group: "european",
    aceStepNative: true,
    description: "Folk électro ukrainien, Kobzar, Polyphonies cosaques"
  },
  {
    code: "lt",
    label: "Lietuvių (Lithuanian)",
    nativeName: "Lietuvių",
    englishName: "Lithuanian",
    flag: "🇱🇹",
    group: "european",
    aceStepNative: true,
    description: "Sutartinės polyphoniques, Folk balte contemporain"
  },
  {
    code: "is",
    label: "Íslenska (Icelandic)",
    nativeName: "Íslenska",
    englishName: "Icelandic",
    flag: "🇮🇸",
    group: "european",
    aceStepNative: true,
    description: "Post-rock éthéré, Ambiance boréale, Rímur"
  },
  {
    code: "az",
    label: "Azərbaycanca (Azerbaijani)",
    nativeName: "Azərbaycan",
    englishName: "Azerbaijani",
    flag: "🇦🇿",
    group: "european",
    aceStepNative: true,
    description: "Mugham, Balaban, Musique des Ashiqs caucasiens"
  },
  {
    code: "la",
    label: "Latina (Latin)",
    nativeName: "Latina",
    englishName: "Latin",
    flag: "🏛️",
    group: "european",
    aceStepNative: true,
    description: "Chant grégorien, Chœurs épiques sacrés, Requiem cinématique"
  },

  // ── ASIATIQUES & ORIENT (Toutes les langues ACE-Step 1.5) ──
  {
    code: "vi",
    label: "Tiếng Việt (Vietnamese)",
    nativeName: "Tiếng Việt",
    englishName: "Vietnamese",
    flag: "🇻🇳",
    group: "asian",
    aceStepNative: true,
    description: "V-Pop, Nhạc Trữ Tình, Đàn bầu, Ballades modernes"
  },
  {
    code: "th",
    label: "ไทย (Thai)",
    nativeName: "ไทย",
    englishName: "Thai",
    flag: "🇹🇭",
    group: "asian",
    aceStepNative: true,
    description: "T-Pop, Luk Thung, Mor Lam, Pop siamoise"
  },
  {
    code: "tl",
    label: "Tagalog / Filipino",
    nativeName: "Tagalog",
    englishName: "Tagalog",
    flag: "🇵🇭",
    group: "asian",
    aceStepNative: true,
    description: "OPM (Original Pilipino Music), Kundiman, Pinoy Rock"
  },
  {
    code: "bn",
    label: "বাংলা (Bengali)",
    nativeName: "বাংলা",
    englishName: "Bengali",
    flag: "🇧🇩",
    group: "asian",
    aceStepNative: true,
    description: "Rabindra Sangeet, Baul mystique, Bangla Pop, Adhunik"
  },
  {
    code: "pa",
    label: "ਪੰਜਾਬੀ (Punjabi)",
    nativeName: "ਪੰਜਾਬੀ",
    englishName: "Punjabi",
    flag: "🇮🇳",
    group: "asian",
    aceStepNative: true,
    description: "Bhangra énergique, Dhol rhythm, Punjabi Drill, Sufi"
  },
  {
    code: "ta",
    label: "தமிழ் (Tamil)",
    nativeName: "தமிழ்",
    englishName: "Tamil",
    flag: "🇮🇳",
    group: "asian",
    aceStepNative: true,
    description: "Musique carnatique, Kollywood OST, Gaana, Fusion tamoule"
  },
  {
    code: "te",
    label: "తెలుగు (Telugu)",
    nativeName: "తెలుగు",
    englishName: "Telugu",
    flag: "🇮🇳",
    group: "asian",
    aceStepNative: true,
    description: "Tollywood OST, Chants folkloriques telugu, Kirtana"
  },
  {
    code: "ur",
    label: "اردو (Urdu)",
    nativeName: "اردو",
    englishName: "Urdu",
    flag: "🇵🇰",
    group: "asian",
    aceStepNative: true,
    description: "Qawwali soufi (Nusrat), Ghazal poétique, Coke Studio"
  },
  {
    code: "ne",
    label: "नेपाली (Nepali)",
    nativeName: "नेपाली",
    englishName: "Nepali",
    flag: "🇳🇵",
    group: "asian",
    aceStepNative: true,
    description: "Folk himalayen, Lok Dohori, Sarangi, Adhunik Geet"
  },
  {
    code: "id",
    label: "Bahasa Indonesia",
    nativeName: "Bahasa Indonesia",
    englishName: "Indonesian",
    flag: "🇮🇩",
    group: "asian",
    aceStepNative: true,
    description: "Dangdut, Pop indo, Gamelan javanais, Kroncong"
  },
  {
    code: "ms",
    label: "Bahasa Melayu (Malay)",
    nativeName: "Bahasa Melayu",
    englishName: "Malay",
    flag: "🇲🇾",
    group: "asian",
    aceStepNative: true,
    description: "Asli malais, Dondang Sayang, Pop malaisienne, Nasyid"
  },
  {
    code: "fa",
    label: "فارسی (Persian)",
    nativeName: "فارسی",
    englishName: "Persian",
    flag: "🇮🇷",
    group: "asian",
    aceStepNative: true,
    description: "Radif persan, Dastgah, Târ & Santoor, Poésie d'Hafez"
  },
  {
    code: "he",
    label: "עברית (Hebrew)",
    nativeName: "עברית",
    englishName: "Hebrew",
    flag: "🇮🇱",
    group: "asian",
    aceStepNative: true,
    description: "Mizrahi, Klezmer séfarade, Pop hébraïque moderne"
  },
  {
    code: "yue",
    label: "粵語 (Cantonese)",
    nativeName: "粵語",
    englishName: "Cantonese",
    flag: "🇭🇰",
    group: "asian",
    aceStepNative: true,
    description: "Cantopop 80s/90s, Nostalgie hongkongaise, Ballades romantiques"
  },
  {
    code: "sa",
    label: "संस्कृतम् (Sanskrit)",
    nativeName: "संस्कृतम्",
    englishName: "Sanskrit",
    flag: "🕉️",
    group: "asian",
    aceStepNative: true,
    description: "Mantras védiques, Chants sacrés méditatifs, Slokas"
  },

  // ── SPÉCIAL & INSTRUMENTAL ──
  {
    code: "unknown",
    label: "Auto / Instrumental",
    nativeName: "Auto / Sans voix",
    englishName: "Instrumental",
    flag: "🌐",
    group: "special",
    aceStepNative: true,
    description: "Piste 100% instrumentale sans voix ni choeurs"
  }
];

/**
 * 51 codes de langues officielles validées par ACE-Step 1.5 (acestep/constants.py)
 */
export const VALID_ACE_STEP_LANG_CODES = [
  "ar", "az", "bg", "bn", "ca", "cs", "da", "de", "el", "en", "es", "fa", "fi", "fr", "he", "hi",
  "hr", "ht", "hu", "id", "is", "it", "ja", "ko", "la", "lt", "ms", "ne", "nl", "no", "pa", "pl",
  "pt", "ro", "ru", "sa", "sk", "sr", "sv", "sw", "ta", "te", "th", "tl", "tr", "uk", "ur", "vi",
  "yue", "zh", "unknown"
];

/**
 * Dictionnaire complet de correspondance Code -> Nom Anglais Canonical
 * Utilisé pour le prompt conditioning et les tags vocaux de diffusion
 */
export const LANG_FULL_NAMES_MAP = {
  // Français
  fr: "French",
  french: "French",
  français: "French",
  francais: "French",
  // English
  en: "English",
  english: "English",
  anglais: "English",
  // Espagnol
  es: "Spanish",
  spanish: "Spanish",
  español: "Spanish",
  espanol: "Spanish",
  // Portugais
  pt: "Portuguese",
  portuguese: "Portuguese",
  português: "Portuguese",
  portugues: "Portuguese",
  // Allemand
  de: "German",
  german: "German",
  deutsch: "German",
  allemand: "German",
  // Italien
  it: "Italian",
  italian: "Italian",
  italiano: "Italian",
  // Japonais
  ja: "Japanese",
  japanese: "Japanese",
  japonais: "Japanese",
  // Coréen
  ko: "Korean",
  korean: "Korean",
  coreen: "Korean",
  // Chinois
  zh: "Chinese",
  chinese: "Chinese",
  mandarin: "Chinese",
  chinois: "Chinese",
  yue: "Cantonese",
  cantonese: "Cantonese",
  // Arabe
  ar: "Arabic",
  arabic: "Arabic",
  arabe: "Arabic",
  // Hindi
  hi: "Hindi",
  hindi: "Hindi",
  // Russe
  ru: "Russian",
  russian: "Russian",
  russe: "Russian",
  // Créoles & Afrique
  ht: "Haitian Creole",
  "kreyòl": "Haitian Creole",
  kreyol: "Haitian Creole",
  creole: "Haitian Creole",
  "créole": "Haitian Creole",
  "haitian creole": "Haitian Creole",
  ln: "Lingala",
  lingala: "Lingala",
  lingála: "Lingala",
  sw: "Swahili",
  swahili: "Swahili",
  kiswahili: "Swahili",
  yo: "Yoruba",
  yoruba: "Yoruba",
  zu: "Zulu",
  zulu: "Zulu",
  isizulu: "Zulu",
  am: "Amharic",
  amharic: "Amharic",
  // Autres Européennes
  nl: "Dutch",
  dutch: "Dutch",
  neerlandais: "Dutch",
  pl: "Polish",
  polish: "Polish",
  polonais: "Polish",
  tr: "Turkish",
  turkish: "Turkish",
  turc: "Turkish",
  sv: "Swedish",
  swedish: "Swedish",
  suedois: "Swedish",
  da: "Danish",
  danish: "Danish",
  danois: "Danish",
  no: "Norwegian",
  norwegian: "Norwegian",
  norvegien: "Norwegian",
  fi: "Finnish",
  finnish: "Finnish",
  finlandais: "Finnish",
  cs: "Czech",
  czech: "Czech",
  tcheque: "Czech",
  ro: "Romanian",
  romanian: "Romanian",
  roumain: "Romanian",
  el: "Greek",
  greek: "Greek",
  grec: "Greek",
  hu: "Hungarian",
  hungarian: "Hungarian",
  hongrois: "Hungarian",
  bg: "Bulgarian",
  bulgarian: "Bulgarian",
  bulgare: "Bulgarian",
  ca: "Catalan",
  catalan: "Catalan",
  hr: "Croatian",
  croatian: "Croatian",
  croate: "Croatian",
  sk: "Slovak",
  slovak: "Slovak",
  slovaque: "Slovak",
  sr: "Serbian",
  serbian: "Serbian",
  serbe: "Serbian",
  uk: "Ukrainian",
  ukrainian: "Ukrainian",
  ukrainien: "Ukrainian",
  lt: "Lithuanian",
  lithuanian: "Lithuanian",
  lituanien: "Lithuanian",
  is: "Icelandic",
  icelandic: "Icelandic",
  islandais: "Icelandic",
  az: "Azerbaijani",
  azerbaijani: "Azerbaijani",
  azerbaïdjanais: "Azerbaijani",
  la: "Latin",
  latin: "Latin",
  // Autres Asiatiques
  vi: "Vietnamese",
  vietnamese: "Vietnamese",
  vietnamien: "Vietnamese",
  th: "Thai",
  thai: "Thai",
  thaï: "Thai",
  tl: "Tagalog",
  tagalog: "Tagalog",
  filipino: "Tagalog",
  bn: "Bengali",
  bengali: "Bengali",
  pa: "Punjabi",
  punjabi: "Punjabi",
  ta: "Tamil",
  tamil: "Tamil",
  tamoul: "Tamil",
  te: "Telugu",
  telugu: "Telugu",
  ur: "Urdu",
  urdu: "Urdu",
  ne: "Nepali",
  nepali: "Nepali",
  nepalais: "Nepali",
  id: "Indonesian",
  indonesian: "Indonesian",
  indonesien: "Indonesian",
  ms: "Malay",
  malay: "Malay",
  malais: "Malay",
  fa: "Persian",
  persian: "Persian",
  farsi: "Persian",
  persan: "Persian",
  he: "Hebrew",
  hebrew: "Hebrew",
  hebreu: "Hebrew",
  sa: "Sanskrit",
  sanskrit: "Sanskrit",
  // Spécial
  unknown: "Instrumental",
  instrumental: "Instrumental"
};

function stripAccents(str) {
  return String(str || '')
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Récupère les métadonnées d'une langue via son code ISO ou alias
 */
export function getLanguageByCode(code) {
  if (!code) return ALL_LANGUAGES[0]; // default 'fr'
  const clean = String(code).trim().toLowerCase();

  // 1. Exact ISO-639-1 code match takes absolute precedence
  const exactCode = ALL_LANGUAGES.find(l => l.code.toLowerCase() === clean);
  if (exactCode) return exactCode;

  // 2. Exact English name or Native name match
  const exactName = ALL_LANGUAGES.find(l => 
    l.englishName.toLowerCase() === clean || 
    l.nativeName.toLowerCase() === clean
  );
  if (exactName) return exactName;

  // 3. Fallback alias mapping from LANG_FULL_NAMES_MAP
  const mappedName = LANG_FULL_NAMES_MAP[clean];
  if (mappedName) {
    const fromMap = ALL_LANGUAGES.find(l => l.englishName.toLowerCase() === mappedName.toLowerCase());
    if (fromMap) return fromMap;
  }

  return {
    code: clean,
    label: clean.toUpperCase(),
    nativeName: clean,
    englishName: LANG_FULL_NAMES_MAP[clean] || clean,
    flag: "🌐",
    group: "special",
    aceStepNative: VALID_ACE_STEP_LANG_CODES.includes(clean)
  };
}

/**
 * Retourne le nom canonique anglais pour l'injection dans les prompts ACE-Step
 */
export function getPromptLanguageName(code) {
  const clean = String(code || 'fr').trim().toLowerCase();
  return LANG_FULL_NAMES_MAP[clean] || getLanguageByCode(clean).englishName || "French";
}

/**
 * Filtre les langues par texte de recherche avec support insensible aux accents
 */
export function searchLanguages(query, category = "all") {
  const q = stripAccents(query).trim();
  return ALL_LANGUAGES.filter(lang => {
    const matchesCat = category === "all" || lang.group === category;
    if (!matchesCat) return false;
    if (!q) return true;
    return (
      stripAccents(lang.code).includes(q) ||
      stripAccents(lang.label).includes(q) ||
      stripAccents(lang.nativeName).includes(q) ||
      stripAccents(lang.englishName).includes(q) ||
      (lang.description && stripAccents(lang.description).includes(q))
    );
  });
}

