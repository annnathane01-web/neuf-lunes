// Convertit le tableur de l'annuaire (CSV) en annuaire.json, lu par l'appli.
// Usage : node outils/csv-vers-json.js annuaire.csv [annuaire.json]
// Le CSV peut être enregistré depuis Excel ou Google Sheets (séparateur ; ou ,).
// Colonnes : voir outils/annuaire-modele.csv
const fs = require('fs');

const [, , src, out = 'annuaire.json'] = process.argv;
if (!src) { console.error('Usage : node outils/csv-vers-json.js annuaire.csv [annuaire.json]'); process.exit(1); }

// --- lecture du CSV (guillemets, retours à la ligne, ; ou ,) ---
function parseCsv(text) {
  text = text.replace(/^﻿/, '');
  const first = text.split(/\r?\n/)[0] || '';
  const sep = (first.match(/;/g) || []).length >= (first.match(/,/g) || []).length ? ';' : ',';
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === sep) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some(x => x.trim() !== '')) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some(x => x.trim() !== '')) rows.push(row);
  return rows;
}

const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');
const yes = v => ['oui', 'o', 'yes', 'y', '1', 'true', 'vrai', 'x'].includes(norm(v));
const TYPES = ['hopital', 'pro', 'pharmacie', 'labo', 'studio'];

const rows = parseCsv(fs.readFileSync(src, 'utf8'));
const head = rows.shift().map(norm);
const entries = [], problems = [];
let currency = 'FCFA';

rows.forEach((r, n) => {
  const g = {}; head.forEach((h, i) => { g[h] = (r[i] || '').trim(); });
  const line = n + 2, id = g.id || ('ligne-' + line);
  const type = norm(g.type);
  if (!g.nom) { problems.push(`ligne ${line} : nom manquant, fiche ignorée`); return; }
  if (!TYPES.includes(type)) { problems.push(`ligne ${line} (${g.nom}) : type « ${g.type} » inconnu (${TYPES.join(', ')}), fiche ignorée`); return; }
  if (!g.ville) { problems.push(`ligne ${line} (${g.nom}) : ville manquante, fiche ignorée`); return; }
  const consent = yes(g.consentement);
  if (type === 'pro' && !consent) { problems.push(`ligne ${line} (${g.nom}) : professionnel sans consentement « oui », fiche ignorée`); return; }
  if (!g.telephone && !g.whatsapp && !g.email) problems.push(`ligne ${line} (${g.nom}) : aucun moyen de contact`);
  if (g.telephone && !/^\+?[\d\s().-]{6,20}$/.test(g.telephone)) problems.push(`ligne ${line} (${g.nom}) : téléphone « ${g.telephone} » au format inhabituel`);
  if (g.devise) currency = g.devise;

  const prices = [];
  for (let k = 1; k <= 8; k++) {
    const label = g[`tarif${k}_libelle`]; if (!label) continue;
    const raw = g[`tarif${k}_montant`];
    const amount = raw === '' || raw == null ? null : Number(String(raw).replace(/[\s ]/g, '').replace(',', '.'));
    if (raw && Number.isNaN(amount)) { problems.push(`ligne ${line} (${g.nom}) : montant « ${raw} » invalide pour « ${label} »`); continue; }
    prices.push({ label, amount });
  }
  if (prices.length && !g.date_tarifs) problems.push(`ligne ${line} (${g.nom}) : tarifs sans date_tarifs`);
  if (g.date_tarifs && !/^\d{4}-\d{2}-\d{2}$/.test(g.date_tarifs)) problems.push(`ligne ${line} (${g.nom}) : date_tarifs doit être au format AAAA-MM-JJ`);

  const e = { id, type, name: g.nom, country: g.pays || 'CM', city: g.ville };
  const opt = { zone: g.quartier, address: g.adresse, phone: g.telephone, whatsapp: g.whatsapp, email: g.email, website: g.site, role: g.role, hospital: g.etablissement, services: g.services, pricesDate: g.date_tarifs, source: g.source_tarifs, currency: g.devise };
  Object.entries(opt).forEach(([k, v]) => { if (v) e[k] = v; });
  if (prices.length) e.prices = prices;
  if (type === 'pro') e.consent = true;
  if (yes(g.verifie)) e.verified = true;
  if (yes(g.partenaire)) e.partner = true;
  entries.push(e);
});

const data = { version: 1, updated: new Date().toISOString().slice(0, 10), currency, entries };
fs.writeFileSync(out, JSON.stringify(data, null, 1) + '\n');
console.log(`${entries.length} fiche(s) écrite(s) dans ${out}`);
if (problems.length) { console.log('\nÀ vérifier :'); problems.forEach(p => console.log(' - ' + p)); }
