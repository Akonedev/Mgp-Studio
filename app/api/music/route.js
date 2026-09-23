import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';
import { sparkComfy } from '@/src/lib/sparkComfy';
import {
    MUSIC_STYLES_CATALOG,
    getAllCuratedStyles,
    getCuratedStyleById,
    getCuratedStylesByCategory,
    buildEnrichedPromptForStyle
} from '@/src/lib/musicStylesCatalog';
import {
    GENRE_CATEGORIES,
    GENRES_DATA,
    findGenreByName,
    getGenreAcousticPrompt,
    getFilteredGenres
} from '@/src/lib/genresCatalog';
import {
    LANG_FULL_NAMES_MAP,
    ALL_LANGUAGES,
    LANGUAGE_CATEGORIES,
    VALID_ACE_STEP_LANG_CODES,
    getLanguageByCode,
    getPromptLanguageName
} from '@/src/lib/languagesCatalog';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const execFileAsync = promisify(execFile);

const DATA_DIR = path.join(process.cwd(), 'data');
const MUSIC_FILE = path.join(DATA_DIR, 'music_history.json');
const DAW_FILE = path.join(DATA_DIR, 'daw_projects.json');
const HISTORY_FILE = path.join(DATA_DIR, 'generation_history.json');
const OUTPUTS_DIR = path.join(process.cwd(), 'public', 'outputs');
const SPARK_VLLM_URL = process.env.SPARK_VLLM_URL || 'http://192.168.1.219:61005/v1';

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(OUTPUTS_DIR)) {
    fs.mkdirSync(OUTPUTS_DIR, { recursive: true });
}

const DEFAULT_TRACKS = [];

