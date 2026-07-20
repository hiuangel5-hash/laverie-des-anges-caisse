# Guide: Google Sheets Dashboard + Automatic Daily Email

Takes about 10 minutes. You'll need your Google account.

## What you get

- **Every transaction from every device** gathered in one Google Sheet,
  viewable from anywhere (phone, tablet, PC).
- An **"Order status" column** (En cours / Prêt / Récupéré — In progress /
  Ready / Picked up) you update directly in the Sheet: that's your order
  dashboard.
- A **daily summary email sent automatically at 8 PM** to staff, even if the
  app is closed (includes the breakdown by payment method). No clicking
  required.

## Setup

### Step 1 — Create the Google Sheet
1. Go to [sheets.google.com](https://sheets.google.com) and create a blank
   sheet. Name it e.g. **"Laverie des Anges — Caisse"**.

### Step 2 — Paste the script
2. In the Sheet: menu **Extensions → Apps Script**.
3. Clear the editor's content and paste the entire content of
   **`sync-google-apps-script.js`**.
4. Near the top of the script, edit these lines:
   - `var TOKEN = 'CHANGEZ_MOI';` → replace with a password of your choice
     (e.g. `LdA-2026-secret`). Write it down.
   - `var STAFF_EMAIL = '';` → put the staff email address between the quotes
     (or leave blank to receive it on your own address).
   - `var EMAIL_HOUR = 20;` → change the send hour if needed (24h format,
     20 = 8 PM).
5. Click the **Save** icon (floppy disk).

### Step 3 — Turn on the daily email
6. In the top toolbar, choose the **`setup`** function from the dropdown,
   then click **Run**.
7. Google will ask for authorization: **Authorize** → pick your account →
   "Advanced" → "Go to … (unsafe)" → **Allow**.
   (This is your own script; that warning is normal and expected.)
8. You'll receive a test email "synchronisation activée" ("sync activated").
   ✅

### Step 4 — Publish the script for the app
9. Blue button **Deploy → New deployment**.
10. Gear icon ⚙️ → type **Web app**.
11. Set:
    - *Execute as*: **Me**
    - *Who has access*: **Anyone** ← important, otherwise the checkout app
      can't send receipts (the secret token is what protects access, not
      this setting).
12. **Deploy** → copy the **Web app URL**
    (`https://script.google.com/macros/s/…/exec`).

### Step 5 — Connect the checkout app
13. Open the checkout app → **Réglages (Settings)**:
    - **Google sync URL**: paste the copied URL.
    - **Sync token**: the same password from Step 4.
    - **Save**.
14. Repeat step 13 on every device (phone, tablet…).

### Step 6 — Test it
15. Make a test receipt in the checkout app → open the Google Sheet: the row
    appears in the "Reçus" sheet within a few seconds. Delete the test row
    afterward if you like.

## Day to day

- Every receipt (new, marked paid, reissued) is automatically sent to the
  Sheet. Without an internet connection it's queued and sent as soon as the
  connection returns.
- Update the **Order status** column in the Sheet when an order is ready or
  picked up.
- The daily email sends itself at the chosen hour; if nothing was sold that
  day, no email is sent.
- The "Envoyer les reçus du jour" (Email today's receipts) button in the app
  is still available for a manual send at any time.

## Troubleshooting

- **Nothing shows up in the Sheet**: check that the URL ends with `/exec`,
  that the token matches on both sides, and that the deployment is set to
  "Anyone".
- **You edit the script**: after any change, redo
  **Deploy → Manage deployments → ✏️ → New version → Deploy**
  (the URL stays the same).
- **Change the email time**: edit `EMAIL_HOUR`, save, then re-run `setup`
  once.
