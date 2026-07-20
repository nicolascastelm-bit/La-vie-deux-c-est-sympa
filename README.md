# Le Jeu du Plaisir — V10 Édition Finale

Version finale construite à partir de la V9.3.

## Contenu
- 8 modes : Amical, Cinéma, Musique, Romantique, Sensuel, Spicy, BDSM et Mix.
- Une interface visuelle différente pour chaque mode.
- Plateau, dé, cartes, scénarios et jeu local.
- Salles Firebase jouables entre ordinateur et téléphone.
- Tchat en direct, réactions, photos et messages vocaux.
- Appel audio/vidéo WebRTC avec signalisation Firestore.
- Journal, souvenirs, succès et statistiques.

## Configuration Firebase obligatoire
1. Remplir `firebase-config.js` avec la configuration Web de votre projet.
2. Activer Authentication > Anonymous.
3. Créer Firestore et Storage.
4. Déployer les règles : `firebase deploy --only firestore:rules,storage`.
5. Ajouter `localhost`, votre domaine `web.app`, `firebaseapp.com` et votre domaine personnalisé aux domaines autorisés d’Authentication.
6. Déployer : `firebase deploy --only hosting`.

## Démarrage local
- Windows : `START-PC.bat`
- macOS : `START-MAC.command`
- Linux : `START-LINUX.sh`

Le microphone, la caméra et l'enregistrement vocal exigent HTTPS ou localhost. L'appel WebRTC utilise des serveurs STUN publics. Un serveur TURN est recommandé pour garantir les appels sur tous les réseaux mobiles ou d'entreprise.
