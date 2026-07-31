import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  collection,
  query,
  orderBy,
  limit,
  addDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const $ = (selector) => document.querySelector(selector);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let uid = null;
let roomCode = null;
let playerName = null;
let role = null;
let roomUnsubscribe = null;
let messagesUnsubscribe = null;
let roomReadySent = false;

function emit(name, detail = {}) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

function notify(message) {
  emit("online-error", { message });
}

function cleanCode(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

function otherName(name) {
  return name === "Gwen" ? "Nicolas" : "Gwen";
}

function roomRef(code = roomCode) {
  return doc(db, "gwenNicolasRooms", code);
}

function messagesRef(code = roomCode) {
  return collection(db, "gwenNicolasRooms", code, "messages");
}

async function ensureAuth() {
  if (uid) return uid;
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch {
    try { await setPersistence(auth, browserSessionPersistence); } catch {}
  }
  const result = await signInAnonymously(auth);
  uid = result.user.uid;
  return uid;
}

function friendlyError(error) {
  console.error(error);
  const code = error?.code || "";
  const messages = {
    "auth/operation-not-allowed": "L’authentification anonyme doit être activée dans Firebase.",
    "auth/unauthorized-domain": "Ajoutez ce domaine dans Firebase Authentication > Domaines autorisés.",
    "permission-denied": "Les règles Firestore ne sont pas encore déployées.",
    "unavailable": "Firebase est momentanément indisponible. Réessayez dans quelques instants."
  };
  notify(messages[code] || error?.message || "Une erreur Firebase est survenue.");
}

function setButtonBusy(button, busy, normalLabel) {
  button.disabled = busy;
  button.textContent = busy ? "Connexion…" : normalLabel;
}

async function createRoom() {
  const button = $("#createRoomBtn");
  setButtonBusy(button, true, "Créer la salle");
  try {
    await ensureAuth();
    playerName = $("#createPlayerName").value;
    role = "host";
    roomCode = makeCode();
    roomReadySent = false;

    await setDoc(roomRef(), {
      version: 4,
      hostUid: uid,
      guestUid: null,
      hostName: playerName,
      guestName: null,
      status: "waiting",
      currentCardId: null,
      turn: playerName,
      recentCardIds: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    showWaiting();
    watchRoom();
  } catch (error) {
    friendlyError(error);
  } finally {
    setButtonBusy(button, false, "Créer la salle");
  }
}

async function joinRoom() {
  const button = $("#joinRoomBtn");
  setButtonBusy(button, true, "Rejoindre");
  try {
    await ensureAuth();
    const code = cleanCode($("#roomCodeInput").value);
    if (code.length !== 6) throw new Error("Le code doit contenir 6 caractères.");

    playerName = $("#joinPlayerName").value;
    role = "guest";
    roomCode = code;
    roomReadySent = false;

    await runTransaction(db, async (transaction) => {
      const reference = roomRef(code);
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists()) throw new Error("Cette salle n’existe pas.");
      const data = snapshot.data();
      if (data.guestUid && data.guestUid !== uid) throw new Error("Cette salle contient déjà deux joueurs.");
      if (data.hostName === playerName) throw new Error(`Choisissez ${otherName(data.hostName)} pour rejoindre la salle.`);

      transaction.update(reference, {
        guestUid: uid,
        guestName: playerName,
        status: "playing",
        updatedAt: serverTimestamp()
      });
    });

    showWaiting();
    watchRoom();
  } catch (error) {
    friendlyError(error);
  } finally {
    setButtonBusy(button, false, "Rejoindre");
  }
}

function showWaiting() {
  $("#roomWaiting").classList.remove("hidden");
  $("#roomCodeDisplay").textContent = roomCode;
  $("#roomStatusText").textContent = role === "host"
    ? "Partagez ce code avec l’autre joueur."
    : "Connexion à la salle…";
}

function watchRoom() {
  roomUnsubscribe?.();
  roomUnsubscribe = onSnapshot(roomRef(), (snapshot) => {
    if (!snapshot.exists()) {
      notify("La salle n’existe plus.");
      leave(false);
      return;
    }

    const room = snapshot.data();
    const connected = Boolean(room.hostUid && room.guestUid);
    $("#roomStatusText").textContent = connected
      ? `${room.hostName} et ${room.guestName} sont connectés.`
      : "En attente de l’autre joueur…";

    if (!connected) return;

    watchMessages();
    const detail = {
      code: roomCode,
      playerName,
      cardId: room.currentCardId,
      turn: room.turn,
      canDraw: room.turn === playerName
    };

    if (!roomReadySent) {
      roomReadySent = true;
      emit("online-room-ready", detail);
    } else {
      emit("online-room-update", detail);
    }
  }, friendlyError);
}

async function drawNext(selectedCategories = []) {
  try {
    await ensureAuth();
    await runTransaction(db, async (transaction) => {
      const reference = roomRef();
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists()) throw new Error("Salle introuvable.");

      const room = snapshot.data();
      if (room.turn !== playerName) throw new Error("C’est au tour de l’autre joueur.");

      const categories = selectedCategories.length
        ? selectedCategories
        : [...new Set(window.CARDS.map((card) => card.category))];
      const recent = Array.isArray(room.recentCardIds) ? room.recentCardIds : [];
      let pool = window.CARDS.filter((card) => categories.includes(card.category) && !recent.includes(card.id));
      if (!pool.length) pool = window.CARDS.filter((card) => categories.includes(card.category));
      if (!pool.length) pool = window.CARDS;

      const card = pool[Math.floor(Math.random() * pool.length)];
      transaction.update(reference, {
        currentCardId: card.id,
        turn: otherName(playerName),
        recentCardIds: [...recent, card.id].slice(-30),
        updatedAt: serverTimestamp()
      });
    });
  } catch (error) {
    friendlyError(error);
  }
}

function watchMessages() {
  if (messagesUnsubscribe) return;
  const messagesQuery = query(messagesRef(), orderBy("createdAt", "asc"), limit(150));
  messagesUnsubscribe = onSnapshot(messagesQuery, (snapshot) => {
    renderMessages(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
  }, friendlyError);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[character]));
}

