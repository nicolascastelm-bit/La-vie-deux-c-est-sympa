import { firebaseConfig } from "./firebase-config.js";
import { CARD_BANK, SCENARIO_CARDS, SPECIALS } from "./cards.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged, setPersistence, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot,
  serverTimestamp, arrayUnion, runTransaction
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

function firebaseErrorMessage(error) {
  const code = error?.code || "";
  const messages = {
    "auth/operation-not-allowed": "Active la connexion anonyme dans Firebase Authentication > Méthodes de connexion.",
    "auth/unauthorized-domain": "Ajoute ce domaine dans Firebase Authentication > Paramètres > Domaines autorisés.",
    "auth/network-request-failed": "Connexion à Firebase impossible. Vérifie Internet, le bloqueur de contenu et la configuration.",
    "auth/invalid-api-key": "La clé API Firebase est incorrecte dans firebase-config.js.",
    "permission-denied": "Firestore refuse l’opération. Déploie le fichier firestore.rules fourni.",
    "failed-precondition": "Cloud Firestore n’est pas encore créé dans ce projet Firebase.",
    "unavailable": "Firebase est momentanément indisponible. Réessaie dans quelques instants."
  };
  return messages[code] || error?.message || "Erreur Firebase inconnue.";
}


const state = {
  uid: null,
  roomCode: null,
  role: null,
  room: null,
  unsubscribe: null,
  solo: false,
  journalFilter: "all",
  dashboardTab: "journal",
  typingTimer: null,
  lastChatCount: 0,
  localRevealedChallengeId: null,
  pendingLocalChallenge: null,
  recentLocalCards: [],
  mediaRecorder: null,
  voiceChunks: [],
  voiceStartedAt: 0,
  call: {
    pc: null,
    localStream: null,
    remoteStream: null,
    callId: null,
    appliedCandidates: new Set(),
    makingOffer: false
  }
};

const REACTIONS = ["❤️","🔥","😂","😘","👏"];
const WRITTEN_PROMPTS = ["quel", "décris", "imagine", "partage", "raconte", "choisis", "quelle", "quels"];

const MODE_THEMES = {
  amical: { icon: "😄", label: "Amical", ambience: "Défis, rires et duels entre potes" },
  cinema: { icon: "🎬", label: "Cinéma", ambience: "Rideau rouge, projecteur et scènes cultes" },
  musique: { icon: "🎵", label: "Musique", ambience: "Néons, rythme, blind tests et karaoké" },
  romantique: { icon: "🌸", label: "Romantique", ambience: "Une soirée tendre, lumineuse et élégante" },
  sensuel: { icon: "🔥", label: "Sensuel", ambience: "Une atmosphère chaude, feutrée et complice" },
  spicy: { icon: "🌶️", label: "Spicy", ambience: "Une ambiance audacieuse, joueuse et consentie" },
  bdsm: { icon: "🎭", label: "BDSM", ambience: "Confiance, rôles, limites et consentement explicite" },
  mix: { icon: "🎲", label: "Mix", ambience: "Toutes les ambiances réunies au hasard" }
};


const SCENARIOS = {
  amical: [
    {id:"soiree-potes",icon:"🍕",title:"Soirée entre potes",stages:["Arrivée","Snack","Anecdote","Duel","Photo","Chaos","Finale","Souvenir"]},
    {id:"defis-minute",icon:"⏱️",title:"Défis minute",stages:["Échauffement","Mime","Vitesse","Mémoire","Impro","Duel","Finale","Podium"]}
  ],
  cinema: [
    {id:"premiere",icon:"🎞️",title:"La grande première",stages:["Affiche","Tapis rouge","Interview","Bande-annonce","Projection","Réplique","Palmarès","Générique"]},
    {id:"studio",icon:"🎥",title:"Une journée de tournage",stages:["Casting","Costumes","Répétition","Action","Impro","Montage","Avant-première","Clap final"]}
  ],
  musique: [
    {id:"festival",icon:"🎤",title:"Notre festival",stages:["Pass","Backstage","Balance","Première partie","Concert","Rappel","After","Playlist"]},
    {id:"studio-musique",icon:"🎚️",title:"Session en studio",stages:["Inspiration","Beat","Couplet","Refrain","Duo","Mixage","Écoute","Sortie"]}
  ],
  romantique: [
    {id:"george-v",icon:"🏨",title:"Une nuit au George V",stages:["Invitation","Hall","Champagne","Restaurant","Cinéma privé","Balcon","Suite","Petit-déjeuner"]},
    {id:"cinema",icon:"🎬",title:"Notre soirée cinéma",stages:["Invitation","Affiche","Pop-corn","Bande-annonce","Séance","Générique","Promenade","Dernier message"]},
    {id:"venise",icon:"🛶",title:"Escapade à Venise",stages:["Départ","Train","Canal","Café","Pont","Dîner","Gondole","Aube"]}
  ],
  sensuel: [
    {id:"lounge",icon:"🍸",title:"Le lounge privé",stages:["Invitation","Vestiaire","Cocktail","Playlist","Canapé","Confidence","Minuit","Dernière chanson"]},
    {id:"playlist",icon:"🎧",title:"Notre playlist secrète",stages:["Intro","Premier titre","Souvenir","Tempo","Duo","Frisson","Slow","Encore"]},
    {id:"rooftop",icon:"🌃",title:"Rooftop à minuit",stages:["Ascenseur","Terrasse","Cocktail","Vue","Confession","Danse","Minuit","Aube"]}
  ],
  spicy: [
    {id:"interdite",icon:"🌶️",title:"Soirée interdite",stages:["Accord","Entrée","Désir","Challenge","Rôle","Pouvoir","Surprise","Aftercare"]},
    {id:"secrets",icon:"🗝️",title:"La chambre des secrets",stages:["Clé","Porte","Secret","Choix","Défi","Confession","Révélation","Retour au calme"]},
    {id:"roulette",icon:"🎲",title:"Roulette Spicy",stages:["Mise","Roulette","Désir","Joker","Rôle","Audace","Dernier tour","Débrief"]}
  ],
  bdsm: [
    {id:"rituel-bdsm",icon:"🎭",title:"Le rituel de confiance",stages:["Accord","Limites","Rôles","Consigne","Check-in","Choix","Aftercare","Débrief"]}
  ],
  mix: [{id:"grand-mix",icon:"🎲",title:"Le grand mix",stages:["Fun","Amitié","Confidence","Romance","Défi","Flirt","Surprise","Finale"]}]
};

const ACHIEVEMENTS = [
  {id:"first-card",icon:"🌱",title:"Premier moment",description:"Découvrir une première carte."},
  {id:"first-message",icon:"💬",title:"Premier message",description:"Envoyer un message dans le tchat."},
  {id:"ten-messages",icon:"💌",title:"Conversation lancée",description:"Échanger au moins dix messages."},
  {id:"first-answer",icon:"✍️",title:"À cœur ouvert",description:"Partager une réponse écrite."},
  {id:"first-memory",icon:"⭐",title:"À conserver",description:"Enregistrer un souvenir."},
  {id:"halfway",icon:"🛤️",title:"À mi-chemin",description:"Atteindre la case 32."},
  {id:"first-call",icon:"📞",title:"À portée de voix",description:"Démarrer un appel interne."},
  {id:"finish",icon:"🏆",title:"Soirée accomplie",description:"Terminer le scénario."}
];

