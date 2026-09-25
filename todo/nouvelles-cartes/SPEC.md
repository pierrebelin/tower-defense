# Nouvelles cartes

> Deux cartes de plus, dont une avec deux pierres runiques à toucher dans l'ordre, et un choix de carte à l'écran titre. Pour le joueur qui connaît par cœur le labyrinthe du Gué des Runes : de nouvelles géométries obligent à repenser son tracé.

## 1. Contexte

Il n'existe qu'une carte, « Le Gué des Runes » (`src/domain/catalog/map.ts:11`), avec une seule pierre runique. Le moteur suppose exactement deux tronçons de trajet, du portail à la pierre puis de la pierre à la porte (`src/domain/model/World.ts:76`). Une fois le bon labyrinthe trouvé, la partie devient routinière.

## 2. Vocabulaire

| Terme | Définition |
|---|---|
| Pierre runique | Point de passage obligatoire. Une carte en compte une ou plusieurs, numérotées. |
| Tronçon | Partie du trajet entre deux points consécutifs : portail, pierres dans l'ordre, porte. |

## 4. Cas d'usage

### CU-01 — Choisir sa carte
**Acteur** joueur · **Intention** jouer sur une autre disposition.
**Scénario nominal :**
1. À l'écran titre, le joueur choisit une carte (nom et vignette) et une difficulté.
2. Pour chaque couple carte et difficulté, l'écran affiche le meilleur résultat obtenu.
3. La partie démarre sur la carte choisie.
**Variantes :** au premier lancement, « Le Gué des Runes » est présélectionnée.

### CU-02 — Jouer une carte à deux pierres
**Acteur** joueur · **Intention** construire un labyrinthe qui serve sur trois traversées.
**Scénario nominal :**
1. Le joueur active l'affichage du trajet : il va du portail à la pierre 1, de la pierre 1 à la pierre 2, puis de la pierre 2 à la porte.
2. Il construit. Toute construction qui fermerait un des tronçons est refusée, comme aujourd'hui.
3. Les créatures touchent les pierres dans l'ordre avant de sortir.

## 5. Règles métier

### RM-01 — Pierres dans l'ordre
- **Énoncé** : une créature terrestre doit toucher chaque pierre runique dans l'ordre de leur numéro avant de pouvoir sortir. Toucher la pierre 2 avant la pierre 1 ne compte pas pour la pierre 2. · **Origine** : comportement existant étendu · **Concerne** : CU-02

### RM-02 — Volants
- **Énoncé** : un volant survole chaque pierre dans l'ordre, puis rejoint la porte, en ligne droite entre deux points. · **Origine** : comportement existant étendu · **Concerne** : CU-02

### RM-03 — Anti-blocage sur tous les tronçons
- **Énoncé** : une construction est refusée si elle ferme l'un des tronçons, pour le trajet complet comme pour une créature déjà en route, quel que soit le tronçon où elle se trouve. · **Origine** : comportement existant · **Concerne** : CU-02

### RM-04 — Trajet affiché
- **Énoncé** : l'aperçu du trajet montre tous les tronçons, portail et pierres compris. · **Origine** : comportement existant étendu · **Concerne** : CU-02

### RM-05 — Carte jouable
- **Énoncé** : sur chaque carte, sans aucune tour, chaque tronçon a un chemin, et les zones d'apparition, les pierres et la porte ne sont pas constructibles. · **Origine** : choix de design · **Concerne** : CU-01

### RM-06 — Record par carte et difficulté
- **Énoncé** : le meilleur résultat est mémorisé séparément pour chaque couple carte et difficulté. Les records existants sont attribués au « Gué des Runes » et ne sont pas perdus. · **Origine** : comportement existant étendu · **Concerne** : CU-01

### RM-07 — Carte d'une partie
- **Énoncé** : la carte fait partie des paramètres de la partie, au même titre que la graine et la difficulté : même carte, même graine et mêmes ordres donnent la même partie. · **Origine** : comportement existant · **Concerne** : transverse

### RM-08 — Règles communes
- **Énoncé** : vagues, créatures, or de départ, vies et difficultés sont identiques sur toutes les cartes. · **Origine** : choix de design (version minimale) · **Concerne** : transverse

## 6. Chiffres

| Carte | Taille | Pierres | Disposition |
|---|---|---|---|
| Le Gué des Runes (existante) | 36 × 24 | 1 | Inchangée. |
| La Spirale | 36 × 24 | 1 | Portail au centre, pierre dans un coin, porte dans le coin opposé. Quelques rochers en arc de cercle suggèrent une spirale. |
| Les Deux Sceaux | 40 × 24 | 2 | Portail à gauche, pierre 1 en haut à droite, pierre 2 en bas au centre, porte en bas à gauche. Le champ est traversé trois fois. |

Les dispositions exactes (rochers, zones) se règlent en jouant ; elles doivent respecter RM-05.

## 8. Hors périmètre

| Exclusion | Raison |
|---|---|
| Plusieurs portails sur une même carte | Écarté : répartir les groupes entre portails ajoute des règles. |
| Éditeur de cartes | Non demandé. |
| Cartes à débloquer | Choix : toutes les cartes sont disponibles d'emblée. |
| Équilibrage propre à chaque carte | Version minimale (RM-08). |

## 9. Hypothèses

| # | Hypothèse | À valider par |
|---|---|---|
| H1 | Le bot d'équilibrage n'est exigé que sur « Le Gué des Runes » : son labyrinthe fixe est pensé pour cette carte. | joueur |
| H2 | Le coût du trajet reste raisonnable avec trois tronçons, recalculés à chaque construction. | plan technique |
