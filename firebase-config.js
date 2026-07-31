const fallbackConfig = {
  apiKey: "REMPLACEZ_MOI",
  authDomain: "REMPLACEZ_MOI.firebaseapp.com",
  projectId: "REMPLACEZ_MOI",
  storageBucket: "REMPLACEZ_MOI.firebasestorage.app",
  messagingSenderId: "REMPLACEZ_MOI",
  appId: "REMPLACEZ_MOI"
};

function readSavedConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem("gwenNicolasFirebaseConfig") || "null");
    return saved && typeof saved === "object" ? saved : null;
  } catch {
    return null;
  }
}

export const firebaseConfig = readSavedConfig() || fallbackConfig;
