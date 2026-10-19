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