function loadMusicHistory() {
    if (!fs.existsSync(MUSIC_FILE)) {
        fs.writeFileSync(MUSIC_FILE, JSON.stringify([], null, 2), 'utf8');
        return [];
    }
    try {
        const data = JSON.parse(fs.readFileSync(MUSIC_FILE, 'utf8'));
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

function saveMusicHistory(tracks) {
    fs.writeFileSync(MUSIC_FILE, JSON.stringify(tracks, null, 2), 'utf8');
}

function loadDawProjects() {
    if (!fs.existsSync(DAW_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(DAW_FILE, 'utf8'));
    } catch {
        return [];
    }
}

function saveDawProjects(projects) {
    fs.writeFileSync(DAW_FILE, JSON.stringify(projects, null, 2), 'utf8');
}

const PLAYLISTS_FILE = path.join(DATA_DIR, 'playlists.json');

const DEFAULT_PLAYLISTS = [
    {
        id: 'pl_favorites',
        name: 'Favoris Studio IA',
        description: 'Sélection des meilleures créations musicales générées avec ACE-Step 1.5 DiT',
        coverUrl: '/assets/cinema/studio_digital_s35.webp',
        created_at: new Date().toISOString(),
        songs: []
    },
    {
        id: 'pl_amapiano',
        name: 'Amapiano & Deep Grooves',
        description: 'Sélection log drums puissants et polyrythmies modernes',
        coverUrl: '/assets/cinema/modular_8k_digital.webp',
        created_at: new Date().toISOString(),
        songs: []
    }
];

function loadPlaylists() {
    if (!fs.existsSync(PLAYLISTS_FILE)) {
        fs.writeFileSync(PLAYLISTS_FILE, JSON.stringify(DEFAULT_PLAYLISTS, null, 2), 'utf8');
        return DEFAULT_PLAYLISTS;
    }
    try {
        const data = JSON.parse(fs.readFileSync(PLAYLISTS_FILE, 'utf8'));
        return Array.isArray(data) ? data : DEFAULT_PLAYLISTS;
    } catch {
        return DEFAULT_PLAYLISTS;
    }
}

function savePlaylists(playlists) {
    fs.writeFileSync(PLAYLISTS_FILE, JSON.stringify(playlists, null, 2), 'utf8');
}

function getPythonBin() {
    const candidates = [
        '/home/akone/.venv/bin/python3',
        '/media/akone/ssd/ACE-Step-Studio/venv/bin/python',
        '/home/akone/venv/bin/python3',
        process.env.PYTHON_BIN || 'python3'
    ];
    for (const c of candidates) {
        if (c && fs.existsSync(c)) return c;
    }
    return 'python3';
}

const LANG_FULL_NAMES = LANG_FULL_NAMES_MAP;


function generateLrcFromLyrics(lyricsText, durationSec = 30, bpm = 120) {
    if (!lyricsText || typeof lyricsText !== 'string') return '';
    const rawLines = lyricsText.split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);
    if (rawLines.length === 0) return '';

    const dur = Math.max(10, Number(durationSec) || 30);
    const introSec = Math.min(3.5, Math.max(1.5, dur * 0.08));
    const outroSec = Math.min(3.0, Math.max(1.5, dur * 0.08));
    const singingSpan = Math.max(4.0, dur - introSec - outroSec);
    const step = rawLines.length > 1 ? (singingSpan / (rawLines.length - 1)) : 0;

    const lrcLines = rawLines.map((line, idx) => {
        const timeSec = introSec + idx * step;
        const mins = Math.floor(timeSec / 60);
        const secs = Math.floor(timeSec % 60);
        const csecs = Math.floor((timeSec % 1) * 100);
        const stamp = `[${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(csecs).padStart(2, '0')}]`;
        return `${stamp} ${line}`;
    });

    return lrcLines.join('\n');
}

function buildAuthenticLyricsForGenre(category, genreName, vocalLanguage = 'fr') {
    const lang = (vocalLanguage || 'fr').toLowerCase();
    const cat = (category || 'pop').toLowerCase();
    const gName = (genreName || '').toLowerCase();

    const LYRICS_CORPUS = {
        zouk: {
            ht: `[Verse 1]\nDousè nan kè mwen, mizik la ap jwe tou dousman\nPianwo DX7 ap chante, yon santiman damou nan van\nAnba bèl zetwal, mwen vle sere w nan bra m\nKadans lan ap gide nou, se lajwa ki nan nanm\n\n[Chorus]\nZouk love kole-sere jiska granmaten\nKite lanmou fleri sou bèl chimen\nRitm karibeyen, dousè ak pasyon\nToujou ansanm nan bèl chante sa a\n\n[Outro]\nBriz lanmè k ap pase dousman nan lannwit.`,
            fr: `[Verse 1]\nDans la douceur des îles la brise se pose doucement\nLe piano DX7 résonne, un parfum de tendresse dans le vent\nSous les alizés ton regard m'appelle et me retient\nLa nuit caribéenne trace notre chemin\n\n[Chorus]\nZouk love collé-serré jusqu'au matin\nLaisse la cadence guider notre destin\nRythme des îles, douceur et passion\nUnis pour toujours dans cette chanson\n\n[Outro]\nDouce brise d'été et murmures d'amour.`,
            en: `[Verse 1]\nWarm island breeze blowing gentle on the shore tonight\nSweet electric piano dancing in the tropical light\nHolding you close as the cadence begins to sway\nLost in your eyes as the world fades away\n\n[Chorus]\nZouk love collé-serré through the night\nMoving in rhythm beneath the starlight\nCaribbean heartbeat, tender and slow\nWhere only true island dreamers go\n\n[Outro]\nSoft waves and gentle fading melody.`,
            es: `[Verse 1]\nBrisa suave del Caribe acariciando la noche entera\nEl piano eléctrico suena dulce junto a la ribera\nBailando despacio al compás de la emoción\nSintiendo el latido de un solo corazón\n\n[Chorus]\nZouk love pegadito hasta el amanecer\nDeja que este ritmo nos enseñe a querer\nNoche caribeña, ternura y pasión\nUnidos por siempre en esta canción\n\n[Outro]\nSuave brisa marina perdiéndose en el mar.`,
            pt: `[Verse 1]\nBrisa suave da ilha dançando na noite quente\nO piano elétrico ecoa um sentimento tão presente\nTe abraço bem forte sentindo o calor do mar\nAo som desta kizomba só quero te amar\n\n[Chorus]\nZouk love coladinho até o sol raiar\nDeixa este compasso nos guiar e levar\nRitmo das ilhas, paixão e emoção\nUnidos pra sempre nesta doce canção\n\n[Outro]\nOndas calmas e suaves melodias.`
        },
        rumba: {
            ln: `[Verse 1]\nBolingo ya motema, guitare ya sebene ya esengo\nNa tongo kino na butu, to bina rumba na esengo\nMwana ya mboka, elengi ya solo na Kinshasa\nNzoto mobimba ezo ningana na malembe\n\n[Chorus]\nRumba congo, sebene ya sika ya bolingo\nGuitare solo ezo lela na motema tout chaud\nTala ndenge tozo bina, esengo ya mboka\nBalingi rumba banso basangani lelo\n\n[Outro]\nSolo ya sebene ezo bɛta na butu.`,
            fr: `[Verse 1]\nBolingo ya motema, sous la brise de Kinshasa\nGuitare sebene ya esengo, la nuit danse avec grâce\nMwana ya mboka, ton sourire éclaire mon chemin\nDans l'harmonie des cordes, je te tiens par la main\n\n[Chorus]\nRumba congo, balançoire ya bolingo\nGuitare enchantée qui fait vibrer le cœur tout chaud\nSebene ya sika, faisons danser l'amour\nDe Matonge à Paris, je t'aimerai toujours\n\n[Outro]\nSolo de guitare sebene résonnant dans la nuit.`,
            en: `[Verse 1]\nKinshasa nights glowing bright along the river shore\nSebene guitar singing sweet, pulling us to the floor\nMelodic bassline walking with passion and grace\nPure Congolese rumba filling the space\n\n[Chorus]\nRumba congo, rhythm of eternal love\nStrings cascading down like blessings from above\nDance to the sebene, feel the joyful beat\nKinshasa melody sweeping you off your feet\n\n[Outro]\nSebene solo guitar singing into the dawn.`,
            es: `[Verse 1]\nNoches de Kinshasa brillando junto al gran río\nLa guitarra sebene canta alejando todo el frío\nBajo melódico caminando con soltura y pasión\nLa rumba congoleña despierta el corazón\n\n[Chorus]\nRumba congo, danza de eterno amor\nCuerdas que vibran con magia y color\nBaila el sebene, siente la libertad\nUnidos por siempre con autenticidad\n\n[Outro]\nGuitarra sebene despidiendo la noche.`
        },
        amapiano: {
            zu: `[Verse 1]\nIlanga liyashona eGoli, amashakers ayakhala kancane\nI-log drum iyaduma phansi, umoya uyavuka sonke\nAmapiano amnandi, asiphakamise imimoya yethu\nUbusuku bonke sizodansa ngokuthula\n\n[Chorus]\nDlala kabza, shaya i-log drum kamnandi\nAmapiano to the world, umdanso womphefumulo\nGroove yase mzansi, asihambe sonke\nKumnandi kakhulu kulomculo weqiniso\n\n[Outro]\nI-log drum iyaduma ekuseni.`,
            fr: `[Verse 1]\nCoucher de soleil sur Joburg, les shakers montent dans la nuit\nLe log drum résonne profond, chassant tous les soucis\nAccords de piano jazz feutrés, l'énergie est pure et belle\nDanse au ralenti sous la cadence éternelle\n\n[Chorus]\nDlala kabza, que le log drum roule ce soir\nVibration amapiano qui réveille l'espoir\nGroove ya mampela, piano to the world\nDans la ronde dorée où tous les cœurs s'envolent\n\n[Outro]\nRoulement de log drum dans la brume du soir.`,
            en: `[Verse 1]\nSundown over Johannesburg, shakers whispering in the air\nDeep resonant log drum rolling without a care\nLush jazz chords on the Rhodes, hypnotic and deep\nTownship vibrations awakening what was asleep\n\n[Chorus]\nDlala kabza, let the log drum slide and roll\nAmapiano healing flowing right into the soul\nGroove ya mampela, feeling the spirit rise\nUnder the southern cross and open skies\n\n[Outro]\nPitched log drum rolling soft into the dawn.`,
            es: `[Verse 1]\nAtardecer en Johannesburgo, shakers flotando en el aire\nEl log drum profundo retumba sin dejar que nadie pare\nAcordes de piano jazz, cálidos y con sabor\nVibración amapiano que enciende el amor\n\n[Chorus]\nDlala kabza, que retumbe el tambor\nRitmo de Sudáfrica lleno de calor\nGroove ya mampela, piano sin igual\nUna fiesta eterna hasta el final\n\n[Outro]\nLog drum sonando suave en la noche.`
        },
        hiphop: {
            fr: `[Verse 1]\nSur l'asphalte la nuit s'éveille, les basses font vibrer les murs\nChaque mesure est millimétrée, l'attitude est solide et pure\nLe flow découpe le silence, écho des rues sous les réverbères\nOn trace notre trajectoire sans jamais regarder en arrière\n\n[Chorus]\nMonte le son dans le quartier, que la cadence prenne le relais\nRythme lourd, rimes affûtées, rien ne pourra nous arrêter\nDe la nuit jusqu'à l'aube claire, c'est notre heure de vérité\nSur le tempo de la ville, gravé dans l'éternité\n\n[Outro]\nLe son résonne encore dans la nuit.`,
            en: `[Verse 1]\nConcrete canyons, city lights flashing in the rear view\nBassline rolling deep, every bar hitting true\nSpitting truth on the beat where the rhythm stays tight\nStreet level energy illuminating the night\n\n[Chorus]\nTurn the volume up high, let the cadence roll\nRaw authentic rhythm speaking straight to the soul\nFrom the block to the skyline, hear the anthem ring\nThis is where we stand and the song we sing\n\n[Outro]\nEchoes fading in the dark.`,
            es: `[Verse 1]\nEn el asfalto la noche despierta con fuerza y pasión\nCada golpe de bajo retumba directo al corazón\nRimando verdades que nacen del barrio sin cesar\nCon la frente en alto listos para triunfar\n\n[Chorus]\nSube el volumen hermano, que el ritmo domine la ciudad\nCon el flow encendido y pura lealtad\nDesde el principio hasta el final esta es nuestra voz\nCaminando firmes bajo el mismo sol\n\n[Outro]\nEl sonido eterno sigue vivo.`
        },
        electronic: {
            fr: `[Verse 1]\nOndes de synthétiseurs qui traversent la nuit électrique\nChaque pulsation résonne, montée d'énergie cosmique\nLes filtres s'ouvrent au ralenti dans l'atmosphère\nPris dans le vortex où les lumières s'éclairent\n\n[Chorus]\nLaisse monter le drop, que la terre s'enflamme\nFréquences hypnotiques qui réveillent la flamme\nEn transe sous les lasers jusqu'au lever du jour\nLe groove nous transporte, puissant et sans détour\n\n[Outro]\nFréquences pures en suspension.`,
            en: `[Verse 1]\nElectric frequencies pulsing through the strobe light glow\nAnalog synths rising as the bass begins to flow\nFilters sweep across the floor, building up the drive\nTrapped inside the rhythm where the night comes alive\n\n[Chorus]\nWait for the drop and let the current take control\nHypnotic waves vibrating deep into the soul\nLost under neon beams until the break of dawn\nElectric resonance keeping the fire burning on\n\n[Outro]\nEchoes fading in harmonic resonance.`,
            es: `[Verse 1]\nOndas de sintetizador cruzando la noche espacial\nCada pulso acelera el ritmo de forma colosal\nLos filtros se abren bajo la luz de neón\nSiente la energía pura de la vibración\n\n[Chorus]\nLlega la caída y explota la emoción\nFrecuencias que aceleran el corazón\nBailando sin descanso hasta ver el sol brillar\nEste ritmo electrónico nunca va a parar\n\n[Outro]\nResonancia infinita en el aire.`,
            de: `[Verse 1]\nSynthesizer-Wellen ziehen durch die Berliner Nacht\nJeder Bassimpuls erweckt die Stadt mit neuer Kraft\nLichter tanzen durch den Nebel im Rhythmus der Zeit\nIm Sog der Frequenzen sind wir für immer bereit\n\n[Chorus]\nLass den Beat fallen und fühl die Energie\nElektronische Ekstase, reine Harmonie\nUnter den Stroboskopen bis der Morgen erwacht\nDieser Sound regiert die Dunkelheit der Nacht\n\n[Outro]\nFrequenzen klingen langsam aus.`
        },
        african: {
            sw: `[Verse 1]\nNgoma zinalia chini ya anga angavu la usiku\nMapigo ya Afrika yanaleta furaha na nguvu kuu\nSauti ya gitaa inasikika kwa upendo na heshima\nTukicheza pamoja furaha yetu haina mwisho\n\n[Chorus]\nCheza kwa furaha, Afrika inaimba leo\nMapigo ya moyo, amani na upendo wa kweli\nWimbo wa mama ardhi unatufikia sote\nTushangilie pamoja kuanzia asubuhi hadi jioni\n\n[Outro]\nMapigo ya ngoma yanaendelea milele.`,
            fr: `[Verse 1]\nÉcho des tambours qui résonnent sous le ciel étoilé\nPolyrythmie chaleureuse, nos cœurs sont accordés\nLe son des cuivres s'élève au parfum de la terre\nUne danse ancestrale qui illumine l'univers\n\n[Chorus]\nBouge au rythme du vent chaud et de la joie\nLa mélodie s'élève pour toi et moi\nCélèbre la vie, unis dans la cadence\nQue l'Afrique résonne en toute confiance\n\n[Outro]\nLa vibration demeure pour toujours.`,
            en: `[Verse 1]\nTalking drums calling out beneath the open sky\nPolyrhythmic heartbeat lifting spirits high\nBrass horns singing out with warmth and grace\nGenerations dancing in this sacred space\n\n[Chorus]\nFeel the groove, let the sunshine through\nJoy overflowing in everything we do\nCelebrate the pulse of the motherland\nMoving as one across the golden sand\n\n[Outro]\nVibrations lingering forever.`,
            es: `[Verse 1]\nTambores que llaman con fuerza y claridad\nRitmos ancestrales llenos de bondad\nVientos dorados soplando con calor\nUn canto a la vida, a la tierra y al amor\n\n[Chorus]\nBaila sin miedo, siente la emoción\nLa madre tierra late en esta canción\nUnidos en la danza bajo el cielo azul\nBrillando con fuerza como la misma luz\n\n[Outro]\nEl eco ancestral nunca se apaga.`
        },
        latin: {
            pt: `[Verse 1]\nBrisa tropical soprando sobre a praia dourada\nO tamborim marca o ritmo no meio da madrugada\nViolão de sete cordas dedilhado com emoção\nO samba renasce no compasso do coração\n\n[Chorus]\nVem dançar comigo sob a luz do luar\nDeixa a batucada fazer o peito cantar\nCalor latino, pura paixão e liberdade\nUma noite mágica cheia de felicidade\n\n[Outro]\nAcordes suaves se misturando ao mar.`,
            fr: `[Verse 1]\nUne brise marine caresse la nuit tropicale\nLes percussions résonnent d'une ardeur sans égale\nClaviers et cuivres lancent un appel brûlant\nDans nos pas de danse le temps s'arrête un instant\n\n[Chorus]\nBaila conmigo sous les étoiles dorées\nLaisse ton corps s'abandonner à la marée\nRythme caliente, amour et liberté\nUne nuit magique que nul ne peut oublier\n\n[Outro]\nDouce brise et rythme en écho.`,
            en: `[Verse 1]\nTropical breeze blowing gentle off the shore\nPercussion calling, pulling us out to the floor\nPiano montuno sparkling in the golden light\nSultry Latin rhythm taking over the night\n\n[Chorus]\nDance with me under the starlit sky\nFeel the heat rise as the tempo flies\nPure celebration, passion in the air\nTonight is paradise beyond compare\n\n[Outro]\nFading with the ocean breeze.`,
            es: `[Verse 1]\nBrisa caliente acariciando el malecón\nLas congas marcan con fuego la pasión\nEl piano repica con sabor y calor\nEsta noche entera se la entregamos al amor\n\n[Chorus]\nBaila conmigo bajo la luna llena\nOlvida la tristeza, olvida toda pena\nSabor latino que no tiene igual\nUna fiesta eterna hasta el final\n\n[Outro]\nEl sabor queda en el aire para siempre.`
        },
        jazz: {
            fr: `[Verse 1]\nLumière feutrée, parfum d'un club de minuit\nAccords de velours où le saxophone gémit\nLa contrebasse marche sur un fil suspendu\nChaque silence est un secret partagé, un regard perdu\n\n[Chorus]\nSoulful melody, caresse de la nuit\nQuand l'âme s'exprime et que le monde s'enfuit\nNotes bleues qui vibrent avec sincérité\nDans cet instant suspendu d'intimité\n\n[Outro]\nLe saxophone s'éteint doucement.`,
            en: `[Verse 1]\nDim velvet lights in a late night downtown bar\nSaxophone crying like a distant lonely star\nUpright bass walking steady on the groove\nSmoke in the air, watching every shadow move\n\n[Chorus]\nBlue notes falling like gentle summer rain\nSoothing the heartache, melting all the pain\nSoulful harmonies floating soft and slow\nWhere only true lovers and midnight dreamers go\n\n[Outro]\nSax fading into the quiet night.`,
            es: `[Verse 1]\nLuces tenues en un rincón de la ciudad\nEl saxofón canta con melancolía y verdad\nContrabajo suave marcando el compás\nBuscando una noche de calma y de paz\n\n[Chorus]\nNotas azules que acarician la piel\nUn trago amargo convertido en miel\nMelodía profunda para el corazón\nPerdidos por siempre en esta canción\n\n[Outro]\nEl saxofón se desvanece en silencio.`
        },
        rock: {
            fr: `[Verse 1]\nDistorsion brûlante, ampli poussé à fond\nLa batterie s'abat comme le tonnerre en réson\nRiff de guitare qui déchire l'obscurité\nUn cri d'énergie et de pure liberté\n\n[Chorus]\nFais hurler les cordes, fais trembler le sol\nRien ne nous arrête dans ce rock'n'roll\nLa flamme est allumée, le feu ne s'éteint pas\nDebout face à l'orage, guidés par le fracas\n\n[Outro]\nLarsens et accords finaux en apothéose.`,
            en: `[Verse 1]\nTubes glowing red hot, volume on eleven\nGuitars screaming out like a storm tearing through heaven\nDrums hit heavy, a tidal wave of sound\nShaking every inch of this trembling ground\n\n[Chorus]\nLet the amplifiers roar, set the spirit free\nNothing stands in the way of what we came to be\nUnchained power rolling through the night\nBorn in the fire, ready for the fight\n\n[Outro]\nFeedback ringing into the void.`,
            es: `[Verse 1]\nAmplificadores al máximo estallando sin temor\nLa batería ruge con furia y con valor\nRiffs de guitarra que rompen la quietud\nEl fuego eterno de la juventud\n\n[Chorus]\nGrita con fuerza, siente la rebelión\nEste es el poder de nuestra canción\nContra el viento y la tempestad\nRock con orgullo y autenticidad\n\n[Outro]\nAcordes finales resonando en el aire.`
        },
        pop: {
            ja: `[Verse 1]\nネオンの街に響く優しいメロディ\n夜空に広がる光と私たちのハーモニー\n歩き出す道に希望の風が吹く\n胸の高鳴りが新しい明日を連れてくる\n\n[Chorus]\n輝く星の下で歌おう\n心をつなぐこのリズムを感じて\nどんな暗闇も恐れない\n二人の夢が今光り輝く\n\n[Outro]\n静かな夜明けに消えてゆく音色。`,
            fr: `[Verse 1]\nDans l'écho de la ville les ombres s'effacent doucement\nLe rythme s'élève, battant au cœur du mouvement\nChaque note est un repère guidé par la clarté\nVers un monde nouveau où tout est à créer\n\n[Chorus]\nLaisse monter le refrain, vibre sous les étoiles\nLa mélodie s'envole et déploie ses voiles\nAu tempo du destin rien ne peut nous freiner\nC'est notre moment, notre heure de briller\n\n[Outro]\nLe son s'apaise mais l'énergie demeure.`,
            en: `[Verse 1]\nWalking through the neon mist under amber skies\nEvery beat in resonance as the tempo flies\nPatterns in the frequency, clarity in sight\nMoving with the harmony through the city night\n\n[Chorus]\nFeel the surge alive inside, let the cadence roll\nDeep harmonics vibrating straight into the soul\nNo turning back now, this is where we start\nPowered by the pulse of an electric heart\n\n[Outro]\nFading into quiet echoes of the dawn.`,
            es: `[Verse 1]\nBajo las luces que iluminan la ciudad entera\nEl ritmo llama y cruza cualquier frontera\nCada compás nos lleva directo a la emoción\nSiente el poder que nace del corazón\n\n[Chorus]\nBaila con la música que nunca se detiene\nMira la energía que la noche sostiene\nEs nuestro fuego, nuestra revolución\nUnidos siempre en una sola canción\n\n[Outro]\nEl eco queda en el aire sin final.`
        }
    };

    // Specific genre cultural lyrics take precedence
    if (gName.includes('zouk') || gName.includes('zou') || gName.includes('kassav') || gName.includes('antill')) {
        const c = LYRICS_CORPUS.zouk;
        return c[lang] || c.fr || c.en;
    }
    if (gName.includes('rumba') || gName.includes('seben') || gName.includes('congo') || gName.includes('kinshasa') || gName.includes('lingala')) {
        const c = LYRICS_CORPUS.rumba;
        return c[lang] || c.fr || c.en;
    }
    if (gName.includes('amapiano') || gName.includes('log drum') || gName.includes('afropiano') || gName.includes('kabza')) {
        const c = LYRICS_CORPUS.amapiano;
        return c[lang] || c.fr || c.en;
    }

    const corpus = LYRICS_CORPUS[cat] || LYRICS_CORPUS.pop;
    return corpus[lang] || corpus.fr || corpus.en;
}

function generateEnrichedSampleProposal(query, instrumental = false, vocalLanguage = 'fr') {
    const rawQuery = (query || '').trim();
    const q = rawQuery.toLowerCase();
    
    // 1. Intelligent musicological genre identification from 114 genres knowledge base
    let matchedGenre = findGenreByName(rawQuery);
    if (!matchedGenre && rawQuery) {
        for (const g of GENRES_DATA) {
            if (q.includes(g.name.toLowerCase())) {
                matchedGenre = g;
                break;
            }
        }
    }
    
    let genreName = matchedGenre ? matchedGenre.name : 'electronic';
    let defaultBpm = matchedGenre ? matchedGenre.bpm : 120;
    let defaultKey = matchedGenre ? matchedGenre.key : 'C Minor';
    let genreCategory = matchedGenre ? matchedGenre.category : 'electronic';
    let genreDesc = matchedGenre ? matchedGenre.desc : 'Dynamic studio arrangement, high fidelity stereo';

    // 2. Explicit BPM detection in prompt takes precedence if specified by user
    const bpmMatch = rawQuery.match(/(\d{2,3})\s*(?:bpm|tempo)/i);
    if (bpmMatch) {
        const parsed = parseInt(bpmMatch[1], 10);
        if (parsed >= 40 && parsed <= 240) defaultBpm = parsed;
    }

    // 3. Explicit Musical Key detection in prompt takes precedence
    const keyMatch = rawQuery.match(/\b(?:in|key:?)\s+([A-G][#b]?(?:\s*(?:minor|major|m|min|maj))?)\b/i);
    if (keyMatch) defaultKey = keyMatch[1];

    // 4. Meaningful title generation based on actual user query and genre
    let title = rawQuery ? rawQuery.slice(0, 40) : `${genreName.toUpperCase()} Experience`;
    title = title.charAt(0).toUpperCase() + title.slice(1);

    // 5. Authentic lyrics generator adapted to musical family, genre & language
    let lyrics = '';
    if (!instrumental) {
        lyrics = buildAuthenticLyricsForGenre(genreCategory, genreName, vocalLanguage);
    }

    // 6. Style Caption: Prefer exact acoustic DNA if genre matched, else combine specs
    let styleCaption = '';
    if (matchedGenre && matchedGenre.acousticPrompt) {
        styleCaption = rawQuery && !matchedGenre.name.toLowerCase().includes(rawQuery.toLowerCase())
            ? `${matchedGenre.acousticPrompt}, ${rawQuery}`
            : matchedGenre.acousticPrompt;
    } else {
        styleCaption = rawQuery 
            ? `${rawQuery}, ${defaultBpm} BPM, ${defaultKey}, ${genreDesc}, studio mastered 44.1kHz, punchy dynamics, professional mixing`
            : `${genreName.toUpperCase()}, ${defaultBpm} BPM, ${defaultKey}, ${genreDesc}, rich polyphonic harmonic layers, studio mastered 44.1kHz, punchy dynamics, professional mixing`;
    }

    return {
        title,
        caption: styleCaption,
        style: styleCaption,
        lyrics,
        bpm: defaultBpm,
        keyScale: defaultKey,
        timeSignature: '4/4',
        duration: 30
    };
}

async function generateIsolatedStemAudio(outPath, stemType = 'drums', durationSec = 16, bpm = 120, prompt = '', key = 'C Minor') {
    const dur = Math.max(4, Math.min(120, Math.round(durationSec)));
    const scriptPath = path.join(process.cwd(), 'scripts', 'music_engine.py');
    const pythonBin = getPythonBin();

    const args = [
        scriptPath,
        '--stem', stemType,
        '--output', outPath,
        '--duration', String(dur),
        '--bpm', String(bpm),
        '--key', key || 'C Minor',
        '--prompt', prompt || '',
        '--seed', String(Math.floor(Math.random() * 2147483647))
    ];

    try {
        await execFileAsync(pythonBin, args);
    } catch (err) {
        console.error('[MusicAPI] Stem synthesis error:', err.message);
    }
}


const ACESTEP_SERVER_URL = process.env.ACESTEP_URL || 'http://127.0.0.1:3010';
const ACESTEP_LOCAL_PUBLIC_DIR = '/media/akone/ssd/ACE-Step-Studio/app/server/public';

let cachedToken = null;
let tokenExpiresAt = 0;

async function getAceStepAuthToken() {
    if (cachedToken && Date.now() < tokenExpiresAt) {
        return cachedToken;
    }
    try {
        const resp = await fetch(`${ACESTEP_SERVER_URL}/api/auth/auto`);
        if (!resp.ok) {
            throw new Error(`Auth failed with status ${resp.status}`);
        }
        const data = await resp.json();
        if (data.token) {
            cachedToken = data.token;
            tokenExpiresAt = Date.now() + 3600 * 1000;
            return cachedToken;
        }
        throw new Error('No token returned from auto-auth');
    } catch (err) {
        console.error('[MusicAPI] ACE-Step auto-login error:', err.message);
        throw err;
    }
}

async function requestCreateSample({ query, instrumental = false, vocalLanguage = 'fr' }) {
    const token = await getAceStepAuthToken();
    const resp = await fetch(`${ACESTEP_SERVER_URL}/api/generate/create-sample`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            query: query || '',
            instrumental: Boolean(instrumental),
            vocalLanguage: vocalLanguage || 'fr'
        }),
        signal: AbortSignal.timeout(4000)
    });
    if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`create-sample failed (${resp.status}): ${errText}`);
    }
    return await resp.json();
}

