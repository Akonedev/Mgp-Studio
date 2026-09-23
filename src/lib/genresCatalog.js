/**
 * GENRES CATALOG - Base de connaissances musicologique universelle
 * Regroupe et structure les 119 genres musicaux en 8 familles cohérentes.
 * Permet un affichage Card / Liste / Badges homogène et garantit le respect
 * strict du prompt, du tempo (BPM), de la clé musicale et de l'orchestration.
 */

export const GENRE_CATEGORIES = [
  { id: "all", label: "Tous les Genres", count: 114, color: "from-amber-500/20 to-amber-700/20" },
  { id: "electronic", label: "Electronic & Club", icon: "Waves", color: "from-cyan-500/20 to-blue-500/20", borderColor: "border-cyan-500/30" },
  { id: "hiphop", label: "Hip-Hop & Urban", icon: "Disc", color: "from-amber-500/20 to-amber-800/20", borderColor: "border-amber-500/30" },
  { id: "african", label: "African & Afro-Roots", icon: "Sparkles", color: "from-emerald-500/20 to-teal-500/20", borderColor: "border-emerald-500/30" },
  { id: "latin", label: "Latin & Caribbean", icon: "Music", color: "from-amber-600/20 to-amber-800/20", borderColor: "border-amber-500/30" },
  { id: "jazz", label: "Jazz, Soul & Blues", icon: "Sliders", color: "from-purple-500/20 to-indigo-500/20", borderColor: "border-purple-500/30" },
  { id: "rock", label: "Rock & Alternative", icon: "Wrench", color: "from-red-500/20 to-amber-500/20", borderColor: "border-red-500/30" },
  { id: "pop", label: "Pop & Global Trends", icon: "Radio", color: "from-[#df9c43]/20 to-amber-600/20", borderColor: "border-[#df9c43]/30" },
  { id: "world", label: "Traditional & Classical", icon: "Library", color: "from-teal-500/20 to-cyan-500/20", borderColor: "border-teal-500/30" },
];

