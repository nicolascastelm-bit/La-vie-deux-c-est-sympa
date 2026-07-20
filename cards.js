const unique = (items) => [...new Set(items.map((item) => item.trim()).filter(Boolean))];


const CINEMA = unique([
"Devine le film avec trois emojis.","Imite un personnage culte pendant 20 secondes.","Cite un film que tu reverrais 10 fois.","Rejouez une scène romantique célèbre.","Quel est ton film préféré de tous les temps ?"
]);
const MUSIQUE = unique([
"Chante le refrain de ta chanson préférée.","Fais deviner un artiste en le mimant.","Quel album t'a marqué ?","Fais un blind test en fredonnant.","Danse 20 secondes sans t'arrêter."
]);
const AMICAL_BASE = [
  "Fais deviner un film avec seulement trois emoji.",
  "Imite une célébrité pendant vingt secondes.",
  "Raconte une anecdote vraie et une fausse : l'autre doit trouver le mensonge.",
  "Inventez une poignée de main secrète.",
  "Décris l'autre comme un personnage de jeu vidéo avec trois pouvoirs.",
  "Fais la pire publicité possible pour un objet de la pièce.",
  "Mime une émotion sans parler.",
  "Choisissez un mot interdit jusqu'au prochain tour.",
  "Fais un compliment si exagéré qu'il devient absurde.",
  "Résume votre duo comme la bande-annonce d'un film d'action.",
  "Crée un slogan pour votre duo.",
  "Fais rire l'autre sans parler.",
  "Défi grimace : le premier qui rit perd.",
  "Inventez un nom d'équipe et une devise.",
  "Raconte ta journée comme un commentateur sportif.",
  "Invente une fête nationale et sa tradition.",
  "Choisissez chacun un super-pouvoir inutile.",
  "Fais un mini-discours de remise de prix à l'autre.",
  "Transforme la dernière phrase entendue en titre de chanson.",
  "Dessine les yeux fermés un animal choisi par l'autre."
];

const AMICAL_ACTIONS = [
  "cite cinq choses rouges",
  "trouve quatre mots commençant par M",
  "mime un métier",
  "improvise une météo dramatique",
  "invente un sport absurde",
  "fais un bruitage de film",
  "décris un objet sans le nommer",
  "chante une phrase banale",
  "raconte une blague volontairement mauvaise",
  "crée un nom de restaurant catastrophique",
  "invente un slogan publicitaire",
  "fais une pose de victoire",
  "décris l'autre avec trois titres de films",
  "fais deviner un animal avec un seul son",
  "invente une règle absurde pour un tour",
  "cite six aliments",
  "improvise un jingle de trois secondes",
  "raconte une mini-histoire avec trois mots imposés",
  "fais une déclaration dramatique à un objet",
  "trouve trois surnoms de super-héros pour l'autre"
];

const AMICAL_PREFIXES = [
  "Défi express : ",
  "Duel : ",
  "Mission surprise : ",
  "Question flash : ",
  "Carte chaos : "
];

const AMICAL = unique([...AMICAL_BASE, ...AMICAL_PREFIXES.flatMap((prefix) => AMICAL_ACTIONS.map((action) => `${prefix}${action}.`))]);

const ROMANTIQUE_BASE = [
  "Quel souvenir partagé te fait sourire immédiatement ?",
  "Faites-vous chacun un compliment précis et sincère.",
  "Quelle chanson pourrait représenter votre histoire ?",
  "Imaginez votre prochain rendez-vous idéal.",
  "Quel petit geste de l'autre te touche particulièrement ?",
  "Décris le message que tu aimerais recevoir demain matin.",
  "Choisissez une ville pour une future escapade.",
  "Raconte un moment où tu t'es senti particulièrement proche de l'autre.",
  "Quelle tradition aimerais-tu créer à deux ?",
  "Écrivez chacun une promesse simple pour vos prochaines retrouvailles.",
  "Quel film ressemble le plus à votre histoire ?",
  "Imagine votre dîner parfait, du décor au dessert.",
  "Regardez-vous dix secondes sans parler, puis dites ce que vous avez ressenti.",
  "Donne trois raisons concrètes pour lesquelles tu apprécies l'autre.",
  "Choisissez une photo commune et racontez ce qu'elle vous rappelle.",
  "Quel projet à deux te rendrait heureux ?",
  "Termine cette phrase : avec toi, j'ai découvert…",
  "Inventez le titre du prochain chapitre de votre histoire.",
  "Quel détail de votre première rencontre n'as-tu jamais oublié ?",
  "Choisissez un mot qui résume votre relation aujourd'hui."
];

