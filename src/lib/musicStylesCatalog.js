/**
 * MUSIC STYLES CATALOG - SOTA Curated Master Styles
 * Moteur musicologique de référence basé sur 13 chefs-d'œuvre mondiaux
 * (Neo-Soul, Deep Amapiano, West African Kora/Balafon, Naija Afrobeats, Rumba Congolaise, Lingala Soul)
 *
 * Conçu pour les modèles neuronaux SOTA : ACE-Step 1.5 DiT, YuE2-3B Vocal, MiniMax Music 3 DiT.
 */

export const MUSIC_STYLES_CATALOG = [
  // ── 1. NEO-SOUL & MIDNIGHT HIP-HOP JAZZ ──
  {
    id: "style_neo_soul_midnight",
    name: "Midnight Neo-Soul & Hip-Hop Jazz",
    category: "Neo-Soul & Hip-Hop Jazz",
    originUrl: "https://youtu.be/sdEWXVUb7a8",
    referenceArtists: "Lauryn Hill, The Fugees, D'Angelo, J Dilla, Erykah Badu",
    badge: "90s Organic Soul",
    color: "from-amber-600 to-amber-950",
    coverUrl: "/assets/cinema/studio_digital_s35.webp",
    description: "Session nocturne acoustique et hip-hop jazz inspirée de l'âge d'or de Lauryn Hill. Accords de Rhodes soyeux, ligne de basse Fender Jazz ronde et chaleureuse, groove MPC 16-beat laid-back avec craquement de vinyle, trompette feutrée et voix soul passionnée entre chant mélodique et rimes conscientes.",
    defaultBpm: 86,
    bpmRange: [80, 94],
    keySignature: "F minor",
    timeSignature: "4/4",
    suggestedModel: "ace-step-v35",
    instruments: {
      rhythm: ["MPC 3000 swing boom-bap drums", "vintage snare with analog snap", "soft hi-hat rolls", "handclaps"],
      bass: ["Fender Jazz Bass electric warm tone", "sub-frequency roll-off", "subtle finger slides"],
      harmony: ["Fender Rhodes Mark I electric piano", "Hammond B3 organ swells", "warm jazz guitar comping"],
      melody: ["Muted jazz trumpet with Harmon mute", "smoky tenor saxophone", "expressive soulful vocal lead"],
      textures: ["Vinyl crackle noise", "analog tape saturation", "warm room plate reverb"]
    },
    vocalProfile: {
      style: "Expressive Neo-Soul lead with dynamic vocal runs, silky falsetto and introspective spoken/rap cadence",
      language: "en",
      gender: "female",
      effects: "Vintage analog tape delay, warm tube saturation, subtle plate reverb"
    },
    structure: [
      { name: "Intro", bars: 4, desc: "Fender Rhodes chords solo with vinyl crackle and muted trumpet riff" },
      { name: "Verse 1", bars: 8, desc: "Boom-bap drums and warm electric bass drop in; introspective melodic soul vocals" },
      { name: "Chorus", bars: 8, desc: "Full lush vocal harmonies, organ swell, trumpet counter-melodies and deep groove" },
      { name: "Verse 2", bars: 8, desc: "Rhythmic cadence shifts to spoken-word hip-hop jazz flow with responsive bass licks" },
      { name: "Bridge", bars: 8, desc: "Stripped down drums; intimate Rhodes arpeggios, soaring vocal falsetto crescendo" },
      { name: "Chorus", bars: 8, desc: "Climactic ensemble chorus with rich multi-layered backing vocals and brass fills" },
      { name: "Outro", bars: 4, desc: "Solo tenor saxophone improvisation fading over hypnotic Rhodes groove and vinyl warmth" }
    ],
    masterPrompt: "Soulful 90s neo-soul and hip-hop jazz session, warm Fender Rhodes chords, deep round electric bassline, laid-back boom-bap drum groove with MPC swing, vinyl crackle, smoky muted trumpet, soulful expressive female vocals with rich harmonies, 86 BPM, in F minor, analog studio warmth",
    negativePrompt: "EDM synth, aggressive distorted bass, autotune metallic voice, trap hi-hat rolls, harsh highs, muddy mix, thin digital sound",
    lyricsTemplate: `[Intro]
(Soft vinyl crackle, gentle Rhodes chords, distant trumpet cries)
Yeah... under the midnight lamp.
Listen closely.

[Verse 1]
Streetlights flickering across the rain-slicked avenue
Carrying the echoes of the promises we never knew
My fingers tracing melodies across the piano keys
Looking for the solace in the autumn evening breeze
Words unspoken drifting in the purple evening mist
Finding all the answers in the moments that we missed.

[Chorus]
Hold on to the midnight soul
Let the warm vibrations make the broken spirit whole
Through the shadows, through the jazz and the pain
We rise above the sorrow like the sun above the rain.

[Verse 2]
Rhythm in the heartbeat, poetry inside the verse
Sometimes the blessing feels heavier than the curse
They look for revolution in the headlines on the screen
While we cultivate the gardens in the space between.

[Bridge]
(Soaring vocal harmonies, Rhodes ascending arpeggios)
Let the horn cry out, let the bassline breathe
There's a freedom waiting only lovers can conceive.

[Chorus]
Hold on to the midnight soul
Let the warm vibrations make the broken spirit whole
Through the shadows, through the jazz and the pain
We rise above the sorrow like the sun above the rain.

[Outro]
(Muted trumpet improvisation, Rhodes fadeout, soft cymbal decay)
Midnight soul... stay right here.`
  },

  // ── 2. DEEP AMBIENT & SOULFUL AMAPIANO ──
  {
    id: "style_deep_amapiano_ambient",
    name: "Deep Ambient & Soulful Amapiano",
    category: "Amapiano & South African House",
    originUrl: "https://youtu.be/jwillgJl4Ow",
    referenceArtists: "Kelvin Momo, Babalwa M, MDU aka TRP, Bongza, Soa Mattrix",
    badge: "Private School Amapiano",
    color: "from-blue-600 to-indigo-950",
    coverUrl: "/assets/cinema/modular_8k_digital.webp",
    description: "Le son 'Private School' sud-africain d'une élégance absolue. Nappes ambiantes immersives, accords de piano jazz complexe (9th et 11th), shakers polyrythmiques hypnotiques et un Log Drum feutré et profond qui sculpte les infrabasses sans agressivité.",
    defaultBpm: 113,
    bpmRange: [110, 116],
    keySignature: "Ab minor",
    timeSignature: "4/4",
    suggestedModel: "ace-step-v35",
    instruments: {
      rhythm: ["Precision syncopated South African shakers", "soft wooden rimshots", "subtle bongo and conga polyrhythms", "laid-back soft 4-on-the-floor kick"],
      bass: ["Signature pitched FM Log Drum with warm resonance", "deep smooth sub-bass glides"],
      harmony: ["Jazz grand piano with extended 9th/11th voicings", "lush wide atmospheric ambient synth pads", "reedy Rhodes electric piano"],
      melody: ["Airy soprano saxophone runs", "gentle jazz flute", "subtle spiritual vocal whispers"],
      textures: ["Lush stereo reverb tails", "warm analog chorus", "spatial ambient air"]
    },
    vocalProfile: {
      style: "Ethereal, whispered and soul-stirring South African vocal chants and harmonies",
      language: "zu", // Zulu
      gender: "female",
      effects: "Deep hall reverb, wide ping-pong stereo delay, airy high-shelf boost"
    },
    structure: [
      { name: "Intro", bars: 8, desc: "Atmospheric ambient pads, soft shaker pattern entering at bar 4, delicate jazz piano chords" },
      { name: "Build", bars: 8, desc: "Wooden rimshots and conga polyrhythms emerge; vocal chant introduces the mood" },
      { name: "Drop (Log Drum)", bars: 16, desc: "Signature deep warm FM Log Drum rolls enter with sub glides beneath emotional piano chords" },
      { name: "Vocal Section", bars: 16, desc: "Soulful Zulu female vocal harmonies floating over rhythmic shaker and walking log drum bass" },
      { name: "Breakdown", bars: 8, desc: "Log drum cuts out; lush ambient piano solo with airy saxophone fills and wide reverb" },
      { name: "Second Drop", bars: 16, desc: "Full rhythmic power returns with complex rolling log drum patterns and ecstatic piano riffs" },
      { name: "Outro", bars: 8, desc: "Gradual decrescendo into ambient pads and solitary jazz piano chords" }
    ],
    masterPrompt: "Private school soulful deep amapiano, warm resonant FM log drum with deep sub glides, lush jazz grand piano chords with 9th and 11th voicings, syncopated South African shakers, ethereal ambient synth pads, soft sax fills, emotional atmospheric lounge vibe, 113 BPM, in Ab minor, pristine studio acoustics",
    negativePrompt: "Harsh distorted bass, aggressive festival drop, abrasive screeching leads, eurodance synth, chaotic tempo",
    lyricsTemplate: `[Intro]
(Atmospheric ambient pads, whispering shaker, distant jazz chords)
Thula... moya wami...
(Peace, my spirit...)

[Verse 1]
Ebusuku lapho kuthula khona
(In the night where silence lives)
Umoya wami uyaphefumula
(My soul begins to breathe)
Izinkanyezi zikhanya kude
(The stars are shining far away)
Zisikhumbuza lapho sivela khona
(Reminding us where we came from.)

[Chorus]
(Deep log drum glides enter under emotional piano)
Ngiyabonga, ngiyabonga empilweni
(I am grateful, grateful for this life)
Ukuthula kwenhliziyo kuhlala nami
(The peace in my heart remains with me)
Zizwe umculo uhamba egazini
(Feel the music moving through the veins)
Kuhle kakhulu, thula moya.
(It is so beautiful, quiet spirit.)

[Bridge]
(Ambient piano solo, soprano saxophone whisper)
Sondela eduze... yizwa umoya...
(Come closer... feel the spirit...)

[Chorus]
Ngiyabonga, ngiyabonga empilweni
Ukuthula kwenhliziyo kuhlala nami
Zizwe umculo uhamba egazini
Kuhle kakhulu, thula moya.

[Outro]
(Log drum fades, lingering jazz chord, soft shaker decay)
Moya wami... thula.`
  },

  // ── 3. EMOTIONAL WEST AFRICAN KORA & MANDINGUE CHOIR ──
  {
    id: "style_kora_choir_mandeng",
    name: "Emotional West African Kora & Griot Choir",
    category: "West African Roots & Griot",
    originUrl: "https://youtu.be/Q5K5Ci_qLAk",
    referenceArtists: "Ballaké Sissoko, Sona Jobarteh, Toumani Diabaté, Baobab Roots Collective",
    badge: "Mandingue Roots",
    color: "from-emerald-700 to-amber-900",
    coverUrl: "/assets/cinema/studio_digital_s35.webp",
    description: "Sérénité et transcendance des racines mandingues d'Afrique de l'Ouest. Harpe-luth Kora 21 cordes cristalline exécutant des arpèges virtuoses et des ostinatos hypnotiques, portée par des chœurs polyphoniques majestueux, la pulsation douce de la calebasse et la profondeur boisée d'une contrebasse acoustique.",
    defaultBpm: 98,
    bpmRange: [90, 105],
    keySignature: "F major",
    timeSignature: "6/8",
    suggestedModel: "sahelian-groove",
    instruments: {
      rhythm: ["Hollow calabash water drum percussion", "talking drum (tama) subtle pitch bends", "shekere shakers", "soft djembe bass tones"],
      bass: ["Warm acoustic upright bass", "acoustic guitar bass-string ostinatos"],
      harmony: ["Secondary acoustic nylon-string guitar", "ngoni lute counterpoint", "traditional balafon with gourd buzz"],
      melody: ["21-string harp-lute Kora virtuoso picking", "soaring Mandé choral polyphony", "Fulani pastoral flute (tambin)"],
      textures: ["Natural wooden room ambiance", "river stream field recordings", "pure acoustic resonance"]
    },
    vocalProfile: {
      style: "Majestic West African griot choral harmony with call-and-response lead vocal",
      language: "fr", // Or Bambara
      gender: "female",
      effects: "Rich cathedral-like acoustic space, natural warm room reflections"
    },
    structure: [
      { name: "Intro", bars: 8, desc: "Solo Kora birimintingo improvisations over gentle calabash water drops" },
      { name: "Theme A", bars: 8, desc: "Steady 6/8 kumbengo groove establishes with acoustic bass and warm ngoni chords" },
      { name: "Choral Verse", bars: 12, desc: "Polyphonic Mandingue choir sings ancestral melody in call-and-response" },
      { name: "Kora Solo", bars: 8, desc: "High-speed cascading Kora arpeggios demonstrating griot mastery" },
      { name: "Choral Chorus", bars: 12, desc: "Full choir harmonizes in ecstatic celebration accompanied by joyous balafon accents" },
      { name: "Flute Bridge", bars: 8, desc: "Tambin (Fulani flute) weaves pastoral melody over soft calabash pulse" },
      { name: "Final Chorus", bars: 12, desc: "Magnificent unified choral finale with Kora counter-melodies" },
      { name: "Outro", bars: 8, desc: "Kora returns to quiet cyclical ostinato gently decaying into peaceful silence" }
    ],
    masterPrompt: "Majestic West African acoustic roots, 21-string Kora harp-lute virtuoso fingerpicking, uplifting Mandingue polyphonic choir, resonant calabash percussion, warm acoustic upright bass, wooden balafon accents, pastoral Fulani flute, spiritual peaceful focus music, 98 BPM in 6/8 time signature, F major mode, pure organic acoustic recording",
    negativePrompt: "Electronic beats, synthesizers, distortion, auto-tune, metallic drums, aggressive bass, modern trap",
    lyricsTemplate: `[Intro]
(Crystalline Kora harp arpeggios, gentle calabash pulse)
Kora djeliya... barika.

[Verse 1]
Sur les rives du grand fleuve où s'endorment les géants
Le chant des anciens traverse les tourments du temps
Chaque corde de la kora porte la voix d'un aïeul
Qui nous rappelle qu'en ce monde nul ne marche seul
Bénis soient les cœurs qui écoutent le murmure du vent
Et trouvent la paix au creux des mots réconfortants.

[Chorus]
(Polyphonic West African choir enters with radiant warmth)
Barika, barika lafia...
(Bénédiction et paix sur la terre...)
Que la musique élève les âmes vers la lumière
Un baobab millénaire qui veille sur nos pas
Dans l'harmonie sacrée que nul n'oubliera.

[Verse 2]
La calebasse résonne comme un battement du cœur
Chassant les ombres et guérissant la douleur
Les doigts du griot dessinent un ciel infini
Où chaque note est une prière pour la vie.

[Bridge]
(Virtuoso Kora cascade, Fulani pastoral flute solo)
Écoute la sagesse du silence et de l'eau
L'âme retrouve son chemin vers le plus haut.

[Chorus]
Barika, barika lafia...
Que la musique élève les âmes vers la lumière
Un baobab millénaire qui veille sur nos pas
Dans l'harmonie sacrée que nul n'oubliera.

[Outro]
(Kora ostinato slowly fading with river sounds)
Barika... lafia don...`
  },

  // ── 4. UPLIFTING WEST AFRICAN KORA & BALAFON ROOTS ──
  {
    id: "style_kora_roots_uplifting",
    name: "Uplifting West African Kora & Balafon Roots",
    category: "West African Roots & Griot",
    originUrl: "https://youtu.be/KnByeN2y2d4",
    referenceArtists: "Toumani Diabaté, Ballaké Sissoko, Kandia Kouyaté, Sekou Kouyate",
    badge: "Griot Heritage",
    color: "from-yellow-600 to-amber-800",
    coverUrl: "/assets/cinema/modular_8k_digital.webp",
    description: "Célébration chaleureuse et lumineuse du patrimoine griot d'Afrique de l'Ouest. Dialogue mélodique vif entre la Kora et le Balafon aux lames de bois de rose résonnantes, porté par une pulsation 12/8 festive, des percussions douces et une guitare mandingue aux phrasés dansants.",
    defaultBpm: 104,
    bpmRange: [98, 112],
    keySignature: "C major",
    timeSignature: "12/8",
    suggestedModel: "sahelian-groove",
    instruments: {
      rhythm: ["Calabash struck with soft mallets", "djembe tone and slap accents", "caxixi woven shakers"],
      bass: ["Acoustic upright bass walking in 12/8", "acoustic guitar bass ostinato"],
      harmony: ["Traditional Mandé acoustic guitar picking", "resonant wooden Balafon chords"],
      melody: ["21-string Kora intricate melody", "wooden Balafon running polyrhythmic lines", "joyous griot vocal calls"],
      textures: ["Natural gourd mirliton buzz", "warm dry wooden room"]
    },
    vocalProfile: {
      style: "Uplifting, soulful griot vocal expressions with joyful celebratory inflections",
      language: "fr",
      gender: "male",
      effects: "Natural room acoustics, warm harmonic saturation"
    },
    structure: [
      { name: "Intro", bars: 4, desc: "Balafon sparkling intro joined by rapid Kora response" },
      { name: "Groove Entry", bars: 8, desc: "Calabash and djembe lock into a swinging 12/8 West African rhythm" },
      { name: "Theme", bars: 8, desc: "Kora and Balafon play memorable harmonized melodic theme in thirds" },
      { name: "Vocal Chant", bars: 8, desc: "Uplifting lead vocal with choir answering in traditional Mandé style" },
      { name: "Balafon Solo", bars: 8, desc: "High-energy Balafon improvisation with vibrating gourd resonance" },
      { name: "Ensemble Climax", bars: 12, desc: "All instruments unite in a driving, celebratory rhythmic celebration" },
      { name: "Outro", bars: 4, desc: "Harmonized final chord resolving gracefully on the open tonic" }
    ],
    masterPrompt: "Uplifting West African acoustic folk, dialogue between 21-string Kora and traditional wooden Balafon, warm calabash and djembe percussion, nylon acoustic guitar picking, joyful griot celebration, 104 BPM, 12/8 polyrhythmic groove, in C major, organic pristine warmth",
    negativePrompt: "Synthesizers, electronic drums, EDM drops, distortion, cold digital instruments",
    lyricsTemplate: `[Intro]
(Joyous Balafon melody with vibrating buzz, sparkling Kora reply)

[Verse 1]
Le soleil se lève sur les collines dorées
Emportant les doutes et les peines du passé
Le balafon réveille la terre nourricière
Et la kora tisse un fil entre ciel et poussière.

[Chorus]
(Joyful uplifting choir and dancing rhythm)
Danse sous la lumière, embrasse l'espérance
Dans chaque note résonne notre renaissance
Que la joie demeure et que le chant s'élève
Plus fort que la nuit, plus doux que le rêve !

[Outro]
(Harmonious Balafon and Kora finale)`
  },

  // ── 5. HIGH-ENERGY CLUB & BACARDI AMAPIANO ──
  {
    id: "style_club_amapiano_bacardi",
    name: "High-Energy Club & Bacardi Amapiano",
    category: "Amapiano & South African House",
    originUrl: "https://youtu.be/O1sU1F6dZNk",
    referenceArtists: "DJ Phaphane, Uncle Waffles, Tyler ICU, Musa Keys, Vigro Deep",
    badge: "Paris Nights / Bacardi",
    color: "from-[#df9c43] to-amber-950",
    coverUrl: "/assets/cinema/studio_digital_s35.webp",
    description: "L'énergie volcanique des clubs de Johannesburg et des nuits parisiennes. Log Drums ultra-percutants, distordus et agressifs, sifflets de stade (stadium whistles), percussions Bacardi frénétiques, caisses claires roulantes et chants festifs scandés qui enflamment les pistes de danse.",
    defaultBpm: 116,
    bpmRange: [114, 120],
    keySignature: "G minor",
    timeSignature: "4/4",
    suggestedModel: "minimax-h3",
    instruments: {
      rhythm: ["Punchy 4-on-the-floor kick", "frantic Bacardi percussions", "stadium metal whistles", "rapid snare rolls", "crisp syncopated shakers"],
      bass: ["Distorted heavy FM Log Drum with aggressive attack", "sub-bass divebombs"],
      harmony: ["Staccato piano stabs", "bright synth brass brassy hits", "pitch-bent synth lead"],
      melody: ["Catchy repetitive whistle hooks", "energetic vocal chants and hype cries"],
      textures: ["Club reverb risers", "laser impacts", "crowd cheering energy"]
    },
    vocalProfile: {
      style: "Energetic club chants, rhythmic call-outs, infectious hype phrases in South African slang",
      language: "zu",
      gender: "male",
      effects: "Tight short room reverb, aggressive compression, subtle saturation"
    },
    structure: [
      { name: "Intro", bars: 8, desc: "Building kick and fast shaker with stadium whistle accents" },
      { name: "Snare Roll Build", bars: 8, desc: "Ascending snare rolls and hype vocals ramping up intensity" },
      { name: "Drop (Aggressive Log Drum)", bars: 16, desc: "Heavy distorted FM log drum hits full throttle with driving Bacardi beat" },
      { name: "Chant Section", bars: 16, desc: "Crowd vocal chant over locked groove and staccato brass stabs" },
      { name: "Whistle Breakdown", bars: 8, desc: "Kick cuts out; solo whistle and rapid percussion roll" },
      { name: "Second Monster Drop", bars: 16, desc: "Maximum club energy with wild pitch-shifting log drums and synth sirens" },
      { name: "Outro", bars: 8, desc: "Drums gradually strip back leaving rolling shaker and whistle echo" }
    ],
    masterPrompt: "High-energy festival club amapiano, explosive distorted FM log drums, Bacardi percussion groove, stadium referee whistles, staccato piano stabs, urgent South African vocal chants, 116 BPM, in G minor, club sound system punch, massive sub-bass impact",
    negativePrompt: "Slow tempo, sleepy ambient pads, acoustic folk, gentle lullaby, weak drums",
    lyricsTemplate: `[Intro]
(Referee whistle piercing through, fast driving shakers)
Amapiano to the world!
Paris nights! Asambe!

[Verse 1]
(Crowd hype vocals, ascending snare roll)
Yebo! Zwana le sound!
(Yes! Hear this sound!)
Shaya phansi, shaya phezulu!
(Hit the floor, hit the sky!)
One, two, three, let's go!

[Drop]
(Monster distorted Log Drum hits with thunderous power)
Wena! Shaya log drum!
Tsiki tsiki tsiki, ha!
Wena! Shaya log drum!
Tsiki tsiki tsiki, ha!

[Outro]
(Whistle blast, echoing kick, fading cheers)
Amapiano to the world!`
  },

  // ── 6. QUINTESSENTIAL SOULFUL AMAPIANO (WEEKEND AWAY) ──
  {
    id: "style_soulful_amapiano_private_school",
    name: "Soulful Amapiano 'Weekend Away'",
    category: "Amapiano & South African House",
    originUrl: "https://youtu.be/4h4qEh3_WIY",
    referenceArtists: "De Mthuda, Kelvin Momo, Kabza De Small, DJ Maphorisa, Samthing Soweto",
    badge: "Fine Champagne",
    color: "from-amber-500 to-amber-900",
    coverUrl: "/assets/cinema/modular_8k_digital.webp",
    description: "Le sommet du raffinement 'Fine Champagne' d'Amapiano. Piano à queue jazzy virtuose aux phrasés limpides, chant gospel d'une ferveur poignante, percussions chirurgicales d'orfèvre et un Log Drum mélodique qui dialogue harmonieusement avec la basse fretless.",
    defaultBpm: 114,
    bpmRange: [112, 115],
    keySignature: "Eb minor",
    timeSignature: "4/4",
    suggestedModel: "ace-step-v35",
    instruments: {
      rhythm: ["Crisp dual-layer shakers", "classic amapiano rimshot on beat 3", "warm conga slap", "soft punchy kick"],
      bass: ["Warm melodic FM Log Drum with controlled low-end", "supporting electric fretless bass"],
      harmony: ["Acoustic grand piano jazzy chords and runs", "vintage electric piano", "subtle string ensemble"],
      melody: ["Expressive vocal lead with rich emotional gospel vibrato", "warm muted saxophone"],
      textures: ["Velvety studio saturation", "wide air EQ", "subtle analog tape flutter"]
    },
    vocalProfile: {
      style: "Warm, emotional South African soulful vocal with gospel-tinged lead and soaring harmonies",
      language: "zu",
      gender: "female",
      effects: "Rich stereo reverb, subtle optical compression, crystalline vocal presence"
    },
    structure: [
      { name: "Intro", bars: 8, desc: "Solo jazz grand piano chords with subtle Rhodes backing and distant shaker" },
      { name: "Verse 1", bars: 8, desc: "Soulful female vocal introduces the emotional theme over gentle rimshots" },
      { name: "Chorus", bars: 8, desc: "Gorgeous full vocal harmonies soar; piano plays flowing counter-melodies" },
      { name: "Drop (Melodic Log Drum)", bars: 16, desc: "Smooth, perfectly sculpted Log Drum enters, carrying the groove effortlessly" },
      { name: "Piano Solo", bars: 8, desc: "Virtuoso jazz piano solo demonstrating deep harmonic knowledge" },
      { name: "Final Chorus & Drop", bars: 16, desc: "Unification of full vocal choir, walking log drum, and joyful piano accents" },
      { name: "Outro", bars: 8, desc: "Delicate piano resolution with soft fading shaker" }
    ],
    masterPrompt: "Soulful amapiano fine champagne sound, elegant acoustic grand piano jazz runs, melodic resonant FM log drum, emotional South African gospel vocal harmonies, precise syncopated shakers, warm rimshots, 114 BPM, in Eb minor, luxurious warm studio production",
    negativePrompt: "Abrasive distortion, harsh synth leads, cheap EDM sound, tinny drums, muddy low-end",
    lyricsTemplate: `[Intro]
(Sweet grand piano chords, quiet shaker)
Weekend away... just you and me.

[Verse 1]
Sihamba kude nalomsindo wedolobha
(We are going far away from the city noise)
Sibheke lapho ulwandle luhlangana khona
(Heading where the ocean meets the sky)
Inhliziyo yami igcwele injabulo
(My heart is full of joy)
Lapho nginawe akukho ukwesaba.
(When I am with you, there is no fear.)

[Chorus]
(Log drum drops smoothly under rich piano harmonies)
Ngithanda wena njalo, sthandwa sami
(I love you always, my beloved)
Lomculo wethu uyohlala njalo
(This song of ours will last forever)
Weekend away, lapho uthando lukhona.
(Weekend away, where love lives.)

[Outro]
(Solo piano arpeggio fading with sunset warmth)`
  },

  // ── 7. MODERN NAIJA AFROBEATS & AFRO-FUSION ──
  {
    id: "style_modern_naija_afrobeats",
    name: "Modern Naija Afrobeats Hitmaker",
    category: "Afrobeats & Afro-Pop",
    originUrl: "https://youtu.be/16lOqq4jipw",
    referenceArtists: "Burna Boy, Rema, Ayra Starr, Davido, Asake, Wizkid",
    badge: "Top Naija 2026",
    color: "from-[#b87524] to-amber-800",
    coverUrl: "/assets/cinema/studio_digital_s35.webp",
    description: "Le son Afrobeats moderne numéro 1 des charts mondiaux. Groove percussif irrésistible avec talking drum (gangan), rimshots syncopés, cocottes de guitare highlife scintillantes, basse 808 mélodique rebondissante et refrains ultra-accrocheurs en pidgin anglais et yoruba.",
    defaultBpm: 104,
    bpmRange: [100, 108],
    keySignature: "G minor",
    timeSignature: "4/4",
    suggestedModel: "yue2-3b",
    instruments: {
      rhythm: ["Afrobeats syncopated cross-stick", "bouncing punchy kick", "talking drum (gangan) pitch sweeps", "shekere and woodblocks"],
      bass: ["Melodic tuned 808 bassline with harmonic saturation", "sub-bass groove"],
      harmony: ["Sparkling clean electric guitar highlife riffs", "warm electric Rhodes chords", "festive synth brass stabs"],
      melody: ["Silky autotuned lead vocals", "falsetto hook", "catchy horn section riffs"],
      textures: ["Crisp modern radio polish", "stereo claps", "short reverb plates"]
    },
    vocalProfile: {
      style: "Infectious Afropop lead with memorable melodic hooks, smooth pitch-correction and call-and-response backing vocals",
      language: "en", // Pidgin English
      gender: "male",
      effects: "Modern pop auto-tune, parallel vocal compression, stereo doubling on chorus"
    },
    structure: [
      { name: "Intro", bars: 4, desc: "Clean highlife guitar lick with vocal signature ad-libs and talking drum roll" },
      { name: "Verse 1", bars: 8, desc: "Bouncing Afrobeats rhythm enters with melodious storytelling in Pidgin English" },
      { name: "Pre-Chorus", bars: 4, desc: "Snare build with climbing chords creating anticipation" },
      { name: "Chorus", bars: 8, desc: "Massive catchy vocal hook, horn stabs and driving 808 bassline" },
      { name: "Verse 2", bars: 8, desc: "Rhythmic cadence intensifies with syncopated talking drum answers" },
      { name: "Chorus", bars: 8, desc: "Explosive chorus with layered harmonies and joyful ad-libs" },
      { name: "Bridge", bars: 8, desc: "Stripped groove, guitar arpeggio and emotional falsetto delivery" },
      { name: "Final Chorus", bars: 8, desc: "Full energy anthem with ad-libs and brass fanfare" },
      { name: "Outro", bars: 4, desc: "Guitar riff resolves with signature talking drum sign-off" }
    ],
    masterPrompt: "Top Naija modern afrobeats hit, infectious bouncing drum groove with talking drum accents, sparkling clean highlife electric guitar licks, deep melodic 808 bassline, brass stabs, catchy autotuned Afro-fusion vocals with infectious chorus hook, 104 BPM, in G minor, chart-topping radio polish",
    negativePrompt: "Heavy metal, rock distortion, harsh noise, off-key singing, dry dull mix",
    lyricsTemplate: `[Intro]
(Sparkling highlife guitar lick, talking drum roll)
Yeah, you already know the vibe!
Otilo! Let's go!

[Verse 1]
Early in the morning when the sun dey rise
I see the blessing shining in your eyes
Nobody fit to tell me say my joy go end
Every little struggle na the road to bend
I say make you dance, make you shake off the load
We go dey groove all the way down the road.

[Pre-Chorus]
(Talking drum swelling, energetic snare build)
Dem say water no get enemy
Tonight na celebration of the energy!

[Chorus]
(Full brass, bouncing 808 bass, massive hook)
Omo no dulling tonight, we dey feel the groove
Every single body in the room dey move
From Lagos to the world, hear the melody
Living life to the fullest with no remedy!
Oya dance, oya move, make you feel the sound
Good vibration everywhere around!

[Bridge]
(Clean guitar solo, silky falsetto)
No matter where you go, remember where you from
After the storm, the sunshine must surely come.

[Chorus]
Omo no dulling tonight, we dey feel the groove
Every single body in the room dey move
From Lagos to the world, hear the melody
Living life to the fullest with no remedy!

[Outro]
(Guitar flourish, talking drum hit)
Oya na, we out!`
  },

  // ── 8. MELODIC AFRO-FUSION & STREET POP NAIJA ──
  {
    id: "style_afro_fusion_melodic",
    name: "Melodic Afro-Fusion & Fuji-Pop",
    category: "Afrobeats & Afro-Pop",
    originUrl: "https://youtu.be/yaie5Uia4k8",
    referenceArtists: "Asake, Fireboy DML, Omah Lay, Rema, Kizz Daniel",
    badge: "Fuji-Pop / Amapiano Fusion",
    color: "from-amber-600 to-amber-900",
    coverUrl: "/assets/cinema/modular_8k_digital.webp",
    description: "La fusion révolutionnaire qui a transformé la scène mondiale. Violons dramatiques et chœurs fuji grandioses (signature Asake), mélodies mélancoliques Afro-R&B, log drum percutant emprunté à l'Amapiano et percussions yoruba traditionnelles créant une intensité spirituelle et festive.",
    defaultBpm: 108,
    bpmRange: [104, 112],
    keySignature: "A minor",
    timeSignature: "4/4",
    suggestedModel: "yue2-3b",
    instruments: {
      rhythm: ["Fast syncopated Afrobeats snare and rimshot", "shakers", "congas and bongo fills", "agogô bell"],
      bass: ["Heavy sliding Log Drum layered with round sub-bass"],
      harmony: ["Dramatic orchestral string section", "acoustic nylon guitar", "bright organ stabs"],
      melody: ["Operatic Fuji choir chants", "melancholic Arabic/Yoruba violin runs", "expressive lead vocal"],
      textures: ["Church hall reverb", "crowd chorus response", "high-energy vinyl tape warmth"]
    },
    vocalProfile: {
      style: "Dramatic Fuji-style chant mixed with soulful contemporary R&B vocal delivery and massive choir hooks",
      language: "yo", // Yoruba & Pidgin
      gender: "male",
      effects: "Rich choral reverberation, harmonic exciter, vocal doubling"
    },
    structure: [
      { name: "Intro", bars: 4, desc: "Dramatic orchestral violin melody joined by Fuji crowd choir chanting" },
      { name: "Verse 1", bars: 8, desc: "Melodic lead vocal over nylon guitar and subtle shaker; storytelling of ambition" },
      { name: "Drop (Log Drum & Fuji)", bars: 16, desc: "Thunderous fusion of Amapiano log drum with soaring violins and ecstatic choir" },
      { name: "Verse 2", bars: 8, desc: "Rapid syncopated flow with street-smart Yoruba proverbs and clapping" },
      { name: "Drop 2", bars: 16, desc: "Full power fuji-pop explosion with horn section, choir and rolling log drums" },
      { name: "Outro", bars: 4, desc: "Triumphant violin crescendo fading into joyful choir chanting" }
    ],
    masterPrompt: "Epic melodic Afro-fusion and Fuji-pop, dramatic orchestral violins, powerful choir chant, heavy sliding amapiano log drum, syncopated Afrobeats percussion, nylon acoustic guitar, spiritual uplifting celebration, 108 BPM, in A minor, stadium-filling modern production",
    negativePrompt: "Flat drums, weak vocals, cheap MIDI strings, boring tempo, harsh distortion",
    lyricsTemplate: `[Intro]
(Dramatic cinematic violins, echoing choir chant)
Omo Oloore... egbé e dide!
(Children of grace... stand up!)

[Verse 1]
From the trenches to the palace, see the story unfold
Every tear that was cried turned to diamonds and gold
I dey pray to Olodumare every day and night
Make my blessing shine like the morning light
Through the struggle and the rain, we keep holding the ground
Now the victory song is the only sound!

[Chorus]
(Heavy Log Drum drops with soaring violins and massive crowd choir)
Orin ope l'a o ma ko!
(We will sing songs of thanksgiving!)
Every day we celebrate, no dulling tomorrow!
From the mainland to the island, hear the people shout
This is what the blessing and the grace is about!

[Outro]
(Epic violin crescendo, joyous choir chanting)
Ope lo ye o... Olodumare!`
  },

  // ── 9. CONGOLESE RUMBA & SEBEN ÉLECTRIQUE ──
  {
    id: "style_congolese_rumba_seben",
    name: "Modern Congolese Rumba & Seben",
    category: "Congolese Rumba & Soukous",
    originUrl: "https://youtu.be/vvDxhydx4Jk",
    referenceArtists: "Fally Ipupa, Koffi Olomidé, Ferré Gola, Héritier Watanabe, Cindy Le Cœur",
    badge: "Rumba & Seben",
    color: "from-red-600 to-amber-700",
    coverUrl: "/assets/cinema/studio_digital_s35.webp",
    description: "L'art royal de Kinshasa : la Rumba Congolaise moderne avec sa transition mythique vers le Seben dansant. Guitares solo cristallines jouées au médiator avec chorus et réverbe, basse slapping hyper mélodique, voix de crooner en lingala passionné et montée extatique vers le Seben endiablé.",
    defaultBpm: 92, // Seben ramps to 118
    bpmRange: [88, 122],
    keySignature: "C major",
    timeSignature: "4/4",
    suggestedModel: "sahelian-groove",
    instruments: {
      rhythm: ["Congolese rumba clave pattern", "acoustic congas (tumbadoras)", "crisp snare and rimshots", "shakers and cowbell"],
      bass: ["Virtuoso melodious electric bass guitar with slapping and thumb pops"],
      harmony: ["Rhythm electric guitar (guitare accompagnement) with bright clean tone", "mi-solo guitar arpeggios"],
      melody: ["Legendary Congolese solo lead guitar with chorus and digital delay", "crooner vocal lead with romantic vibrato", "4-part lingala vocal choir"],
      textures: ["Vintage Roland JC-120 clean chorus guitar tone", "warm studio concert reverb", "lively Kinshasa club energy"]
    },
    vocalProfile: {
      style: "Passionate Congolese crooner vocal lead with seductive romantic delivery, soaring melismas and polished vocal ensemble harmonies",
      language: "ln", // Lingala
      gender: "male",
      effects: "Rich stereo chorus, lush studio hall reverb, vocal warmth"
    },
    structure: [
      { name: "Part 1: Rumba Intro", bars: 8, desc: "Clean chorus electric guitar solo arpeggio introduces romantic melody over gentle clave" },
      { name: "Rumba Verse", bars: 12, desc: "Smooth, seductive Lingala vocals over flowing bassline and conga rhythm" },
      { name: "Rumba Chorus", bars: 8, desc: "Four-part vocal harmonies soar in romantic devotion with responsive guitar licks" },
      { name: "Transition / Dédicaces", bars: 4, desc: "Atalaku (animator) speaks rhythmically; bassline builds anticipation" },
      { name: "Part 2: SEBEN DROP!", bars: 24, desc: "Tempo kicks into high gear; dazzling solo guitar shreds sparkling cascading arpeggios over infectious dance beat" },
      { name: "Seben Vocal Climax", bars: 16, desc: "Chant and animation exchange rapidly with driving bass slap and syncopated cowbell" },
      { name: "Outro", bars: 8, desc: "Triumphant final guitar arpeggio flourish resolving on sustained chord" }
    ],
    masterPrompt: "Authentic modern Congolese Rumba transitioning into an ecstatic dancing Seben, sparkling clean electric solo guitar with chorus and delay, melodious slapping bassline, conga tumbadoras, rumba clave, passionate Lingala crooner vocals with 4-part choir harmonies, 92 BPM transitioning to 118 BPM, in C major, rich Kinshasa studio production",
    negativePrompt: "Synthesizer dance pop, aggressive trap beats, cold electronic distortion, out-of-tune guitar",
    lyricsTemplate: `[Intro - Rumba Douce]
(Guitare solo étincelante avec chorus, clave rumba feutrée)
Bolingo na ngai... écoute ce que mon cœur te dit.

[Verse 1 - Rumba]
Motema na ngai etondi na bolingo ya solo
(Mon cœur est rempli d'un amour véritable)
Lokola mbula ezali kokitela mabele na esengo
(Comme la pluie qui descend sur la terre avec joie)
Oza mwasi ya motuya, kitoko na yo eleki nionso
(Tu es une femme précieuse, ta beauté dépasse tout)
Ata mokili etumbi moto, yo nde kimia na ngai.
(Même si le monde brûle, tu es ma paix.)

[Chorus - Rumba]
(Harmonies sublimes à quatre voix)
Bolingo, bolingo ya motema
(L'amour, l'amour du cœur)
Tika ngai na linga yo kino suka ya mokili
(Laisse-moi t'aimer jusqu'à la fin du monde)
Maboko na yo epesi ngai makasi
(Tes bras me donnent la force)
Yo nde eloko na ngai ya motuya.

[Transition - Atalaku]
(Rythme s'accélère, la caisse claire roule !)
Attention... oyo ezali seben ya Kinshasa !
Bina, bina, tala libumu !

[SEBEN DROP - Guitare Solo Endiablée]
(Arpèges virtuoses de guitare en cascade, basse slapping survoltée !)
Bina seben ! Tokos ! Fimbu !
Bina seben ! Tokos ! Fimbu !

[Outro]
(Dernier accord de guitare suspendu avec écho)
Bolingo ya solo... Fally a lobi.`
  },

  // ── 10. CONGOLESE ACOUSTIC SOUL & LINGALA BALLAD ──
  {
    id: "style_congolese_acoustic_lingala",
    name: "Congolese Acoustic Soul & Lingala Ballad",
    category: "Congolese Rumba & Soukous",
    originUrl: "https://youtu.be/1WRngWW1MWM",
    referenceArtists: "Lokua Kanza, Papa Wemba (Acoustique), Jean Goubald, Fally Ipupa (Acoustic)",
    badge: "Lingala Fever / Love & Soul",
    color: "from-amber-700 to-amber-950",
    coverUrl: "/assets/cinema/modular_8k_digital.webp",
    description: "L'intimité bouleversante et apaisante de la chanson acoustique congolaise. Guitares en picking boisé et cordes nylon, percussions douces (shaker calebasse, balais sur caisse claire), voix veloutée et murmurée en lingala, harmonies pures et mélodies guérisseuses pour l'âme.",
    defaultBpm: 82,
    bpmRange: [75, 88],
    keySignature: "G major",
    timeSignature: "4/4",
    suggestedModel: "yue2-3b",
    instruments: {
      rhythm: ["Soft wire brushes on snare", "gentle seed shakers", "wooden cajón soft tap", "udu pot bass heartbeat"],
      bass: ["Warm acoustic upright bass with wooden resonance", "gentle sub tone"],
      harmony: ["Fingerpicked acoustic nylon-string guitar", "warm acoustic dreadnought chords", "soft upright piano"],
      melody: ["Velvety, intimate solo vocal in Lingala", "soft acoustic guitar fills", "sweet vocal hums and whispers"],
      textures: ["Warm room reverberation", "intimate microphone proximity effect", "pure organic silence between notes"]
    },
    vocalProfile: {
      style: "Intimate, tender, whispered and soulful vocal delivery with micro-vibrato and healing warmth",
      language: "ln",
      gender: "male",
      effects: "Gentle proximity warmth, intimate room ambiance, zero harshness"
    },
    structure: [
      { name: "Intro", bars: 4, desc: "Delicate fingerpicked nylon guitar with soft vocal humming" },
      { name: "Verse 1", bars: 8, desc: "Intimate voice enters like a secret whispered in the dusk" },
      { name: "Chorus", bars: 8, desc: "Sweet acoustic harmonies envelop the lead vocal with gentle cajón tap" },
      { name: "Verse 2", bars: 8, desc: "Upright bass joins; guitar weaves delicate counterpoint fills" },
      { name: "Guitar Bridge", bars: 8, desc: "Soulful, singing nylon-string acoustic guitar solo" },
      { name: "Final Chorus", bars: 8, desc: "Tender climax with ethereal vocal harmonies and soft shakers" },
      { name: "Outro", bars: 4, desc: "Solitary guitar chord decaying into peaceful quiet" }
    ],
    masterPrompt: "Intimate Congolese acoustic soul ballad, fingerpicked nylon acoustic guitar, soft brushes on snare, wooden upright bass, gentle seed shakers, velvety heartfelt whispered vocals in Lingala, healing relaxing love song, 82 BPM, in G major, warm microphone proximity, pristine organic acoustic space",
    negativePrompt: "Loud drums, electric instruments, auto-tune, synthesizers, shouting vocals, harsh treble",
    lyricsTemplate: `[Intro]
(Delicate acoustic guitar picking, gentle humming)
Mmmh... motema zala na kimia.
(Cœur, sois en paix.)

[Verse 1]
Kati na butu oyo ya kimia
(Dans cette nuit de paix)
Naza ko kanisa yo na esengo
(Je pense à toi avec joie)
Maloba na yo ezali lokola mafuta
(Tes paroles sont comme un baume)
Ekitisaka motema na ngai.
(Qui apaise mon cœur.)

[Chorus]
(Soft acoustic harmonies, gentle cajón pulse)
Loba na ngai lisusu, bolingo na ngai
(Parle-moi encore, mon amour)
Tika kimia etonda na motema
(Laisse la paix remplir le cœur)
Ata mikakatano ebele na mokili
(Même s'il y a tant d'épreuves dans ce monde)
Bolingo na yo ezali libonza na ngai.
(Ton amour est mon trésor.)

[Bridge]
(Soulful nylon guitar solo, warm upright bass)
Nalingi yo... nalingi yo mingi.

[Chorus]
Loba na ngai lisusu, bolingo na ngai
Tika kimia etonda na motema
Ata mikakatano ebele na mokili
Bolingo na yo ezali libonza na ngai.

[Outro]
(Gentle guitar picking fading into silence)
Kimia... bolingo... motema na ngai.`
  },

  // ── 11. TRADITIONAL MALIAN BALAFON SERENITY ──
  {
    id: "style_mali_balafon_serenity",
    name: "Mali Serenity Traditional Balafon",
    category: "West African Roots & Griot",
    originUrl: "https://youtu.be/RK4twaQJrMI",
    referenceArtists: "Neba Solo, Aly Keita, Lassana Diabaté, Trio Da Kali",
    badge: "Bambara Serenity",
    color: "from-amber-600 to-yellow-900",
    coverUrl: "/assets/cinema/studio_digital_s35.webp",
    description: "Méditation ancestrale au son du Balafon malien traditionnel en bois de guénou. Polyrythmies hypnotiques des lames de bois résonnant sur calebasses avec mirlitons naturels (léger grésillement noble), accompagnées de la calebasse frappée et de la flûte peule au bord du fleuve Niger.",
    defaultBpm: 102,
    bpmRange: [96, 114],
    keySignature: "D minor",
    timeSignature: "12/8",
    suggestedModel: "sahelian-groove",
    instruments: {
      rhythm: ["Calabash drum (djabara) struck with palm and fingers", "woven wrist shakers", "talking drum subtle bass rhythm"],
      bass: ["Bass keys of the large low-register Balafon", "deep gourd resonance"],
      harmony: ["Rhythmic ostinato on secondary Balafon", "ngoni lute chords"],
      melody: ["Lead wooden Balafon virtuoso runs with buzzing mirlitons", "pastoral Fulani bamboo flute (tambin)"],
      textures: ["Authentic buzzing spider-web membrane resonance (mirliton)", "warm dry Sahelian air", "gentle river Niger ambience"]
    },
    vocalProfile: {
      style: "Instrumental focus with occasional peaceful Bambara griot vocal blessings and proverbs",
      language: "bm", // Bambara
      gender: "male",
      effects: "Pure natural outdoor acoustic ambiance, organic wooden depth"
    },
    structure: [
      { name: "Intro", bars: 4, desc: "Solitary low Balafon ostinato enters establishing the 12/8 pulse" },
      { name: "Calabash Entry", bars: 8, desc: "Hollow calabash rhythms lock in with shaking wrist beads" },
      { name: "Main Polyphony", bars: 12, desc: "Dueling Balafons weave intricate interlocking wooden patterns" },
      { name: "Flute Theme", bars: 8, desc: "Fulani pastoral flute plays serene soaring melody over churning balafon bed" },
      { name: "Balafon Improvisation", bars: 16, desc: "Rapid mallet work flying across high and low octaves with authentic buzz" },
      { name: "Deep Meditation", bars: 8, desc: "Tempo breathes softly as flute and balafon harmonize in unison" },
      { name: "Outro", bars: 4, desc: "Final cyclical groove gently slowing to a peaceful resonant chord" }
    ],
    masterPrompt: "Traditional Malian balafon instrumental, authentic wooden balafon with vibrating gourd mirlitons, intricate 12/8 polyrhythms, resonant calabash percussion, pastoral Fulani bamboo flute, peaceful West African meditation music, 102 BPM in 12/8 time signature, D minor pentatonic mode, pure acoustic organic sound",
    negativePrompt: "Electronic instruments, drum machines, synthesizers, distortion, auto-tune, western pop beats",
    lyricsTemplate: `[Intro]
(Authentic Balafon wooden notes with vibrating mirliton buzz, soft calabash)
I ni ce... Mali lafia.
(Welcome... peace upon Mali.)

[Instrumental Section - 12/8 Balafon Weave]
(Intricate interlocking polyrhythms between two wooden Balafons)

[Vocal Blessing]
Mogoya be nyanama, lafia be di ya
(Humanity is precious, peace is sweet)
Sabali be mogo kene ya
(Patience heals the body and the soul.)

[Flute & Balafon Duet]
(Pastoral Fulani flute soars over the rolling wooden keys)

[Outro]
(Gentle Balafon resolution on resonant low gourd note)
Barika.`
  },

  // ── 12. TOUMANI DIABATÉ CLASSICAL MANDINKA KORA ──
  {
    id: "style_kora_classical_toumani",
    name: "Toumani Diabaté Classical Mandinka Kora",
    category: "West African Roots & Griot",
    originUrl: "https://youtu.be/bOBe-wE5CWM",
    referenceArtists: "Toumani Diabaté, Sidiki Diabaté, Ballaké Sissoko (New Ancient Strings)",
    badge: "Classical Griot Royalty",
    color: "from-amber-700 to-yellow-600",
    coverUrl: "/assets/cinema/modular_8k_digital.webp",
    description: "L'apogée de la musique classique mandingue immortalisée par le maître suprême Toumani Diabaté. Jeu simultané à 4 doigts sans aucun overdub : les pouces exécutent la ligne de basse rythmique continue (kumbengo) pendant que les index improvisent des cascades de notes célestes (birimintingo) sur les 21 cordes en boyau de la Kora.",
    defaultBpm: 88,
    bpmRange: [80, 96],
    keySignature: "F major",
    timeSignature: "4/4",
    suggestedModel: "sahelian-groove",
    instruments: {
      rhythm: ["Thumb-tapped wood pulse directly on the Kora bridge/body (konkon)"],
      bass: ["Low-string bass lines plucked with left and right thumbs (kumbengo bass)"],
      harmony: ["Mid-range ostinato chordal patterns on nylon strings"],
      melody: ["High-speed, expressive virtuoso birimintingo improvisations across 3 octaves"],
      textures: ["Acoustic resonance of cowhide stretched over large hollowed calabash", "pure unamplified room clarity"]
    },
    vocalProfile: {
      style: "Purely instrumental classical performance with deep introspective dignity",
      language: "bm",
      gender: "male",
      effects: "Pristine stereo concert hall acoustic capture, zero artificial processing"
    },
    structure: [
      { name: "Praeludium (Birimintingo)", bars: 8, desc: "Free-time solo Kora flourish showcasing dazzling dexterity across all 21 strings" },
      { name: "Kumbengo Theme", bars: 12, desc: "The stately cyclical bass ostinato locks into a steady, dignified 4/4 rhythm" },
      { name: "Variations I", bars: 16, desc: "Subtle rhythmic displacements and melodic ornaments over unwavering bass pattern" },
      { name: "Birimintingo Cascade", bars: 16, desc: "Breathtaking high-register arpeggios that flow like crystal water over the steady pulse" },
      { name: "Imperial Stride", bars: 12, desc: "Harmonized octaves in the lower and middle registers recalling the royal court of Sundiata Keita" },
      { name: "Outro", bars: 8, desc: "The ostinato slowly thins down to a single resonant bass string, followed by a gentle final tap on the calabash" }
    ],
    masterPrompt: "Classical West African Mandinka Kora solo performance in the style of Toumani Diabaté, virtuoso 4-finger simultaneous bass and treble fingerpicking, 21-string harp-lute, pure acoustic cowhide calabash resonance, stately cyclical kumbengo rhythm with dazzling birimintingo improvisations, 88 BPM, in F major (Silaba tuning), royal concert hall acoustic recording",
    negativePrompt: "Any modern instruments, drums, bass guitar, synthesizer, electronic beat, auto-tune, vocals, noise",
    lyricsTemplate: `[Instrumental Masterpiece - Solo Classical Kora]
(Pure 21-string Kora harp-lute performance with simultaneous thumb bassline and dazzling index-finger melodic cascades. No lyrics required.)`
  },

  // ── 13. DEEP FOCUS & MEDITATIVE AFRICAN KORA ──
  {
    id: "style_kora_meditation_focus",
    name: "Deep Focus & Meditative African Kora",
    category: "West African Roots & Griot",
    originUrl: "https://youtu.be/m8dpJHjv0Es",
    referenceArtists: "Sona Jobarteh, Ballaké Sissoko, Baobab Roots Collective",
    badge: "Deep Focus & Peace",
    color: "from-teal-700 to-emerald-950",
    coverUrl: "/assets/cinema/studio_digital_s35.webp",
    description: "Une oasis de paix pour l'esprit et la concentration profonde. Des arpèges de Kora lents et caressants, accompagnés d'une guitare acoustique délicate, de murmures de vent chaud et de l'eau calme d'un marigot du Sahel, créant un cocon sonore idéal pour le travail, la création et la sérénité.",
    defaultBpm: 90,
    bpmRange: [84, 94],
    keySignature: "D minor",
    timeSignature: "4/4",
    suggestedModel: "sahelian-groove",
    instruments: {
      rhythm: ["Extremely soft feathered calabash pulse", "subtle shaker with fine sand sound"],
      bass: ["Soft wooden sub-bass tone from low Kora strings"],
      harmony: ["Gentle fingerstyle acoustic guitar in open tuning", "soft ngoni lute pad"],
      melody: ["Meditative, repetitive Kora melodic motifs that breathe peacefully"],
      textures: ["Subtle natural soundscape (warm gentle breeze, flowing water, distant Sahelian birds)", "lush soothing stereo reverb"]
    },
    vocalProfile: {
      style: "Instrumental meditation with occasional soft, wordless vocal hums and peaceful breath",
      language: "fr",
      gender: "female",
      effects: "Spacious ambient reverb, wide immersive stereo field"
    },
    structure: [
      { name: "Ambient Arrival", bars: 4, desc: "Gentle sounds of water and warm wind with first tender Kora notes" },
      { name: "Hypnotic Loop", bars: 12, desc: "Calm cyclical Kora pattern establishes, inducing deep focus and relaxation" },
      { name: "Acoustic Guitar Harmony", bars: 12, desc: "Nylon guitar supports with warm, comforting chords" },
      { name: "Gentle Water Pulse", bars: 16, desc: "Soft calabash pulse joins; Kora introduces delicate variations that soothe the mind" },
      { name: "Wordless Hum", bars: 8, desc: "Warm, calming vocal hum drifts in the background like a distant lullaby" },
      { name: "Quiet Flow", bars: 16, desc: "The music flows like a quiet stream, peaceful, consistent, and deeply centering" },
      { name: "Fadeout", bars: 8, desc: "Kora notes gently slow down, leaving only the sound of peaceful flowing water" }
    ],
    masterPrompt: "Peaceful meditative West African Kora instrumental for deep focus, gentle soothing harp-lute arpeggios, warm acoustic nylon guitar in open tuning, extremely soft feathered calabash pulse, subtle ambient sounds of flowing water and warm breeze, 90 BPM, in D minor, immersive spatial acoustic warmth, stress-relief atmosphere",
    negativePrompt: "Loud drums, harsh percussion, fast tempos, electronic beats, sudden volume changes, aggressive sounds",
    lyricsTemplate: `[Meditation Atmosphere]
(Gentle water stream, warm Sahelian breeze, soothing Kora arpeggios)
(Soft, wordless vocal humming creating an oasis of peace and deep mental focus...)`
  },

  // ── 14. ZOUK LOVE RÉTRO-DIGITAL & ANTILLAIS ──
  {
    id: "style_zouk_love_antilles",
    name: "Zouk Love Rétro-Digital & Antillais",
    category: "Caribbean & Zouk Antillais",
    originUrl: "https://youtu.be/kassav-zouk",
    referenceArtists: "Kassav', Gilles Floro, Patrick Saint-Éloi, Eric Virgal, Jocelyne Béroard, Jean-Philippe Marthély",
    badge: "Antilles & Kreyòl 80s/90s",
    color: "from-emerald-600 to-teal-950",
    coverUrl: "/assets/cinema/studio_digital_s35.webp",
    description: "Le son mythique des Antilles françaises et caribéennes. Balancement syncopé de boîte à rythmes avec groove de ti-bwa en bois, shakers chacha, basse slap bondissante au synthé, accords soyeux de piano électrique Yamaha DX7, cocottes de guitare avec chorus sur les contretemps, saxophone romantique suave et harmonies vocales en Kreyòl Ayisyen / Guadeloupéen et Français créolisé.",
    defaultBpm: 90,
    bpmRange: [86, 94],
    keySignature: "Bb major",
    timeSignature: "4/4",
    suggestedModel: "ace-step-v35",
    instruments: {
      rhythm: ["Vintage Roland TR-707 and LinnDrum zouk beat", "syncopated ti-bwa wooden rimshot groove", "chacha shakers", "snare with 80s gated reverb"],
      bass: ["Punchy synthesizer slap bassline with rubbery envelope", "deep round analog sub-bass foundation"],
      harmony: ["Iconic Yamaha DX7 FullTines electric piano chords", "Roland D-50 warm digital pad layers", "chorused clean Fender Stratocaster offbeat chops"],
      melody: ["Smooth romantic alto saxophone leads with vibrato", "brass horn section stabs on turnaround bars", "warm lead vocal delivery"],
      textures: ["Analog tape chorus", "stereo plate reverb", "sweet Caribbean harmonies"]
    },
    vocalProfile: {
      style: "Smooth, passionate and sensual Caribbean crooner vocals with rich bilingual French and Kreyòl harmonies, call-and-response backing vocals",
      language: "ht",
      gender: "female",
      effects: "Smooth plate reverb, warm analog delay, gentle chorus on backing vocal harmonies"
    },
    structure: [
      { name: "Intro", bars: 8, desc: "Syncopated ti-bwa rimshot pattern, lush DX7 chords, and sensual saxophone melody introduce the tropical atmosphere" },
      { name: "Verse 1", bars: 8, desc: "Punchy synth slap bass enters with sweet lead vocals singing tenderly in Kreyòl; clean guitar chops on offbeats" },
      { name: "Chorus", bars: 8, desc: "Euphoric 'kole-sere' chorus with multi-part vocal choir, brass stabs, and hypnotic zouk drum groove" },
      { name: "Verse 2", bars: 8, desc: "Sensual vocal delivery continues, responsive saxophone counter-melodies and warm digital pads" },
      { name: "Bridge / Sax Solo", bars: 8, desc: "Emotional alto saxophone solo takes center stage over soaring DX7 arpeggios and resonant slap bass" },
      { name: "Chorus", bars: 8, desc: "Full energy climactic chorus with call-and-response vocal ad-libs" },
      { name: "Outro", bars: 4, desc: "Gentle fadeout over DX7 chords, tender vocal whispers, and seaside breeze" }
    ],
    masterPrompt: "Authentic French Antillean Zouk Love, classic syncopated zouk drum machine beat with ti-bwa wooden rimshot groove, chacha shakers, bouncy synthesizer slap bassline, iconic Yamaha DX7 electric piano chords, chorused clean rhythm guitar strums on offbeats, smooth romantic saxophone lead, sweet Caribbean French and Kreyòl vocal harmonies, 90 BPM, in Bb major, pristine 80s/90s West Indies studio warmth",
    negativePrompt: "EDM synth, aggressive distorted bass, trap hi-hat rolls, distorted 808 sub, autotune metallic voice, rock guitar distortion, cold thin mix, rushed tempo, techno kick",
    lyricsTemplate: `[Intro]
(Ti-bwa en bois syncopé, accords veloutés de piano DX7, saxophone langoureux)
Dousè nan kè mwen...
Kole-sere.

[Verse 1]
Anba bèl zetwal, lannwit la ap dousman kouvri nou
Mizik la ap jwe, santiman damou ap anvayi nou
Pianwo DX7 ap chante yon melodi sekrè
Koute batman kè mwen k ap pale ak fòs e ak klète
Gade nan je m, pa bezwen pale ankò
Kadans lan ap pote nou pi lwen pase tout lò.

[Chorus]
Zouk love kole-sere jiska granmaten
Kite lanmou fleri sou bèl chimen
Ritm karibeyen, dousè ak pasyon
Nou de ansanm nan bèl chante sa a
Zouk love, lanmou ki pa ka fini
Nan bra ou mwen jwenn tout paradi.

[Verse 2]
La brise des îles caresse nos épaules enlacées
Dans ce zouk rétro tous nos doutes sont effacés
Les accords résonnent, la basse nous soulève tout bas
Chaque pas de danse nous rapproche pas à pas.

[Bridge]
(Solo de saxophone suave avec réverbération chaleureuse)
Pa kite m ale, kenbe men m pi fò
Zouk la ap gide nou jiska granjou.

[Chorus]
Zouk love kole-sere jiska granmaten
Kite lanmou fleri sou bèl chimen
Ritm karibeyen, dousè ak pasyon
Nou de ansanm nan bèl chante sa a
Zouk love, lanmou ki pa ka fini
Nan bra ou mwen jwenn tout paradi.

[Outro]
(Accords DX7 en decrescendo, murmures d'amour, clapotis des vagues)
Kole-sere...
Dousman, tou dousman...
Zouk love pou tout tan.`
  }
];

/**
 * Retourne la liste intégrale des styles de référence (14 styles curés).
 */
export function getAllCuratedStyles() {
  return MUSIC_STYLES_CATALOG;
}

/**
 * Retourne un style spécifique par son identifiant unique.
 */
export function getCuratedStyleById(id) {
  return MUSIC_STYLES_CATALOG.find((s) => s.id === id) || null;
}

/**
 * Retourne les styles regroupés par famille musicale.
 */
export function getCuratedStylesByCategory() {
  const categories = {};
  for (const style of MUSIC_STYLES_CATALOG) {
    if (!categories[style.category]) {
      categories[style.category] = [];
    }
    categories[style.category].push(style);
  }
  return categories;
}

/**
 * Construit un master prompt enrichi combinant les attributs musicologiques du style
 * avec les souhaits spécifiques de l'utilisateur.
 */
export function buildEnrichedPromptForStyle(styleId, userPrompt = "") {
  const style = getCuratedStyleById(styleId);
  if (!style) return userPrompt;

  const userClean = (userPrompt || "").trim();
  if (!userClean) return style.masterPrompt;

  // Combine user intent with the style's master prompt
  return `${userClean}, ${style.masterPrompt}`;
}