function scenariosForMode(mode) {
  return SCENARIOS[mode] || SCENARIOS.romantique;
}
function scenarioFor(room = state.room) {
  const list = scenariosForMode(room?.mode);
  return list.find((item) => item.id === room?.scenarioId) || list[0];
}
function targetCell(room = state.room) {
  const value = Number(room?.targetCell || 49);
  return [36, 49, 63].includes(value) ? value : 49;
}
function stageForCell(cell, room = state.room) {
  const scenario = scenarioFor(room);
  const target = targetCell(room);
  const index = Math.min(scenario.stages.length - 1, Math.floor(Math.max(0, cell - 1) / (target / scenario.stages.length)));
  return scenario.stages[index];
}
function populateScenarioSelect(selectId, mode) {
  const select = $(selectId);
  if (!select) return;
  select.innerHTML = scenariosForMode(mode).map((item) =>
    `<option value="${item.id}">${item.icon} ${item.title}</option>`
  ).join("");
}
function deriveStats(room = state.room) {
  const journal = room?.journal || [];
  const messages = room?.messages || [];
  return {
    rolls: (room?.history || []).filter((line) => line.includes(" obtient ")).length,
    messages: messages.length,
    answers: journal.filter((item) => item.type === "answer").length,
    cards: journal.filter((item) => item.type === "card").length,
    memories: (room?.memories || []).length,
    calls: room?.callCount || 0
  };
}
function unlockedAchievements(room = state.room) {
  const stats = deriveStats(room);
  const maxPosition = Math.max(room?.players?.host?.position || 0, room?.players?.guest?.position || 0);
  return new Set([
    ...(stats.cards ? ["first-card"] : []),
    ...(stats.messages ? ["first-message"] : []),
    ...(stats.messages >= 10 ? ["ten-messages"] : []),
    ...(stats.answers ? ["first-answer"] : []),
    ...(stats.memories ? ["first-memory"] : []),
    ...(maxPosition >= Math.ceil(targetCell(room) / 2) ? ["halfway"] : []),
    ...(stats.calls ? ["first-call"] : []),
    ...(room?.status === "finished" ? ["finish"] : [])
  ]);
}

function applyModeTheme(mode = "romantique") {
  const safeMode = MODE_THEMES[mode] ? mode : "romantique";
  document.body.classList.remove("theme-amical", "theme-cinema", "theme-musique", "theme-romantique", "theme-sensuel", "theme-spicy", "theme-bdsm", "theme-mix");
  document.body.classList.add(`theme-${safeMode}`);
  document.documentElement.dataset.gameMode = safeMode;

  const theme = MODE_THEMES[safeMode];
  if ($("#modeAmbienceIcon")) $("#modeAmbienceIcon").textContent = theme.icon;
  if ($("#modeAmbienceText")) $("#modeAmbienceText").textContent = theme.ambience;
  if ($("#modeName")) $("#modeName").textContent = theme.label;
}



const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ]
};

function callField(path, value) {
  return { [`call.${path}`]: value };
}

function setCallStatus(text) {
  if ($("#callStatus")) $("#callStatus").textContent = text;
}

function setCallControls({ idle=false, incoming=false, connected=false } = {}) {
  $("#startCall").classList.toggle("hidden", !idle);
  $("#answerCall").classList.toggle("hidden", !incoming);
  $("#declineCall").classList.toggle("hidden", !incoming);
  $("#incomingCallBox").classList.toggle("hidden", !incoming);
  $("#toggleMute").classList.toggle("hidden", !connected);
  $("#toggleCamera").classList.toggle("hidden", !connected);
  $("#hangupCall").classList.toggle("hidden", !(connected || incoming));
  $("#callButton").classList.toggle("call-active-indicator", connected || incoming);
}

async function ensureLocalMedia() {
  if (state.call.localStream) return state.call.localStream;
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Ce navigateur ne permet pas l’accès au micro et à la caméra.");
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
  state.call.localStream = stream;
  $("#localVideo").srcObject = stream;
  return stream;
}