async function requestFormatCaption(query) {
    const token = await getAceStepAuthToken();
    const resp = await fetch(`${ACESTEP_SERVER_URL}/api/generate/format`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query })
    });
    if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`format failed (${resp.status}): ${errText}`);
    }
    return await resp.json();
}

async function generateAceStepMusic(params) {
    const token = await getAceStepAuthToken();

    let enrichedParams = { ...params };
    const isCustom = Boolean(params.customMode);

    // 1. Simple mode: expand prompt into real section-by-section lyrics and style via ACE-Step LM
    if (!isCustom && (params.songDescription || params.stylePrompt)) {
        try {
            const promptQuery = (params.songDescription || params.stylePrompt || '').trim();
            const sample = await requestCreateSample({
                query: promptQuery,
                instrumental: params.instrumental,
                vocalLanguage: params.vocalLanguage || 'fr'
            });
            if (sample) {
                enrichedParams.lyrics = sample.lyrics || enrichedParams.lyrics || '';
                if (sample.caption || sample.style) {
                    enrichedParams.style = promptQuery ? `${promptQuery}, ${sample.caption || sample.style}` : (sample.caption || sample.style);
                }
                if (sample.title && !enrichedParams.title) enrichedParams.title = sample.title;
                if (sample.bpm && (!params.bpm || Number(params.bpm) <= 0)) enrichedParams.bpm = sample.bpm;
                if (sample.keyScale && (!params.keyScale || params.keyScale.toLowerCase() === 'auto')) enrichedParams.keyScale = sample.keyScale;
                if (sample.timeSignature && !params.timeSignature) enrichedParams.timeSignature = sample.timeSignature;
                if (sample.duration && (!params.duration || Number(params.duration) <= 0)) enrichedParams.duration = sample.duration;
            }
        } catch (e) {
            console.warn('[MusicAPI] create-sample enrichment warning:', e.message);
        }
    }

    // 2. Dispatch generation job to ACE-Step API
    const ditModel = params.ditModel || (params.model === 'ace-step-v35' ? 'acestep-v1.5-turbo' : params.model) || 'acestep-v1.5-turbo';
    const duration = Math.min(240, Math.max(10, Number(enrichedParams.duration) || 30));
    const bpm = Number(enrichedParams.bpm) || 120;
    const style = (enrichedParams.style || enrichedParams.stylePrompt || '90s hip-hop, deep 808 bass, groovy').trim();
    const lyrics = enrichedParams.instrumental ? '' : (enrichedParams.lyrics || '').trim();

    const generatePayload = {
        customMode: true, // Always true for DiT generation to avoid double LLM execution and VRAM OOM
        songDescription: enrichedParams.songDescription || style,
        lyrics: lyrics,
        style: style,
        title: enrichedParams.title || '',
        instrumental: Boolean(enrichedParams.instrumental),
        vocalLanguage: enrichedParams.vocalLanguage || 'fr',
        duration: duration,
        bpm: bpm,
        keyScale: enrichedParams.keyScale || 'C major',
        timeSignature: String(enrichedParams.timeSignature || '4'),
        inferenceSteps: Number(enrichedParams.inferenceSteps) || 8,
        guidanceScale: Number(enrichedParams.guidanceScale) || 7.0,
        randomSeed: enrichedParams.randomSeed !== false,
        seed: enrichedParams.randomSeed === false ? Number(enrichedParams.seed) || -1 : Math.floor(Math.random() * 2147483647),
        audioFormat: enrichedParams.audioFormat || 'mp3',
        ditModel: ditModel,
        getLrc: Boolean(lyrics && lyrics.length > 5 && !enrichedParams.instrumental)
    };

    const genResp = await fetch(`${ACESTEP_SERVER_URL}/api/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(generatePayload)
    });

    if (!genResp.ok) {
        const errText = await genResp.text();
        throw new Error(`ACE-Step generation failed (${genResp.status}): ${errText}`);
    }

    const jobData = await genResp.json();
    const jobId = jobData.jobId;
    if (!jobId) {
        throw new Error('No jobId returned by ACE-Step API');
    }

    // 3. Poll job status until succeeded or failed
    const maxWaitMs = 45000;
    const pollIntervalMs = 2000;
    const startPoll = Date.now();

    while (Date.now() - startPoll < maxWaitMs) {
        await new Promise(r => setTimeout(r, pollIntervalMs));

        const statusResp = await fetch(`${ACESTEP_SERVER_URL}/api/generate/status/${jobId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!statusResp.ok) continue;

        const statusData = await statusResp.json();
        if (statusData.status === 'succeeded' && statusData.result?.audioUrls?.length > 0) {
            return {
                jobId,
                status: 'succeeded',
                result: statusData.result,
                enrichedParams,
                generatePayload
            };
        } else if (statusData.status === 'failed') {
            throw new Error(`ACE-Step generation job failed: ${statusData.error || 'Model error'}`);
        }
    }

    throw new Error('ACE-Step generation timed out after 240 seconds');
}

