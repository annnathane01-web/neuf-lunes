// Convertit le tableur du catalogue (CSV) en catalogue.json, lu par l'appli.
// Usage : node outils/catalogue-csv-vers-json.js catalogue.csv [catalogue.json]
// Le CSV peut être enregistré depuis Excel ou Google Sheets (séparateur ; ou ,).
// Colonnes : voir outils/catalogue-modele.csv
const fs = require('fs');
const path = require('path');

const [, , src, out = 'catalogue.json'] = process.argv;
if (!src) { console.error('Usage : node outils/catalogue-csv-vers-json.js catalogue.csv [catalogue.json]'); process.exit(1); }

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
const num = v => { const s = String(v || '').replace(/[\s ]/g, '').replace(',', '.'); return s === '' ? null : Number(s); };
const list = v => String(v || '').split('|').map(x => x.trim()).filter(Boolean);
const STOCKS = { disponible: 'disponible', sur_commande: 'sur commande', epuise: 'epuise', masque: 'masque' };

const rows = parseCsv(fs.readFileSync(src, 'utf8'));
const head = rows.shift().map(norm);
const products = [], problems = [], seen = new Set();
const root = path.resolve(__dirname, '..');

rows.forEach((r, n) => {
  const g = {}; head.forEach((h, i) => { g[h] = (r[i] || '').trim(); });
  const line = n + 2;
  if (!g.id || !g.nom) { problems.push(`ligne ${line} : id ou nom manquant, produit ignoré`); return; }
  if (seen.has(g.id)) { problems.push(`ligne ${line} (${g.nom}) : id « ${g.id} » déjà utilisé, produit ignoré`); return; }
  const price = num(g.prix);
  if (price === null || Number.isNaN(price) || price < 0) { problems.push(`ligne ${line} (${g.nom}) : prix invalide, produit ignoré`); return; }
  seen.add(g.id);

  const p = { id: g.id, name: g.nom, price };
  if (g.categorie) p.category = g.categorie;
  const old = num(g.ancien_prix);
  if (old) { if (old > price) p.oldPrice = old; else problems.push(`ligne ${line} (${g.nom}) : ancien_prix doit être supérieur au prix`); }
  if (g.description) p.description = g.description;
  const sizes = list(g.tailles), colors = list(g.couleurs);
  if (sizes.length) p.sizes = sizes;
  if (colors.length) p.colors = colors;
  if (g.image) {
    p.image = /^https:\/\//.test(g.image) ? g.image : 'img/boutique/' + g.image.replace(/^img\/boutique\//, '');
    if (!/^https:\/\//.test(p.image) && !fs.existsSync(path.join(root, p.image))) problems.push(`ligne ${line} (${g.nom}) : image « ${p.image} » introuvable`);
  } else problems.push(`ligne ${line} (${g.nom}) : pas d'image`);
  const stock = STOCKS[norm(g.disponibilite) || 'disponible'];
  if (!stock) problems.push(`ligne ${line} (${g.nom}) : disponibilite « ${g.disponibilite} » inconnue (disponible, sur commande, epuise, masque)`);
  else if (stock !== 'disponible') p.stock = stock;
  if (g.badge) p.badge = g.badge;
  const a = num(g.sa_min), b = num(g.sa_max);
  if (a !== null && b !== null && a <= b) p.sa = [a, b];
  else if ((a !== null) !== (b !== null)) problems.push(`ligne ${line} (${g.nom}) : sa_min et sa_max vont ensemble`);
  if (yes(g.vedette)) p.featured = true;
  products.push(p);
});

const data = { version: 1, updated: new Date().toISOString().slice(0, 10), currency: 'FCFA', products };
fs.writeFileSync(out, JSON.stringify(data, null, 1) + '\n');
console.log(`${products.length} produit(s) écrit(s) dans ${out}`);
if (problems.length) { console.log('\nÀ vérifier :'); problems.forEach(p => console.log(' - ' + p)); }
