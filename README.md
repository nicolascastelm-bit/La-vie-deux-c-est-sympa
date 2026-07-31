# Gwen & Nicolas — Le Jeu des Deux

Application web statique prête pour GitHub Pages, Firebase Hosting, Netlify ou un hébergement classique.

## Contenu
- 290 cartes originales
- catégories personnalisées : amour, humour, Harry Potter, PLK/PNL et musique, Japon/sushis, bachata, vie à deux, voyages, souvenirs, complicité, bonus
- favoris, historique et sélection des catégories
- alternance Gwen / Nicolas
- album local de photos et messages vocaux
- playlist commune
- installation PWA et mode hors ligne
- aucun plateau, aucun score

## Mise en ligne sur GitHub Pages
1. Décompressez le ZIP.
2. Envoyez tous les fichiers à la racine du dépôt GitHub.
3. Dans Settings > Pages : choisissez `Deploy from a branch`, `main`, puis `/(root)`.
4. Laissez le champ Custom domain vide tant que vous n’avez pas acheté de domaine.

L’adresse sera de la forme : `https://votre-compte.github.io/nom-du-depot/`.

## Important sur les données
Les favoris, photos, vocaux et chansons sont stockés localement dans le navigateur. Ils ne sont pas synchronisés entre deux téléphones. Pour une synchronisation multi-appareils, il faudra connecter Firebase Firestore et Storage.

## Test local
Ne double-cliquez pas simplement sur `index.html` pour tester le micro ou la PWA. Lancez un petit serveur :

```bash
python3 -m http.server 8000
```

Puis ouvrez `http://localhost:8000`.


## Version 2 — jeu en ligne et tchat

Cette version conserve le jeu local et ajoute :

- création d’une salle privée à six caractères ;
- connexion de Gwen et Nicolas depuis deux appareils ou navigateurs ;
- synchronisation instantanée de la carte et du tour ;
- tchat texte Firebase en temps réel ;
- anti-répétition partagé sur les 30 dernières cartes ;
- reconnexion visuelle tant que la page reste ouverte.

### Configuration Firebase obligatoire

1. Dans **Paramètres du projet > Général**, créez une application Web.
2. Copiez sa configuration dans `firebase-config.js`.
3. Dans **Authentication > Sign-in method**, activez **Anonyme**.
4. Créez une base **Cloud Firestore**.
5. Ajoutez votre domaine Firebase/GitHub dans **Authentication > Settings > Authorized domains**.
6. Dans le terminal, à la racine du projet :

```bash
firebase login
firebase use --add
firebase deploy --only firestore:rules,hosting
```

Firebase affichera ensuite l’adresse du jeu sous la forme :

```text
https://votre-projet.web.app
```

Le jeu local, l’album local, les vocaux et la playlist continuent de fonctionner sans salle en ligne. Le tchat en ligne est volontairement limité au texte pour rester simple et fiable.


## V3 — Firebase réellement inclus

Cette archive inclut Firebase Authentication, Cloud Firestore, les règles de sécurité, Firebase Hosting et un assistant intégré de configuration.

### Configuration sans modifier le code

1. Publiez une première fois le projet.
2. Ouvrez le jeu et cliquez sur **Firebase — Configurer le mode en ligne**.
3. Dans Firebase Console, ouvrez **Paramètres du projet > Général > Vos applications > Application Web**.
4. Collez l’objet `firebaseConfig` dans la fenêtre du jeu.
5. Activez **Authentication > Anonyme**, puis créez **Cloud Firestore**.
6. Déployez les règles :

```bash
firebase use --add
firebase deploy --only firestore:rules,hosting
```

La configuration est stockée dans le navigateur. Pour un déploiement permanent partagé sur tous les appareils, vous pouvez aussi recopier les valeurs directement dans `firebase-config.js`.

### GitHub Pages

Le fichier `.nojekyll` est inclus. `index.html` doit rester à la racine du dépôt et le domaine personnalisé doit rester vide tant qu’aucun domaine n’a été acheté.
