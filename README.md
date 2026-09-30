# Ma cuisine — frontend PWA

Interface client, administration et livraison pour le service de commande. Le projet utilise React, TypeScript, Vite, MapLibre GL et Socket.IO.

## Fonctions livrées

- catalogue public, panier persistant et état ouvert/fermé de la prise de commandes ;
- inscription et connexion par code SMS (Firebase) ou par e-mail ;
- commande avec compte obligatoire, livraison ou retrait, espèces ou PawaPay ;
- destination choisie sur la carte, depuis le GPS du téléphone ou à un autre emplacement ;
- calcul du tarif de livraison par l’API, avec un minimum de 500 FCFA ;
- historique et détail des commandes, abonnement aux notifications push et suivi GPS en direct ;
- tableau de bord admin : statistiques, commandes, catalogue, utilisateurs, réglages, notifications et création des tournées ;
- espace livreur : démarrage de tournée, partage GPS, itinéraire et validation de chaque arrêt ;
- installation PWA et cache applicatif.

## Configuration

Copier `.env.example` vers `.env` :

```env
VITE_API_URL=https://api.votre-domaine.cm/api/v1
VITE_FIREBASE_API_KEY=…
VITE_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre-projet
VITE_FIREBASE_APP_ID=…
VITE_MAP_STYLE_URL=https://votre-fournisseur/style.json
```

`VITE_API_URL` doit être l’URL publique HTTPS du backend. Dans la console Firebase, activer le fournisseur « Téléphone » et ajouter le domaine du frontend aux domaines autorisés. Le style MapLibre de démonstration convient au développement ; configurez un fournisseur de tuiles pour la production.

## Développement

```bash
npm install
npm run dev
```

L’application démarre sur `http://localhost:3001`. Le backend doit accepter cette origine dans `CORS_ORIGINS`.

## Vérification et build

```bash
npm run lint
npm run build
npm run preview -- --port 3001
```

Les fichiers de production sont générés dans `dist/`.

## Déploiement Docker

```bash
docker build \
  --build-arg VITE_API_URL=https://api.votre-domaine.cm/api/v1 \
  --build-arg VITE_FIREBASE_API_KEY=… \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com \
  --build-arg VITE_FIREBASE_PROJECT_ID=votre-projet \
  --build-arg VITE_FIREBASE_APP_ID=… \
  --build-arg VITE_MAP_STYLE_URL=https://votre-fournisseur/style.json \
  -t ma-cuisine-frontend .

docker run -d --name ma-cuisine-frontend -p 8080:80 ma-cuisine-frontend
```

Le conteneur Nginx gère les routes React et met en cache les ressources versionnées. Placez votre reverse proxy HTTPS devant le port 8080. Les variables `VITE_*` sont intégrées au moment du build : reconstruisez l’image après leur modification.

Pour que la PWA, la géolocalisation et les notifications push fonctionnent sur téléphone, le frontend doit être servi en HTTPS. Configurez aussi les clés VAPID côté backend.

## CI/CD

Le workflow `.github/workflows/ci-cd.yml` vérifie le lint et le build sur chaque pull request et push vers `main`. Après un push valide sur `main`, il synchronise le frontend sur le VPS, reconstruit le conteneur `web` et contrôle `https://justin.tadjo.dev`. En cas d’échec du contrôle HTTP, l’image précédente est restaurée.

Créer dans GitHub, sous **Settings → Secrets and variables → Actions**, le secret `VPS_SSH_PRIVATE_KEY` contenant la clé privée de déploiement. Sans ce secret, la CI s’exécute et le déploiement est ignoré. Le workflow peut aussi être relancé manuellement depuis l’onglet **Actions**.