function createPeerConnection(callId) {
  if (state.call.pc) state.call.pc.close();

  const pc = new RTCPeerConnection(RTC_CONFIG);
  state.call.pc = pc;
  state.call.callId = callId;
  state.call.appliedCandidates = new Set();

  const remoteStream = new MediaStream();
  state.call.remoteStream = remoteStream;
  $("#remoteVideo").srcObject = remoteStream;

  pc.ontrack = (event) => {
    event.streams[0]?.getTracks().forEach((track) => {
      if (!remoteStream.getTracks().some((item) => item.id === track.id)) remoteStream.addTrack(track);
    });
  };

  pc.onicecandidate = async (event) => {
    if (!event.candidate || state.solo || !state.roomCode || !state.call.callId) return;
    try {
      await updateDoc(roomRef(), {
        [`call.candidates.${state.role}`]: arrayUnion(event.candidate.toJSON()),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.warn("Candidat ICE non envoyé", error);
    }
  };

  pc.onconnectionstatechange = () => {
    const status = pc.connectionState;
    if (status === "connected") {
      setCallStatus("Appel connecté.");
      setCallControls({ connected:true });
    } else if (status === "connecting") {
      setCallStatus("Connexion de l’appel…");
    } else if (["failed","disconnected"].includes(status)) {
      setCallStatus("Connexion interrompue. Vous pouvez raccrocher puis rappeler.");
    } else if (status === "closed") {
      setCallStatus("Appel terminé.");
    }
  };

  return pc;
}

async function attachLocalTracks(pc) {
  const stream = await ensureLocalMedia();
  const existing = new Set(pc.getSenders().map((sender) => sender.track?.id).filter(Boolean));
  stream.getTracks().forEach((track) => {
    if (!existing.has(track.id)) pc.addTrack(track, stream);
  });
}

async function startInternalCall() {
  if (state.solo) {
    toast("L’appel interne est disponible uniquement dans une salle multijoueur.");
    return;
  }
  if (!state.room?.players?.guest) {
    toast("Le deuxième joueur doit rejoindre la salle.");
    return;
  }

  try {
    $("#callDialog").showModal();
    setCallStatus("Accès au micro et à la caméra…");
    const callId = crypto.randomUUID();
    const pc = createPeerConnection(callId);
    await attachLocalTracks(pc);

    state.call.makingOffer = true;
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await updateDoc(roomRef(), {
      callCount: (state.room?.callCount || 0) + 1,
      call: {
        id: callId,
        status: "ringing",
        callerRole: state.role,
        offer: { type: offer.type, sdp: offer.sdp },
        answer: null,
        candidates: { host: [], guest: [] },
        createdAt: Date.now()
      },
      updatedAt: serverTimestamp()
    });

    state.call.makingOffer = false;
    setCallStatus("Appel en cours… En attente de votre partenaire.");
    setCallControls({ connected:true });
  } catch (error) {
    console.error(error);
    state.call.makingOffer = false;
    toast(error.message || "Impossible de démarrer l’appel.");
    await closeLocalCall(false);
  }
}

async function answerInternalCall() {
  const signal = state.room?.call;
  if (!signal?.offer || signal.status !== "ringing") return;

  try {
    $("#callDialog").showModal();
    setCallStatus("Connexion à l’appel…");
    const pc = createPeerConnection(signal.id);
    await attachLocalTracks(pc);
    await pc.setRemoteDescription(signal.offer);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    await updateDoc(roomRef(), {
      ...callField("answer", { type: answer.type, sdp: answer.sdp }),
      ...callField("status", "connected"),
      updatedAt: serverTimestamp()
    });

    await applyRemoteCandidates(signal);
    setCallControls({ connected:true });
  } catch (error) {
    console.error(error);
    toast(error.message || "Impossible de répondre à l’appel.");
    await closeLocalCall(false);
  }
}

async function declineInternalCall() {
  if (!state.solo && state.roomCode) {
    await updateDoc(roomRef(), {
      ...callField("status", "declined"),
      ...callField("endedBy", state.role),
      updatedAt: serverTimestamp()
    }).catch(console.warn);
  }
  await closeLocalCall(false);
  toast("Appel refusé.");
}

async function applyRemoteCandidates(signal) {
  const pc = state.call.pc;
  if (!pc?.remoteDescription || !signal?.candidates) return;
  const remoteRole = state.role === "host" ? "guest" : "host";
  for (const candidate of signal.candidates[remoteRole] || []) {
    const key = `${candidate.candidate}|${candidate.sdpMid}|${candidate.sdpMLineIndex}`;
    if (state.call.appliedCandidates.has(key)) continue;
    try {
      await pc.addIceCandidate(candidate);
      state.call.appliedCandidates.add(key);
    } catch (error) {
      console.warn("Candidat ICE non appliqué", error);
    }
  }
}

async function handleCallSignal(signal) {
  if (state.solo || !signal) {
    setCallControls({ idle:true });
    return;
  }

  const amCaller = signal.callerRole === state.role;
  const partner = state.room?.players?.[signal.callerRole];

  if (signal.status === "ringing" && !amCaller) {
    $("#incomingCaller").textContent = `${partner?.name || "Votre partenaire"} vous appelle.`;
    setCallStatus("Appel entrant.");
    setCallControls({ incoming:true });
    if (!$("#callDialog").open) $("#callDialog").showModal();
    return;
  }

  if (signal.status === "ringing" && amCaller) {
    setCallStatus("Appel en cours… En attente de votre partenaire.");
    setCallControls({ connected:true });
  }

  if (amCaller && signal.answer && state.call.callId === signal.id && state.call.pc && !state.call.pc.remoteDescription) {
    try {
      await state.call.pc.setRemoteDescription(signal.answer);
      setCallStatus("Connexion de l’appel…");
    } catch (error) {
      console.warn("Réponse distante non appliquée", error);
    }
  }

  if (signal.status === "connected") {
    setCallControls({ connected:true });
  }

  if (state.call.callId === signal.id) await applyRemoteCandidates(signal);

  if (["ended","declined"].includes(signal.status)) {
    const message = signal.status === "declined" ? "Appel refusé." : "Appel terminé.";
    await closeLocalCall(false);
    setCallStatus(message);
    setCallControls({ idle:true });
  }
}

async function hangupInternalCall() {
  if (!state.solo && state.roomCode && state.room?.call?.id) {
    await updateDoc(roomRef(), {
      ...callField("status", "ended"),
      ...callField("endedBy", state.role),
      updatedAt: serverTimestamp()
    }).catch(console.warn);
  }
  await closeLocalCall(false);
  setCallControls({ idle:true });
}

async function closeLocalCall(closeDialog = true) {
  state.call.pc?.getSenders().forEach((sender) => sender.track?.stop());
  state.call.pc?.close();
  state.call.localStream?.getTracks().forEach((track) => track.stop());
  state.call.remoteStream?.getTracks().forEach((track) => track.stop());
  state.call.pc = null;
  state.call.localStream = null;
  state.call.remoteStream = null;
  state.call.callId = null;
  state.call.appliedCandidates = new Set();
  $("#localVideo").srcObject = null;
  $("#remoteVideo").srcObject = null;
  if (closeDialog && $("#callDialog").open) $("#callDialog").close();
}

function toggleMute() {
  const tracks = state.call.localStream?.getAudioTracks() || [];
  if (!tracks.length) return;
  const enabled = !tracks[0].enabled;
  tracks.forEach((track) => { track.enabled = enabled; });
  $("#toggleMute").textContent = enabled ? "🎙️ Micro activé" : "🔇 Micro coupé";
}

function toggleCamera() {
  const tracks = state.call.localStream?.getVideoTracks() || [];
  if (!tracks.length) return;
  const enabled = !tracks[0].enabled;
  tracks.forEach((track) => { track.enabled = enabled; });
  $("#toggleCamera").textContent = enabled ? "📹 Caméra activée" : "🚫 Caméra coupée";
}

const screenIds = [
  "homeScreen","createScreen","joinScreen","soloScreen",
  "waitingScreen","readyScreen","gameScreen","victoryScreen"
];

function showScreen(id) {
  screenIds.forEach((screenId) => {
    document.getElementById(screenId).classList.toggle("active", screenId === id);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toast(message) {
  const element = document.createElement("div");
  element.className = "toast";
  element.textContent = message;
  $("#toastArea").append(element);
  setTimeout(() => element.remove(), 2600);
}

function cleanName(value) {
  return value.trim().replace(/[<>]/g, "").slice(0, 20);
}

function selectedValue(name) {
  return document.querySelector(`input[name="${name}"]:checked`)?.value;
}

function roomRef(code = state.roomCode) {
  return doc(db, "rooms", code);
}

function diceSymbol(value) {
  return ["⚀","⚁","⚂","⚃","⚄","⚅"][value - 1] || "⚄";
}

function createRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function invitationUrl(code) {
  return `${location.origin}${location.pathname}?room=${encodeURIComponent(code)}`;
}

function isMyTurn(room = state.room) {
  return state.solo || room?.turnRole === state.role;
}

function saveSession() {
  if (!state.solo) {
    localStorage.setItem("pmc-v9-session", JSON.stringify({
      roomCode: state.roomCode,
      role: state.role
    }));
  }
}

function clearSession() {
  localStorage.removeItem("pmc-v9-session");
}

async function ensureAuth() {
  if (auth.currentUser) { state.uid = auth.currentUser.uid; return auth.currentUser; }

  // Certains navigateurs de bureau, profils privés ou bloqueurs refusent le stockage local.
  // On essaie donc successivement une persistance locale, de session, puis en mémoire.
  let persistenceReady = false;
  for (const persistence of [browserLocalPersistence, browserSessionPersistence, inMemoryPersistence]) {
    try {
      await setPersistence(auth, persistence);
      persistenceReady = true;
      break;
    } catch (error) {
      console.warn("Persistance Firebase indisponible, essai suivant.", error);
    }
  }
  if (!persistenceReady) throw new Error("Impossible d'initialiser la session Firebase sur ce navigateur.");

  const credential = await signInAnonymously(auth);
  if (credential?.user) { state.uid = credential.user.uid; return credential.user; }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Délai de connexion dépassé.")), 10000);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        state.uid = user.uid;
        clearTimeout(timeout);
        unsubscribe();
        resolve(user);
      }
    });
  });
}

