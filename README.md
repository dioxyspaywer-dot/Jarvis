# JARVIS — Assistant IA vocal pour Android

Agent IA personnel qui contrôle un téléphone Android par la voix, via l'API Gemini.

## État actuel : Phase 1 fonctionnelle + squelette des phases 2/3

- ✅ **Phase 1 — Noyau vocal + Gemini** : reconnaissance vocale, synthèse vocale, appel au
  serveur proxy, exécution d'actions simples (ouvrir une app, Wi-Fi, Bluetooth, recherche YouTube,
  retour à l'accueil), confirmation avant action sensible.
- 🚧 **Phase 2 — Accessibilité** : `JarvisAccessibilityService` existe (lecture d'écran, tap,
  scroll) mais n'est pas encore relié à `ActionExecutor` ni activable depuis les Paramètres.
- 🚧 **Phase 3 — Arrière-plan + mot d'activation** : `JarvisForegroundService` existe mais
  aucun moteur de mot d'activation ("Hey JARVIS") n'est encore intégré (recommandé : Porcupine
  ou Vosk, en local — Android ne permet pas une écoute cloud continue).
- ⏳ **Phase 4 — Caméra / analyse multimodale** : pas encore commencée.

## Architecture

```
[Téléphone Android]                [Ton serveur]              [Google]
 Voix -> SpeechToTextManager
   -> GeminiClient.requestPlan()  --->  POST /plan  --->  API Gemini
   <- JarvisPlan (JSON)           <---  spokenReply +      (clé API ici,
   -> ActionExecutor exécute            actions            jamais dans l'app)
   -> TextToSpeechManager parle
```

**Pourquoi un serveur intermédiaire ?** Une clé API Gemini ne doit jamais être embarquée dans
un APK (elle serait extractible). Le dossier `/server` contient un petit proxy Express qui la
protège.

## Installation

### 1. App Android
1. Ouvrir le dossier `JarvisApp/` dans Android Studio (Koala ou plus récent).
2. Laisser Gradle synchroniser.
3. Lancer sur un appareil/émulateur Android 8.0 (API 26) ou plus.
4. Au premier lancement, accepter la permission microphone.
5. Dans **Paramètres** (dans l'app), renseigner l'URL de ton serveur proxy (ex :
   `https://ton-serveur.onrender.com`).

### 2. Serveur proxy
```bash
cd server
cp .env.example .env      # puis coller ta clé Gemini dans .env
npm install
npm start
```
Déploie-le ensuite sur un hébergeur (Render, Railway, Fly.io, VPS...) pour que le téléphone
puisse le joindre en dehors de ton réseau local.

## Prochaines étapes suggérées

1. Brancher `JarvisAccessibilityService` sur `ActionExecutor` pour `TAP_TEXT` / `SCROLL_DOWN` /
   `TYPE_TEXT`, et ajouter un bouton "Activer l'accessibilité" dans Paramètres.
2. Ajouter le contexte d'écran (`describeScreen()`) à chaque appel `GeminiClient.requestPlan()`.
3. Intégrer un mot d'activation hors-ligne dans `JarvisForegroundService`.
4. Ajouter la capture caméra + envoi d'image à Gemini (analyse multimodale).
5. Chiffrer/valider les échanges avec le serveur (auth simple par token, HTTPS obligatoire).

## Avertissement important

Le service d'accessibilité (lecture d'écran, clics automatiques dans d'autres apps comme
WhatsApp) est très encadré par les règles du Google Play Store et fragile face aux mises à jour
d'interface des apps tierces. Pour un usage strictement personnel (APK installé manuellement,
pas publié sur le Store), il n'y a pas de restriction particulière.
