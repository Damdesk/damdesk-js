# damdesk.js

Le composant de diffusion d'images de [DAMDesk](https://damdesk.com).
**2,8 Ko compressés**, sans dépendance.

Une image doit être servie à la taille où elle s'affiche, ni plus ni moins.
Cette taille dépend de la mise en page et de l'écran du visiteur — deux choses
que le serveur ignore. L'attribut `sizes` de HTML demande à l'intégrateur de
les deviner et de tenir cette devinette à jour à chaque refonte ; personne ne
le fait correctement longtemps.

Ce script mesure la boîte réelle et demande la bonne variante.

```html
<script defer src="https://cdn.damdesk.com/damdesk.js" data-espace="votre-espace"></script>

<img data-dam="044_32_s1" data-dam-ratio="4/3" alt="Pull col roulé, laine mérinos">
```

C'est tout. Le script s'occupe du reste.

## Ce qu'il fait

- **Il mesure.** Une boîte de 310 px sur un écran ordinaire demande `w=384`.
  La même sur un écran à densité double demande `w=640`.
- **Il charge en différé.** Rien ne part tant que l'image n'approche pas de
  l'écran, avec 25 % de viewport d'anticipation.
- **Il réserve la place.** Aucun décalage de mise en page, à condition de lui
  donner un `data-dam-ratio` ou un `data-dam-taille` (voir plus bas).
- **Il suit les redimensionnements.** La colonne s'élargit, il monte d'un
  palier. Elle rétrécit, il ne redemande rien : ce serait une requête de plus
  pour une image moins bonne.
- **Il vous prévient des droits.** En développement, une image dont la licence
  a expiré est signalée en console, avec le motif du serveur.

## Le point important : les paliers

Les largeurs sont arrondies **au-dessus**, sur une liste fixe :

```
64  128  256  384  512  640  768  1024  1280  1600  2048  2560  3200
```

Ce n'est pas une approximation qu'on subit, c'est la raison pour laquelle la
diffusion ne vous est pas facturée. Chaque largeur distincte est une
transformation facturée une fois par mois ; un composant qui demanderait la
largeur exacte de chaque visiteur créerait des milliers de variantes pour une
seule image.

Le script est **engendré par le serveur** à partir des mêmes constantes que la
livraison. Les paliers que connaît votre navigateur sont donc exactement ceux
que le serveur applique, sans dérive possible.

## La balise `<dam-img>`

Si vous préférez une balise à des attributs `data-`, le script en définit une :

```html
<dam-img nom="044_32_s1" ratio="4/3" couleur="#c8b8a4" alt="Pull col roulé"></dam-img>
```

C'est un composant web natif, donc **Vue, Svelte, Angular, Astro et le HTML nu
la posent sans rien installer**. Il n'y a pas de paquet par framework : écrire
cinq paquets pour cinq façons de produire le même DOM serait de l'entretien
pur.

| Attribut | Équivalent |
|---|---|
| `nom` | `data-dam` |
| `ratio` `taille` `focus` `couleur` `format` `qualite` `espace` | `data-dam-…` |
| `immediat` | `data-dam-charge="immediat"` |
| `alt` | recopié sur l'image interne |

La balise vit en **light DOM**, sans racine d'ombre : les règles de votre
feuille de style s'appliquent normalement à l'image qu'elle contient.

## La couleur d'attente

DAMDesk calcule la couleur moyenne de chaque image à l'import. Écrite dans le
HTML, elle peint la place réservée pendant le chargement **sans coûter une
seule requête** — là où un aperçu flouté en coûterait une par image.

```html
<img data-dam="packshot" data-dam-taille="2400x1600" data-dam-couleur="#955252" alt="">
```

L'API la donne, ainsi que la balise toute faite :

```json
{ "couleur": "#955252",
  "balise": "<img data-dam=\"packshot\" data-dam-taille=\"2400x1600\" data-dam-couleur=\"#955252\" alt=\"\">" }
```

C'est la moyenne et non la teinte la plus fréquente : sur un packshot sur fond
blanc, la couleur dominante est le blanc, ce qui ne prépare l'œil à rien.

## Attributs

Sur l'image :