const ROMANTIQUE_ACTIONS = [
  "nomme une qualité de l'autre illustrée par un souvenir",
  "décris un futur dimanche parfait à deux",
  "partage un moment où l'autre t'a surpris",
  "choisis une chanson à envoyer après la partie",
  "imagine une attention simple pour demain",
  "termine « je me sens bien avec toi quand… »",
  "choisis un souvenir à revivre exactement pareil",
  "donne un mot doux que tu n'utilises pas assez",
  "décris votre escapade idéale en trois phrases",
  "cite trois choses que vous faites bien ensemble",
  "écris une invitation tendre en une phrase",
  "raconte un instant où tu t'es senti soutenu",
  "imagine votre photo parfaite dans cinq ans",
  "choisis une saison qui représente votre duo",
  "décris une soirée parfaite sans parler de lieu",
  "propose un petit rituel à créer ensemble",
  "dis ce que tu admires le plus chez l'autre",
  "choisis un parfum qui évoque un souvenir à deux",
  "imagine le titre d'une lettre adressée à l'autre",
  "résume votre relation en trois emoji"
];

const ROMANTIQUE_PREFIXES = [
  "Moment tendre : ",
  "Question cœur : ",
  "Souvenir : ",
  "Défi complice : ",
  "Carte étoile : "
];

const ROMANTIQUE = unique([...ROMANTIQUE_BASE, ...ROMANTIQUE_PREFIXES.flatMap((prefix) => ROMANTIQUE_ACTIONS.map((action) => `${prefix}${action}.`))]);

const SENSUEL_BASE = [
  "Quel détail chez l'autre trouves-tu particulièrement séduisant ?",
  "Envoie un vocal de quinze secondes avec ton ton le plus charmeur.",
  "Choisissez chacun une musique pour créer une ambiance.",
  "Décris un baiser idéal sans détails explicites.",
  "Quelle atmosphère rendrait votre prochain rendez-vous plus intense ?",
  "Quel compliment te ferait le plus rougir ?",
  "Écris une invitation séduisante en deux phrases.",
  "Choisissez un mot codé qui signifie : continue comme ça.",
  "Quel regard imagines-tu lors d'un dîner élégant ?",
  "Décris une tenue qui changerait l'ambiance.",
  "Quelle lumière et quelle musique composeraient votre soirée idéale ?",
  "Jouez deux messages comme deux inconnus qui se séduisent.",
  "Fais un compliment à voix basse.",
  "Choisissez lequel de vous mènera le prochain échange.",
  "Décris le moment de retrouvailles parfait en trois phrases.",
  "Envoie trois emoji qui représentent ton niveau de séduction.",
  "Quel parfum associes-tu spontanément à l'autre ?",
  "Inventez une invitation mystérieuse pour ce soir.",
  "Gardez le silence cinq secondes en vous regardant, puis souriez.",
  "Choisis une chanson et explique pourquoi elle créerait la bonne tension."
];

const SENSUEL_ACTIONS = [
  "choisis une chanson pour un slow à distance",
  "décris un regard qui ferait monter la tension",
  "envoie un compliment en cinq mots",
  "choisis entre bougies, nuit étoilée ou lumière tamisée",
  "invente une phrase d'invitation mystérieuse",
  "décris l'ambiance idéale pour un appel complice",
  "garde le silence cinq secondes avant de sourire",
  "choisis une couleur qui représente ton attirance",
  "propose un jeu de séduction simple pour le prochain tour",
  "décris un parfum qui changerait l'ambiance",
  "écris une phrase à murmurer à l'oreille",
  "choisis un mot qui résume la tension actuelle",
  "imagine un rendez-vous sans téléphone",
  "décris une danse lente idéale",
  "propose un défi de regard de dix secondes",
  "dis quel compliment te ferait perdre tes moyens",
  "choisis une tenue pour une soirée élégante",
  "décris un lieu discret et romantique",
  "invente un code secret entre vous",
  "termine la phrase « je te trouve irrésistible quand… »"
];

