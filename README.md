# ReminderBot

Bot Discord personnel en français, Components V2 sans accent latéral.

## Installation

Node.js 22.13+ (ou 24), SQLite intégré à Node.js.

```sh
npm install --omit=dev
cp .env.example .env
npm run check
npm start
```

Renseigner DISCORD_TOKEN (token du bot), CLIENT_ID (ID application) et OWNER_ID (ID utilisateur Discord) dans .env. Ne jamais les publier. Inviter le bot avec les scopes bot et applications.commands, sans administrateur. Autoriser les MP du bot. Les commandes globales sont enregistrées au démarrage.

## Pterodactyl

Créer un serveur avec un egg Node.js compatible, RAM 512 MiB, swap 0, CPU 50 %, disque 1024 MiB. Choisir Node 22.13+ ou 24. Installer le dépôt https://github.com/BestGameClips/Bot-Discord-de-rappels-en-Node.js.git sur main via les options Git de l'egg ou importer les fichiers. Installer les dépendances avec npm install --omit=dev. Fichier de démarrage index.js, commande personnalisée si possible : node --max-old-space-size=256 index.js. La commande exacte dépend de l'egg. Créer .env dans le gestionnaire de fichiers. Préserver data/ et .env lors des mises à jour. Ne pas utiliser git clean -fdx. Sauvegarder le dossier data/ serveur arrêté. La limite V8 ne limite pas toute la mémoire du processus.

## Commandes

/panel, /rappel ajouter, /rappel liste, /rappel historique, /agenda, /note texte, /tache texte, /statistiques, /testmp.

Dates : JJ/MM/AAAA HH:mm, fuseau Europe/Paris par défaut. Récurrences : none, daily, weekly, monthly, yearly. Les rappels échus sont vérifiés toutes les 15 secondes, avec nouvelle tentative si les MP échouent. Les envois ne sont pas garantis exactement une fois si le processus s'arrête pendant un envoi. Pour les récurrences, l'échéance suivante est planifiée après l'envoi; les boutons agissent sur le rappel courant en base.

## État

Première version, non testée en connexion réelle à Discord. Les modules avancés (import/export, routines, pomodoro, sauvegardes automatisées, résumés, dates naturelles) restent à développer. Ne pas utiliser plusieurs instances avec la même base.
