# Firebase sur PC, Mac et mobile

1. Firebase Console > Authentication > Sign-in method : activer **Anonymous**.
2. Authentication > Settings > Authorized domains : ajouter `localhost`, le domaine public du jeu, et les domaines Hosting (`*.web.app`, `*.firebaseapp.com`) utilisés.
3. Ne pas ouvrir `index.html` avec `file://`. Utiliser les lanceurs fournis ou un serveur HTTP local.
4. Vérifier que `firebase-config.js` contient la configuration de l'application **Web** du projet Firebase.
5. Déployer les règles :

```bash
firebase deploy --only firestore:rules,firestore:indexes,hosting
```

La même application Web Firebase fonctionne sur navigateur ordinateur et mobile. Il n'existe pas de configuration Firebase séparée pour chaque type d'appareil.