const SENSUEL_PREFIXES = [
  "Flirt express : ",
  "Défi regard : ",
  "Carte tension : ",
  "Question charme : ",
  "Moment complice : "
];

const SENSUEL = unique([...SENSUEL_BASE, ...SENSUEL_PREFIXES.flatMap((prefix) => SENSUEL_ACTIONS.map((action) => `${prefix}${action}.`))]);

const SPICY_BASE = [
  "Partage une envie et une limite ; l'autre reformule pour vérifier.",
  "Inventez un mot de sécurité et un signal pour ralentir.",
  "Envoie une phrase suggestive sans vocabulaire explicite.",
  "Propose un défi à distance : l'autre peut accepter, modifier ou refuser.",
  "Imaginez un rendez-vous audacieux qui respecte vos limites.",
  "Choisissez qui guidera les deux prochains échanges et ce qui reste hors-jeu.",
  "Propose une règle temporaire pour trois messages, révocable immédiatement.",
  "Choisissez entre confession, défi ou jeu de rôle.",
  "Décris un scénario mystérieux réalisable par messages ou appel.",
  "Partage ce dont tu aurais besoin après un échange intense.",
  "Inventez trois options audacieuses : accepter, modifier ou refuser.",
  "Écrivez chacun une limite que l'autre doit reconnaître.",
  "Choisis une carte blanche : question, défi ou pause complice.",
  "Propose une consigne audacieuse mais réversible.",
  "Décris une attente qui rendrait vos retrouvailles plus intenses.",
  "Demande clairement l'accord de l'autre avant de poursuivre.",
  "Choisissez un joker utilisable sans justification.",
  "Imagine une scène de séduction en restant mystérieux.",
  "Partage une préférence et demande l'avis de l'autre.",
  "Terminez ce tour par une phrase rassurante et complice."
];

const SPICY_ACTIONS = [
  "propose trois options : oui, à modifier ou non",
  "définissez une limite et un signal d'arrêt",
  "choisis qui mène le prochain échange",
  "formule une envie sans rien imposer",
  "invente un défi à distance facilement refusé",
  "choisissez un mot codé pour ralentir",
  "décris une situation audacieuse sans détail explicite",
  "demande l'accord avant une consigne mystérieuse",
  "termine par une phrase d'aftercare",
  "propose une règle qui ne dure qu'un tour",
  "partage une curiosité et une limite ferme",
  "choisis un joker de pause immédiate",
  "décris une ambiance plus intense mais sûre",
  "demande à l'autre son niveau de confort",
  "transforme une envie en trois choix",
  "propose un jeu de rôle très court",
  "définissez ce qui est hors-jeu ce soir",
  "choisis entre mystère, contrôle ou surprise",
  "partage ce qui te rassure dans un moment intense",
  "propose un défi qui peut être interrompu à tout moment"
];

const SPICY_PREFIXES = [
  "Carte audace : ",
  "Défi spicy : ",
  "Question limite : ",
  "Mission consentie : ",
  "Carte rouge : "
];

const SPICY = unique([...SPICY_BASE, ...SPICY_PREFIXES.flatMap((prefix) => SPICY_ACTIONS.map((action) => `${prefix}${action}.`))]);

const BDSM_BASE = [
  "Avant le défi, chacun nomme une limite et un mot de sécurité.",
  "Choisissez les rôles de cette manche ; chacun peut changer d'avis.",
  "Le joueur qui guide propose une consigne non explicite ; l'autre répond oui, à modifier ou non.",
  "Définissez un signal pour ralentir et un autre pour arrêter.",
  "Échangez sur ce qui vous met en confiance avant une expérience plus intense.",
  "Proposez un jeu de contrôle léger et réversible pour un seul tour.",
  "Le joueur qui suit reformule la consigne pour confirmer qu'elle est comprise.",
  "Choisissez un accessoire symbolique ou imaginaire et fixez son usage.",
  "Faites une pause d'une minute pour vérifier le confort de chacun.",
  "Partagez une envie, une limite stricte et une zone d'incertitude.",
  "Décidez ensemble qui peut interrompre le jeu : chacun, immédiatement.",
  "Créez un rituel de début et un rituel d'aftercare.",
  "Le joueur qui guide donne trois options ; l'autre en choisit une ou refuse.",
  "Décrivez une ambiance de pouvoir consentie sans détail explicite.",
  "Terminez par : continuer, ralentir ou changer ?",
  "Choisissez une règle temporaire valable un tour et révocable sans justification.",
  "Discutez d'un geste ou d'un mot rassurant après un défi intense.",
  "Le joueur qui suit choisit le niveau : doux, moyen ou pause.",
  "Inventez un titre pour votre scénario, puis posez ses limites.",
  "Aftercare : adressez à l'autre une phrase rassurante et valorisante."
];