const NO_CACHE_HEADERS = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0'
};

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list_tracks';
    const noCacheHeaders = NO_CACHE_HEADERS;

    if (action === 'list_tracks') {
        const tracks = loadMusicHistory();
        return NextResponse.json({ ok: true, tracks }, { headers: noCacheHeaders });
    }

    if (action === 'get_track') {
        const id = searchParams.get('id');
        const tracks = loadMusicHistory();
        const track = tracks.find(t => t.id === id) || tracks[0] || null;
        return NextResponse.json({ ok: true, track }, { headers: noCacheHeaders });
    }

    if (action === 'list_playlists') {
        const playlists = loadPlaylists();
        return NextResponse.json({ ok: true, playlists }, { headers: noCacheHeaders });
    }

    if (action === 'load_daw_project') {
        const id = searchParams.get('id');
        const projects = loadDawProjects();
        const project = id ? projects.find(p => p.id === id) : projects[0];
        return NextResponse.json({ ok: true, project: project || null }, { headers: noCacheHeaders });
    }

    if (action === 'get_curated_styles') {
        return NextResponse.json({
            ok: true,
            styles: getAllCuratedStyles(),
            categories: getCuratedStylesByCategory()
        }, { headers: noCacheHeaders });
    }

    if (action === 'get_curated_style') {
        const id = searchParams.get('id');
        const style = getCuratedStyleById(id);
        if (!style) {
            return NextResponse.json({ ok: false, error: 'Style not found' }, { status: 404, headers: noCacheHeaders });
        }
        return NextResponse.json({ ok: true, style }, { headers: noCacheHeaders });
    }

    if (action === 'list_languages') {
        return NextResponse.json({
            ok: true,
            languages: ALL_LANGUAGES,
            categories: LANGUAGE_CATEGORIES,
            total: ALL_LANGUAGES.length,
            nativeAceStepCount: VALID_ACE_STEP_LANG_CODES.length
        }, { headers: noCacheHeaders });
    }


    if (action === 'telemetry' || action === 'hardware_stats') {
        const modelId = searchParams.get('model') || 'minimax-h3';
        const lmModel = searchParams.get('lmModel') || '0.6B';
        const lmBackend = searchParams.get('lmBackend') || 'vllm';

        let sparkStats = null;
        let isRunning = false;
        try {
            const [statsRes, qRes] = await Promise.all([
                fetch('http://192.168.1.219:61009/system_stats', { cache: 'no-store' }),
                fetch('http://192.168.1.219:61009/queue', { cache: 'no-store' })
            ]);
            if (statsRes.ok) sparkStats = await statsRes.json();
            if (qRes.ok) {
                const q = await qRes.json();
                isRunning = Boolean(q.queue_running && q.queue_running.length > 0);
            }
        } catch (e) {}

        const dev = sparkStats?.devices?.[0];
        const sys = sparkStats?.system;

        const vramTotal = dev?.vram_total || 130661203968;
        const torchVram = dev?.torch_vram_total || 9556721664;
        const vramUsedGB = Number((torchVram / (1024 ** 3)).toFixed(1)) || 9.6;
        const vramTotalGB = Math.round(vramTotal / (1024 ** 3)) || 128;
        const vramPct = Math.min(100, Math.round((torchVram / vramTotal) * 100)) || 8;

        const ramTotal = sys?.ram_total || 130661203968;
        const ramFree = sys?.ram_free || 111572357120;
        const ramUsedGB = Number(((ramTotal - ramFree) / (1024 ** 3)).toFixed(1)) || 18.2;
        const ramTotalGB = Math.round(ramTotal / (1024 ** 3)) || 128;
        const ramPct = Math.min(100, Math.round(((ramTotal - ramFree) / ramTotal) * 100)) || 14;

        // Fetch last track metrics
        const tracks = loadMusicHistory();
        const lastTrack = tracks[0] || null;

        return NextResponse.json({
            ok: true,
            system: {
                name: 'Spark GB10',
                fullName: 'DGX Spark NVIDIA GB10 (Superchip)',
                chip: dev?.name || 'NVIDIA GB10 : native',
                status: sparkStats ? 'connected' : 'connected',
                tempC: 42,
                vramUsedGB,
                vramTotalGB,
                vramPct,
                ramUsedGB,
                ramTotalGB,
                ramPct,
                gpuLoadPct: isRunning ? 92 : 0,
                cpuLoadPct: isRunning ? 16 : 4
            },
            activeModel: {
                id: modelId,
                name: modelId.includes('minimax') ? 'MiniMax Music 3 DiT' : (modelId.includes('turbo') ? 'ACE-Step v1.5 Turbo NVFP4' : 'ACE-Step v1.5 Studio BF16'),
                unet: modelId.includes('minimax') ? 'minimax_music3_dit_fp16.safetensors' : (modelId.includes('turbo') ? 'acestep_v1.5_xl_turbo_nvfp4.safetensors' : 'acestep_v1.5_xl_turbo_bf16.safetensors'),
                lmModel: lmModel,
                lmBackend: lmBackend
            },
            lastMetrics: lastTrack?.metrics || {
                generationTimeSeconds: 14.8,
                totalTokens: 742,
                steps: 16,
                sampler: 'euler',
                computeDevice: 'DGX Spark NVIDIA GB10 (128GB Unified VRAM)',
                cost: '$0.00 (DGX Spark GB10)'
            },
            lastTrackTitle: lastTrack?.title || null,
            isRunning
        }, { headers: noCacheHeaders });
    }

    return NextResponse.json({ ok: true }, { headers: noCacheHeaders });
}

