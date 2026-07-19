# Guide : Tableau de bord Google Sheets + email quotidien automatique

Durée : ~10 minutes. Vous aurez besoin de votre compte Google.

## Ce que vous obtenez

- **Toutes les transactions de tous les appareils** rassemblées dans un seul
  Google Sheet, consultable depuis n'importe où (téléphone, tablette, PC).
- Une colonne **"Statut commande"** (En cours / Prêt / Récupéré) à mettre à
  jour directement dans le Sheet : c'est votre tableau de bord de commandes.
- Un **email récapitulatif envoyé automatiquement chaque jour à 20h** au
  personnel, même si l'application est fermée (le détail par mode de
  règlement inclus). Aucun clic nécessaire.

## Installation

### Étape 1 — Créer le Google Sheet
1. Allez sur [sheets.google.com](https://sheets.google.com) et créez une
   feuille vierge. Nommez-la par ex. **« Laverie des Anges — Caisse »**.

### Étape 2 — Coller le script
2. Dans le Sheet : menu **Extensions → Apps Script**.
3. Effacez le contenu de l'éditeur et collez tout le contenu du fichier
   **`sync-google-apps-script.js`**.
4. En haut du script, modifiez la ligne :
   - `var TOKEN = 'CHANGEZ_MOI';` → remplacez par un mot de passe de votre
     choix (ex. `LdA-2026-secret`). Notez-le.
   - `var STAFF_EMAIL = '';` → mettez l'adresse du personnel entre les
     guillemets (ou laissez vide pour recevoir sur votre propre adresse).
   - `var EMAIL_HOUR = 20;` → changez l'heure d'envoi si besoin.
5. Cliquez sur l'icône **Enregistrer** (disquette).

### Étape 3 — Activer l'email quotidien
6. Dans la barre du haut, choisissez la fonction **`setup`** dans le menu
   déroulant, puis cliquez **Exécuter**.
7. Google demande une autorisation : **Autoriser** → choisissez votre compte →
   « Paramètres avancés » → « Accéder à … (non sécurisé) » → **Autoriser**.
   (C'est votre propre script ; cet avertissement est normal.)
8. Vous recevez un email de test « synchronisation activée ». ✅

### Étape 4 — Publier le script pour l'application
9. Bouton bleu **Déployer → Nouveau déploiement**.
10. Icône engrenage ⚙️ → type **Application Web**.
11. Réglez :
    - *Exécuter en tant que* : **Moi**
    - *Qui a accès* : **Tout le monde**  ← important, sinon la caisse ne peut
      pas envoyer les reçus (le jeton secret protège l'accès).
12. **Déployer** → copiez l'**URL de l'application Web**
    (`https://script.google.com/macros/s/…/exec`).

### Étape 5 — Brancher l'application caisse
13. Ouvrez l'application caisse → **Réglages** :
    - **URL de synchronisation Google** : collez l'URL copiée.
    - **Jeton de synchronisation** : le même mot de passe qu'à l'étape 4.
    - **Enregistrer**.
14. Répétez l'étape 13 sur chaque appareil (téléphone, tablette…).

### Étape 6 — Tester
15. Faites un reçu de test dans la caisse → ouvrez le Google Sheet : la ligne
    apparaît dans la feuille « Reçus » en quelques secondes. Supprimez la
    ligne de test si besoin.

## Au quotidien

- Chaque reçu (nouveau, marqué payé, réédité) part automatiquement vers le
  Sheet. Sans connexion, il est mis en file d'attente et envoyé dès le retour
  d'internet.
- Changez la colonne **Statut commande** dans le Sheet quand une commande est
  prête ou récupérée.
- L'email quotidien part tout seul à l'heure choisie ; s'il n'y a eu aucun
  reçu dans la journée, aucun email n'est envoyé.
- Le bouton « Envoyer les reçus du jour » dans l'application reste disponible
  pour un envoi manuel à tout moment.

## En cas de problème

- **Rien n'apparaît dans le Sheet** : vérifiez que l'URL se termine par
  `/exec`, que le jeton est identique des deux côtés, et que le déploiement
  est réglé sur « Tout le monde ».
- **Vous modifiez le script** : après toute modification, refaites
  **Déployer → Gérer les déploiements → ✏️ → Nouvelle version → Déployer**
  (l'URL ne change pas).
- **Changer l'heure d'email** : modifiez `EMAIL_HOUR`, enregistrez, puis
  ré-exécutez `setup` une fois.