export const GENRES_DATA = [
  // ── ELECTRONIC & CLUB ──
  { name: "16-bit", category: "electronic", bpm: 135, key: "C major", desc: "Nostalgie chiptune rétro 80s/90s avec synthétiseurs FM carrés et arpèges ultra-rapides." },
  { name: "2-step", category: "electronic", bpm: 134, key: "F minor", desc: "Rythmique syncopée UK Garage avec basse puissante et percussions sautillantes." },
  { name: "acid house", category: "electronic", bpm: 124, key: "A minor", desc: "Ligne de basse TB-303 résonnante, kicks 4-on-the-floor et énergie club hypnotique." },
  { name: "acid techno", category: "electronic", bpm: 138, key: "D minor", desc: "Synthèse modulée acide agressive, percussions industrielles percutantes et cadence sombre." },
  { name: "acid trance", category: "electronic", bpm: 140, key: "E minor", desc: "Envolées psychédéliques TB-303, nappes euphoriques et montée d'énergie progressive." },
  { name: "algorave", category: "electronic", bpm: 145, key: "C minor", desc: "Musique générative live-codée, motifs polymétriques complexes et sons digitaux bruts." },
  { name: "ambient techno", category: "electronic", bpm: 120, key: "D minor", desc: "Textures atmosphériques planantes, réverbérations profondes et kick feutré régulier." },
  { name: "bubblegum bass", category: "electronic", bpm: 130, key: "G major", desc: "Hyperpop éclatante, basses modulées métalliques et mélodies pop acidulées." },
  { name: "bubblegum dance", category: "electronic", bpm: 138, key: "Bb major", desc: "Eurodance festive et lumineuse avec synthés accrocheurs et voix enjouée." },
  { name: "chillstep", category: "electronic", bpm: 140, key: "Ab minor", desc: "Sous-genre dubstep mélodique avec nappes atmosphériques et demi-tempo relaxant." },
  { name: "chillsynth", category: "electronic", bpm: 100, key: "F major", desc: "Synthwave lente et contemplative, synthés analogiques chauds et filtres passe-bas." },
  { name: "dance", category: "electronic", bpm: 128, key: "A minor", desc: "Production club moderne avec hooks fédérateurs, piano house et basse rebondissante." },
  { name: "drum and bass", category: "electronic", bpm: 174, key: "F minor", desc: "Rythmes breakbeat hyper-rapides et sub-bass Reese vrombissant." },
  { name: "dubstep", category: "electronic", bpm: 140, key: "E minor", desc: "Lignes de basse wobble ultra-lourdes, drops percutants et caisse claire explosive au 3e temps." },
  { name: "edm", category: "electronic", bpm: 128, key: "C minor", desc: "Build-ups d'anthologie, festival drops et synthés supersaw monumentaux." },
  { name: "electro swing", category: "electronic", bpm: 124, key: "G minor", desc: "Échantillons de jazz swing des années 30 fusionnés avec des beats house modernes." },
  { name: "electronic", category: "electronic", bpm: 122, key: "D minor", desc: "Composition électronique polyvalente, synthèse modulaire et mixage précis." },
  { name: "eurodance", category: "electronic", bpm: 140, key: "B minor", desc: "Énergie club des années 90, synthétiseurs M1 et piano rave exaltant." },
  { name: "future bass", category: "electronic", bpm: 150, key: "Eb major", desc: "Accords supersaw modulés par LFO, arpeggiators riches et basses 808 chaleureuses." },
  { name: "glitch hop", category: "electronic", bpm: 105, key: "D minor", desc: "Groove mid-tempo avec découpages saccadés, textures micro-éditées et funk digital." },
  { name: "hardcore techno", category: "electronic", bpm: 165, key: "F minor", desc: "Kick distordu gabber implacable, tempo extrême et ambiance rave frénétique." },
  { name: "house", category: "electronic", bpm: 124, key: "C major", desc: "Piliers de Chicago : kick 4x4, charleston ouvert, piano soul et groove entraînant." },
  { name: "industrial", category: "electronic", bpm: 130, key: "D minor", desc: "Sons métalliques grinçants, percussions mécaniques et atmosphère dystopique." },
  { name: "synthwave", category: "electronic", bpm: 118, key: "A minor", desc: "Vibe cyberpunk neon 80s avec synthés Juno-106, boîte à rythmes LinnDrum et basse en croches." },
  { name: "techno", category: "electronic", bpm: 132, key: "F minor", desc: "Rythme métronomique de Détroit/Berlin, percussions sombres et hypnotic loops." },
  { name: "vaporwave", category: "electronic", bpm: 84, key: "Bb major", desc: "Ralentissements de samples jazz-funk 80s, réverbération nostalgique et esthétique lo-fi." },

  // ── HIP-HOP & URBAN ──
  { name: "afro trap", category: "hiphop", bpm: 130, key: "G minor", desc: "Fusion pionnière entre trap 808 percutante et polyrythmies dansantes d'Afrique de l'Ouest." },
  { name: "cloud rap", category: "hiphop", bpm: 120, key: "Db minor", desc: "Nappes planantes éthérées, vocaux réverbérés spatiaux et 808 profondes au ralenti." },
  { name: "drill", category: "hiphop", bpm: 142, key: "C minor", desc: "Sub-bass 808 glissants (slides), charlestons syncopés complexes et ambiance obscure." },
  { name: "emo rap", category: "hiphop", bpm: 130, key: "E minor", desc: "Guitares mélancoliques acoustiques ou grunge, thématiques intimistes et beat trap doux." },
  { name: "g-funk", category: "hiphop", bpm: 80, key: "G minor", desc: "West Coast 90s légendaire : synthé lead Moog sifflant, basse lourde et cordes staccato." },
  { name: "gangsta rap", category: "hiphop", bpm: 88, key: "D minor", desc: "Beat lourd boom-bap, cuivres sombres, caisse claire franche et attitude de rue sans compromis." },
  { name: "grime", category: "hiphop", bpm: 140, key: "E minor", desc: "Rythmique saccadée 140 BPM de Londres, sub-bass 8-bar et énergie brute underground." },
  { name: "hip hop", category: "hiphop", bpm: 90, key: "F minor", desc: "L'essence boom-bap : sample de vinyle craquant, kick percutant et basse organique ronde." },
  { name: "lo-fi hip hop", category: "hiphop", bpm: 78, key: "Eb major", desc: "Accords de jazz feutrés au piano Rhodes, pluie d'ambiance et groove détendu relaxant." },
  { name: "trap", category: "hiphop", bpm: 140, key: "C# minor", desc: "Charlestons en triolets rapides, sub 808 accordé dévastateur et caisse claire claquante." },
  { name: "trip hop", category: "hiphop", bpm: 82, key: "B minor", desc: "Bristol sound atmosphérique, breakbeats lourds, scratchs discrets et ambiance cinématique sombre." },

  // ── AFRICAN & AFRO-ROOTS ──
  { name: "african folk", category: "african", bpm: 96, key: "D major", desc: "Instruments traditionnels (Kora, Balafon, Ngoni), chants polyphoniques et célébration communautaire." },
  { name: "afrikaner folk", category: "african", bpm: 110, key: "G major", desc: "Guitare acoustique entraînante, accordéon concertina et mélodies narratives du Cap." },
  { name: "afro house", category: "african", bpm: 122, key: "A minor", desc: "Rythme 3-step sud-africain, percussions congas organiques et synthétiseurs profonds." },
  { name: "afro-funk", category: "african", bpm: 112, key: "E minor", desc: "Section de cuivres éclatante, cocottes de guitare frénétiques et groove de basse contagieux." },
  { name: "afro-jazz", category: "african", bpm: 100, key: "Bb major", desc: "Improvisation jazz virtuose mariée aux échelles et rythmes ancestraux d'Afrique." },
  { name: "afro-rock", category: "african", bpm: 125, key: "A minor", desc: "Guitares électriques saturées distordues sur polyrythmies de percussions africaines." },
  {
    name: "afrobeat",
    category: "african",
    bpm: 108,
    key: "F minor",
    aliases: ["afrobeat", "fela", "fela kuti", "tony allen", "afro-beat"],
    acousticPrompt: "Authentic Nigerian Afrobeat, polyrhythmic drum groove by Tony Allen, driving electric bass guitar, bright clean rhythm guitar interlocking chords, fiery brass horn section with trumpet, tenor sax and baritone sax stabs, Hammond organ and Rhodes electric piano, call-and-response vocal chants, 108 BPM, in F minor",
    desc: "L'héritage de Fela Kuti : batterie hypnotique de Tony Allen, cuivres puissants et clavier Rhodes."
  },
  { name: "afropiano", category: "african", bpm: 113, key: "G minor", aliases: ["afropiano", "afrobeats amapiano"], desc: "Croisement parfait entre le groove vocal Afrobeats et le log drum signature Amapiano." },
  { name: "afroswing", category: "african", bpm: 104, key: "D minor", desc: "Mélodie chaloupée UK-africaine, dancehall doux et production pop urbaine soignée." },
  {
    name: "amapiano",
    category: "african",
    bpm: 113,
    key: "F# minor",
    aliases: ["amapiano", "log drum", "private school amapiano", "piano", "kabza", "south african house", "afropiano", "kelvin momo", "mdu", "goli"],
    recommendedLanguage: "zu",
    acousticPrompt: "Authentic South African Amapiano, signature pitched FM Log Drum bassline with rolling sub-bass glides and woody resonant attack, syncopated South African shaker loops, wooden rimshots, lush jazz grand piano and Rhodes chords with 9th and 11th intervals, deep atmospheric analog pads, airy vocal chants, 113 BPM, in F# minor",
    negativePrompt: "distorted 808 trap bass, aggressive square synth lead, fast techno tempo, rock drums, screeching synths, aggressive vocal shouting, harsh EDM drop",
    desc: "Le son royal de Johannesburg : log drum percussif résonnant, nappes jazz au piano Rhodes, shakers aériens et sub-bass glissants.",
    lyricsTemplate: `[Verse 1]
Ilanga liyashona phezu kweGoli
Umculo omnandi udlala kamnandi
Amabhasi e-log drum ashaya ngomoya
Uthando lwethu lumile njalo

[Chorus]
Amapiano aseGoli, umculo womoya
Woza sidanse sonke ebusuku
Log drum iyashaya, inhliziyo iyathokoza
Siyabonga uthando, siyabonga umculo`
  },
  { name: "highlife", category: "african", bpm: 115, key: "C major", desc: "Guitares en dentelle du Ghana, cuivres festifs et rythmique chaleureuse ensoleillée." },
  { name: "kizomba", category: "african", bpm: 92, key: "D minor", desc: "Danse sensuelle d'Angola au rythme lent, cadence zouk moderne et harmonies romantiques." },
  { name: "mbalax", category: "african", bpm: 128, key: "A minor", desc: "Le rythme palpitant de Dakar : tambours sabar virtuoses, tama parlant et envolées wolof." },
  {
    name: "rumba congolaise",
    category: "african",
    bpm: 106,
    key: "G major",
    aliases: ["rumba congolaise", "rumba congo", "rumba", "seben", "sebene", "kinshasa", "congo", "koffi", "zaiko", "franco", "lingala", "rumba congolais", "congolese rumba"],
    recommendedLanguage: "ln",
    acousticPrompt: "Authentic Congolese Rumba and Sebene, intricate solo electric guitar fingerpicking with lush chorus and tape delay, mi-solo arpeggios, dynamic walking bass guitar groove, congas tumbadoras, rumba clave 2-3, warm brass section with trumpet and saxophone, romantic Kinshasa crooner vocals with Lingala vocal harmonies, 106 BPM, in G major",
    negativePrompt: "Synthesizer dance pop, aggressive trap beats, cold electronic distortion, out-of-tune guitar, 4-on-the-floor EDM kick, metallic autotune",
    desc: "L'élégance de Kinshasa : jeu de guitare Sebene ultra-mélodique avec chorus et delay, congas tumbadoras, basse marchante et transition rumba entraînante.",
    lyricsTemplate: `[Verse 1]
Bolingo ya motema, guitare ya sebene ya esengo
Motema na ngai etondi na bolingo ya solo
Lokola mbula ezali kokitela mabele na esengo
Oza mwasi ya motuya, kitoko na yo eleki nionso

[Chorus]
Rumba congo, sebene ya sika ya bolingo
Bolingo, bolingo ya motema
Tika ngai na linga yo kino suka ya mokili
Bina rumba, bina seben ya Kinshasa`
  },
  { name: "sahel blues", category: "african", bpm: 90, key: "E minor", desc: "Desert blues hypnotique des Touaregs : guitares lancinantes, calebasse et transes poétiques." },

  // ── LATIN & CARIBBEAN ──
  {
    name: "bachata",
    category: "latin",
    bpm: 128,
    key: "A minor",
    aliases: ["bachata", "bachata dominicana", "requinto"],
    acousticPrompt: "Authentic Dominican Bachata, bright lead requinto acoustic guitar virtuoso fingerpicking, bongo dominicano rhythmic syncopations, metallic guira scraping, warm electric bass guitar, passionate romantic vocals, 128 BPM, in A minor",
    desc: "Requinto guitare pincée virtuose, bongo dominicain, güira et chant romantique passionné."
  },
  { name: "boogie", category: "latin", bpm: 114, key: "F major", desc: "Ligne de basse slappée rebondissante, piano staccato et pulsation disco-funk festive." },
  { name: "caribbean", category: "latin", bpm: 108, key: "C major", desc: "Steel pans ensoleillés, percussions insulaires, guitare rythmique et brise tropicale." },
  { name: "cumbia", category: "latin", bpm: 96, key: "A minor", desc: "Rythme de güiro ch-ch-ku signature, accordéon mélodique et basse dansante colombienne." },
  { name: "cumbia sonidera", category: "latin", bpm: 92, key: "E minor", desc: "Cumbia ralentie de Mexico avec effets de voix pitchés, échos spatiaux et synthétiseurs." },
  { name: "dancehall", category: "latin", bpm: 100, key: "F# minor", desc: "Riddim jamaïcain percutant, basse lourde et phrasé toasting énergique." },
  { name: "dembow", category: "latin", bpm: 118, key: "C minor", desc: "Rythmique ultra-rapide dominicaine, percussions staccato saccadées et ad-libs explosifs." },
  { name: "flamenco", category: "latin", bpm: 116, key: "A phrygian", desc: "Guitare espagnole en rasgueado, cajón vigoureux, palmas claquées et chant cante jondo." },
  { name: "flamenco nuevo", category: "latin", bpm: 105, key: "D minor", desc: "Fusion moderne du flamenco avec basse électrique fretless, flûte traversière et jazz." },
  { name: "latin pop", category: "latin", bpm: 104, key: "B minor", desc: "Accroches mélodiques hispaniques, guitare acoustique chaleureuse et production radio internationale." },
  {
    name: "reggae",
    category: "latin",
    bpm: 75,
    key: "A minor",
    aliases: ["reggae", "roots reggae", "dub", "bob marley"],
    acousticPrompt: "Authentic Roots Reggae, heavy round bassline, syncopated one-drop drum beat with cross-stick rimshot, clean electric guitar chop skank on beats 2 and 4, bubbling Hammond organ and piano chords, warm horn section, conscious roots vocal delivery, 75 BPM, in A minor",
    desc: "Contretemps guitare skank sur le 2e et 4e temps, ligne de basse ronde et batterie one-drop."
  },
  { name: "reggaeton", category: "latin", bpm: 94, key: "G minor", desc: "Battement dembow classique boum-cha-boum-cha, basse synthétique lourde et mélodies urbaines." },
  {
    name: "salsa",
    category: "latin",
    bpm: 180,
    key: "D minor",
    aliases: ["salsa", "salsa dura", "fania"],
    acousticPrompt: "Authentic Salsa Brava, clave 2-3 rhythm, congas tumbao, bongo bell, timbales fills, syncopated piano montuno, driving walking baby bass, blazing brass section with trumpets and trombones, passionate Spanish sonero vocals, 180 BPM, in D minor",
    desc: "Clave 2-3 ou 3-2, congas en tumbao, piano montuno syncopé et cuivres éclatants."
  },
  { name: "samba", category: "latin", bpm: 120, key: "G major", desc: "Polyrythmie du carnaval de Rio : surdo profond, pandeiro vif, cuíca et cavaquinho enjoué." },
  { name: "ska", category: "latin", bpm: 130, key: "C major", desc: "Up-beat rapide des cuivres, guitare chop nerveuse et ligne de basse marchante walking-bass." },
  { name: "tango", category: "latin", bpm: 120, key: "D minor", desc: "Bandoneón tragique et expressif, violons dramatiques et accentuations syncopées argentines." },
  {
    name: "zouk love",
    category: "latin",
    bpm: 90,
    key: "Bb major",
    aliases: [
      "zouk", "zouk love", "zouk retro", "style zouk", "styme zou", "styme zouk",
      "zou", "zook", "antilles", "kassav", "cadence zouk", "caribbean zouk",
      "zouk antillais", "kassav style", "zouk des antilles", "kole sere"
    ],
    recommendedLanguage: "ht",
    acousticPrompt: "Authentic French Antillean Zouk Love, classic syncopated zouk drum machine beat with ti-bwa wooden rimshot groove, chacha shakers, bouncy synthesizer slap bassline, iconic Yamaha DX7 electric piano chords, chorused clean rhythm guitar strums on offbeats, smooth romantic saxophone lead, sweet Caribbean French vocal harmonies, 90 BPM, in Bb major",
    negativePrompt: "EDM synth, aggressive distorted bass, trap hi-hat rolls, distorted 808 sub, autotune metallic voice, rock guitar distortion, cold thin mix, rushed tempo, techno kick",
    desc: "Douceur des Antilles : ti-bwa syncopé, basse rebondissante, piano DX7 soyeux, saxophone velouté et mélodie romantique envoûtante.",
    lyricsTemplate: `[Verse 1]
Dousè nan kè mwen, mizik la ap jwe tou dousman
Pianwo DX7 ap chante, yon santiman damou nan van
Anba bèl zetwal, mwen vle sere w nan bra m
Kadans lan ap gide nou, se lajwa ki nan nanm

[Chorus]
Zouk love kole-sere jiska granmaten
Kite lanmou fleri sou bèl chimen
Ritm karibeyen, dousè ak pasyon
Toujou ansanm nan bèl chante sa a`
  },

  // ── JAZZ, SOUL & BLUES ──
  { name: "acoustic chicago blues", category: "jazz", bpm: 90, key: "E blues", desc: "Guitare bottleneck résonateur slide, harmonica plaintif et shuffle blues authentique." },
  { name: "acoustic texas blues", category: "jazz", bpm: 110, key: "A blues", desc: "Fingerpicking virtuose sur guitare acoustique, groove rapide et solo expressif." },
  { name: "afro-cuban jazz", category: "jazz", bpm: 120, key: "C minor", desc: "Cuivres bebop tranchants soutenus par les congas, bongos et la clave cubaine." },
  { name: "avant-garde jazz", category: "jazz", bpm: 110, key: "Free", desc: "Harmonies atonales audacieuses, improvisation libre explosive et textures sonores novatrices." },
  { name: "blues rock", category: "jazz", bpm: 115, key: "E minor", desc: "Guitare électrique avec overdrive chaleureux, solo pentatonique enflammé et batterie puissante." },
  { name: "bossa nova", category: "jazz", bpm: 125, key: "D major", desc: "Guitare nylon d'Ipanema, accords de jazz enrichis 9e/13e et chant intimiste murmure." },
  { name: "funk", category: "jazz", bpm: 108, key: "E minor", desc: "L'accentuation sur le ONE : basse slap percutante, cocotte de guitare wah-wah et cuivres piquants." },
  { name: "gospel", category: "jazz", bpm: 95, key: "Ab major", desc: "Chœur monumental puissant, orgue Hammond B3 spirituel, piano expressif et claquements de mains." },
  { name: "jazz", category: "jazz", bpm: 120, key: "Bb major", desc: "Contrebasse en walking-bass, balais sur la cymbale ride et progressions d'accords II-V-I raffinées." },
  { name: "motown", category: "jazz", bpm: 118, key: "G major", desc: "Le son légendaire de Detroit : tambourin régulier, basse mélodique de James Jamerson et cuivres chaleureux." },
  { name: "neo-soul", category: "jazz", bpm: 86, key: "F minor", desc: "Fender Rhodes soyeux, MPC swing laid-back, basse électrique ronde et voix soul feutrée." },
  { name: "r&b", category: "jazz", bpm: 88, key: "Eb minor", desc: "Mélodies vocales douces et sensuelles, harmonies riches et rythmique moderne ciselée." },
  { name: "alternative r &b", category: "jazz", bpm: 82, key: "Db minor", desc: "Textures sombres et atmosphériques, synthés expérimentaux et chant introspectif." },
  { name: "soul", category: "jazz", bpm: 94, key: "C major", desc: "Chant habité et vibrant, section de cuivres Stax émouvante et batterie organique feutrée." },

  // ── ROCK & ALTERNATIVE ──
  { name: "acoustic rock", category: "rock", bpm: 115, key: "G major", desc: "Guitare folk à cordes acier en accords ouverts, batterie énergique et voix rock vibrante." },
  { name: "alternative rock", category: "rock", bpm: 124, key: "D minor", desc: "Guitares saturées dynamiques alternant couplets calmes et refrains explosifs." },
  { name: "anti-folk", category: "rock", bpm: 128, key: "C major", desc: "Esprit punk acoustique lo-fi, paroles ironiques décalées et guitare brute spontanée." },
  { name: "bluegrass", category: "rock", bpm: 145, key: "G major", desc: "Banjo 5 cordes ultra-rapide en picking Scruggs, mandoline tranchante et contrebasse acoustique." },
  { name: "garage rock", category: "rock", bpm: 140, key: "A major", desc: "Énergie brute vintage, fuzz déchaîné, batterie simplifiée percutante et chant direct." },
  { name: "heavy metal", category: "rock", bpm: 130, key: "E minor", desc: "Riffs en palm-muting lourds et agressifs, double grosse caisse et solos de guitare épiques." },
  { name: "indie rock", category: "rock", bpm: 122, key: "F# minor", desc: "Mélodies de guitare avec reverb et chorus soignés, basse mélodique et esprit indépendant." },
  { name: "metalcore", category: "rock", bpm: 145, key: "D minor", desc: "Breakdowns dévastateurs, riffs saccadés en drop D et alternance de screams et chant clair." },
  { name: "post-rock", category: "rock", bpm: 95, key: "A minor", desc: "Montées en puissance cinématographiques, nappes de guitares immersives et crescendo émotionnel." },
  { name: "punk rock", category: "rock", bpm: 160, key: "E major", desc: "Accords de puissance power-chords rapides, tempo effréné, basse en plectre et rébellion pure." },
  { name: "rock", category: "rock", bpm: 120, key: "E minor", desc: "Le classic rock : batterie percutante, guitare électrique Les Paul et solo transcendant." },
  { name: "shoegaze", category: "rock", bpm: 105, key: "D major", desc: "Mur du son de guitares noyées sous le delay et la réverbération, voix éthérée vaporeuse." },

  // ── POP & GLOBAL TRENDS ──
  { name: "bedroom pop", category: "pop", bpm: 90, key: "E major", desc: "Production intime DIY faite maison, synthés lo-fi rêveurs et chant doux murmuré." },
  { name: "cabaret", category: "pop", bpm: 110, key: "C minor", desc: "Théâtralité burlesque au piano bastringue, contrebasse piquante et vocal expressif narquois." },
  { name: "cajun", category: "pop", bpm: 132, key: "A major", desc: "Violon cajun enjoué, accordéon diatonique et deux-temps festif de Louisiane." },
  { name: "dancepop", category: "pop", bpm: 126, key: "Ab major", desc: "Refrain immédiat et inoubliable, production rutilante et beat taillé pour les charts." },
  { name: "disco", category: "pop", bpm: 120, key: "D minor", desc: "Basse au médiator octavée dansante, cordes disco flamboyantes et percussions scintillantes." },
  { name: "indie pop", category: "pop", bpm: 118, key: "G major", desc: "Guitares jangle-pop carillonnantes, sifflements joyeux et refrains solaires communicatifs." },
  { name: "j-pop", category: "pop", bpm: 138, key: "F# minor", desc: "Progressions d'accords japonaises complexes (Royal Road), mélodie vive et orchestration riche." },
  { name: "k-pop", category: "pop", bpm: 126, key: "C# minor", desc: "Production ultra-précise multi-genres, transitions audacieuses et refrains surpuissants." },
  { name: "pop", category: "pop", bpm: 120, key: "C major", desc: "Clarté acoustique et électronique moderne, topline mémorable et dynamique impeccable." },
  { name: "synthpop", category: "pop", bpm: 122, key: "A minor", desc: "Synthétiseurs analogiques mélodiques, batterie électronique LinnDrum et chant élégant." },

  // ── TRADITIONAL, WORLD & CLASSICAL ──
  { name: "cape verdean", category: "world", bpm: 95, key: "C minor", desc: "Morna et Coladeira mélancoliques inspirées de Cesária Évora, guitare et cavaquinho." },
  { name: "carnatic", category: "world", bpm: 100, key: "Raga", desc: "Tradition savante d'Inde du Sud : veena, violon, mridangam et micro-intervalles raga." },
  { name: "celtic", category: "world", bpm: 118, key: "D major", desc: "Flûte tin whistle, violon fiddle irlandais, cornemuse uilleann pipes et bodhrán." },
  { name: "chanson", category: "world", bpm: 88, key: "A minor", desc: "Chanson française poétique : accordéon mélodieux, piano acoustique et texte d'auteur." },
  { name: "classical", category: "world", bpm: 100, key: "D major", desc: "Grand orchestre symphonique, cordes nobles, bois délicats et écriture contrapuntique." },
  { name: "coptic", category: "world", bpm: 80, key: "Modal", desc: "Chants liturgiques anciens de la vallée du Nil, cymbales en bronze et voix solennelles." },
  { name: "folk", category: "world", bpm: 104, key: "G major", desc: "Guitare acoustique en strumming, voix sincère sans artifice et mélodie intemporelle." },
  { name: "orchestral", category: "world", bpm: 85, key: "D minor", desc: "Envolées orchestrales pour cinéma : cuivres épiques, percussions taiko et chœurs grandioses." },
  { name: "tarab", category: "world", bpm: 90, key: "Bayati", desc: "Extase musicale arabe : oud virtuose, qanun étincelant, violon oriental et nay méditatif." },
];

