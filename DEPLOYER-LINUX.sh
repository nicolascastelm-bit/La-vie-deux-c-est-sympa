#!/bin/bash
set -e
cd "$(dirname "$0")"
if ! command -v firebase >/dev/null 2>&1; then
  if ! command -v npm >/dev/null 2>&1; then
    echo "Installez Node.js depuis https://nodejs.org/"
    exit 1
  fi
  npm install -g firebase-tools
fi
firebase login
firebase use plaisir-malin-et-coquin
firebase deploy --only firestore:rules,hosting
