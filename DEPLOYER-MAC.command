#!/bin/bash
cd "$(dirname "$0")"
echo ""
echo "============================================="
echo " Gwen et Nicolas - Déploiement automatique"
echo "============================================="
if ! command -v firebase >/dev/null 2>&1; then
  echo "Firebase CLI absente. Installation automatique..."
  if ! command -v npm >/dev/null 2>&1; then
    echo "ERREUR : installez Node.js depuis https://nodejs.org/"
    read -r -p "Appuyez sur Entrée pour fermer."
    exit 1
  fi
  npm install -g firebase-tools || exit 1
fi
firebase login || exit 1
firebase use plaisir-malin-et-coquin || exit 1
firebase deploy --only firestore:rules,hosting || exit 1
echo ""
echo "TERMINÉ. Copiez la ligne Hosting URL affichée ci-dessus."
read -r -p "Appuyez sur Entrée pour fermer."