const BDSM_ACTIONS = [
  "fixez une limite, un signal de ralentissement et un mot d'arrêt",
  "choisissez les rôles pour un tour seulement",
  "propose une consigne réversible et demande un accord clair",
  "définissez l'aftercare souhaité",
  "donne trois choix dont l'option de refuser",
  "faites un check-in : confort, confiance et envie de continuer",
  "imaginez une dynamique de pouvoir légère et non explicite",
  "le joueur qui suit choisit le rythme",
  "formule une règle qui s'arrête au prochain tour",
  "définissez une zone verte, orange et rouge",
  "choisissez un geste rassurant de fin",
  "le joueur qui guide demande une confirmation explicite",
  "le joueur qui suit choisit entre continuer, ralentir ou arrêter",
  "décrivez un scénario symbolique avec limites claires",
  "précisez ce qui doit rester hors-jeu",
  "choisissez un mot de rappel pour l'aftercare",
  "discutez du niveau de confiance actuel",
  "propose une consigne sans contact physique",
  "définissez un rituel d'entrée et de sortie de rôle",
  "terminez par un compliment et une vérification de confort"
];

const BDSM_PREFIXES = [
  "Check-in BDSM : ",
  "Rituel : ",
  "Carte contrôle : ",
  "Mission confiance : ",
  "Aftercare : "
];

const BDSM = unique([...BDSM_BASE, ...BDSM_PREFIXES.flatMap((prefix) => BDSM_ACTIONS.map((action) => `${prefix}${action}.`))]);


export const CARD_BANK = {
  amical: AMICAL, romantique: ROMANTIQUE, sensuel: SENSUEL, spicy: SPICY, bdsm: BDSM,
  cinema:CINEMA, musique:MUSIQUE, mix: unique([...AMICAL,...CINEMA,...MUSIQUE,...ROMANTIQUE,...SENSUEL,...SPICY,...BDSM])
};


