
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, signInAnonymously, onAuthStateChanged,
  setPersistence, browserLocalPersistence, browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot,
  runTransaction, serverTimestamp, collection, query, orderBy,
  limit, addDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const $ = (selector) => document.querySelector(selector);
const configured = firebaseConfig?.apiKey && !firebaseConfig.apiKey.includes("REMPLACEZ");

let app, auth, db, uid = null;
let roomCode = null;
let playerName = null;
let role = null;
let roomUnsubscribe = null;
let messagesUnsubscribe = null;
let roomData = null;
let roomReadySent = false;

function emit(name, detail = {}) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
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
function setBusy(button, busy, label) {
  button.disabled = busy;
  if (label) button.textContent = busy ? "Connexion…" : label;
}
function firebaseError(error) {
  console.error(error);
  const code = error?.code || "";
  const messages = {
    "auth/operation-not-allowed": "Activez l’authentification anonyme dans Firebase.",
    "auth/unauthorized-domain": "Ajoutez ce domaine dans Authentication > Authorized domains.",
    "permission-denied": "Les règles Firestore refusent cette action. Déployez firestore.rules.",
    "unavailable": "Firebase est temporairement indisponible."
  };
  emit("online-error", { message: messages[code] || error?.message || "Erreur Firebase." });
}

async function ensureAuth() {
  if (!configured) throw new Error("Firebase n’est pas configuré dans firebase-config.js.");
  if (uid) return uid;
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch {
    try { await setPersistence(auth, browserSessionPersistence); } catch {}
  }
  const credential = await signInAnonymously(auth);
  uid = credential.user.uid;
  return uid;
}

function roomRef(code = roomCode) {
  return doc(db, "gwenNicolasRooms", code);
}
function messagesRef(code = roomCode) {
  return collection(db, "gwenNicolasRooms", code, "messages");
}

async function createRoom() {
  const button = $("#createRoomBtn");
  setBusy(button, true, "Créer la salle");
  try {
    await ensureAuth();
    playerName = $("#createPlayerName").value;
    role = "host";
    roomCode = makeCode();
    roomReadySent = false;
    await setDoc(roomRef(), {
      version: 2,
      hostUid: uid,
      guestUid: null,
      hostName: playerName,
      guestName: null,
      players: [playerName],
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
    firebaseError(error);
  } finally {
    setBusy(button, false, "Créer la salle");
  }
}

async function joinRoom() {
  const button = $("#joinRoomBtn");
  setBusy(button, true, "Rejoindre");
  try {
    await ensureAuth();
    const code = cleanCode($("#roomCodeInput").value);
    if (code.length !== 6) throw new Error("Saisissez un code de salle à 6 caractères.");
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
      if (data.hostName === playerName) throw new Error(`Choisissez ${otherName(data.hostName)} pour rejoindre cette salle.`);
      transaction.update(reference, {
        guestUid: uid,
        guestName: playerName,
        players: [data.hostName, playerName],
        status: "playing",
        updatedAt: serverTimestamp()
      });
    });
    showWaiting();
    watchRoom();
  } catch (error) {
    firebaseError(error);
  } finally {
    setBusy(button, false, "Rejoindre");
  }
}

function showWaiting() {
  $("#roomWaiting").classList.remove("hidden");
  $("#roomCodeDisplay").textContent = roomCode;
  $("#roomStatusText").textContent = role === "host"
    ? "Partagez ce code. La partie commencera dès que l’autre joueur arrivera."
    : "Connexion à la salle…";
}