function renderMessages(messages) {
  const container = $("#chatMessages");
  if (!messages.length) {
    container.innerHTML = '<p class="chat-empty">Écrivez votre premier message.</p>';
    return;
  }

  container.innerHTML = messages.map((message) => `
    <article class="chat-message ${message.uid === uid ? "mine" : ""}">
      <small>${escapeHtml(message.author)}</small>
      <p>${escapeHtml(message.text)}</p>
    </article>
  `).join("");
  container.scrollTop = container.scrollHeight;
}

async function sendMessage(event) {
  event.preventDefault();
  const input = $("#chatInput");
  const text = input.value.trim();
  if (!text || !roomCode) return;

  input.value = "";
  try {
    await ensureAuth();
    await addDoc(messagesRef(), {
      uid,
      author: playerName,
      text: text.slice(0, 500),
      createdAt: serverTimestamp()
    });
  } catch (error) {
    input.value = text;
    friendlyError(error);
  }
}

async function copyCode() {
  try {
    await navigator.clipboard.writeText(roomCode);
    notify("Code copié.");
  } catch {
    const field = document.createElement("textarea");
    field.value = roomCode;
    document.body.appendChild(field);
    field.select();
    document.execCommand("copy");
    field.remove();
  }
}

async function leave(emitEvent = true) {
  roomUnsubscribe?.();
  messagesUnsubscribe?.();
  roomUnsubscribe = null;
  messagesUnsubscribe = null;

  if (role === "host" && roomCode) {
    try { await deleteDoc(roomRef()); } catch {}
  }

  roomCode = null;
  playerName = null;
  role = null;
  roomReadySent = false;
  $("#roomWaiting").classList.add("hidden");
  $("#chatMessages").innerHTML = '<p class="chat-empty">Écrivez votre premier message.</p>';
  if (emitEvent) emit("online-left");
}

window.OnlineGame = { drawNext, leave };

$("#createRoomBtn").addEventListener("click", createRoom);
$("#joinRoomBtn").addEventListener("click", joinRoom);
$("#copyRoomCode").addEventListener("click", copyCode);
$("#leaveRoomBtn").addEventListener("click", () => leave());
$("#chatForm").addEventListener("submit", sendMessage);
$("#roomCodeInput").addEventListener("input", (event) => {
  event.target.value = cleanCode(event.target.value);
});