/**
 * Recherche intelligente d'un genre par son nom exact ou partiel.
/**
 * Recherche intelligente d'un genre par son nom exact, partiel ou alias musicologique.
 * Gère les variantes de saisie courantes (ex: "styme zou", "rumba congo", "log drum", etc.)
 */
export function findGenreByName(name) {
  if (!name) return null;
  const raw = name.toLowerCase().trim();
  // Strip common French/English prefixes like "style", "styme" (typo), "musique", "genre", "vibe"
  const cleaned = raw.replace(/^(?:style|styme|musique|genre|vibe|son)\s+/i, '').trim();

  // 1. Exact name match
  let exact = GENRES_DATA.find((g) => g.name.toLowerCase() === raw);
  if (exact) return exact;
  if (cleaned && cleaned !== raw) {
    exact = GENRES_DATA.find((g) => g.name.toLowerCase() === cleaned);
    if (exact) return exact;
  }

  // 2. Exact alias match
  let aliasMatch = GENRES_DATA.find((g) => g.aliases && g.aliases.some((a) => a.toLowerCase() === raw || a.toLowerCase() === cleaned));
  if (aliasMatch) return aliasMatch;

  // 3. Substring inclusion in name
  let substrName = GENRES_DATA.find((g) => {
    const n = g.name.toLowerCase();
    return n.includes(raw) || raw.includes(n) || (cleaned && (n.includes(cleaned) || cleaned.includes(n)));
  });
  if (substrName) return substrName;

  // 4. Substring inclusion in aliases
  let substrAlias = GENRES_DATA.find((g) => g.aliases && g.aliases.some((a) => {
    const aLow = a.toLowerCase();
    return aLow.includes(raw) || raw.includes(aLow) || (cleaned && (aLow.includes(cleaned) || cleaned.includes(aLow)));
  }));
  if (substrAlias) return substrAlias;

  // 5. Multi-token match (e.g. "rumba congo" matches both words in rumba congolaise + aliases)
  const tokens = (cleaned || raw).split(/\s+/).filter((t) => t.length >= 3);
  if (tokens.length > 0) {
    let tokenMatch = GENRES_DATA.find((g) => {
      const searchTarget = `${g.name} ${g.desc} ${(g.aliases || []).join(' ')}`.toLowerCase();
      return tokens.every((t) => searchTarget.includes(t));
    });
    if (tokenMatch) return tokenMatch;
  }

  return null;
}

