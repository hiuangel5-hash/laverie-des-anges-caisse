/**
 * Laverie des Anges — Synchronisation Google Sheets + email quotidien automatique
 * =================================================================================
 * Ce script se colle dans Google Apps Script (script.google.com), attaché à un
 * Google Sheet. Voir GUIDE-SYNCHRONISATION.md pour l'installation pas à pas.
 *
 * Ce qu'il fait :
 *  - Reçoit chaque reçu envoyé par l'application caisse et le range dans la
 *    feuille "Reçus" (une ligne par reçu, mise à jour si le reçu change).
 *  - Colonne "Statut commande" avec menu déroulant : En cours / Prêt / Récupéré
 *    (c'est votre tableau de bord : ouvrez le Sheet sur n'importe quel appareil).
 *  - Envoie automatiquement chaque jour à EMAIL_HOUR un récapitulatif des reçus
 *    du jour à STAFF_EMAIL, avec le détail par mode de règlement.
 */

/* ========================== À CONFIGURER ========================== */
var TOKEN = 'CHANGEZ_MOI';          // Inventez un mot de passe, le même que dans Réglages > Jeton de synchronisation
var STAFF_EMAIL = '';               // Email du personnel. Vide = votre propre adresse Google.
var EMAIL_HOUR = 20;                // Heure d'envoi du récapitulatif quotidien (0-23)
var TZ = 'Europe/Paris';
/* =================================================================== */

var SHEET_NAME = 'Reçus';
var HEADERS = [
  'Reçu n°', 'Date', 'Nom', 'Prénom', 'Téléphone', 'Email', 'Adresse',
  'Articles', 'Sous-total', 'Remise', 'Total TTC', 'Montant payé', 'Solde dû',
  'Mode de règlement', 'Réglé le', 'Remplace', 'Remplacé par',
  'Statut commande', 'Mis à jour le'
];
var PAY_LABELS = {
  cash: 'Espèces', card: 'Carte bancaire', gift: 'Carte cadeau',
  unpaid: 'Non payé — à percevoir'
};

/** Point d'entrée : l'application caisse envoie les reçus ici. */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.token !== TOKEN) {
      return ContentService.createTextOutput('unauthorized');
    }
    if (data.type === 'upsert' && data.receipt) {
      upsertReceipt(data.receipt);
    }
    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('error: ' + err);
  }
}

/** À exécuter UNE FOIS à la main après avoir collé le script (menu Exécuter). */
function setup() {
  ensureSheet();
  // Remplace tout déclencheur existant pour éviter les doublons
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'dailySummary') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('dailySummary')
    .timeBased()
    .everyDays(1)
    .atHour(EMAIL_HOUR)
    .inTimezone(TZ)
    .create();
  // Email de test pour vérifier que tout fonctionne
  MailApp.sendEmail(
    staffEmail_(),
    'Laverie des Anges — synchronisation activée',
    'La synchronisation des reçus et l\'email quotidien (' + EMAIL_HOUR + 'h) sont bien configurés.'
  );
}

function ensureSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getRange(1, 1).getValue() !== HEADERS[0]) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  // Menu déroulant du statut de commande
  var statusCol = HEADERS.indexOf('Statut commande') + 1;
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['En cours', 'Prêt', 'Récupéré'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, statusCol, sheet.getMaxRows() - 1, 1).setDataValidation(rule);
  return sheet;
}

function upsertReceipt(r) {
  var sheet = ensureSheet();
  var items = (r.lines || []).map(function (l) { return l.qty + '× ' + l.fr; }).join(', ');
  var row = [
    r.receiptNumber, r.date,
    (r.client && r.client.lastName) || '', (r.client && r.client.firstName) || '',
    (r.client && r.client.phone) || '', (r.client && r.client.email) || '',
    (r.client && r.client.address) || '',
    items, r.subtotal, r.discountAmount, r.total, r.amountPaid, r.balanceDue,
    PAY_LABELS[r.paymentMethod] || r.paymentMethod, r.settledDate || '',
    r.replaces || '', r.replacedBy || '',
    '', // Statut commande : géré à la main dans le Sheet, jamais écrasé
    Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm')
  ];
  var numbers = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), 1).getValues();
  for (var i = 0; i < numbers.length; i++) {
    if (numbers[i][0] === r.receiptNumber) {
      var target = sheet.getRange(i + 2, 1, 1, HEADERS.length);
      var existing = target.getValues()[0];
      row[17] = existing[17] || 'En cours'; // conserve le statut choisi à la main
      target.setValues([row]);
      return;
    }
  }
  row[17] = 'En cours';
  sheet.appendRow(row);
}

/** Envoyé automatiquement chaque jour par le déclencheur créé dans setup(). */
function dailySummary() {
  var sheet = ensureSheet();
  var today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  if (sheet.getLastRow() < 2) return;
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length).getValues();
  var lines = [], byMethod = {}, grandTotal = 0, unpaidTotal = 0;
  rows.forEach(function (row) {
    var date = row[1] instanceof Date ? Utilities.formatDate(row[1], TZ, 'yyyy-MM-dd') : String(row[1]);
    if (date !== today) return;
    var name = [row[3], row[2]].filter(String).join(' ');
    var total = Number(row[10]) || 0;
    var method = row[13];
    lines.push(row[0] + ' — ' + name + ' — ' + eur_(total) + ' — ' + method);
    byMethod[method] = (byMethod[method] || 0) + total;
    grandTotal += total;
    unpaidTotal += Number(row[12]) || 0;
  });
  if (lines.length === 0) return; // rien vendu aujourd'hui : pas d'email
  var body = 'Récapitulatif des reçus du ' + today + ' :\n\n' +
    lines.join('\n') + '\n\n' +
    'Détail par mode de règlement :\n' +
    Object.keys(byMethod).map(function (m) { return m + ': ' + eur_(byMethod[m]); }).join('\n') +
    (unpaidTotal > 0 ? '\n\nTotal restant à percevoir : ' + eur_(unpaidTotal) : '') +
    '\n\nTotal du jour : ' + eur_(grandTotal) +
    '\n\nLaverie des Anges';
  MailApp.sendEmail(staffEmail_(), 'Reçus du jour — ' + today, body);
}

function staffEmail_() {
  return STAFF_EMAIL || Session.getEffectiveUser().getEmail();
}
function eur_(n) {
  return Number(n).toFixed(2).replace('.', ',') + ' €';
}
