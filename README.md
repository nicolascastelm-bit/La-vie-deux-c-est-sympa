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
