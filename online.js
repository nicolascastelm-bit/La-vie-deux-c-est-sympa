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
      version: 6,
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

function invitationUrl(code = roomCode) {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("room", code);
  url.searchParams.set("player", otherName(playerName));
  return url.toString();
}

function updateInvitationTools() {
  const tools = $("#inviteTools");
  const detected = $("#inviteDetected");
  if (role !== "host" || !roomCode) {
    tools.classList.add("hidden");
    return;
  }

  const link = invitationUrl();
  $("#inviteLink").value = link;
  $("#inviteQr").src = `https://quickchart.io/qr?size=240&margin=1&text=${encodeURIComponent(link)}`;
  tools.classList.remove("hidden");
  detected.classList.add("hidden");
}

function showWaiting() {
  $("#roomWaiting").classList.remove("hidden");
  $("#roomCodeDisplay").textContent = roomCode;
  $("#roomStatusText").textContent = role === "host"
    ? "La salle est créée. Envoyez le lien ou le code à l’autre joueur."
    : "Connexion à la salle…";
  updateInvitationTools();
  $("#roomWaiting").scrollIntoView({ behavior: "smooth", block: "center" });
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

async function copyText(value, successMessage) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const field = document.createElement("textarea");
    field.value = value;
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    document.execCommand("copy");
    field.remove();
  }
  notify(successMessage);
}

async function copyInvite() {
  const link = $("#inviteLink").value || invitationUrl();
  await copyText(link, "Lien d’invitation copié.");
}

async function shareInvite() {
  const link = $("#inviteLink").value || invitationUrl();
  const message = `Rejoins-moi sur Gwen & Nicolas — Le Jeu des Deux. Code : ${roomCode}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: "Gwen & Nicolas — Le Jeu des Deux", text: message, url: link });
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }
  await copyText(`${message}\n${link}`, "Invitation copiée. Collez-la dans votre messagerie.");
}

function applyInvitationFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const invitedRoom = cleanCode(params.get("room"));
  if (invitedRoom.length !== 6) return;

  const invitedPlayer = params.get("player");
  $("#roomCodeInput").value = invitedRoom;
  if (invitedPlayer === "Gwen" || invitedPlayer === "Nicolas") {
    $("#joinPlayerName").value = invitedPlayer;
  }

  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === "onlineView"));
  $("#inviteDetected").classList.remove("hidden");
  $("#roomWaiting").classList.remove("hidden");
  $("#inviteTools").classList.add("hidden");
  $("#roomCodeDisplay").textContent = invitedRoom;
  $("#roomStatusText").textContent = "Cliquez sur Rejoindre pour entrer dans la salle.";
  setTimeout(() => $("#joinRoomBtn").focus(), 150);
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
  $("#inviteTools").classList.add("hidden");
  $("#inviteDetected").classList.add("hidden");
  const cleanUrl = new URL(window.location.href);
  cleanUrl.searchParams.delete("room");
  cleanUrl.searchParams.delete("player");
  window.history.replaceState({}, "", cleanUrl);
  $("#chatMessages").innerHTML = '<p class="chat-empty">Écrivez votre premier message.</p>';
  if (emitEvent) emit("online-left");
}

window.OnlineGame = { drawNext, leave };

$("#createRoomBtn").addEventListener("click", createRoom);
$("#joinRoomBtn").addEventListener("click", joinRoom);
$("#copyRoomCode").addEventListener("click", copyCode);
$("#copyInviteLink").addEventListener("click", copyInvite);
$("#shareInviteLink").addEventListener("click", shareInvite);
$("#leaveRoomBtn").addEventListener("click", () => leave());
$("#chatForm").addEventListener("submit", sendMessage);
$("#roomCodeInput").addEventListener("input", (event) => {
  event.target.value = cleanCode(event.target.value);
});

applyInvitationFromUrl();