/**
 * Retourne le prompt acoustique et instrumental optimal pour conditionner les modèles de diffusion / DiT.
 */
export function getGenreAcousticPrompt(genreOrName) {
  const g = typeof genreOrName === 'string' ? findGenreByName(genreOrName) : genreOrName;
  if (!g) return '';
  return g.acousticPrompt || `${g.name}, ${g.bpm} BPM, ${g.key}, ${g.desc}`;
}

/**
 * Retourne les genres filtrés par catégorie et par requête de recherche.
 */
export function getFilteredGenres(category = "all", searchQuery = "") {
  const rawQ = searchQuery ? searchQuery.toLowerCase().trim() : "";
  const cleanedQ = rawQ.replace(/^(?:style|styme|musique|genre|vibe|son)\s+/i, '').trim();

  return GENRES_DATA.filter((g) => {
    const matchesCategory = category === "all" || g.category === category;
    if (!matchesCategory) return false;
    if (!rawQ) return true;

    const nameLow = g.name.toLowerCase();
    const descLow = g.desc.toLowerCase();
    const aliasStr = (g.aliases || []).join(' ').toLowerCase();

    return nameLow.includes(rawQ) ||
           descLow.includes(rawQ) ||
           aliasStr.includes(rawQ) ||
           (cleanedQ && (nameLow.includes(cleanedQ) || descLow.includes(cleanedQ) || aliasStr.includes(cleanedQ)));
  });
}

