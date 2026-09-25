# Ma cuisine — frontend PWA

Interface client, administration et livraison pour le service de commande. Le projet utilise React, TypeScript, Vite, MapLibre GL et Socket.IO.

## Fonctions livrées

- catalogue public, panier persistant et état ouvert/fermé de la prise de commandes ;
- inscription et connexion par e-mail ou Google ;
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
VITE_GOOGLE_CLIENT_ID=votre-client-id.apps.googleusercontent.com
VITE_MAP_STYLE_URL=https://votre-fournisseur/style.json
```

`VITE_API_URL` doit être l’URL publique HTTPS du backend. Dans Google Cloud, ajouter le domaine du frontend aux origines JavaScript autorisées. Le style MapLibre de démonstration convient au développement ; configurez un fournisseur de tuiles pour la production.

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
  --build-arg VITE_GOOGLE_CLIENT_ID=votre-client-id.apps.googleusercontent.com \
  --build-arg VITE_MAP_STYLE_URL=https://votre-fournisseur/style.json \
  -t ma-cuisine-frontend .

docker run -d --name ma-cuisine-frontend -p 8080:80 ma-cuisine-frontend
```

Le conteneur Nginx gère les routes React et met en cache les ressources versionnées. Placez votre reverse proxy HTTPS devant le port 8080. Les variables `VITE_*` sont intégrées au moment du build : reconstruisez l’image après leur modification.

Pour que la PWA, la géolocalisation et les notifications push fonctionnent sur téléphone, le frontend doit être servi en HTTPS. Configurez aussi les clés VAPID côté backend.