export const SCENARIO_CARDS = {
  "soiree-potes": ["Choisissez le snack officiel de la soirée.","Inventez le nom de votre groupe dans une série.","Faites un toast ridicule mais sincère.","Rejouez une anecdote commune en accéléré.","Créez une pose photo imposée.","Élisez la meilleure blague de la soirée."],
  "defis-minute": ["Une minute pour trouver dix mots sur un thème.","Fais deviner trois objets en les mimant.","Inventez un slogan en vingt secondes.","Trouvez chacun un défi très court.","Duel de grimaces : le premier qui rit perd.","Citez à tour de rôle des capitales."],
  "chaos": ["Inversez vos rôles jusqu'au prochain tour.","Le joueur en retard invente une règle.","Parlez comme un présentateur télé pendant un tour.","Choisissez un mot interdit pendant trois tours.","Le prochain défi vaut double.","Créez un événement imprévisible pour votre histoire."],
  "premiere": ["Choisissez le titre du film présenté ce soir.","Improvise une interview sur le tapis rouge.","Mime une scène culte sans prononcer un mot.","Inventez une bande-annonce en vingt secondes.","Attribuez-vous chacun un prix de cinéma.","Créez la dernière réplique avant le générique."],
  "studio": ["Choisissez qui réalise et qui joue.","Inventez un costume avec ce qui vous entoure.","Rejouez une scène en version comique.","Dites « action » puis improvisez dix secondes.","Imaginez une erreur de tournage mémorable.","Terminez par un clap final dramatique."],
  "festival": ["Choisissez le nom et l'affiche de votre festival.","Faites une annonce comme si vous étiez en backstage.","Imitez le son d'un instrument.","Chantez chacun un refrain inventé.","Choisissez le morceau du rappel.","Créez ensemble la playlist de l'after."],
  "studio-musique": ["Trouvez un titre pour votre morceau.","Créez un rythme avec les mains.","Inventez un couplet de deux lignes.","Chantez un refrain avec un mot imposé.","Faites un duo de dix secondes.","Présentez votre single comme à la radio."],
  "george-v": ["Imagine votre arrivée dans le hall du George V.","Quelle tenue choisirais-tu pour ce rendez-vous ?","Quel toast porterais-tu ?","Composez le menu idéal.","Quel film programmeriez-vous dans un cinéma privé ?","Décris la vue parfaite depuis le balcon."],
  "cinema": ["Choisissez l'affiche du film de votre soirée.","Qui choisit le pop-corn ?","Quelle bande-annonce vous donnerait envie ?","Quel siège choisiriez-vous ?","Quel film vous a déjà rapprochés ?","Inventez le synopsis d'un film inspiré de votre duo."],
  "venise": ["Décris votre arrivée à Venise.","Quel café choisiriez-vous près d'un canal ?","Quelle couleur aurait votre gondole ?","Choisissez le pont de votre photo préférée.","Quel plat italien commanderiez-vous ?","Imaginez une promenade sans itinéraire."],
  "lounge": ["Choisissez le cocktail qui représente l'autre.","Quelle chanson ouvre votre playlist ?","Décris le regard des retrouvailles.","Écris une confidence à murmurer après minuit.","Inventez le nom de votre bar privé.","Choisissez un slow."],
  "playlist": ["Choisissez le premier morceau de votre playlist secrète.","Quelle chanson évoque votre première rencontre ?","Envoyez chacun un titre qui dit ce que vous ressentez.","Quel morceau vous ferait danser ?","Inventez le titre d'une chanson sur votre histoire.","Choisissez le slow de la soirée."],
  "rooftop": ["Imaginez l'ascenseur vers le rooftop.","Quelle ville observer de nuit ?","Choisissez le cocktail de la terrasse.","Décris une danse lente sous les étoiles.","Quelle phrase prononcer à minuit ?","Quel souvenir immortaliser ?"],
  "interdite": ["Fixez une envie, une limite et un mot de pause.","Choisissez qui guide le prochain échange.","Écris une phrase qui crée de la tension sans être explicite.","Propose un défi modifiable.","Demande l'accord avant de poursuivre.","Terminez par un message d'aftercare."],
  "secrets": ["Choisissez la clé symbolique de votre chambre des secrets.","Partage un secret léger.","Choisissez : confession, choix ou défi.","Écris une envie sous forme d'énigme.","Partage ce qui te fait te sentir en sécurité.","Fermez la chambre avec un message tendre."],
  "roulette": ["Roulette : désir, confidence ou surprise ?","Propose trois choix et laisse l'autre en modifier un.","Choisissez un joker.","Inventez un défi pendant un appel.","Fixez un mot de sécurité.","Terminez par une confidence libre."],
  "rituel-bdsm": ["Fixez vos limites et votre mot de sécurité.","Choisissez les rôles.","Le joueur qui suit choisit le niveau.","Faites un check-in de confort.","Proposez une consigne réversible.","Terminez par un moment d'aftercare."],
  "grand-mix": ["Choisis librement la catégorie.","Tirez au sort entre rire, confidence, flirt ou surprise.","Transformez la dernière carte en version opposée.","Chacun propose un mini-défi ; le dé décide.","Choisissez l'ambiance des deux prochains tours.","Utilisez un joker pour passer ou doubler."]
};

export const SPECIALS = {
  9:{kind:"move",value:3,text:"Bonus : avance de 3 cases."},
  18:{kind:"replay",text:"Bonus : rejoue après cette carte."},
  27:{kind:"move",value:-4,text:"Surprise : recule de 4 cases."},
  36:{kind:"move",value:5,text:"Bonus : avance de 5 cases."},
  45:{kind:"skip",text:"Surprise : passe ton prochain tour."},
  54:{kind:"move",value:-6,text:"Surprise : recule de 6 cases."}
};