function watchRoom() {
  roomUnsubscribe?.();
  roomUnsubscribe = onSnapshot(roomRef(), (snapshot) => {
    if (!snapshot.exists()) {
      emit("online-error", { message: "La salle a été supprimée." });
      leave(false);
      return;
    }
    roomData = snapshot.data();
    const bothConnected = Boolean(roomData.hostUid && roomData.guestUid);
    $("#roomStatusText").textContent = bothConnected
      ? `${roomData.hostName} et ${roomData.guestName} sont connectés.`
      : "En attente de l’autre joueur…";

    if (bothConnected) {
      watchMessages();
      const detail = {
        code: roomCode,
        playerName,
        cardId: roomData.currentCardId,
        turn: roomData.turn,
        canDraw: roomData.turn === playerName
      };
      if (!roomReadySent) {
        roomReadySent = true;
        emit("online-room-ready", detail);
      } else {
        emit("online-room-update", detail);
      }
    }
  }, firebaseError);
}

async function drawNext(selectedCategories = []) {
  try {
    await ensureAuth();
    await runTransaction(db, async (transaction) => {
      const reference = roomRef();
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists()) throw new Error("Salle introuvable.");
      const data = snapshot.data();
      if (data.turn !== playerName) throw new Error("Ce n’est pas encore votre tour.");

      const categories = selectedCategories?.length
        ? selectedCategories
        : [...new Set(window.CARDS.map((card) => card.category))];
      const recent = data.recentCardIds || [];
      let pool = window.CARDS.filter((card) =>
        categories.includes(card.category) && !recent.includes(card.id)
      );
      if (!pool.length) pool = window.CARDS.filter((card) => categories.includes(card.category));
      if (!pool.length) pool = window.CARDS;
      const card = pool[Math.floor(Math.random() * pool.length)];
      const nextTurn = otherName(playerName);

      transaction.update(reference, {
        currentCardId: card.id,
        turn: nextTurn,
        recentCardIds: [...recent, card.id].slice(-30),
        updatedAt: serverTimestamp()
      });
    });
  } catch (error) {
    firebaseError(error);
  }
}

function watchMessages() {
  if (messagesUnsubscribe) return;
  const q = query(messagesRef(), orderBy("createdAt", "asc"), limit(150));
  messagesUnsubscribe = onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    renderMessages(messages);
  }, firebaseError);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
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
      <small>${escapeHtml(message.author || "")}</small>
      <p>${escapeHtml(message.text || "")}</p>
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
    await addDoc(messagesRef(), {
      uid,
      author: playerName,
      text: text.slice(0, 500),
      createdAt: serverTimestamp()
    });
  } catch (error) {
    input.value = text;
    firebaseError(error);
  }
}

async function copyRoomCode() {
  try {
    await navigator.clipboard.writeText(roomCode);
    emit("online-error", { message: "Code copié." });
  } catch {
    const input = document.createElement("textarea");
    input.value = roomCode;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    input.remove();
  }
}

function leave(notify = true) {
  roomUnsubscribe?.();
  messagesUnsubscribe?.();
  roomUnsubscribe = null;
  messagesUnsubscribe = null;
  roomData = null;
  roomReadySent = false;
  roomCode = null;
  playerName = null;
  role = null;
  $("#roomWaiting").classList.add("hidden");
  $("#chatMessages").innerHTML = '<p class="chat-empty">Écrivez votre premier message.</p>';
  if (notify) emit("online-left");
}

window.OnlineGame = { drawNext, leave };

if (!configured) {
  $("#firebaseWarning").classList.remove("hidden");
  $("#createRoomBtn").disabled = true;
  $("#joinRoomBtn").disabled = true;
} else {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    onAuthStateChanged(auth, (user) => { uid = user?.uid || null; });
  } catch (error) {
    firebaseError(error);
  }
}

$("#createRoomBtn").addEventListener("click", createRoom);
$("#joinRoomBtn").addEventListener("click", joinRoom);
$("#copyRoomCode").addEventListener("click", copyRoomCode);
$("#leaveRoomBtn").addEventListener("click", () => leave());
$("#chatForm").addEventListener("submit", sendMessage);
$("#roomCodeInput").addEventListener("input", (event) => {
  event.target.value = cleanCode(event.target.value);
});