| Attribut | Rôle |
|---|---|
| `data-dam` | le nom du fichier publié — **obligatoire** |
| `data-dam-ratio` | cadre fixe : `1/1` `4/3` `3/2` `16/9` `21/9` `3/4` `2/3` `9/16` |
| `data-dam-taille` | les dimensions du fichier (`2400x1600`), si vous n'imposez pas de ratio |
| `data-dam-focus` | `visage` `auto` `centre` `haut` `bas` `gauche` `droite` |
| `data-dam-charge` | `immediat` pour une image au-dessus de la ligne de flottaison |
| `data-dam-format` | `webp` (défaut) · `jpeg` · `png` |
| `data-dam-qualite` | `60` · `80` (défaut) · `92` |
| `data-dam-couleur` | couleur d'attente, donnée par l'API (`couleur`) |
| `data-dam-espace` | pour tirer d'un autre espace que celui du script |
| `data-dam-bg` | sur un `<div>` : fond CSS au lieu d'une balise `<img>` |

Sur la balise `<script>` :

| Attribut | Défaut | Rôle |
|---|---|---|
| `data-espace` | — | votre espace DAMDesk, **obligatoire** |
| `data-max-dpr` | `2` | plafond de densité d'écran |
| `data-anticipation` | `25%` | à quelle distance de l'écran on précharge |
| `data-format` | `webp` | format par défaut |
| `data-qualite` | — | qualité par défaut |
| `data-base` | `https://cdn.damdesk.com` | pour un domaine de diffusion à vous |
| `data-diagnostic` | — | force les avertissements de droits hors développement |

## Réserver la place

Le script ne peut réserver la hauteur que s'il connaît le rapport de l'image
**avant** de l'avoir chargée. Deux façons de le lui dire :

```html
<!-- vous imposez un cadre -->
<img data-dam="packshot" data-dam-ratio="1/1" alt="">

<!-- vous gardez le rapport d'origine, et vous donnez les dimensions -->
<img data-dam="packshot" data-dam-taille="2400x1600" alt="">
```

Sans l'une des deux, la page se décale quand l'image arrive — mesuré à 0,15 de
décalage cumulé sur une grille de quatre colonnes, ce qui suffit à faire
échouer un audit de performance. Aucune bibliothèque ne peut réserver la bonne
hauteur sans cette information.

## Fond CSS

```html
<div data-dam-bg="banniere" data-dam-ratio="21/9" style="width:100%"></div>
```

L'image est préchargée puis posée en `background-image`, jamais avant d'être
prête : pas de clignotement.

## Cadres et recadrage

Le recadrage se fait aussi directement dans l'adresse, sans script :

```
https://cdn.damdesk.com/votre-espace/044_32_s1?w=800&ratio=16/9&focus=visage
```

Les ratios forment une liste fermée, pour la même raison que les paliers : une
hauteur libre rendrait le nombre de variantes facturées illimité, et un
visiteur pourrait toutes les déclencher depuis son navigateur.

`focus=visage` cadre sur le visage plutôt que sur le centre géométrique.
Recadrer un portrait en `1/1` par le centre coupe le menton une fois sur deux.

## Applications à rendu client

Le script observe le DOM : les images ajoutées après coup — rendu React,
navigation d'une application monopage, contenu injecté — sont prises en charge
sans rien faire. Si vous avez besoin de forcer un balayage :

```js
window.damdesk.balayer();          // tout le document
window.damdesk.balayer(monElement); // une sous-arborescence
```

## Sans JavaScript

Le script est un confort, pas une dépendance. Une page rendue côté serveur peut
très bien écrire ses propres `srcset` et `sizes` — c'est même préférable quand
la mise en page est connue à l'avance :

```html
<img src="https://cdn.damdesk.com/espace/photo?w=800&fm=webp"
     srcset="https://cdn.damdesk.com/espace/photo?w=480&fm=webp 480w,
             https://cdn.damdesk.com/espace/photo?w=800&fm=webp 800w,
             https://cdn.damdesk.com/espace/photo?w=1280&fm=webp 1280w"
     sizes="(max-width: 700px) 100vw, 700px" alt="">
```

Le site public de DAMDesk fait exactement cela.

## Exemples

- [`exemples/html`](exemples/html) — page statique, aucun outillage
- [`exemples/react`](exemples/react) — composant `<Image>` de trois lignes
- [`exemples/vue`](exemples/vue) — idem en Vue 3
- [`exemples/balise`](exemples/balise) — `<dam-img>`, sans aucun outillage
- [`exemples/wordpress`](exemples/wordpress) — extrait à coller dans un thème

## Licence

MIT. Voir [LICENSE](LICENSE).
