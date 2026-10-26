# Annuaire santé : comment ajouter des fiches

L'appli lit le fichier `annuaire.json` (à la racine). On ne le modifie pas à la main : on remplit un tableur, puis on le convertit.

## 1. Remplir le tableur
1. Ouvrez `outils/annuaire-modele.csv` dans Excel ou Google Sheets (séparateur `;`).
2. Supprimez les lignes `EXEMPLE-…` et ajoutez une ligne par établissement, professionnel, pharmacie, laboratoire ou studio.
3. Enregistrez en CSV.

| Colonne | À remplir |
|---|---|
| `type` | `hopital` (hôpital ou clinique), `pro` (médecin, sage-femme, infirmier), `pharmacie`, `labo`, `studio` |
| `nom`, `ville` | obligatoires. `quartier` sert au filtre par zone |
| `telephone`, `whatsapp`, `email`, `site` | au moins un moyen de contact. Téléphone avec l'indicatif (`+237 …`) |
| `role`, `etablissement` | pour un professionnel : `Médecin`, `Sage-femme`, `Infirmier(ère)` ou `Pédiatre`, et l'hôpital où il exerce |
| `consentement` | **`oui` obligatoire pour un professionnel** : la fiche n'est publiée que s'il a donné son accord |
| `verifie`, `partenaire` | `oui` ou `non`. Les partenaires sont signalés comme tels dans l'appli |
| `date_tarifs`, `source_tarifs` | date au format `AAAA-MM-JJ` et qui a communiqué les prix (ex. « la clinique »). Après un an, l'appli affiche « Tarifs de plus d'un an » |
| `tarif1_libelle` / `tarif1_montant` … `tarif4` | par exemple « Accouchement voie basse avec péridurale » et `350000`. Montant vide = « Sur demande » |

## 2. Convertir
```
node outils/csv-vers-json.js annuaire.csv annuaire.json
```
Le script liste ce qui est à vérifier (téléphone au format inhabituel, date manquante, professionnel sans consentement…).

## 3. Publier
```
git add annuaire.json
git commit -m "Mise à jour de l'annuaire"
git push
```
Netlify republie le site en moins d'une minute.

## Règles à respecter
- Ne publiez un prix que s'il vient de l'établissement, avec sa date.
- Ne publiez un professionnel de santé qu'avec son accord écrit (un message WhatsApp suffit comme preuve).
- Aucun établissement n'est recommandé par l'appli : un partenaire payant doit toujours être signalé « Partenaire ».

---

# Boutique Motherhood237 : comment ajouter des produits

L'appli lit le fichier `catalogue.json` (à la racine). Même principe que l'annuaire : un tableur, une conversion, une publication.

## 1. Préparer les photos
- Une photo carrée par produit, environ 800 × 800 pixels, format `.webp` ou `.jpg`, 100 Ko au maximum (les téléphones chargent la page en 4G).
- Rangez-les dans le dossier `img/boutique/` (à créer) et donnez-leur le nom écrit dans la colonne `image`.

## 2. Remplir le tableur
Ouvrez `outils/catalogue-modele.csv` dans Excel ou Google Sheets, supprimez les lignes `EXEMPLE-…`, puis une ligne par produit :

| Colonne | À remplir |
|---|---|
| `id` | une référence unique, par exemple `RB-001` (elle apparaît dans le message de commande) |
| `nom`, `categorie`, `prix` | obligatoires. Prix en F CFA, sans espace ni « F » (`15000`) |
| `ancien_prix` | facultatif : le prix barré, plus élevé que `prix` |
| `tailles`, `couleurs` | séparées par `|` : `S|M|L|XL` et `Noir|Bleu`. Vide si le produit n'a pas de variante |
| `image` | nom du fichier dans `img/boutique/`, par exemple `rb-001.webp` |
| `description` | une ou deux phrases : matière, entretien |
| `disponibilite` | `disponible` (par défaut), `sur commande`, `epuise` (affiché « Épuisé »), `masque` (caché) |
| `badge` | facultatif : `Nouveau`, `Promo`… |
| `sa_min`, `sa_max` | facultatif : semaines de grossesse pour lesquelles le produit est suggéré sur la page « Aujourd'hui » |
| `vedette` | `oui` pour suggérer le produit à toutes quand aucun produit ne correspond à sa semaine |

## 3. Convertir et publier
```
node outils/catalogue-csv-vers-json.js catalogue.csv catalogue.json
git add catalogue.json img/boutique
git commit -m "Mise à jour du catalogue"
git push
```
Le script signale les images introuvables, les prix invalides et les références en double.

## Comment la commande fonctionne
La cliente ajoute des produits au panier, puis touche « Envoyer ma commande sur WhatsApp » : un message prêt à envoyer s'ouvre avec les produits, les tailles, les couleurs, le total et sa zone de livraison. Le numéro WhatsApp de la boutique est dans `index.html` (constante `SHOP`). Rien n'est payé dans l'appli : la boutique confirme la disponibilité, la livraison et le paiement par WhatsApp.
