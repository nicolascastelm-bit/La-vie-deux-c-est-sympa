# Gwen & Nicolas — V4 Firebase + tchat

Cette archive est prête pour le projet Firebase `plaisir-malin-et-coquin`.
La configuration Firebase est déjà intégrée dans `firebase-config.js`.

## Fonctionnalités

- jeu local sur un seul appareil ;
- jeu en ligne à deux ;
- création et connexion à une salle privée avec un code ;
- cartes et tours synchronisés en temps réel ;
- tchat texte en temps réel ;
- favoris, historique, album local et playlist ;
- PWA utilisable sur ordinateur et téléphone.

## Avant le premier déploiement

Dans Firebase Console :

1. `Authentication > Méthode de connexion` : **Anonyme activé** ;
2. `Authentication > Paramètres > Domaines autorisés` : ajoutez votre domaine GitHub Pages ou Firebase Hosting ;
3. Cloud Firestore doit être créé.

## Déploiement recommandé : Firebase Hosting

Ouvrez un terminal dans ce dossier puis lancez :

```bash
firebase login
firebase use plaisir-malin-et-coquin
firebase deploy --only firestore:rules,hosting
```

À la fin, Firebase affiche l’adresse du jeu en `https://...web.app`.

## Si vous gardez GitHub Pages

Le site fonctionne également sur GitHub Pages, mais les règles Firestore doivent tout de même être déployées séparément :

```bash
firebase deploy --only firestore:rules
```

Dans GitHub `Settings > Pages`, utilisez `main` et `/(root)`, sans domaine personnalisé.

## Test

1. Ouvrez le jeu sur deux navigateurs ou appareils différents.
2. Sur le premier, cliquez sur **Jouer en ligne à deux**, choisissez Gwen ou Nicolas, puis créez une salle.
3. Sur le second, saisissez le code.
4. Le tchat apparaît dès que les deux joueurs sont connectés.

## Version 5 — configuration automatique

Aucune modification de `firebase-config.js`, `.firebaserc` ou `firebase.json` n’est nécessaire.
Le projet `plaisir-malin-et-coquin` est déjà sélectionné.

### Publication recommandée

- Windows : double-cliquez sur `DEPLOYER-WINDOWS.bat`
- macOS : double-cliquez sur `DEPLOYER-MAC.command`
- Linux : exécutez `./DEPLOYER-LINUX.sh`

Le script publie automatiquement les règles Firestore et Firebase Hosting. À la fin, copiez la ligne `Hosting URL`.


## V6 — invitation simplifiée

Après avoir cliqué sur **Créer la salle**, le jeu affiche automatiquement :

- le code à six caractères ;
- un bouton pour copier le code ;
- un lien d’invitation complet ;
- un bouton de partage natif sur téléphone ;
- un QR code à scanner.

Le lien contient automatiquement le code de la salle. Quand l’autre joueur l’ouvre, l’écran en ligne s’affiche et le code est déjà rempli.

Exemple :

```text
https://votre-site.web.app/?room=ABC123&player=Gwen
```

Le QR code est produit par le service externe QuickChart. Le code et le lien restent copiables même si l’image du QR code ne se charge pas.
