# Vinothèque — interface React

Interface de gestion de cave (React 19 + Vite 5). Le backend est une API séparée : **[ApiWine](https://github.com/pleu38/ApiWine)**. Le frontend seul n'enregistre pas les vins.

## Démarrage local (avant production)

Prérequis : **Node.js 22 LTS ou supérieur** et un backend ApiWine démarré, avec une base de données disponible.

```bash
git clone https://github.com/pleu38/WineCellarManagerFE.git
cd WineCellarManagerFE
npm ci
cp .env.example .env.local
```

Renseigner `.env.local` avec l'adresse **accessible depuis le navigateur** et la clé de développement de votre API :

```dotenv
VITE_API_BASE_URL=http://localhost:8000
VITE_API_KEY=votre-cle-de-developpement
```

Démarrer manuellement le frontend :

```bash
npm start
```

Ouvrir l'URL affichée par Vite (par défaut **http://localhost:5173**). Arrêter le serveur avec **Ctrl+C**. On peut aussi utiliser `npm run dev` (identique, mais Vite choisit son hôte par défaut).

## Vérifications avant mise en production

```bash
npm test
npm run build
npm run preview
```

`npm run preview` lance la version compilée sur une adresse locale (par défaut **http://localhost:4173**). Cela ne met rien en production. La commande `npm run build` crée le dossier `dist/`.

> **Attention** : les variables préfixées `VITE_` sont intégrées au JavaScript public lors du build. La `VITE_API_KEY` ne doit donc **jamais** être un secret privilégié ni une clé de production sensible. Pour un déploiement public, utiliser une authentification côté serveur et limiter les permissions de l'API. La clé de développement permet uniquement des essais dans un environnement contrôlé.

Si les appels API échouent, vérifier que le backend écoute à l'URL indiquée, qu'il accepte l'origine du frontend via CORS et que la clé est valide. Le frontend ne fournit pas de serveur simulé.

## Fonctionnement

- La page d'introduction est sombre même lorsque l'interface est en thème clair. Elle s'efface automatiquement et peut être passée.
- Le bouton Apparence de la barre latérale permet de basculer entre clair et sombre. Le choix est conservé dans le navigateur.
- Une cuvée est identifiée par **cru + producteur + appellation + millésime + catégorie** ; les stocks d'une année ne doivent pas être modifiés en ouvrant une autre année. L'API de mise à jour utilise l'identifiant `BID` d'une bouteille.
- **Limite de l'API actuelle** : `GET /wine/cru/{cru}` ne renvoie pas `BID` ni `millesime`. Lorsque plusieurs vins portent le même nom de cru, l'interface masque donc leurs localisations existantes afin de ne pas attribuer une clayette au mauvais millésime. Pour les afficher précisément, faire évoluer l'API backend afin de les consulter par `BID`.
- La saisie d'une localisation nécessite un `bouteille_id` et un `localisation_cave` (ID de la zone), conformément au modèle `ClavetteInsertRequest` du backend.

## Commandes

| Commande | Utilisation |
| --- | --- |
| `npm start` | Démarrage manuel local |
| `npm run dev` | Développement Vite |
| `npm test` | Tests unitaires sur l'identité des vins |
| `npm run build` | Compilation de production |
| `npm run preview` | Vérifier la compilation localement |