async function createOnlineRoom(event) {
  event.preventDefault();
  $("#createError").textContent = "";

  const name = cleanName($("#hostName").value);
  if (!name) {
    $("#createError").textContent = "Entre un prénom ou un pseudo.";
    return;
  }

  try {
    await ensureAuth();

    let code = null;
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const candidate = createRoomCode();
      const snapshot = await getDoc(roomRef(candidate));
      if (!snapshot.exists()) {
        code = candidate;
        break;
      }
    }

    if (!code) throw new Error("Impossible de générer un code de salle.");

    state.solo = false;
    state.roomCode = code;
    state.role = "host";
    applyModeTheme(selectedValue("onlineMode"));

    await setDoc(roomRef(), {
      version: 10,
      code,
      status: "waiting",
      mode: selectedValue("onlineMode"),
      scenarioId: $("#onlineScenario").value,
      targetCell: Number($("#onlineLength").value || 49),
      hostUid: state.uid,
      guestUid: null,
      players: {
        host: {
          uid: state.uid,
          name,
          token: selectedValue("hostToken"),
          position: 0,
          skipNext: false
        },
        guest: null
      },
      turnRole: "host",
      dice: null,
      activeChallenge: null,
      winnerRole: null,
      history: [`${name} a créé la salle.`],
      messages: [],
      journal: [],
      memories: [],
      callCount: 0,
      recentCards: [],
      typing: { host: false, guest: false },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    saveSession();
    watchRoom();
  } catch (error) {
    console.error(error);
    $("#createError").textContent = firebaseErrorMessage(error);
  }
}

async function joinOnlineRoom(event) {
  event.preventDefault();
  $("#joinError").textContent = "";

  const code = $("#joinCode").value.trim().toUpperCase();
  const name = cleanName($("#guestName").value);

  if (code.length !== 6 || !name) {
    $("#joinError").textContent = "Vérifie le code et ton pseudo.";
    return;
  }

  try {
    await ensureAuth();

    state.solo = false;
    state.roomCode = code;
    state.role = "guest";

    await runTransaction(db, async (transaction) => {
      const reference = roomRef(code);
      const snapshot = await transaction.get(reference);

      if (!snapshot.exists()) throw new Error("Salle introuvable.");

      const room = snapshot.data();
      if (![7, 8, 9, 10].includes(room.version)) throw new Error("Cette salle appartient à une version incompatible.");
      if (room.status !== "waiting" || room.players?.guest) {
        throw new Error("Cette salle n’est plus disponible.");
      }

      const token = selectedValue("guestToken");
      if (room.players.host.token === token) {
        throw new Error("Choisis un pion différent.");
      }

      transaction.update(reference, {
        guestUid: state.uid,
        "players.guest": {
          uid: state.uid,
          name,
          token,
          position: 0,
          skipNext: false
        },
        status: "ready",
        updatedAt: serverTimestamp(),
        history: arrayUnion(`${name} a rejoint la salle.`)
      });
    });

    saveSession();
    watchRoom();
  } catch (error) {
    console.error(error);
    state.roomCode = null;
    state.role = null;
    $("#joinError").textContent = firebaseErrorMessage(error);
  }
}

function startSoloGame(event) {
  event.preventDefault();

  const playerOne = cleanName($("#soloName1").value) || "Joueur 1";
  const playerTwo = cleanName($("#soloName2").value) || "Joueur 2";

  state.solo = true;
  state.localRevealedChallengeId = null;
  state.pendingLocalChallenge = null;
  state.roomCode = "SOLO";
  applyModeTheme(selectedValue("soloMode"));
  state.role = "host";
  state.room = {
    version: 10,
    code: "SOLO",
    status: "playing",
    mode: selectedValue("soloMode"),
    scenarioId: $("#soloScenario").value,
    targetCell: Number($("#soloLength").value || 49),
    players: {
      host: { uid: "solo-host", name: playerOne, token: "💗", position: 0, skipNext: false },
      guest: { uid: "solo-guest", name: playerTwo, token: "💙", position: 0, skipNext: false }
    },
    turnRole: "host",
    dice: null,
    activeChallenge: null,
    winnerRole: null,
    history: ["Mode test solo lancé."],
    messages: [],
    journal: [],
    memories: [],
    callCount: 0,
    recentCards: [],
    typing: { host: false, guest: false }
  };

  renderGame();
}

function watchRoom() {
  state.unsubscribe?.();

  state.unsubscribe = onSnapshot(
    roomRef(),
    (snapshot) => {
      if (!snapshot.exists()) {
        toast("La salle a été fermée.");
        goHome();
        return;
      }

      state.room = snapshot.data();
      applyModeTheme(state.room?.mode);
      renderRoom();
    },
    (error) => {
      console.error(error);
      toast(firebaseErrorMessage(error));
    }
  );
}

function renderRoom() {
  const room = state.room;
  if (!room) return;

  if (room.status === "waiting") renderWaiting();
  else if (room.status === "ready") renderReady();
  else if (room.status === "playing") renderGame();
  else if (room.status === "finished") renderVictory();
}

function playerRow(player, label) {
  if (!player) {
    return `<div class="player-row"><span>?</span><div><strong>En attente…</strong><small>${label}</small></div></div>`;
  }

  return `<div class="player-row"><span>${player.token}</span><div><strong>${player.name}</strong><small>${label}</small></div></div>`;
}

function renderWaiting() {
  applyModeTheme(state.room?.mode);
  showScreen("waitingScreen");
  $("#waitingCode").textContent = state.room.code;
  $("#inviteLink").value = invitationUrl(state.room.code);
  $("#waitingPlayers").innerHTML =
    playerRow(state.room.players.host, "Créateur") +
    playerRow(state.room.players.guest, "Invité");
}

function renderReady() {
  applyModeTheme(state.room?.mode);
  showScreen("readyScreen");
  $("#readyPlayers").innerHTML =
    playerRow(state.room.players.host, "Créateur") +
    playerRow(state.room.players.guest, "Invité");

  const isHost = state.role === "host";
  $("#startGame").classList.toggle("hidden", !isHost);
  $("#guestWaitText").classList.toggle("hidden", isHost);
}

async function startOnlineGame() {
  if (state.role !== "host") return;

  try {
    await updateDoc(roomRef(), {
      status: "playing",
      turnRole: "host",
      updatedAt: serverTimestamp(),
      history: arrayUnion("La partie commence.")
    });
  } catch (error) {
    console.error(error);
    toast("Impossible de lancer la partie.");
  }
}

function cellType(number) {
  if (SPECIALS[number]) return { icon: "🎁", label: "Surprise" };

  return [
    { icon: "💬", label: "Question" },
    { icon: "❤️", label: "Complicité" },
    { icon: "🔥", label: "Flirt" }
  ][(number - 1) % 3];
}

function buildBoard() {
  const board = $("#board");
  board.innerHTML = "";

  const target = targetCell();
  for (let number = 1; number <= target; number += 1) {
    const type = cellType(number);
    const cell = document.createElement("div");

    cell.className = `cell ${SPECIALS[number] ? "special" : ""}`;
    cell.dataset.cell = String(number);
    cell.innerHTML = `
      <span class="cell-number">${number}</span>
      <span class="cell-icon">${number === target ? "🏆" : type.icon}</span>
      <small class="cell-stage">${stageForCell(number)}</small>
      <div class="cell-tokens"></div>
    `;

    board.append(cell);
  }
}

function renderGame() {
  const room = state.room;
  applyModeTheme(room?.mode);
  if (!room?.players?.host || !room?.players?.guest) {
    toast("La partie ne contient pas deux joueurs.");
    return;
  }

  showScreen("gameScreen");
  buildBoard();

  $("#gameType").textContent = state.solo ? "Partie locale" : "Partie en ligne";
  $("#gameCode").textContent = state.solo ? "MÊME ÉCRAN" : room.code;
  $("#modeName").textContent = MODE_THEMES[room.mode]?.label || room.mode;
  const scenario = scenarioFor(room);
  $("#scenarioHeading").textContent = `${scenario.icon} ${scenario.title}`;
  $("#boardScenarioTitle").textContent = `${scenario.icon} ${scenario.title} · arrivée case ${targetCell(room)}`;
  $("#boardStageText").textContent = `Parcours : ${scenario.stages.join(" → ")}`;

  const roles = ["host", "guest"];

  $("#playersPanel").innerHTML = roles.map((role) => {
    const player = room.players[role];
    return `
      <div class="player-status ${room.turnRole === role ? "active" : ""}">
        <span>${player.token}</span>
        <div><strong>${player.name}</strong><small>Case ${player.position}</small></div>
      </div>
    `;
  }).join("");

  roles.forEach((role) => {
    const player = room.players[role];
    const target = $(`[data-cell="${Math.max(1, player.position)}"] .cell-tokens`);
    if (target) target.textContent += player.token;
  });

  const activePlayer = room.players[room.turnRole];
  const myTurn = isMyTurn(room);

  $("#currentToken").textContent = activePlayer.token;
  $("#currentName").textContent = activePlayer.name;
  $("#currentPosition").textContent = activePlayer.position ? `Case ${activePlayer.position}` : "Départ";

  $("#rollDice").disabled = !myTurn || Boolean(room.activeChallenge);
  $("#turnMessage").textContent = state.solo
    ? `Tu contrôles maintenant ${activePlayer.name}.`
    : myTurn
      ? "C’est ton tour."
      : "En attente de l’autre joueur.";

  $("#diceFace").textContent = room.dice ? diceSymbol(room.dice) : "⚄";
  $("#diceMessage").textContent = room.activeChallenge
    ? "Une carte est en cours."
    : myTurn
      ? "Tu peux lancer le dé."
      : "Le partenaire joue.";

  $("#historyList").innerHTML = [...(room.history || [])]
    .slice(-8)
    .reverse()
    .map((line) => `<li>${line}</li>`)
    .join("");

  renderChat();
  renderTypingIndicator();
  renderJournal();
  handleCallSignal(room.call).catch(console.warn);

  if (room.activeChallenge) showChallenge(room.activeChallenge);
  else if ($("#challengeDialog").open) $("#challengeDialog").close();
}

function randomCard(mode, scenarioId = state.room?.scenarioId, recent = []) {
  const base = CARD_BANK[mode] || CARD_BANK.romantique;
  const themed = SCENARIO_CARDS[scenarioId] || [];
  const cards = [...base, ...themed, ...themed];
  const recentSet = new Set((recent || []).slice(-14));
  const fresh = cards.filter((card) => !recentSet.has(card));
  const pool = fresh.length ? fresh : cards;
  return pool[Math.floor(Math.random() * pool.length)];
}

function randomRarity(special = null) {
  if (special) return "rare";
  const roll = Math.random();
  if (roll < 0.03) return "legendary";
  if (roll < 0.12) return "epic";
  if (roll < 0.32) return "rare";
  return "common";
}

function animateDice() {
  const dice = $("#diceFace");
  const button = $("#rollDice");
  dice?.classList.remove("dice-rolling");
  button?.classList.remove("dice-button-rolling");
  void dice?.offsetWidth;
  dice?.classList.add("dice-rolling");
  button?.classList.add("dice-button-rolling");
  window.setTimeout(() => {
    dice?.classList.remove("dice-rolling");
    button?.classList.remove("dice-button-rolling");
  }, 700);
}

async function rollDice() {
  if (state.solo) {
    rollDiceSolo();
    return;
  }

  if (!isMyTurn() || state.room.activeChallenge) return;

  $("#rollDice").disabled = true;
  animateDice();
  const value = 1 + Math.floor(Math.random() * 6);

  try {
    await runTransaction(db, async (transaction) => {
      const reference = roomRef();
      const snapshot = await transaction.get(reference);

      if (!snapshot.exists()) throw new Error("Salle absente.");

      const room = snapshot.data();
      if (room.status !== "playing" || room.turnRole !== state.role || room.activeChallenge) return;

      const players = structuredClone(room.players);
      const player = players[state.role];

      const finish = targetCell(room);
      let nextPosition = player.position + value;
      if (nextPosition > finish) nextPosition = finish - (nextPosition - finish);
      player.position = nextPosition;

      if (nextPosition === finish) {
        transaction.update(reference, {
          players,
          dice: value,
          status: "finished",
          winnerRole: state.role,
          updatedAt: serverTimestamp(),
          history: arrayUnion(`${player.name} atteint la case ${finish}.`)
        });
        return;
      }

      const type = cellType(nextPosition);
      const special = SPECIALS[nextPosition] || null;
      const cardText = special?.text || randomCard(room.mode, room.scenarioId, room.recentCards);
      const requiresWrittenAnswer = !special && WRITTEN_PROMPTS.some((word) => cardText.toLowerCase().startsWith(word));

      transaction.update(reference, {
        players,
        dice: value,
        activeChallenge: {
          id: crypto.randomUUID(),
          targetRole: state.role,
          cell: nextPosition,
          icon: type.icon,
          label: type.label,
          text: cardText,
          effect: special,
          rarity: randomRarity(special),
          requiresWrittenAnswer
        },
        recentCards: [...(room.recentCards || []).slice(-13), cardText],
        journal: arrayUnion({
          id: crypto.randomUUID(),
          type: "card",
          authorRole: state.role,
          authorName: player.name,
          text: cardText,
          cell: nextPosition,
          createdAt: Date.now()
        }),
        updatedAt: serverTimestamp(),
        history: arrayUnion(`${player.name} obtient ${value} et arrive case ${nextPosition}.`)
      });
    });
  } catch (error) {
    console.error(error);
    toast("Le lancer a échoué.");
  }
}

function rollDiceSolo() {
  const room = state.room;
  animateDice();
  const role = room.turnRole;
  const player = room.players[role];
  const value = 1 + Math.floor(Math.random() * 6);

  const finish = targetCell(room);
  let nextPosition = player.position + value;
  if (nextPosition > finish) nextPosition = finish - (nextPosition - finish);

  player.position = nextPosition;
  room.dice = value;
  room.history.push(`${player.name} obtient ${value} et arrive case ${nextPosition}.`);

  if (nextPosition === finish) {
    room.status = "finished";
    room.winnerRole = role;
    renderVictory();
    return;
  }

  const type = cellType(nextPosition);
  const special = SPECIALS[nextPosition] || null;
  const cardText = special?.text || randomCard(room.mode, room.scenarioId, room.recentCards);
  room.recentCards = [...(room.recentCards || []).slice(-13), cardText];
  const requiresWrittenAnswer = !special && WRITTEN_PROMPTS.some((word) => cardText.toLowerCase().startsWith(word));

  room.activeChallenge = {
    id: crypto.randomUUID(),
    targetRole: role,
    cell: nextPosition,
    icon: type.icon,
    label: type.label,
    text: cardText,
    effect: special,
    rarity: randomRarity(special),
    requiresWrittenAnswer
  };
  room.journal.push({
    id: crypto.randomUUID(),
    type: "card",
    authorRole: role,
    authorName: player.name,
    text: cardText,
    cell: nextPosition,
    createdAt: Date.now()
  });

  renderGame();
}

function showChallenge(challenge) {
  if (state.solo && state.localRevealedChallengeId !== challenge.id) {
    state.pendingLocalChallenge = challenge;
    const player = state.room?.players?.[challenge.targetRole];
    $("#handoffPlayerName").textContent = player?.name || "le joueur actif";
    if (!$("#handoffDialog").open) $("#handoffDialog").showModal();
    return;
  }

  const rarity = challenge.rarity || "common";
  const rarityLabels = {common:"COMMUNE",rare:"RARE",epic:"ÉPIQUE",legendary:"LÉGENDAIRE"};
  $("#challengeDialog").classList.remove("rarity-common","rarity-rare","rarity-epic","rarity-legendary","card-reveal");
  $("#challengeDialog").classList.add(`rarity-${rarity}`, "card-reveal");
  $("#challengeRarity").textContent = rarityLabels[rarity] || rarityLabels.common;
  $("#challengeIcon").textContent = challenge.icon;
  $("#challengeCategory").textContent = challenge.label;
  $("#challengeTitle").textContent = `Case ${challenge.cell}`;
  $("#challengeText").textContent = challenge.text;

  const canAct = state.solo || challenge.targetRole === state.role;
  const requiresWrittenAnswer = Boolean(challenge.requiresWrittenAnswer);
  const hasAnswer = Boolean(challenge.answer?.text);

  $("#challengeActions").classList.toggle("hidden", !canAct);
  $("#challengeWait").classList.toggle("hidden", canAct);

  // V7.1 : une zone de réponse est proposée pour toutes les cartes.
  // Certaines cartes rendent la réponse obligatoire, mais elle reste facultative sur les autres.
  $("#writtenAnswerBox").classList.toggle("hidden", !(canAct && !hasAnswer));
  $("#writtenAnswerLabel").textContent = requiresWrittenAnswer
    ? "Ta réponse écrite — obligatoire pour valider"
    : "Ta réponse écrite — facultative";
  $("#receivedAnswerBox").classList.toggle("hidden", !hasAnswer);
  $("#writtenAnswerStatus").textContent = hasAnswer
    ? "Réponse partagée avec ton partenaire."
    : (requiresWrittenAnswer ? "Une réponse est nécessaire pour valider cette carte." : "Tu peux répondre, ou valider sans écrire.");
  $("#completeChallenge").disabled = canAct && requiresWrittenAnswer && !hasAnswer;
  const favorite = (state.room.memories || []).some((item) => item.challengeId === challenge.id);
  $("#favoriteChallenge").textContent = favorite ? "★ Souvenir" : "☆ Souvenir";
  $("#favoriteChallenge").disabled = !canAct;

  if (hasAnswer) {
    $("#receivedAnswerText").textContent = `${challenge.answer.authorName} : ${challenge.answer.text}`;
  }

  if (!$("#challengeDialog").open) {
    $("#writtenAnswer").value = "";
    $("#challengeDialog").showModal();
  }
}

async function replaceChallenge() {
  const challenge = state.room.activeChallenge;
  if (!challenge) return;

  if (state.solo) {
    challenge.text = randomCard(state.room.mode);
    challenge.effect = null;
    challenge.rarity = randomRarity();
    challenge.requiresWrittenAnswer = WRITTEN_PROMPTS.some((word) => challenge.text.toLowerCase().startsWith(word));
    challenge.answer = null;
    showChallenge(challenge);
    return;
  }

  if (challenge.targetRole !== state.role) return;

  try {
    const replacementText = randomCard(state.room.mode);
    await updateDoc(roomRef(), {
      activeChallenge: {
        ...challenge,
        id: crypto.randomUUID(),
        text: replacementText,
        effect: null,
        rarity: randomRarity(),
        answer: null,
        requiresWrittenAnswer: WRITTEN_PROMPTS.some((word) => replacementText.toLowerCase().startsWith(word))
      },
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(error);
    toast("Impossible de remplacer la carte.");
  }
}


async function toggleChallengeFavorite() {
  const challenge = state.room?.activeChallenge;
  if (!challenge) return;
  const memories = [...(state.room.memories || [])];
  const index = memories.findIndex((item) => item.challengeId === challenge.id);
  if (index >= 0) memories.splice(index, 1);
  else memories.push({
    id: crypto.randomUUID(),
    challengeId: challenge.id,
    text: challenge.text,
    label: challenge.label,
    cell: challenge.cell,
    authorName: state.room.players[challenge.targetRole]?.name || "Joueur",
    scenarioId: state.room.scenarioId,
    createdAt: Date.now()
  });

  if (state.solo) {
    state.room.memories = memories;
    showChallenge(challenge);
    return;
  }
  await updateDoc(roomRef(), { memories, updatedAt: serverTimestamp() });
}

async function resolveChallenge(result) {
  if (state.solo) {
    resolveChallengeSolo(result);
    return;
  }

  const challenge = state.room.activeChallenge;
  if (!challenge || challenge.targetRole !== state.role) return;

  try {
    await runTransaction(db, async (transaction) => {
      const reference = roomRef();
      const snapshot = await transaction.get(reference);

      if (!snapshot.exists()) return;

      const room = snapshot.data();
      if (!room.activeChallenge || room.activeChallenge.id !== challenge.id) return;

      const players = structuredClone(room.players);
      const player = players[state.role];
      let nextRole = state.role === "host" ? "guest" : "host";

      if (result === "done" && challenge.effect) {
        if (challenge.effect.kind === "move") {
          player.position = Math.max(0, Math.min(targetCell(state.room), player.position + challenge.effect.value));
        }
        if (challenge.effect.kind === "replay") nextRole = state.role;
        if (challenge.effect.kind === "skip") player.skipNext = true;
      }

      if (players[nextRole]?.skipNext) {
        players[nextRole].skipNext = false;
        nextRole = state.role;
      }

      transaction.update(reference, {
        players,
        turnRole: nextRole,
        activeChallenge: null,
        updatedAt: serverTimestamp(),
        history: arrayUnion(
          result === "done"
            ? `${player.name} valide la carte.`
            : `${player.name} passe la carte.`
        )
      });
    });
  } catch (error) {
    console.error(error);
    toast("Impossible de terminer la carte.");
  }
}

function resolveChallengeSolo(result) {
  const room = state.room;
  const challenge = room.activeChallenge;
  const role = room.turnRole;
  const player = room.players[role];
  let nextRole = role === "host" ? "guest" : "host";

  if (result === "done" && challenge?.effect) {
    if (challenge.effect.kind === "move") {
      player.position = Math.max(0, Math.min(targetCell(state.room), player.position + challenge.effect.value));
    }
    if (challenge.effect.kind === "replay") nextRole = role;
    if (challenge.effect.kind === "skip") player.skipNext = true;
  }

  if (room.players[nextRole]?.skipNext) {
    room.players[nextRole].skipNext = false;
    nextRole = role;
  }

  room.history.push(
    result === "done"
      ? `${player.name} valide la carte.`
      : `${player.name} passe la carte.`
  );

  room.turnRole = nextRole;
  room.activeChallenge = null;
  $("#challengeDialog").close();
  renderGame();
}


function currentPlayerInfo(role = state.role) {
  return state.room?.players?.[role] || null;
}

function formatTime(timestamp) {
  const value = Number(timestamp);
  if (!Number.isFinite(value)) return "";
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function renderChat() {
  const container = $("#chatMessages");
  if (!container || !state.room) return;

  const messages = state.room.messages || [];
  if (!messages.length) {
    container.innerHTML = '<p class="chat-empty">Aucun message pour le moment. Lance la conversation.</p>';
    return;
  }

  container.innerHTML = messages.map((message) => {
    const mine = state.solo ? message.authorRole === state.room.turnRole : message.authorRole === state.role;
    const reactions = REACTIONS.map((emoji) => {
      const users = message.reactions?.[emoji] || [];
      const active = users.includes(state.solo ? state.room.turnRole : state.role);
      return `<button class="reaction-btn ${active ? "active" : ""}" data-message-id="${message.id}" data-reaction="${emoji}" type="button">${emoji}${users.length ? ` ${users.length}` : ""}</button>`;
    }).join("");

    return `
      <article class="chat-message ${mine ? "mine" : ""}">
        <div class="message-meta"><strong>${message.authorName}</strong><span>${formatTime(message.createdAt)}</span></div>
        <div class="message-bubble">${renderMessageContent(message)}</div>
        <div class="message-reactions">${reactions}</div>
      </article>
    `;
  }).join("");

  $$(".reaction-btn").forEach((button) => {
    button.addEventListener("click", () => toggleReaction(button.dataset.messageId, button.dataset.reaction));
  });

  if (messages.length !== state.lastChatCount) {
    container.scrollTop = container.scrollHeight;
    state.lastChatCount = messages.length;
  }
}


function renderMessageContent(message) {
  if (message.type === "photo" && message.mediaUrl) {
    return `<a href="${escapeHtml(message.mediaUrl)}" target="_blank" rel="noopener"><img class="chat-photo" src="${escapeHtml(message.mediaUrl)}" alt="Photo partagée par ${escapeHtml(message.authorName)}" loading="lazy"></a>${message.text ? `<p>${escapeHtml(message.text)}</p>` : ""}`;
  }
  if (message.type === "voice" && message.mediaUrl) {
    return `<audio class="chat-audio" controls preload="metadata" src="${escapeHtml(message.mediaUrl)}"></audio><small>Vocal${message.duration ? ` · ${message.duration}s` : ""}</small>`;
  }
  return escapeHtml(message.text || "");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendChatMessage(event) {
  event.preventDefault();
  const text = $("#chatInput").value.trim();
  if (!text || !state.room) return;

  const authorRole = state.solo ? state.room.turnRole : state.role;
  const player = currentPlayerInfo(authorRole);
  if (!player) return;

  const message = {
    id: crypto.randomUUID(),
    type: "message",
    authorRole,
    authorName: player.name,
    text: text.slice(0, 500),
    createdAt: Date.now(),
    reactions: {}
  };

  $("#chatInput").value = "";

  if (state.solo) {
    state.room.messages.push(message);
    state.room.journal.push({ ...message });
    renderChat();
    renderJournal();
    return;
  }

  try {
    await updateDoc(roomRef(), {
      messages: arrayUnion(message),
      journal: arrayUnion({ ...message }),
      [`typing.${state.role}`]: false,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(error);
    toast("Message non envoyé.");
  }
}


async function publishMediaMessage({ type, mediaUrl, text = "", duration = 0 }) {
  if (!state.room) return;
  const authorRole = state.solo ? state.room.turnRole : state.role;
  const player = currentPlayerInfo(authorRole);
  if (!player) return;
  const message = { id: crypto.randomUUID(), type, authorRole, authorName: player.name, mediaUrl, text, duration, createdAt: Date.now(), reactions: {} };
  if (state.solo) {
    state.room.messages.push(message);
    state.room.journal.push({ ...message, text: type === "photo" ? "Photo partagée" : "Vocal partagé" });
    renderChat(); renderJournal();
    return;
  }
  await updateDoc(roomRef(), {
    messages: arrayUnion(message),
    journal: arrayUnion({ ...message, text: type === "photo" ? "Photo partagée" : "Vocal partagé" }),
    updatedAt: serverTimestamp()
  });
}

function setMediaStatus(text, busy = false) {
  const status = $("#mediaStatus");
  if (status) status.textContent = text;
  $("#photoButton")?.toggleAttribute("disabled", busy);
}

async function uploadRoomMedia(file, type, duration = 0) {
  const maxBytes = type === "photo" ? 12 * 1024 * 1024 : 20 * 1024 * 1024;
  if (file.size > maxBytes) throw new Error(type === "photo" ? "Photo trop lourde (12 Mo max)." : "Vocal trop lourd (20 Mo max)." );
  if (state.solo) {
    const url = URL.createObjectURL(file);
    await publishMediaMessage({ type, mediaUrl: url, duration });
    return;
  }
  if (!state.roomCode || !state.uid) throw new Error("Salle Firebase indisponible.");
  const extension = (file.name?.split(".").pop() || (type === "photo" ? "jpg" : "webm")).replace(/[^a-z0-9]/gi, "");
  const path = `rooms/${state.roomCode}/media/${state.uid}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const reference = storageRef(storage, path);
  await uploadBytes(reference, file, { contentType: file.type, customMetadata: { roomCode: state.roomCode, mediaType: type } });
  const mediaUrl = await getDownloadURL(reference);
  await publishMediaMessage({ type, mediaUrl, duration });
}

async function handlePhotoSelection(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) return toast("Format photo non accepté.");
  try {
    setMediaStatus("Envoi de la photo…", true);
    await uploadRoomMedia(file, "photo");
    setMediaStatus("Photo envoyée ✓");
  } catch (error) {
    console.error(error); setMediaStatus(""); toast(error.message || "Photo non envoyée.");
  } finally { setMediaStatus("", false); }
}

async function toggleVoiceRecording() {
  const button = $("#voiceButton");
  if (state.mediaRecorder?.state === "recording") {
    state.mediaRecorder.stop();
    button.classList.remove("recording");
    button.querySelector("span").textContent = "Vocal";
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return toast("Enregistrement vocal non disponible sur ce navigateur.");
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const preferred = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
    state.voiceChunks = [];
    state.voiceStartedAt = Date.now();
    const recorder = new MediaRecorder(stream, { mimeType: preferred });
    state.mediaRecorder = recorder;
    recorder.ondataavailable = (event) => { if (event.data.size) state.voiceChunks.push(event.data); };
    recorder.onstop = async () => {
      stream.getTracks().forEach(track => track.stop());
      const duration = Math.max(1, Math.round((Date.now() - state.voiceStartedAt) / 1000));
      if (!state.voiceChunks.length) return;
      const blob = new Blob(state.voiceChunks, { type: recorder.mimeType || "audio/webm" });
      const file = new File([blob], `vocal-${Date.now()}.webm`, { type: blob.type });
      try { setMediaStatus("Envoi du vocal…", true); await uploadRoomMedia(file, "voice", duration); setMediaStatus("Vocal envoyé ✓"); }
      catch (error) { console.error(error); toast(error.message || "Vocal non envoyé."); }
      finally { setMediaStatus("", false); state.mediaRecorder = null; }
    };
    recorder.start();
    button.classList.add("recording");
    button.querySelector("span").textContent = "Arrêter";
    setMediaStatus("Enregistrement en cours…");
    setTimeout(() => { if (recorder.state === "recording") toggleVoiceRecording(); }, 60000);
  } catch (error) { console.error(error); toast("Autorise le microphone pour enregistrer un vocal."); }
}

async function toggleReaction(messageId, emoji) {
  if (!state.room) return;
  const actorRole = state.solo ? state.room.turnRole : state.role;
  const messages = structuredClone(state.room.messages || []);
  const index = messages.findIndex((message) => message.id === messageId);
  if (index < 0) return;

  const list = messages[index].reactions?.[emoji] || [];
  const exists = list.includes(actorRole);
  messages[index].reactions = messages[index].reactions || {};
  messages[index].reactions[emoji] = exists
    ? list.filter((role) => role !== actorRole)
    : [...list, actorRole];

  if (state.solo) {
    state.room.messages = messages;
    renderChat();
    return;
  }

  try {
    await updateDoc(roomRef(), {
      messages,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(error);
    toast("Réaction non enregistrée.");
  }
}

function renderTypingIndicator() {
  const element = $("#typingIndicator");
  if (!element || !state.room || state.solo) {
    if (element) element.textContent = "";
    return;
  }

  const otherRole = state.role === "host" ? "guest" : "host";
  const otherPlayer = state.room.players?.[otherRole];
  element.textContent = state.room.typing?.[otherRole] && otherPlayer
    ? `${otherPlayer.name} est en train d’écrire…`
    : "";
}

async function setTyping(isTyping) {
  if (state.solo || !state.roomCode || !state.role) return;
  try {
    await updateDoc(roomRef(), {
      [`typing.${state.role}`]: isTyping,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.warn(error);
  }
}

async function sendWrittenAnswer() {
  const challenge = state.room?.activeChallenge;
  const text = $("#writtenAnswer").value.trim();
  if (!challenge || !text) {
    $("#writtenAnswerStatus").textContent = "Écris d’abord une réponse.";
    return;
  }

  const authorRole = state.solo ? challenge.targetRole : state.role;
  if (!state.solo && challenge.targetRole !== state.role) return;

  const player = currentPlayerInfo(authorRole);
  const answer = {
    id: crypto.randomUUID(),
    type: "answer",
    authorRole,
    authorName: player.name,
    text: text.slice(0, 1000),
    cardText: challenge.text,
    cell: challenge.cell,
    createdAt: Date.now()
  };

  if (state.solo) {
    state.room.activeChallenge.answer = answer;
    state.room.messages.push({ ...answer, reactions: {} });
    state.room.journal.push(answer);
    $("#writtenAnswer").value = "";
    showChallenge(state.room.activeChallenge);
    renderChat();
    renderJournal();
    return;
  }

  try {
    await updateDoc(roomRef(), {
      "activeChallenge.answer": answer,
      messages: arrayUnion({ ...answer, reactions: {} }),
      journal: arrayUnion(answer),
      updatedAt: serverTimestamp()
    });
    $("#writtenAnswer").value = "";
    $("#writtenAnswerStatus").textContent = "Réponse envoyée.";
  } catch (error) {
    console.error(error);
    $("#writtenAnswerStatus").textContent = "La réponse n’a pas pu être envoyée.";
  }
}

function renderJournal() {
  const room = state.room;
  if (!room) return;

  const dashboardTab = state.dashboardTab || "journal";
  $$("[data-dashboard-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.dashboardTab === dashboardTab);
  });
  $("#journalFilters").classList.toggle("hidden", dashboardTab !== "journal");
  $("#journalList").classList.toggle("hidden", dashboardTab !== "journal");
  $("#memoriesList").classList.toggle("hidden", dashboardTab !== "memories");
  $("#achievementsList").classList.toggle("hidden", dashboardTab !== "achievements");
  $("#statsList").classList.toggle("hidden", dashboardTab !== "stats");

  const journal = [...(room.journal || [])];
  (room.messages || []).forEach((message) => {
    journal.push({
      id: `message-${message.id}`,
      type: "message",
      authorName: room.players?.[message.authorRole]?.name || message.authorName || "Joueur",
      text: message.text,
      createdAt: message.createdAt
    });
  });

  const filtered = state.journalFilter === "all"
    ? journal
    : journal.filter((item) => item.type === state.journalFilter);

  filtered.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  $("#journalList").innerHTML = filtered.length
    ? filtered.map((item) => `
      <article class="journal-item">
        <small>${formatTime(item.createdAt)} · ${item.type === "message" ? "Message" : item.type === "answer" ? "Réponse" : "Carte"}</small>
        <strong>${escapeHtml(item.authorName || "Journal")}</strong>
        <p>${escapeHtml(item.text || "")}</p>
      </article>`).join("")
    : `<p class="muted">Le journal est encore vide.</p>`;

  const memories = [...(room.memories || [])].reverse();
  $("#memoriesList").innerHTML = memories.length
    ? memories.map((item) => `
      <article class="journal-item memory-item">
        <small>⭐ ${escapeHtml(item.label || "Moment")} · case ${item.cell || "—"}</small>
        <strong>${escapeHtml(item.authorName || "Souvenir")}</strong>
        <p>${escapeHtml(item.text)}</p>
      </article>`).join("")
    : `<p class="muted">Aucun souvenir enregistré.</p>`;

  const unlocked = unlockedAchievements(room);
  $("#achievementsList").innerHTML = ACHIEVEMENTS.map((item) => `
    <article class="achievement ${unlocked.has(item.id) ? "unlocked" : ""}">
      <span>${item.icon}</span><strong>${item.title}</strong><p>${item.description}</p>
    </article>`).join("");

  const stats = deriveStats(room);
  const scenario = scenarioFor(room);
  $("#statsList").innerHTML = `
    <article><strong>${stats.rolls}</strong><span>Lancers</span></article>
    <article><strong>${stats.cards}</strong><span>Moments</span></article>
    <article><strong>${stats.messages}</strong><span>Messages</span></article>
    <article><strong>${stats.answers}</strong><span>Réponses</span></article>
    <article><strong>${stats.memories}</strong><span>Souvenirs</span></article>
    <article><strong>${stats.calls}</strong><span>Appels</span></article>
    <article class="wide"><strong>${scenario.icon}</strong><span>${escapeHtml(scenario.title)}</span></article>`;
}


function renderVictory() {
  showScreen("victoryScreen");
  const winner = state.room.players[state.room.winnerRole];
  $("#victoryTitle").textContent = `${winner.token} ${winner.name} remporte la partie !`;
  $("#victoryText").textContent = `La case ${targetCell()} a été atteinte. Bravo !`;
}

async function leaveRoom() {
  if (state.solo) {
    goHome();
    return;
  }

  try {
    if (state.roomCode && state.role === "host" && state.room?.status === "waiting") {
      await deleteDoc(roomRef());
    }
  } catch (error) {
    console.warn(error);
  }

  goHome();
}

function goHome() {
  closeLocalCall(false).catch(console.warn);
  state.unsubscribe?.();
  state.unsubscribe = null;
  state.roomCode = null;
  state.role = null;
  state.room = null;
  state.solo = false;
  clearSession();
  applyModeTheme("romantique");

  if ($("#challengeDialog").open) $("#challengeDialog").close();
  if ($("#journalDialog").open) $("#journalDialog").close();
  showScreen("homeScreen");
}


function bindModePreview(groupName) {
  $$(`input[name="${groupName}"]`).forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) applyModeTheme(input.value);
    });
  });
}

bindModePreview("onlineMode");
bindModePreview("soloMode");

$("#openCreate").addEventListener("click", () => showScreen("createScreen"));
$("#openJoin").addEventListener("click", () => showScreen("joinScreen"));
$("#openSolo").addEventListener("click", () => showScreen("soloScreen"));

$$("[data-home]").forEach((button) => button.addEventListener("click", goHome));
$$("[data-leave]").forEach((button) => button.addEventListener("click", leaveRoom));

$("#createForm").addEventListener("submit", createOnlineRoom);
$("#joinForm").addEventListener("submit", joinOnlineRoom);
$("#soloForm").addEventListener("submit", startSoloGame);

$("#startGame").addEventListener("click", startOnlineGame);
$("#rollDice").addEventListener("click", rollDice);
$("#replaceChallenge").addEventListener("click", replaceChallenge);
$("#skipChallenge").addEventListener("click", () => resolveChallenge("skip"));
$("#completeChallenge").addEventListener("click", () => resolveChallenge("done"));
$("#leaveGame").addEventListener("click", leaveRoom);

$("#callButton").addEventListener("click", () => {
  if (state.solo) {
    toast("L’appel interne est disponible uniquement en multijoueur.");
    return;
  }
  $("#callDialog").showModal();
  const signal = state.room?.call;
  if (signal?.status === "ringing" && signal.callerRole !== state.role) {
    setCallControls({ incoming:true });
  } else if (["ringing","connected"].includes(signal?.status)) {
    setCallControls({ connected:true });
  } else {
    setCallControls({ idle:true });
  }
});
$("#startCall").addEventListener("click", startInternalCall);
$("#answerCall").addEventListener("click", answerInternalCall);
$("#declineCall").addEventListener("click", declineInternalCall);
$("#hangupCall").addEventListener("click", hangupInternalCall);
$("#toggleMute").addEventListener("click", toggleMute);
$("#toggleCamera").addEventListener("click", toggleCamera);
$("#closeCallDialog").addEventListener("click", () => $("#callDialog").close());

$("#chatForm").addEventListener("submit", sendChatMessage);
$("#photoButton").addEventListener("click", () => $("#photoInput").click());
$("#photoInput").addEventListener("change", handlePhotoSelection);
$("#voiceButton").addEventListener("click", toggleVoiceRecording);
$("#chatInput").addEventListener("input", () => {
  clearTimeout(state.typingTimer);
  setTyping(Boolean($("#chatInput").value.trim()));
  state.typingTimer = setTimeout(() => setTyping(false), 1400);
});
$("#chatInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    $("#chatForm").requestSubmit();
  }
});
$("#sendWrittenAnswer").addEventListener("click", sendWrittenAnswer);

$("#openJournal").addEventListener("click", () => {
  renderJournal();
  $("#journalDialog").showModal();
});
$("#closeJournal").addEventListener("click", () => $("#journalDialog").close());
$$(".journal-tab").forEach((button) => {
  button.addEventListener("click", () => {
    state.journalFilter = button.dataset.journalFilter;
    $$(".journal-tab").forEach((tab) => tab.classList.toggle("active", tab === button));
    renderJournal();
  });
});

$("#openRules").addEventListener("click", () => $("#rulesDialog").showModal());
$("#closeRules").addEventListener("click", () => $("#rulesDialog").close());

$("#copyCode").addEventListener("click", async () => {
  await navigator.clipboard.writeText(state.roomCode);
  toast("Code copié.");
});

$("#copyLink").addEventListener("click", async () => {
  await navigator.clipboard.writeText($("#inviteLink").value);
  toast("Lien copié.");
});

window.addEventListener("online", () => {
  $("#statusBadge").classList.add("online");
  $("#statusText").textContent = `Connecté · ${location.hostname || "local"}`;
});

window.addEventListener("offline", () => {
  $("#statusBadge").classList.remove("online");
  $("#statusText").textContent = "Hors ligne";
});

applyModeTheme("romantique");

const roomFromUrl = new URLSearchParams(location.search).get("room");
if (roomFromUrl) {
  $("#joinCode").value = roomFromUrl.toUpperCase().slice(0, 6);
  showScreen("joinScreen");
}

if (location.protocol === "file:") {
  $("#statusBadge").classList.remove("online");
  $("#statusText").textContent = "Ouvre le jeu via localhost";
  toast("Sur ordinateur, lance START-PC.bat, START-MAC.command ou un serveur local. Firebase ne fonctionne pas correctement en file://.");
}

try {
  const user = await ensureAuth();
  state.uid = user.uid;
  $("#statusBadge").classList.add("online");
  $("#statusText").textContent = `Connecté · ${location.hostname || "local"}`;

  const saved = JSON.parse(localStorage.getItem("pmc-v9-session") || "null");

  if (saved?.roomCode && saved?.role) {
    const snapshot = await getDoc(roomRef(saved.roomCode));

    if (snapshot.exists()) {
      const room = snapshot.data();
      const player = room.players?.[saved.role];

      if ([7, 8, 9, 10].includes(room.version) && player?.uid === state.uid) {
        state.roomCode = saved.roomCode;
        state.role = saved.role;
        watchRoom();
      }
    }
  }
} catch (error) {
  console.error(error);
  $("#statusBadge").classList.remove("online");
  $("#statusText").textContent = "Firebase à configurer";
  toast(firebaseErrorMessage(error) + " Le mode local reste disponible.");
}

// Compléments V7 : scénarios, souvenirs et tableau de bord
function bindScenarioSelect(modeGroupName, selectId) {
  $$(`input[name="${modeGroupName}"]`).forEach((input) => {
    input.addEventListener("change", () => populateScenarioSelect(selectId, input.value));
  });
  populateScenarioSelect(selectId, selectedValue(modeGroupName));
}
bindScenarioSelect("onlineMode", "#onlineScenario");
bindScenarioSelect("soloMode", "#soloScenario");

$("#revealLocalCard").addEventListener("click", () => {
  const challenge = state.pendingLocalChallenge;
  if (!challenge) return;
  state.localRevealedChallengeId = challenge.id;
  state.pendingLocalChallenge = null;
  $("#handoffDialog").close();
  showChallenge(challenge);
});

$("#favoriteChallenge").addEventListener("click", () => toggleChallengeFavorite().catch((error) => {
  console.error(error); toast("Impossible d’enregistrer ce souvenir.");
}));
$$("[data-dashboard-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    state.dashboardTab = button.dataset.dashboardTab;
    renderJournal();
  });
});
