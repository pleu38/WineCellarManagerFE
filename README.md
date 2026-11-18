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

## Compilation automatique et déploiement Docker via GHCR

Le workflow [Compiler et publier Vinothèque (GHCR)](.github/workflows/container.yml) fonctionne **sans npm sur le serveur** :
- **Pull Request** : `npm ci`, tests, build Vite et compilation Docker de validation (sans publication).
- **Branche de prévisualisation** `ci/build-ghcr-container` : publication de `ghcr.io/pleu38/winecellarmanagerfe:preview`.
- **Branche `main`** : publication de `ghcr.io/pleu38/winecellarmanagerfe:latest`.
- **Tag Git `v*`** : publication du tag correspondant, par exemple `:v1.0.0`.
- **Actions → Compiler et publier Vinothèque (GHCR) → Run workflow** : lancement manuel sur la branche choisie.
- Chaque publication dispose également d'une étiquette `sha-...` pour déployer une image immuable identifiée par un commit.

Les images sont construites pour `linux/amd64` et `linux/arm64` ; elles sont publiées dans **GitHub Container Registry**, pas déployées automatiquement sur un serveur.

### Déployer une préversion sans toucher à la production

Avec Docker installé, récupérer l'image prévisualisée :

```bash
docker pull ghcr.io/pleu38/winecellarmanagerfe:preview
```

Si le paquet GHCR n'est pas public, se connecter avec un token GitHub ayant `read:packages` :

```bash
echo "$GHCR_TOKEN" | docker login ghcr.io -u pleu38 --password-stdin
```

Démarrer un conteneur distinct sur le port 8080 :

```bash
docker run -d --name vinotheque-preview --restart unless-stopped \
  -p 8080:80 \
  -e API_UPSTREAM=http://api:8000 \
  --env-file ./winecellar-container.env \
  --network mon-reseau-docker \
  ghcr.io/pleu38/winecellarmanagerfe:preview
```

Le fichier `winecellar-container.env` (non versionné, permissions restrictives) peut contenir :

```dotenv
API_KEY=cle-api-de-developpement
```

Remplacer `api:8000` par le nom et le port réels du backend sur le réseau Docker `mon-reseau-docker`. Ce nom doit être résolvable *depuis le conteneur Nginx*. Si l'API tourne sur l'hôte Linux et non dans Docker, utiliser `host.docker.internal` et ajouter `--add-host=host.docker.internal:host-gateway` à la commande.

L'URL de l'application est alors `http://ADRESSE_DU_SERVEUR:8080`. Pour arrêter le test : `docker rm -f vinotheque-preview`.

### Mise en production

Après fusion dans `main`, remplacer `:preview` par `:latest` (ou de préférence un tag `:sha-...` précis). Déployer ensuite ce conteneur derrière un reverse proxy HTTPS si l'application est accessible sur Internet.

**Configuration réseau et sécurité :** Le navigateur appelle **`/api` sur le même domaine que le frontend**. Nginx relaie ces appels vers `API_UPSTREAM` et ajoute l'en-tête `API-Key` côté serveur. La clé n'est donc plus intégrée dans la compilation JavaScript de l'image. Utiliser des clés limitées à l'environnement concerné, ne pas publier le fichier `.env` et restreindre l'accès réseau au backend. Les variables `VITE_API_*` restent possibles uniquement pour le développement local, et une clé Vite est toujours publique.

Si `API_UPSTREAM` ou `API_KEY` changent, recréer le conteneur avec les nouvelles variables ; inutile de recompiler l'image.