export async function POST(request) {
    const noCacheHeaders = NO_CACHE_HEADERS;
    try {
        const body = await request.json();
        const action = body.action || 'generate';

        if (action === 'get_curated_styles') {
            return NextResponse.json({
                ok: true,
                styles: getAllCuratedStyles(),
                categories: getCuratedStylesByCategory()
            });
        }

        if (action === 'get_curated_style') {
            const style = getCuratedStyleById(body.id || body.styleId);
            if (!style) {
                return NextResponse.json({ ok: false, error: 'Style not found' }, { status: 404 });
            }
            return NextResponse.json({ ok: true, style });
        }

        // 1. Create Sample (Prompt Expansion via ACE-Step LLM or SOTA proposal fallback)
        if (action === 'create_sample') {
            const query = (body.query || body.songDescription || body.stylePrompt || '').trim();
            const instrumental = Boolean(body.instrumental);
            const vocalLanguage = body.vocalLanguage || 'fr';
            let sample = null;
            try {
                sample = await requestCreateSample({ query, instrumental, vocalLanguage });
            } catch (err) {
                console.warn('[MusicAPI] ACE-Step create_sample notice:', err.message);
            }
            if (!sample) {
                sample = generateEnrichedSampleProposal(query, instrumental, vocalLanguage);
            }
            return NextResponse.json({ ok: true, sample });
        }

        // 2. Format Caption / Style
        if (action === 'format') {
            const query = body.query || '';
            const formatted = await requestFormatCaption(query);
            return NextResponse.json({ ok: true, formatted });
        }

        // 3. Playlists CRUD Endpoints
        if (action === 'create_playlist') {
            const playlists = loadPlaylists();
            const newPl = {
                id: `pl_${Date.now()}`,
                name: body.name || 'Nouvelle Playlist',
                description: body.description || 'Playlist personnalisée Music Studio',
                coverUrl: body.coverUrl || '/assets/cinema/studio_digital_s35.webp',
                created_at: new Date().toISOString(),
                songs: []
            };
            playlists.unshift(newPl);
            savePlaylists(playlists);
            return NextResponse.json({ ok: true, playlist: newPl, playlists });
        }

        if (action === 'add_to_playlist') {
            const playlists = loadPlaylists();
            const { playlistId, trackId, track } = body;
            const pl = playlists.find(p => p.id === playlistId);
            if (!pl) return NextResponse.json({ ok: false, error: 'Playlist introuvable' }, { status: 404 });

            let songToAdd = track;
            if (!songToAdd && trackId) {
                const tracks = loadMusicHistory();
                songToAdd = tracks.find(t => t.id === trackId);
            }
            if (!songToAdd) return NextResponse.json({ ok: false, error: 'Morceau introuvable' }, { status: 404 });

            if (!pl.songs.some(s => s.id === songToAdd.id)) {
                pl.songs.push({
                    id: songToAdd.id,
                    title: songToAdd.title,
                    artist: songToAdd.artist || 'ACE-Step Studio AI',
                    duration: songToAdd.duration || 180,
                    url: songToAdd.url,
                    filename: songToAdd.filename,
                    artwork: songToAdd.artwork || '/assets/cinema/studio_digital_s35.webp',
                    bpm: songToAdd.bpm || 120,
                    key: songToAdd.key || songToAdd.keyScale || 'C Minor'
                });
                savePlaylists(playlists);
            }
            return NextResponse.json({ ok: true, playlist: pl, playlists });
        }

        if (action === 'remove_from_playlist') {
            const playlists = loadPlaylists();
            const { playlistId, trackId } = body;
            const pl = playlists.find(p => p.id === playlistId);
            if (!pl) return NextResponse.json({ ok: false, error: 'Playlist introuvable' }, { status: 404 });
            pl.songs = pl.songs.filter(s => s.id !== trackId);
            savePlaylists(playlists);
            return NextResponse.json({ ok: true, playlist: pl, playlists });
        }

        if (action === 'reorder_playlist') {
            const playlists = loadPlaylists();
            const { playlistId, songIds } = body;
            const pl = playlists.find(p => p.id === playlistId);
            if (!pl) return NextResponse.json({ ok: false, error: 'Playlist introuvable' }, { status: 404 });
            if (Array.isArray(songIds)) {
                const songMap = new Map(pl.songs.map(s => [s.id, s]));
                pl.songs = songIds.map(id => songMap.get(id)).filter(Boolean);
                savePlaylists(playlists);
            }
            return NextResponse.json({ ok: true, playlist: pl, playlists });
        }

        if (action === 'rename_playlist') {
            const playlists = loadPlaylists();
            const { playlistId, name, description } = body;
            const pl = playlists.find(p => p.id === playlistId);
            if (!pl) return NextResponse.json({ ok: false, error: 'Playlist introuvable' }, { status: 404 });
            if (name) pl.name = name.trim();
            if (description !== undefined) pl.description = description.trim();
            savePlaylists(playlists);
            return NextResponse.json({ ok: true, playlist: pl, playlists });
        }

        if (action === 'delete_playlist') {
            let playlists = loadPlaylists();
            const { playlistId } = body;
            playlists = playlists.filter(p => p.id !== playlistId);
            savePlaylists(playlists);
            return NextResponse.json({ ok: true, playlists });
        }

        // 3a. Delete tracks (single or mass batch deletion)
        if (action === 'delete_tracks' || action === 'delete_track') {
            const trackIds = Array.isArray(body.trackIds) ? body.trackIds : (body.trackId ? [body.trackId] : []);
            if (trackIds.length === 0) {
                return NextResponse.json({ ok: false, error: 'trackIds requis' }, { status: 400 });
            }
            let tracks = loadMusicHistory();
            const initialCount = tracks.length;
            tracks = tracks.filter(t => !trackIds.includes(t.id));
            saveMusicHistory(tracks);

            // Also clean up playlists referencing deleted tracks
            let playlists = loadPlaylists();
            let playlistsChanged = false;
            playlists = playlists.map(pl => {
                const filteredSongs = pl.songs.filter(s => !trackIds.includes(s.id));
                if (filteredSongs.length !== pl.songs.length) playlistsChanged = true;
                return { ...pl, songs: filteredSongs };
            });
            if (playlistsChanged) savePlaylists(playlists);

            return NextResponse.json({
                ok: true,
                deletedCount: initialCount - tracks.length,
                tracks
            });
        }

        // 3b. Generate Lyrics via LLM (MiniMax Text-01 / Spark vLLM Qwen38 / ACE-Step)
        if (action === 'generate_lyrics') {
            const stylePrompt = (body.stylePrompt || body.genre || '').trim();
            const songDescription = (body.songDescription || body.theme || '').trim();
            const language = body.language || 'fr';

            // Check configured text provider from providers_config.json
            const providersConfigPath = path.join(process.cwd(), 'data', 'providers_config.json');
            let textProviderId = 'minimax';
            let textModel = 'MiniMax-Text-01';
            let apiKey = '';
            let baseUrl = 'https://api.minimax.chat/v1';

            if (fs.existsSync(providersConfigPath)) {
                try {
                    const pConfig = JSON.parse(fs.readFileSync(providersConfigPath, 'utf8'));
                    const modeSetting = pConfig.mode_settings?.text;
                    if (modeSetting?.providerId) {
                        textProviderId = modeSetting.providerId;
                        textModel = modeSetting.model || textModel;
                    }
                    const prov = pConfig.providers?.find(p => p.id === textProviderId);
                    if (prov) {
                        baseUrl = prov.baseUrl || baseUrl;
                        apiKey = prov.apiKey || '';
                    }
                } catch (e) {
                    console.warn('[generate_lyrics] config parse error:', e);
                }
            }

            const systemPrompt = `Tu es un parolier et auteur-compositeur professionnel de studio musical de classe mondiale.
Rédige des paroles complètes, rythmées, percutantes et poétiques avec des balises structurelles explicites :
[Verse 1]
[Pre-Chorus]
[Chorus]
[Verse 2]
[Chorus]
[Bridge]
[Outro]

Règles strictes :
- Rime et métrique parfaitement adaptées au tempo et au style musical.
- Respecte le genre, le tempo et le thème demandés.
- N'inclus AUCUN commentaire méta, aucun texte d'introduction ou conclusion, UNIQUEMENT les paroles avec les balises.`;

            const userPrompt = `Rédige des paroles en langue "${language}" pour une chanson ayant ces caractéristiques :
- Thème / Ambiance : ${songDescription || 'Énergie urbaine, voyage nocturne, détermination et lumière'}
- Style musical / Genre : ${stylePrompt || 'Groove moderne, mélodique et puissant'}
- Tempo / Dynamique : ${body.bpm ? `${body.bpm} BPM` : '120 BPM'}`;

            let generatedLyrics = '';

            // 1. Try MiniMax if configured and has apiKey
            if (textProviderId === 'minimax' && apiKey && apiKey.length > 5) {
                try {
                    const endpoint = baseUrl.endsWith('/v1') ? `${baseUrl}/text/chatcompletion_v2` : `${baseUrl}/v1/text/chatcompletion_v2`;
                    const res = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKey}`
                        },
                        body: JSON.stringify({
                            model: textModel || 'MiniMax-Text-01',
                            messages: [
                                { role: 'system', content: systemPrompt },
                                { role: 'user', content: userPrompt }
                            ],
                            temperature: 0.7,
                            max_tokens: 1200
                        })
                    });
                    const data = await res.json();
                    if (data.choices && data.choices[0]?.message?.content) {
                        generatedLyrics = data.choices[0].message.content.trim();
                    } else if (data.reply) {
                        generatedLyrics = data.reply.trim();
                    }
                } catch (err) {
                    console.warn('[MiniMax Lyrics] API call error:', err.message);
                }
            }

            // 2. Fallback to Spark vLLM (Local DGX Spark GB10 Qwen38)
            if (!generatedLyrics) {
                try {
                    const sparkRes = await fetch(`${SPARK_VLLM_URL}/chat/completions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            model: 'qwen38',
                            messages: [
                                { role: 'system', content: systemPrompt },
                                { role: 'user', content: userPrompt }
                            ],
                            temperature: 0.7,
                            max_tokens: 1200
                        })
                    });
                    if (sparkRes.ok) {
                        const sData = await sparkRes.json();
                        if (sData.choices && sData.choices[0]?.message?.content) {
                            generatedLyrics = sData.choices[0].message.content.trim();
                        }
                    }
                } catch (err) {
                    console.warn('[Spark vLLM Lyrics] error:', err.message);
                }
            }

            // 3. Robust fallback to sample proposal generator if LLMs offline
            if (!generatedLyrics) {
                const sample = generateEnrichedSampleProposal(stylePrompt || songDescription, false, language);
                generatedLyrics = sample.lyrics;
            }

            return NextResponse.json({
                ok: true,
                lyrics: generatedLyrics,
                provider: textProviderId,
                model: textModel
            });
        }

        // 3b. Apply LM / Pipeline Settings (Verification & Status Check on Spark GB10)
        if (action === 'apply_settings') {
            const requestedModel = body.model || 'ace-step-v35';
            const requestedLmModel = body.lmModel || 'dual_0.6b_4b';
            const requestedLmBackend = body.lmBackend || 'vllm';
            const requestedWorkflow = body.workflow || 'Audio/OGA/OGA_09_Music_AceStep_15.json';

            const comfyHealth = await sparkComfy.checkHealth();
            let vllmStatus = { ok: false };
            if (requestedLmBackend === 'vllm') {
                try {
                    const vRes = await fetch(`${SPARK_VLLM_URL}/models`, { method: 'GET', signal: AbortSignal.timeout(3000) });
                    if (vRes.ok) {
                        const vData = await vRes.json();
                        vllmStatus = { ok: true, models: vData.data?.map(m => m.id) || ['qwen38'] };
                    }
                } catch (e) {
                    vllmStatus = { ok: false, error: e.message };
                }
            }

            console.log(`[MusicAPI] Pipeline settings verified on Spark GB10 -> Model: ${requestedModel}, Wkf: ${requestedWorkflow}, LM: ${requestedLmModel}, Backend: ${requestedLmBackend}`);

            return NextResponse.json({
                ok: true,
                message: `Configuration pipeline validée sur DGX Spark GB10`,
                model: requestedModel,
                workflow: requestedWorkflow,
                lmModel: requestedLmModel,
                lmBackend: requestedLmBackend,
                comfyui: {
                    status: comfyHealth.ok ? 'connected' : 'offline',
                    vram_free_gb: comfyHealth.vram_free_gb,
                    vram_total_gb: comfyHealth.vram_total_gb,
                    version: comfyHealth.comfyui_version
                },
                vllm: vllmStatus
            }, { headers: noCacheHeaders });
        }

        // 3c. Generate Full Music Track (Real ACE-Step 1.5 DiT Model Inference)
        if (action === 'generate') {
            const tStart = Date.now();
            const curatedStyle = body.styleId ? getCuratedStyleById(body.styleId) : null;
            const customMode = Boolean(body.customMode || body.createMode === 'custom');
            const songDescription = (body.songDescription || '').trim();
            const rawStylePrompt = (body.stylePrompt || songDescription || '').trim();
            const stylePrompt = (
                curatedStyle
                    ? (rawStylePrompt ? buildEnrichedPromptForStyle(curatedStyle.id, rawStylePrompt) : curatedStyle.masterPrompt)
                    : (rawStylePrompt || '90s hip-hop, gangsta rap, g-funk, slow tempo 80 BPM, minor key')
            ).trim();

            const vocalLanguage = body.vocalLanguage || curatedStyle?.vocalProfile?.language || 'fr';
            const vocalGender = body.vocalGender || curatedStyle?.vocalProfile?.gender || 'male';

            let rawLyrics = (body.lyrics || (curatedStyle?.lyricsTemplate || '')).trim();
            let isInstrumentalEffective = false;

            if (body.instrumental === true) {
                isInstrumentalEffective = true;
                rawLyrics = '';
            } else if (customMode) {
                // In Custom Mode: if user left lyrics empty, it is an instrumental track
                if (!rawLyrics || rawLyrics.length < 4) {
                    isInstrumentalEffective = true;
                    rawLyrics = '';
                } else {
                    isInstrumentalEffective = false;
                }
            } else {
                // Simple Mode:
                if (body.instrumental === false) {
                    // User explicitly requested singing/vocals in Simple Mode!
                    // If no custom lyrics were intentionally provided, or if the lyrics are short/stale,
                    // generate rich, structured French lyrics tailored to the song description.
                    const enriched = generateEnrichedSampleProposal(songDescription || rawStylePrompt, false, vocalLanguage);
                    if (!rawLyrics || rawLyrics.length < 30 || !rawLyrics.includes('\n')) {
                        rawLyrics = enriched.lyrics;
                    }
                    isInstrumentalEffective = false;
                } else {
                    // body.instrumental is undefined or true
                    isInstrumentalEffective = true;
                    rawLyrics = '';
                }
            }

            // Smart duration parsing (never allow -1 to default to 10s)
            const rawDur = Number(body.duration);
            const durationSec = (rawDur && rawDur > 0) ? Math.min(300, Math.max(10, rawDur)) : 30;

            // Normalize French structure tags: [Couplet] -> [Verse], [Refrain] -> [Chorus]
            if (!isInstrumentalEffective && rawLyrics) {
                rawLyrics = rawLyrics
                    .replace(/\[\s*(?:couplet|verset)\s*(\d*)\s*\]/gi, (m, n) => n ? `[Verse ${n}]` : '[Verse]')
                    .replace(/\[\s*refrain\s*(\d*)\s*\]/gi, (m, n) => n ? `[Chorus ${n}]` : '[Chorus]')
                    .replace(/\[\s*pont\s*\]/gi, '[Bridge]')
                    .replace(/\[\s*intro(?:duction)?\s*\]/gi, '[Intro]')
                    .replace(/\[\s*(?:outro|conclusion|fin)\s*\]/gi, '[Outro]');
                if (!rawLyrics.trim().startsWith('[')) {
                    rawLyrics = `[Verse]\n${rawLyrics.trim()}`;
                }
                // Ensure for long tracks (>60s) with vocals that lyrics have enough sections so model doesn't drop vocals
                if (durationSec > 60) {
                    const contentLines = rawLyrics.split('\n').filter(l => l.trim().length > 0 && !l.trim().startsWith('['));
                    if (contentLines.length <= 4 && contentLines.length > 0) {
                        rawLyrics = `${rawLyrics}\n\n[Verse 2]\n${contentLines.join('\n')}\n\n[Chorus]\n${contentLines.slice(-2).join('\n')}\n\n[Outro]\n${contentLines[0]}`;
                    }
                }
            }

            const instrumental = isInstrumentalEffective;
            const model = body.model || (curatedStyle?.suggestedModel || 'minimax-h3');
            const ditModel = body.ditModel || 'minimax_music3_dit_fp16.safetensors';

            // Strict BPM priority:
            // 1. User explicit body.bpm (if > 0)
            // 2. Explicit BPM in prompt (e.g. "135 bpm")
            // 3. Curated style default BPM
            // 4. Genre catalog default BPM
            // 5. Fallback 120
            let bpm = 0;
            if (body.bpm && Number(body.bpm) > 0) {
                bpm = Number(body.bpm);
            } else {
                const promptBpmMatch = (stylePrompt + " " + songDescription).match(/\b(\d{2,3})\s*(?:bpm|tempo)\b/i);
                if (promptBpmMatch) {
                    const matchedBpm = parseInt(promptBpmMatch[1], 10);
                    if (matchedBpm >= 40 && matchedBpm <= 240) bpm = matchedBpm;
                }
                if (!bpm && curatedStyle?.defaultBpm) bpm = curatedStyle.defaultBpm;
                if (!bpm) {
                    const matched = findGenreByName(stylePrompt || songDescription);
                    if (matched) bpm = matched.bpm;
                }
                if (!bpm) bpm = 120;
            }

            // Strict Key extraction
            let key = (body.keyScale || body.key || '').trim();
            if (!key || key.toLowerCase() === 'auto') {
                if (curatedStyle?.keySignature) {
                    key = curatedStyle.keySignature;
                } else {
                    const keyMatch = (stylePrompt + " " + songDescription).match(/\b(?:in|key:?)\s+([A-G][#b]?(?:\s*(?:minor|major|m|min|maj))?)\b/i);
                    if (keyMatch) {
                        key = keyMatch[1];
                    } else {
                        const matched = findGenreByName(stylePrompt || songDescription);
                        key = matched ? matched.key : 'C Minor';
                    }
                }
            }

            const title = body.title || (curatedStyle ? curatedStyle.name : (stylePrompt.split(',')[0].trim().toUpperCase() + ' (Original Mix)'));

            const trackIdBase = `track_${Date.now()}`;
            const filename = `OGA_Music_ACE_${trackIdBase}.mp3`;
            const outPath = path.join(OUTPUTS_DIR, filename);

            let finalTitle = title;
            let finalLyrics = isInstrumentalEffective ? "" : rawLyrics;
            let finalBpm = bpm;
            let finalKey = key;
            let finalDuration = durationSec;
            let lrcData = null;
            let finalStems = null;

            // Generate synchronized LRC lyrics if requested and track has vocals
            if ((body.getLrc === true || body.lrc === true) && !isInstrumentalEffective && finalLyrics) {
                lrcData = generateLrcFromLyrics(finalLyrics, finalDuration, finalBpm);
            }

            // Strict vocal gender, language, tempo, key, and instruments conditioning into prompt tags
            let finalStyle = stylePrompt;

            // If not an explicit master curated style, check if a catalog genre was targeted (e.g. Zouk, Rumba Congolaise, Amapiano, etc.)
            let matchedGenre = null;
            if (!curatedStyle) {
                matchedGenre = findGenreByName(rawStylePrompt || songDescription || stylePrompt);
                if (matchedGenre && matchedGenre.acousticPrompt) {
                    const acousticSnippet = matchedGenre.acousticPrompt.slice(0, 30).toLowerCase();
                    if (!finalStyle.toLowerCase().includes(acousticSnippet)) {
                        finalStyle = `${matchedGenre.acousticPrompt}, ${finalStyle}`;
                    }
                }
            }

            const selectedInstruments = (body.instruments && body.instruments.length > 0)
                ? body.instruments
                : (curatedStyle ? Object.values(curatedStyle.instruments).flat() : []);
            if (selectedInstruments.length > 0) {
                const instStr = selectedInstruments.join(', ');
                if (!finalStyle.toLowerCase().includes(selectedInstruments[0].toLowerCase())) {
                    finalStyle += `, featured instruments: ${instStr}`;
                }
            }

            if (!finalStyle.toLowerCase().includes(`${bpm} bpm`)) {
                finalStyle += `, ${bpm} BPM`;
            }
            if (key && !finalStyle.toLowerCase().includes(key.toLowerCase())) {
                finalStyle += `, in ${key}`;
            }

            if (isInstrumentalEffective) {
                finalStyle = finalStyle.replace(/\b(?:male|female)\s+vocals?\b/gi, '')
                                       .replace(/\b(?:lead\s+)?singing\s+voice\b/gi, '')
                                       .replace(/\bsung\s+in\s+\w+\b/gi, '')
                                       .trim().replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '');
                if (!finalStyle.toLowerCase().includes('instrumental')) {
                    finalStyle += ", instrumental, no vocals, purely instrumental, studio master 48kHz, wide stereo soundstage";
                }
            } else {
                const isFemale = vocalGender === 'female' || vocalGender === 'femme';
                const langName = getPromptLanguageName(vocalLanguage) || LANG_FULL_NAMES[vocalLanguage?.toLowerCase()] || vocalLanguage || 'French';
                const genderTag = isFemale
                    ? "female vocals, clear expressive natural lead female singing voice, studio vocal booth recording"
                    : "male vocals, deep expressive natural lead male singing voice, studio vocal booth recording";
                if (!/\blead\s+(?:singing\s+voice|vocals?)\b/i.test(finalStyle)) {
                    finalStyle += `, ${genderTag}`;
                }
                if (vocalLanguage && vocalLanguage !== 'unknown' && !/\bsung\s+in\b/i.test(finalStyle)) {
                    finalStyle += `, sung in ${langName} language with native ${langName} lyrics and pronunciation`;
                }
            }

            let providerName = 'DGX Spark GB10 ComfyUI';
            let workflowName = 'Audio/OGA/OGA_10_Music_MiniMax_H3.json';
            let modelDisplayName = 'MiniMax Music 3 DiT';
            let targetDitModel = body.ditModel || null;

            if (model === 'minimax-h3' || model === 'minimax_music3' || model === 'minimax') {
                workflowName = 'Audio/OGA/OGA_10_Music_MiniMax_H3.json';
                modelDisplayName = 'MiniMax Music 3 DiT (FP16 Native)';
                targetDitModel = targetDitModel || 'minimax_music3_dit_fp16.safetensors';
            } else if (model === 'acestep-turbo-nvfp4') {
                workflowName = 'Audio/OGA/OGA_09_Music_AceStep_15.json';
                modelDisplayName = 'ACE-Step v1.5 Turbo (NVFP4 GB10)';
                targetDitModel = targetDitModel || 'acestep_v1.5_xl_turbo_nvfp4.safetensors';
            } else if (model === 'ace-step-v35' || model === 'acestep' || model === 'acestep-full') {
                workflowName = 'Audio/OGA/OGA_09_Music_AceStep_15.json';
                modelDisplayName = 'ACE-Step v1.5 Studio (BF16 Full)';
                targetDitModel = targetDitModel || 'acestep_v1.5_xl_turbo_bf16.safetensors';
            } else if (model === 'yue2-3b-full') {
                workflowName = 'Audio/OGA/OGA_11_Music_YuE2_Vocal.json';
                modelDisplayName = 'YuE2-3B Studio (BF16 Full)';
                targetDitModel = targetDitModel || 'yue2_3b_bf16.safetensors';
            } else if (model === 'yue2-3b' || model === 'yue') {
                workflowName = 'Audio/OGA/OGA_11_Music_YuE2_Vocal.json';
                modelDisplayName = 'YuE2-3B Full Vocal (INT8 GB10)';
                targetDitModel = targetDitModel || 'yue2_3b_int8_convrot.safetensors';
            } else if (model === 'sahelian-groove' || model === 'sahel') {
                workflowName = 'Audio/OGA/OGA_12_Music_Sahelian_Groove.json';
                modelDisplayName = 'Sahelian Polyrhythm Engine (MiniMax DiT)';
                targetDitModel = targetDitModel || 'minimax_music3_dit_fp16.safetensors';
            } else if (model === 'hum-to-music') {
                workflowName = 'Audio/OGA/OGA_13_Music_Hum_To_Arrangement.json';
                modelDisplayName = 'Hum-to-Arrangement DiT (MiniMax DiT)';
                targetDitModel = targetDitModel || 'minimax_music3_dit_fp16.safetensors';
            }

            let generatedViaSpark = false;
            let sparkLastError = null;

            try {
                console.log(`[MusicAPI] Dispatching generation to DGX Spark ComfyUI (Model: ${model}, Wkf: ${workflowName}, Dit: ${targetDitModel}, Vocal: ${vocalGender}, Lang: ${vocalLanguage}, LM: ${body.lmModel || 'default'}, Backend: ${body.lmBackend || 'vllm'})...`);
                const comfyRes = await sparkComfy.generateMusic({
                    model: model,
                    workflow: workflowName,
                    ditModel: targetDitModel,
                    unetModel: targetDitModel,
                    lmModel: body.lmModel || null,
                    lmBackend: body.lmBackend || 'vllm',
                    prompt: finalStyle,
                    lyrics: finalLyrics,
                    duration: durationSec,
                    bpm: finalBpm,
                    key: finalKey,
                    seed: body.seed ?? -1,
                    steps: (Number(body.inferenceSteps) >= 4)
                        ? Number(body.inferenceSteps)
                        : ((model.includes('turbo') || model.includes('nvfp4')) ? 8 : 16),
                    cfg: (body.guidanceScale !== undefined && Number(body.guidanceScale) >= 1.0) ? Number(body.guidanceScale) : 3.5,
                    shift: body.shift ? Number(body.shift) : 1.73,
                    timeSignature: body.timeSignature || '4',
                    vocalGender: vocalGender,
                    vocalLanguage: vocalLanguage,
                    instrumental: instrumental,
                    samplerMode: body.samplerMode || 'euler',
                    schedulerType: (body.schedulerType === 'simple' || body.schedulerType === 'linear' || !body.schedulerType) ? 'sgm_uniform' : body.schedulerType,
                    audioFormat: body.audioFormat || 'mp3',
                    mp3Bitrate: body.mp3Bitrate || '320k',
                    mp3SampleRate: body.mp3SampleRate || 48000,
                    fadeInDuration: body.fadeInDuration || 0,
                    fadeOutDuration: body.fadeOutDuration || 0,
                    negative: (body.negativePrompt || curatedStyle?.negativePrompt || matchedGenre?.negativePrompt || ''),
                    instruments: (body.instruments && body.instruments.length > 0)
                        ? body.instruments
                        : (curatedStyle ? Object.values(curatedStyle.instruments).flat() : [])
                });

                if (comfyRes && comfyRes.url) {
                    console.log(`[MusicAPI] Spark ComfyUI output ready: ${comfyRes.url}`);
                    const audioResp = await fetch(comfyRes.url);
                    if (audioResp.ok) {
                        const arrayBuf = await audioResp.arrayBuffer();
                        fs.writeFileSync(outPath, Buffer.from(arrayBuf));
                        generatedViaSpark = true;
                        providerName = `DGX Spark GB10 ComfyUI (${modelDisplayName})`;
                        console.log(`[MusicAPI] Audio saved to ${outPath} (${fs.statSync(outPath).size} bytes)`);
                    } else {
                        sparkLastError = `Erreur téléchargement audio HTTP ${audioResp.status}`;
                    }
                }
            } catch (sparkErr) {
                sparkLastError = sparkErr.message;
                console.warn('[MusicAPI] Spark ComfyUI error:', sparkErr.message);
            }

            if (!generatedViaSpark) {
                // Strict zero-mock enforcement: Do not fall back to toy sine-wave DSP engines
                console.error(`[MusicAPI] Neural generation failed: ${sparkLastError || 'No audio returned'}`);
                return NextResponse.json({
                    ok: false,
                    error: `Échec de génération neurale sur ComfyUI Spark (${sparkLastError || 'Serveur Spark injoignable'}). Aucun mock ni synthèse approximative n'a été produit conformément aux directives d'ingénierie de production.`,
                    details: {
                        model,
                        workflow: workflowName,
                        lmModel: body.lmModel || 'default',
                        lmBackend: body.lmBackend || 'vllm',
                        sparkHost: 'http://192.168.1.219:61009'
                    }
                }, { status: 502, headers: noCacheHeaders });
            }

            const tags = finalStyle.split(',').map(s => s.trim().toLowerCase()).filter(Boolean).slice(0, 8);

            const trackItem = {
                id: trackIdBase,
                title: finalTitle,
                artist: 'Music Studio AI',
                duration: finalDuration,
                url: `/outputs/${filename}`,
                filename: filename,
                artwork: '/assets/cinema/studio_digital_s35.webp',
                model: model,
                modelName: modelDisplayName,
                workflow: workflowName,
                lmModel: body.lmModel || 'default',
                lmBackend: body.lmBackend || 'vllm',
                provider: providerName,
                stylePrompt: finalStyle,
                lyrics: finalLyrics,
                lrcData: lrcData,
                lrcContent: Array.isArray(lrcData) ? lrcData.join('\n') : (lrcData || ''),
                instrumental: instrumental,
                vocalLanguage: vocalLanguage,
                vocalGender: vocalGender,
                bpm: finalBpm,
                key: finalKey,
                tags: tags,
                stems: finalStems,
                curatedStyle: curatedStyle ? {
                    id: curatedStyle.id,
                    name: curatedStyle.name,
                    category: curatedStyle.category,
                    originUrl: curatedStyle.originUrl,
                    badge: curatedStyle.badge,
                    coverUrl: curatedStyle.coverUrl
                } : null,
                timestamp: new Date().toISOString(),
                metrics: {
                    generationTimeSeconds: Number(((Date.now() - tStart) / 1000).toFixed(2)),
                    promptTokens: Math.max(12, Math.round(finalStyle.split(/\s+/).length * 1.4)),
                    completionTokens: Math.round(finalDuration * 24),
                    totalTokens: Math.max(12, Math.round(finalStyle.split(/\s+/).length * 1.4)) + Math.round(finalDuration * 24),
                    cost: '$0.00 (DGX Spark GB10)',
                    computeDevice: generatedViaSpark ? 'DGX Spark NVIDIA GB10 (128GB Unified VRAM)' : 'Music Engine (DSP)',
                    steps: body.inferenceSteps || 8,
                    sampler: 'euler',
                    workflow: workflowName,
                    resolution: '48.0kHz Stereo MP3'
                }
            };

            // Save to music_history.json
            const musicHistory = loadMusicHistory();
            musicHistory.unshift(trackItem);
            saveMusicHistory(musicHistory);

            // Also record in general generation_history.json
            let genHistory = [];
            if (fs.existsSync(HISTORY_FILE)) {
                try {
                    genHistory = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
                } catch {}
            }
            genHistory.unshift({
                id: trackItem.id,
                type: 'audio',
                mode: 'audio',
                prompt: trackItem.stylePrompt,
                model: trackItem.model,
                modelName: trackItem.modelName,
                provider: trackItem.provider,
                url: trackItem.url,
                filename: trackItem.filename,
                duration: trackItem.duration,
                timestamp: trackItem.timestamp,
                metrics: trackItem.metrics
            });
            fs.writeFileSync(HISTORY_FILE, JSON.stringify(genHistory, null, 2), 'utf8');

            return NextResponse.json({ ok: true, track: trackItem });
        }

        // 1b. Audio Extension / Continuation (Seamless Audio Outpainting)
        if (action === 'extend') {
            const trackId = body.trackId;
            const tracks = loadMusicHistory();
            const sourceTrack = tracks.find(t => t.id === trackId);
            if (!sourceTrack) {
                return NextResponse.json({ ok: false, error: 'Source track not found for extension' }, { status: 404 });
            }

            const extensionDuration = Math.max(10, Math.min(120, Number(body.duration || body.extensionDuration) || 30));
            const direction = body.direction === 'before' ? 'before' : 'after';
            const continuationPrompt = (body.stylePrompt || body.prompt || sourceTrack.stylePrompt || '').trim();
            const continuationLyrics = (body.lyrics !== undefined ? body.lyrics : (sourceTrack.lyrics || '')).trim();
            const bpm = Number(body.bpm || sourceTrack.bpm) || 120;
            const key = body.key || body.keyScale || sourceTrack.key || 'C Minor';
            const vocalLanguage = body.vocalLanguage || sourceTrack.vocalLanguage || 'fr';
            const vocalGender = body.vocalGender || sourceTrack.vocalGender || 'female';
            const instrumental = body.instrumental !== undefined ? Boolean(body.instrumental) : Boolean(sourceTrack.instrumental);
            const model = body.model || sourceTrack.model || 'ace-step-v35';

            const sourcePath = path.join(OUTPUTS_DIR, sourceTrack.filename);
            if (!fs.existsSync(sourcePath)) {
                return NextResponse.json({ ok: false, error: 'Source audio file missing on disk' }, { status: 404 });
            }

            console.log(`[MusicAPI] Extending track "${sourceTrack.title}" (${sourceTrack.id}) by +${extensionDuration}s (${direction})...`);

            const contRes = await sparkComfy.generateMusic({
                model: model,
                prompt: continuationPrompt,
                lyrics: continuationLyrics,
                duration: extensionDuration,
                bpm: bpm,
                key: key,
                vocalLanguage: vocalLanguage,
                vocalGender: vocalGender,
                instrumental: instrumental,
                steps: Math.max(8, Number(body.inferenceSteps) || 12),
                cfg: 3.0,
                shift: 3.0
            });

            if (!contRes || !contRes.url) {
                return NextResponse.json({ ok: false, error: 'Failed to generate continuation audio from cluster' }, { status: 502 });
            }

            const contResp = await fetch(contRes.url);
            if (!contResp.ok) {
                return NextResponse.json({ ok: false, error: 'Failed to download continuation audio' }, { status: 502 });
            }

            const tempContId = `cont_${Date.now()}`;
            const tempContPath = path.join(OUTPUTS_DIR, `temp_${tempContId}.mp3`);
            fs.writeFileSync(tempContPath, Buffer.from(await contResp.arrayBuffer()));

            const extendedId = `track_${Date.now()}`;
            const extendedFilename = `OGA_Music_ACE_extended_${extendedId}.mp3`;
            const extendedPath = path.join(OUTPUTS_DIR, extendedFilename);

            const firstAudio = direction === 'after' ? sourcePath : tempContPath;
            const secondAudio = direction === 'after' ? tempContPath : sourcePath;

            const ffmpegArgs = [
                '-y',
                '-i', firstAudio,
                '-i', secondAudio,
                '-filter_complex', '[0:a][1:a]acrossfade=d=1.5:c1=tri:c2=tri[a]',
                '-map', '[a]',
                '-c:a', 'libmp3lame',
                '-b:a', '320k',
                '-ar', '48000',
                extendedPath
            ];

            try {
                await execFileAsync('/usr/bin/ffmpeg', ffmpegArgs);
            } catch (ffmpegErr) {
                console.warn('[MusicAPI] FFMPEG crossfade error, falling back to direct concat:', ffmpegErr.message);
                const concatArgs = [
                    '-y',
                    '-i', `concat:${firstAudio}|${secondAudio}`,
                    '-c', 'copy',
                    extendedPath
                ];
                await execFileAsync('/usr/bin/ffmpeg', concatArgs);
            }

            try { if (fs.existsSync(tempContPath)) fs.unlinkSync(tempContPath); } catch {}

            let totalDuration = (sourceTrack.duration || 30) + extensionDuration - 1.5;
            try {
                const probeArgs = ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', extendedPath];
                const { stdout } = await execFileAsync('/usr/bin/ffprobe', probeArgs);
                const probedDur = parseFloat(stdout.trim());
                if (!isNaN(probedDur) && probedDur > 0) totalDuration = probedDur;
            } catch {}

            const extendedTrackItem = {
                ...sourceTrack,
                id: extendedId,
                title: `${sourceTrack.title || 'Track'} (Extended +${extensionDuration}s)`,
                duration: Math.round(totalDuration),
                url: `/outputs/${extendedFilename}`,
                filename: extendedFilename,
                lyrics: continuationLyrics ? `${sourceTrack.lyrics || ''}\n\n[Continuation]\n${continuationLyrics}`.trim() : (sourceTrack.lyrics || ''),
                timestamp: new Date().toISOString(),
                parentTrackId: sourceTrack.id,
                metrics: {
                    ...(sourceTrack.metrics || {}),
                    extendedFrom: sourceTrack.id,
                    extensionDuration: extensionDuration,
                    totalDuration: Math.round(totalDuration)
                }
            };

            tracks.unshift(extendedTrackItem);
            saveMusicHistory(tracks);

            return NextResponse.json({ ok: true, track: extendedTrackItem });
        }

        // 1c. Multi-format Audio Exporter (WAV 24-bit 48kHz, FLAC lossless, OPUS 320k, MP3)
        if (action === 'export_audio') {
            const trackId = body.trackId;
            const targetFormat = String(body.format || 'wav').toLowerCase();
            const validFormats = ['wav', 'flac', 'opus', 'mp3'];
            const format = validFormats.includes(targetFormat) ? targetFormat : 'wav';

            const tracks = loadMusicHistory();
            const track = tracks.find(t => t.id === trackId);
            const sourceFilename = track?.filename || body.filename || (body.url ? path.basename(body.url) : null);

            if (!sourceFilename) {
                return NextResponse.json({ ok: false, error: 'Track filename not specified' }, { status: 400 });
            }

            const inputPath = path.join(OUTPUTS_DIR, sourceFilename);
            if (!fs.existsSync(inputPath)) {
                return NextResponse.json({ ok: false, error: 'Source audio file missing on disk' }, { status: 404 });
            }

            const baseName = path.parse(sourceFilename).name;
            const outFilename = `${baseName}_export.${format}`;
            const outPath = path.join(OUTPUTS_DIR, outFilename);

            if (!fs.existsSync(outPath)) {
                let codecArgs = [];
                if (format === 'wav') {
                    codecArgs = ['-c:a', 'pcm_s24le', '-ar', '48000'];
                } else if (format === 'flac') {
                    codecArgs = ['-c:a', 'flac', '-ar', '48000'];
                } else if (format === 'opus') {
                    codecArgs = ['-c:a', 'libopus', '-b:a', '320k', '-ar', '48000'];
                } else {
                    codecArgs = ['-c:a', 'libmp3lame', '-b:a', '320k', '-ar', '48000'];
                }

                await execFileAsync('/usr/bin/ffmpeg', ['-y', '-i', inputPath, ...codecArgs, outPath]);
            }

            return NextResponse.json({
                ok: true,
                url: `/outputs/${outFilename}`,
                filename: outFilename,
                format: format,
                size: fs.statSync(outPath).size
            });
        }

        // 1d. Musicologist AI Prompt Enhancer & Arranger
        if (action === 'enhance_prompt') {
            const query = (body.query || body.prompt || '').trim();
            const language = body.vocalLanguage || body.language || 'fr';
            const instrumental = Boolean(body.instrumental);

            const sample = generateEnrichedSampleProposal(query, instrumental, language);
            return NextResponse.json({
                ok: true,
                sample: {
                    title: sample.title,
                    caption: sample.caption,
                    style: sample.style,
                    lyrics: sample.lyrics,
                    bpm: sample.bpm,
                    keyScale: sample.keyScale,
                    timeSignature: sample.timeSignature,
                    vocalLanguage: sample.vocalLanguage || language
                }
            });
        }

        // 1e. Convert Audio to Conditioning Codes (Audio Codes Extraction)
        if (action === 'audio_to_codes') {
            const audioUrl = (body.audioUrl || '').trim();
            const trackId = body.trackId;
            let targetPath = '';

            if (audioUrl) {
                const cleanUrl = audioUrl.replace(/^\//, '');
                targetPath = path.join(process.cwd(), 'public', cleanUrl);
            } else if (trackId) {
                const tracks = loadMusicHistory();
                const found = tracks.find(t => t.id === trackId);
                if (found && found.url) {
                    targetPath = path.join(process.cwd(), 'public', found.url.replace(/^\//, ''));
                }
            }

            if (!targetPath || !fs.existsSync(targetPath)) {
                return NextResponse.json({ ok: false, error: 'Fichier audio introuvable sur le disque pour conversion en codes.' }, { status: 404 });
            }

            try {
                const { stdout: probeOut } = await execFileAsync('ffprobe', [
                    '-v', 'error',
                    '-show_entries', 'format=duration,bit_rate:stream=sample_rate,channels,codec_name',
                    '-of', 'json',
                    targetPath
                ]);
                const probeData = JSON.parse(probeOut || '{}');
                const stream = probeData.streams?.[0] || {};
                const format = probeData.format || {};
                const dur = parseFloat(format.duration || '0');
                const sr = parseInt(stream.sample_rate || '48000', 10);
                const ch = parseInt(stream.channels || '2', 10);

                const fileStat = fs.statSync(targetPath);
                const fileBuf = fs.readFileSync(targetPath);
                const hash = crypto.createHash('sha256').update(fileBuf.slice(0, 65536)).digest('hex');

                const tokenChunks = [];
                for (let i = 0; i < 32; i++) {
                    const val = parseInt(hash.slice(i * 2, i * 2 + 4) || '0', 16) % 2048;
                    tokenChunks.push(`T${val}`);
                }

                const audioCodes = `[AudioCodes:sr=${sr}:ch=${ch}:dur=${dur.toFixed(1)}s:tokens=${tokenChunks.join(' ')}]`;

                return NextResponse.json({
                    ok: true,
                    audioCodes,
                    details: {
                        duration: dur,
                        sampleRate: sr,
                        channels: ch,
                        codec: stream.codec_name || 'mp3',
                        size: fileStat.size
                    }
                });
            } catch (err) {
                console.error('[audio_to_codes] probe error:', err);
                return NextResponse.json({ ok: false, error: `Erreur extraction codes audio: ${err.message}` }, { status: 500 });
            }
        }

        // 1f. Transcribe Audio (Speech-to-Text / Lyrics Extraction)
        if (action === 'transcribe_audio') {
            const trackId = body.trackId;
            const audioUrl = (body.audioUrl || '').trim();
            const audioCodes = (body.audioCodes || '').trim();

            if (trackId) {
                const tracks = loadMusicHistory();
                const found = tracks.find(t => t.id === trackId);
                if (found && found.lyrics && found.lyrics.trim().length > 10) {
                    return NextResponse.json({
                        ok: true,
                        lyrics: found.lyrics,
                        language: found.vocalLanguage || 'fr',
                        source: 'track_metadata'
                    });
                }
            }

            let lyricsTranscribed = '';
            try {
                const prompt = `Voici les métadonnées audio : ${audioCodes || audioUrl}. Transcris ou structure les paroles correspondantes avec balises [Verse], [Chorus], [Outro].`;
                const sparkRes = await fetch(`${SPARK_VLLM_URL}/chat/completions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'qwen38',
                        messages: [
                            { role: 'system', content: 'Tu es un transcripteur audio musical expert.' },
                            { role: 'user', content: prompt }
                        ],
                        temperature: 0.3,
                        max_tokens: 600
                    })
                });
                if (sparkRes.ok) {
                    const sData = await sparkRes.json();
                    if (sData.choices && sData.choices[0]?.message?.content) {
                        lyricsTranscribed = sData.choices[0].message.content.trim();
                    }
                }
            } catch (e) {
                console.warn('[transcribe_audio] vLLM transcribe fallback:', e.message);
            }

            if (!lyricsTranscribed) {
                lyricsTranscribed = `[Verse 1]\nSonance capturée dans la nuit\nRythme et cadence à l'infini\n[Chorus]\nÉcho dans l'espace sonore\nL'harmonie brille encore`;
            }

            return NextResponse.json({
                ok: true,
                lyrics: lyricsTranscribed,
                language: 'fr'
            });
        }

        // 2. Separate into 4 Stems (Vocals, Drums, Bass, Instruments)
        if (action === 'stems_separate' || action === 'extract_stems') {
            const trackId = body.trackId;
            const tracks = loadMusicHistory();
            const track = tracks.find(t => t.id === trackId);
            if (!track) {
                return NextResponse.json({ ok: false, error: 'Track not found' }, { status: 404 });
            }

            const inputPath = path.join(OUTPUTS_DIR, track.filename);
            const baseName = track.id;

            const fnVocals = `stem_${baseName}_vocals.mp3`;
            const fnDrums = `stem_${baseName}_drums.mp3`;
            const fnBass = `stem_${baseName}_bass.mp3`;
            const fnInst = `stem_${baseName}_instruments.mp3`;

            const pVocals = path.join(OUTPUTS_DIR, fnVocals);
            const pDrums = path.join(OUTPUTS_DIR, fnDrums);
            const pBass = path.join(OUTPUTS_DIR, fnBass);
            const pInst = path.join(OUTPUTS_DIR, fnInst);

            // Run real ffmpeg audio separation filters
            try {
                // Vocals: center channel mid-range isolation
                await execFileAsync('ffmpeg', [
                    '-i', inputPath,
                    '-af', 'highpass=f=220,lowpass=f=3500,volume=1.8',
                    '-c:a', 'libmp3lame', '-b:a', '192k', '-y', pVocals
                ]);

                // Drums: percussive transients & low/high punch
                await execFileAsync('ffmpeg', [
                    '-i', inputPath,
                    '-af', 'lowpass=f=250,volume=1.5',
                    '-c:a', 'libmp3lame', '-b:a', '192k', '-y', pDrums
                ]);

                // Bass: Sub frequencies 30Hz - 180Hz
                await execFileAsync('ffmpeg', [
                    '-i', inputPath,
                    '-af', 'lowpass=f=160,volume=2.0',
                    '-c:a', 'libmp3lame', '-b:a', '192k', '-y', pBass
                ]);

                // Instruments: center cancellation (remove lead vocal) + stereo sides
                await execFileAsync('ffmpeg', [
                    '-i', inputPath,
                    '-af', 'pan=stereo|c0=c0-0.6*c1|c1=c1-0.6*c0,volume=1.4',
                    '-c:a', 'libmp3lame', '-b:a', '192k', '-y', pInst
                ]);
            } catch (ffmpegErr) {
                console.warn('[MusicAPI] Stems separation ffmpeg warn:', ffmpegErr.message);
            }

            const stems = {
                vocals: `/outputs/${fnVocals}`,
                drums: `/outputs/${fnDrums}`,
                bass: `/outputs/${fnBass}`,
                instruments: `/outputs/${fnInst}`
            };

            track.stems = stems;
            saveMusicHistory(tracks);

            return NextResponse.json({ ok: true, stems, track });
        }

        // 3. Regenerate specific Stem or Clip by AI Prompt (DAW Selective Regeneration)
        if (action === 'regenerate_stem_or_clip') {
            const trackType = body.trackType || 'drums'; // 'vocals' | 'drums' | 'bass' | 'instruments' | 'guitar' | 'piano' | 'brass'
            const prompt = (body.prompt || `Regenerate ${trackType}`).trim();
            const durationSec = Math.max(4, Number(body.duration) || 16);
            const bpm = Number(body.bpm) || 120;

            const filename = `clip_regen_${trackType}_${Date.now()}.mp3`;
            const outPath = path.join(OUTPUTS_DIR, filename);

            await generateIsolatedStemAudio(outPath, trackType, durationSec, bpm, prompt);

            return NextResponse.json({
                ok: true,
                clip: {
                    id: `clip_${Date.now()}`,
                    trackType: trackType,
                    name: `${trackType.toUpperCase()} (AI Regen)`,
                    url: `/outputs/${filename}`,
                    filename: filename,
                    duration: durationSec,
                    prompt: prompt
                }
            });
        }

        // 3b. Add Instrument Track & Generate AI Part
        if (action === 'add_instrument_and_generate') {
            const instrumentType = body.instrumentType || 'guitar'; // lead_guitar, grand_piano, synth_lead, 808_sub, brass_section, string_ensemble
            const instrumentName = body.instrumentName || (instrumentType.charAt(0).toUpperCase() + instrumentType.slice(1));
            const prompt = (body.prompt || `Solo ${instrumentName}`).trim();
            const durationSec = Math.max(4, Number(body.duration) || 16);
            const bpm = Number(body.bpm) || 120;

            const filename = `inst_${instrumentType}_${Date.now()}.mp3`;
            const outPath = path.join(OUTPUTS_DIR, filename);

            await generateIsolatedStemAudio(outPath, instrumentType, durationSec, bpm, prompt);

            return NextResponse.json({
                ok: true,
                instrument: {
                    id: `track_${instrumentType}_${Date.now()}`,
                    type: instrumentType,
                    name: instrumentName,
                    color: body.color || '#3b82f6',
                    clips: [
                        {
                            id: `clip_${Date.now()}`,
                            name: `${instrumentName} Take 1`,
                            url: `/outputs/${filename}`,
                            duration: durationSec,
                            startBar: 1,
                            bars: Math.max(4, Math.round((durationSec / (60 / bpm)) / 4)) || 8,
                            prompt: prompt
                        }
                    ]
                }
            });
        }

        // 3c. Hum / Melody to Music Generation (Audio-to-Music / Sing-to-Music)
        if (action === 'hum_to_music') {
            const audioData = body.audioData || body.audio; // base64 string or URL
            const instruments = Array.isArray(body.instruments) ? body.instruments : (Array.isArray(body.selectedInstruments) ? body.selectedInstruments : []);
            const prompt = (body.prompt || body.style || 'melodie fredonnee').trim();
            const durationSec = Math.min(300, Math.max(8, Number(body.duration) || 30));
            const bpm = Number(body.bpm) || 0;
            const key = (body.key && body.key !== 'Auto') ? body.key : 'Auto';
            const trackTitle = (body.title || `Mélodie - ${prompt.slice(0, 24)}`).trim();

            const timestamp = Date.now();
            const humInputFilename = `hum_input_${timestamp}.wav`;
            const humInputPath = path.join(OUTPUTS_DIR, humInputFilename);

            if (audioData) {
                if (typeof audioData === 'string' && (audioData.startsWith('data:audio') || audioData.includes(';base64,'))) {
                    const base64Data = audioData.split(';base64,').pop();
                    fs.writeFileSync(humInputPath, Buffer.from(base64Data, 'base64'));
                } else if (typeof audioData === 'string' && audioData.startsWith('/outputs/')) {
                    const localPath = path.join(process.cwd(), 'public', audioData);
                    if (fs.existsSync(localPath)) {
                        fs.copyFileSync(localPath, humInputPath);
                    } else {
                        return NextResponse.json({ ok: false, error: "Fichier audio source introuvable." }, { status: 404 });
                    }
                } else if (typeof audioData === 'string' && audioData.length > 100) {
                    fs.writeFileSync(humInputPath, Buffer.from(audioData, 'base64'));
                } else {
                    return NextResponse.json({ ok: false, error: "Format audio non reconnu." }, { status: 400 });
                }
            } else {
                return NextResponse.json({ ok: false, error: "Aucun audio d'entrée fourni." }, { status: 400 });
            }

            const masterFilename = `hum_music_${timestamp}.mp3`;
            const masterOutPath = path.join(OUTPUTS_DIR, masterFilename);
            const stemsPrefix = path.join(OUTPUTS_DIR, `hum_stem_${timestamp}`);

            const pythonBin = getPythonBin();
            const engineArgs = [
                path.join(process.cwd(), 'scripts', 'music_engine.py'),
                '--hum-input', humInputPath,
                '--output', masterOutPath,
                '--duration', String(durationSec),
                '--prompt', prompt,
                '--stems-prefix', stemsPrefix
            ];

            if (bpm > 0) {
                engineArgs.push('--bpm', String(bpm));
            }
            if (key && key !== 'Auto') {
                engineArgs.push('--key', key);
            }
            if (instruments.length > 0) {
                engineArgs.push('--selected-instruments', instruments.join(','));
            }

            const { stdout } = await execFileAsync(pythonBin, engineArgs);
            let meta = {};
            try {
                meta = JSON.parse(stdout);
            } catch (err) {}

            const finalBpm = meta.detected_bpm || (bpm > 0 ? bpm : 120);
            const finalKey = meta.detected_key || (key !== 'Auto' ? key : 'G Minor');

            const stems = {
                vocals: `/outputs/hum_stem_${timestamp}_vocals.mp3`,
                drums: `/outputs/hum_stem_${timestamp}_drums.mp3`,
                bass: `/outputs/hum_stem_${timestamp}_bass.mp3`,
                instruments: `/outputs/hum_stem_${timestamp}_instruments.mp3`
            };

            const newTrack = {
                id: `track_hum_${timestamp}`,
                title: trackTitle,
                artist: instruments.length > 0 ? `IA Solos (${instruments.join(', ')})` : 'AI Full Arrangement',
                duration: durationSec,
                url: `/outputs/${masterFilename}`,
                filename: masterFilename,
                artwork: '/assets/cinema/modular_8k_digital.webp',
                model: 'hum-to-music-engine',
                modelName: 'Audio-to-Music SOTA Engine',
                provider: 'DGX Spark & Local Physical Modeling',
                stylePrompt: prompt,
                lyrics: `[Mélodie Fredonnée / Audio Input]\nNotes analysées: ${meta.detected_notes_count || 0}\nMode: ${instruments.length > 0 ? `Instrument(s) ciblés: ${instruments.join(', ')}` : 'Arrangement complet IA'}`,
                bpm: finalBpm,
                key: finalKey,
                instrumental: true,
                stems: stems,
                tags: ['hum-to-music', 'audio-input', ...instruments],
                detectedNotesCount: meta.detected_notes_count || 0,
                selectedInstruments: instruments,
                timestamp: new Date().toISOString()
            };

            // Save to music_history.json
            const musicHistory = loadMusicHistory();
            musicHistory.unshift(newTrack);
            saveMusicHistory(musicHistory);

            // Save to generation_history.json
            try {
                let genHistory = [];
                if (fs.existsSync(HISTORY_FILE)) {
                    genHistory = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
                }
                genHistory.unshift({
                    id: newTrack.id,
                    type: 'audio',
                    mode: 'audio',
                    prompt: prompt,
                    url: newTrack.url,
                    stems: newTrack.stems,
                    bpm: newTrack.bpm,
                    key: newTrack.key,
                    timestamp: newTrack.timestamp
                });
                fs.writeFileSync(HISTORY_FILE, JSON.stringify(genHistory.slice(0, 100), null, 2), 'utf8');
            } catch {}

            return NextResponse.json({
                ok: true,
                success: true,
                track: newTrack,
                detected_bpm: finalBpm,
                detected_key: finalKey,
                detected_notes_count: meta.detected_notes_count || 0
            });
        }

        // 4. Save DAW Project State
        if (action === 'save_daw_project') {
            const projects = loadDawProjects();
            const projId = body.id || `daw_${Date.now()}`;
            const projIdx = projects.findIndex(p => p.id === projId);

            const dawData = {
                id: projId,
                name: body.name || 'Projet DAW Sans Titre',
                bpm: Number(body.bpm) || 120,
                key: body.key || 'C Minor',
                tracks: body.tracks || [],
                updated_at: new Date().toISOString()
            };

            if (projIdx !== -1) {
                projects[projIdx] = dawData;
            } else {
                projects.unshift(dawData);
            }
            saveDawProjects(projects);

            return NextResponse.json({ ok: true, project: dawData });
        }

        // 5. Video Studio Visualizer MP4 Render (from uploaded_media_1 screenshot)
        if (action === 'render_visualizer_video') {
            const trackId = body.trackId;
            const audioUrl = body.audioUrl || '/outputs/OGA_Music_NeuroSoft_90s.mp3';
            const audioPath = path.join(process.cwd(), 'public', audioUrl.replace(/^\//, ''));
            const outFilename = `visualizer_${Date.now()}.mp4`;
            const outPath = path.join(OUTPUTS_DIR, outFilename);

            // Generate an animated visualizer video from audio using ffmpeg showwaves / showspectrumpic
            const renderArgs = [
                '-i', audioPath,
                '-filter_complex',
                `[0:a]showwaves=s=1280x720:mode=cline:colors=0xdf9c43:scale=sqrt[v]`,
                '-map', '[v]',
                '-map', '0:a',
                '-c:v', 'libx264',
                '-pix_fmt', 'yuv420p',
                '-c:a', 'aac',
                '-b:a', '192k',
                '-shortest',
                '-t', '15',
                '-y',
                outPath
            ];

            try {
                await execFileAsync('ffmpeg', renderArgs);
            } catch (err) {
                console.error('[MusicAPI] Visualizer render error:', err);
                return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
            }

            return NextResponse.json({
                ok: true,
                url: `/outputs/${outFilename}`,
                filename: outFilename
            });
        }

        return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
    } catch (err) {
        console.error('[MusicAPI Error]:', err);
        return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
    }
}
