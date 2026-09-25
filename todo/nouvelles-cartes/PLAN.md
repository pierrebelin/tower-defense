# PLAN — Nouvelles cartes

> Spec : `todo/nouvelles-cartes/SPEC.md`

## Avancement

| Lot | Intention | RM/CU | Dépend de | État |
|-----|-----------|-------|-----------|------|
| F1 | Le moteur gère un nombre quelconque de pierres runiques, touchées dans l'ordre. | RM-01, RM-02, RM-03, RM-04, RM-07 / CU-02 | — | ⬜ |
| F2 | « La Spirale » et « Les Deux Sceaux » rejoignent le catalogue, jouables et aux règles communes. | RM-05, RM-08 / CU-02 | F1 | ⬜ |
| F3 | L'écran titre propose la carte et mémorise un record par carte et difficulté. | RM-06, RM-07 / CU-01 | F2 | ⬜ |

## Périmètre

- **Réutilisé** :
  - `WorldOptions.map` `src/domain/model/World.ts:15` — la carte est déjà un paramètre de partie (RM-07).
  - `World.fields` `src/domain/model/World.ts:38` (tableau de `FlowField` par tronçon), `Creep.leg` `src/domain/model/types.ts:90`, `waypoints` `World.ts:40`, `legRest`/`airRest` `World.ts:63-64` — déjà indexés par tronçon, on généralise leur construction.
  - `FlowField` `src/domain/rules/FlowField.ts:15` — inchangé, une instance par tronçon.
  - `advanceLeg` `src/domain/systems/movement.ts:69`, `moveAir` `movement.ts:13` — déjà pilotés par `c.leg`.
  - `canBuild` / `pathsStayOpen` `src/application/queries/canBuild.ts:31` — la vérification des créatures en route lit déjà `world.fields[c.leg]`.
  - `previewRoute` `src/application/queries/previewRoute.ts:4`, `World.groundRoute()` `World.ts:120`, `Renderer.drawRoute` (appel `Renderer.ts:188`, accepte déjà `number[][]`).
  - `loadBest` / `saveBest` / `showStart` `src/presentation/Game.ts:703-760`, clé `BEST_KEY` `Game.ts:24`.
  - `newWorld` `tests/support/helpers.ts:5` — étendu d'un paramètre carte.
- **Hors périmètre** : plusieurs portails, éditeur de cartes, cartes à débloquer, équilibrage par carte (spec §8) ; bot d'équilibrage sur les nouvelles cartes (H1 de la spec) ; mémoriser la carte choisie d'un lancement à l'autre (spec : présélection au premier lancement seulement) ; réglage fin des dispositions (se fait en jouant, sous contrainte RM-05).
- **Règles N/A** : aucune — les 8 ids sont appliqués dans un lot.
- **Décisions** (2026-09-25, par défaut, à confirmer à la validation du plan) :
  - Pierres codées par leur numéro dans `MapDef.rows` (`'1'`, `'2'`… jusqu'à `'9'`) ; `Grid.checkpoints: number[][]` (index = numéro − 1) remplace `Grid.checkpointCells`.
  - `MapDef.id` (nouveau) sert de clé aux records ; aucun moteur ne branche dessus.
  - Records : nouvelle clé `dedale.best.v2` `{ [mapId]: { [difficulté]: vague } }`. L'ancienne clé `dedale.best.v1` est lue à chaque chargement et fusionnée au maximum sous `crossing`, jamais effacée : idempotent, rien n'est perdu.
  - À l'écran titre, les boutons de difficulté affichent le record de la carte sélectionnée, mis à jour au changement de carte.
  - H2 de la spec tranchée : une construction coûte `2 × (pierres + 1)` Dijkstra sur ≤ 960 cases, hors `step()` — négligeable.

## Traçabilité

| RM/CU | Porté par | Lot |
|-------|-----------|-----|
| RM-01 — pierres dans l'ordre | `Grid.checkpoints`, `World.fields` (un champ par pierre + porte), `advanceLeg` `domain/systems/movement.ts` | F1 |
| RM-02 — volants pierre par pierre | `World.waypoints` / `World.airRest` construits sur toutes les pierres, `moveAir` | F1 |
| RM-03 — anti-blocage tous tronçons | `pathsStayOpen` `application/queries/canBuild.ts` | F1 |
| RM-04 — trajet affiché complet | `World.groundRoute()`, `World.mazeLength()`, `previewRoute` ; `Renderer.drawLandmarks` (pierres numérotées) | F1 |
| RM-05 — carte jouable | entrées `MAP_SPIRAL`, `MAP_SEALS`, `MAPS` `domain/catalog/map.ts` | F2 |
| RM-06 — record par carte et difficulté | `withRecord`, `importLegacyRecords` `domain/rules/records.ts` ; `loadBest`/`saveBest` `presentation/Game.ts` | F3 |
| RM-07 — carte paramètre de partie | `WorldOptions.map` (existant) ; `Game.createWorld(map, d)` | F1, F3 |
| RM-08 — règles communes | `DIFFICULTY`/vagues lus sans la carte (existant), vérifié sur `MAPS` | F2 |
| CU-01 — choisir sa carte | `MAPS` (ordre, `MAPS[0]` présélectionnée) ; `Game.showStart` ; `drawMapThumbnail` `infrastructure/render/sprites.ts` | F3 |
| CU-02 — jouer une carte à deux pierres | F1 (moteur) + `MAP_SEALS` | F1, F2 |

---

## Lot F1 — Trajet à plusieurs pierres runiques — ⬜

### Intention
Une carte déclare 1 à n pierres ; créatures, volants, anti-blocage et aperçu suivent tous les tronçons dans l'ordre. **RM** : RM-01, RM-02, RM-03, RM-04, RM-07 · **CU** : CU-02

### Conception
| Point | Décision |
|-------|----------|
| Règles appliquées | ARCH-01 (`checkpoints` = pierres runiques, vocabulaire existant), ARCH-02 (`domain/model`, `domain/systems`, `application/queries`, `infrastructure/render`), ARCH-04 (aucun calcul ajouté aux commandes ; `canBuild` reste une query), ARCH-05 (aucun aléatoire ajouté ; apparition toujours par `world.rng`), ARCH-06 (nombre de pierres lu dans `MapDef.rows`, aucun `if` sur une carte), ARCH-07, ARCH-08 (généralise `fields`/`leg`/`waypoints` existants, pas de nouveau système) |
| Données | `Grid` lit `'1'`…`'9'` comme `checkpoint` numéroté → `Grid.checkpoints: number[][]` (remplace `checkpointCells`) |
| Calcul pur | aucun nouveau ; `World.mazeLength()` somme les tronçons sur les champs courants |
| Ordre du joueur | aucun |
| Coût par tick | inchangé : `O(créatures)` pour le mouvement, `advanceLeg` en O(1). Champs recalculés seulement dans `refreshPaths()` / queries, hors `step()` |

### Étapes et tests
Tests écrits et **rouges avant toute ligne de production** de l'étape. Ordre : cas nominal d'abord (il fixe les signatures), refus ensuite.

Cartes de test dans `tests/support/maps.ts` (nouveau, partagé) : `MAP_CORRIDOR` — couloir `E S 2 1` de gauche à droite, la pierre 2 est sur le chemin de la pierre 1 ; `MAP_TWO_STONES` — champ ouvert à deux pierres avec goulets construisibles pour fermer un tronçon précis. `newWorld(difficulty, seed, map = MAP_CROSSING)`.

#### Étape 1 — Les créatures terrestres touchent les pierres dans l'ordre — ⬜
| # | Test (`it`) | Fichier de test | RM |
|---|-------------|-----------------|----|
| 1 | `[RM-01] fait passer une créature terrestre par la pierre 1 puis la pierre 2 avant la sortie` | `tests/domain/model/World.test.ts` | RM-01 |
| 2 | `[RM-01] ne compte pas la pierre 2 quand la créature la traverse avant la pierre 1` | idem | RM-01 |
| 3 | `[RM-01] mesure le labyrinthe sur les trois tronçons quand la carte a deux pierres` | idem | RM-01 |
| 4 | `[RM-07] rejoue à l'identique une partie à deux pierres quand carte, graine et journal sont les mêmes` | idem | RM-07 |

Non-régression : `fait passer les créatures par la pierre runique avant la sortie` (Gué des Runes) reste vert.

**Production autorisée** : `src/domain/model/types.ts`, `src/domain/model/Grid.ts`, `src/domain/model/World.ts` (`fields`, `legRest`, `refreshPaths`, `mazeLength`, `groundRoute`), `src/domain/systems/movement.ts` (`advanceLeg`), `src/domain/catalog/map.ts` (légende), `src/infrastructure/render/Renderer.ts` (usages de `checkpointCells`), `tests/support/helpers.ts`, `tests/support/maps.ts`.

#### Étape 2 — Les volants survolent chaque pierre dans l'ordre — ⬜
| # | Test (`it`) | Fichier de test | RM |
|---|-------------|-----------------|----|
| 1 | `[RM-02] fait survoler au volant la pierre 1 puis la pierre 2 avant la porte` | `tests/domain/model/World.test.ts` | RM-02 |
| 2 | `[RM-02] estime la distance restante d'un volant comme la somme des lignes droites jusqu'à la porte` | idem | RM-02 |

**Production autorisée** : `src/domain/model/World.ts` (`waypoints`, `airRest`).

#### Étape 3 — Aucune construction ne ferme un tronçon — ⬜
| # | Test (`it`) | Fichier de test | RM |
|---|-------------|-----------------|----|
| 1 | `[RM-03] refuse la construction quand elle fermerait le tronçon de la pierre 2 à la porte` | `tests/application/commands/build.test.ts` | RM-03 |
| 2 | `[RM-03] refuse la construction quand elle fermerait le tronçon de la pierre 1 à la pierre 2` | idem | RM-03 |
| 3 | `[RM-03] refuse la construction quand elle enfermerait une créature en route vers la pierre 2` | idem | RM-03 |
| 4 | `[RM-03] accepte la construction quand tous les tronçons restent ouverts` | idem | RM-03 |

**Production autorisée** : `src/application/queries/canBuild.ts` (`pathsStayOpen`).

#### Étape 4 — L'aperçu montre le trajet complet — ⬜
| # | Test (`it`) | Fichier de test | RM |
|---|-------------|-----------------|----|
| 1 | `[RM-04] renvoie trois tronçons enchaînés du portail à la porte quand la carte a deux pierres` | `tests/application/queries/previewRoute.test.ts` (nouveau) | RM-04 |
| 2 | `[RM-04] donne la longueur du trajet complet avec le mur prévisualisé` | idem | RM-04 |
| 3 | `laisse le labyrinthe inchangé après l'aperçu` | idem | RM-04 |

**Production autorisée** : `src/application/queries/previewRoute.ts`, `src/infrastructure/render/Renderer.ts` (`drawLandmarks` : une pierre dessinée par entrée de `checkpoints`, numéro affiché quand il y en a plusieurs — vérifié à l'œil), `src/presentation/Game.ts` (texte d'accueil « les pierres runiques, dans l'ordre »).

#### Étape 5 — Vérification — ⬜
Pas de nouveau test. `npx tsc --noEmit` + `npm test` (`balance.test.ts` doit rester vert : Gué des Runes inchangé).

### Éléments de code
Signatures seulement, jamais de corps.
- `domain/model/Grid.ts` — `readonly checkpoints: number[][]` (nouveau, remplace `checkpointCells`) — chiffre `n` de la ligne → case `checkpoint` ajoutée à `checkpoints[n - 1]`.
- `domain/model/World.ts` — `readonly fields: FlowField[]` — un champ par cible : `checkpoints` dans l'ordre, puis `exitCells`.
- `domain/model/World.ts` — `readonly waypoints` — centre de chaque pierre puis de la porte ; `airRest[k]` = somme des segments après le point `k`.
- `domain/model/World.ts` — `refreshPaths(): void` — `legRest[k]` = `legRest[k + 1]` + distance minimale du champ `k + 1` depuis la pierre `k` ; dernier = 0.
- `domain/model/World.ts` — `mazeLength(): number` — calculée sur les champs courants (réutilisée par `previewRoute`).
- `domain/model/World.ts` — `groundRoute(): number[][]` — un tracé par tronçon, chacun partant de l'arrivée du précédent.
- `domain/systems/movement.ts` — `advanceLeg(world, c): boolean` — tronçon suivant tant qu'il en reste, sinon fuite (inchangée).
- `application/queries/canBuild.ts` — `pathsStayOpen(world, blocked): boolean` — portail relié au champ 0 et chaque pierre `k` reliée au champ `k + 1`, puis créatures en route (existant).
- `application/queries/previewRoute.ts` — `previewRoute(world, x, y): { route: number[][]; length: number }` — signature inchangée, tous les champs recalculés puis restaurés.
- `tests/support/helpers.ts` — `newWorld(difficulty?: Difficulty, seed?: number, map?: MapDef): World`.

### Hypothèses
_Vide à l'écriture. Rempli par `/implement-tdd` : `Hn — [hypothèse] — à valider par [qui]`._

---

## Lot F2 — La Spirale et Les Deux Sceaux — ⬜

### Intention
Deux cartes de plus au catalogue, jouables sans tour, avec les mêmes règles que le Gué des Runes. **RM** : RM-05, RM-08 · **CU** : CU-02

### Conception
| Point | Décision |
|-------|----------|
| Règles appliquées | ARCH-01 (`MAP_SPIRAL`, `MAP_SEALS`, `MAPS`), ARCH-02 (`domain/catalog`), ARCH-05 (aucun aléatoire), ARCH-06 (cartes = entrées de catalogue, aucun moteur touché), ARCH-08 (`MapDef` étendu de `id` seulement) |
| Données | `MapDef.id: string` (nouveau) ; `MAP_CROSSING.id = 'crossing'`, `MAP_SPIRAL` (36 × 24, 1 pierre, portail au centre), `MAP_SEALS` (40 × 24, 2 pierres) ; `MAPS: MapDef[]` dans l'ordre d'affichage |
| Calcul pur | aucun |
| Ordre du joueur | aucun |
| Coût par tick | inchangé / hors `step()` |

### Étapes et tests

#### Étape 1 — Chaque carte du catalogue est jouable — ⬜
| # | Test (`it`) | Fichier de test | RM |
|---|-------------|-----------------|----|
| 1 | `[RM-05] trouve un chemin pour chaque tronçon quand la carte n'a aucune tour` (pour chaque carte de `MAPS`) | `tests/domain/catalog/map.test.ts` (nouveau) | RM-05 |
| 2 | `[RM-05] rend non constructibles le portail, les pierres et la porte` (pour chaque carte) | idem | RM-05 |
| 3 | `[RM-05] numérote les pierres sans trou à partir de 1` (pour chaque carte) | idem | RM-05 |
| 4 | `propose Le Gué des Runes, La Spirale et Les Deux Sceaux aux tailles et nombres de pierres prévus` | idem | RM-05 |
| 5 | `[CU-02] fait sortir une créature des Deux Sceaux après la pierre 1 puis la pierre 2` | idem | CU-02 |

**Production autorisée** : `src/domain/model/types.ts` (`MapDef.id`), `src/domain/catalog/map.ts` (`MAP_SPIRAL`, `MAP_SEALS`, `MAPS`, `id` du Gué).

#### Étape 2 — Les règles sont les mêmes sur toutes les cartes — ⬜
| # | Test (`it`) | Fichier de test | RM |
|---|-------------|-----------------|----|
| 1 | `[RM-08] démarre avec le même or et les mêmes vies sur chaque carte quand la difficulté est la même` | `tests/domain/catalog/map.test.ts` | RM-08 |
| 2 | `[RM-08] lance la même première vague sur chaque carte` | idem | RM-08 |

**Production autorisée** : aucune attendue (comportement existant) ; si rouge, `src/domain/model/World.ts` seulement.

#### Étape 3 — Vérification — ⬜
Pas de nouveau test. `npx tsc --noEmit` + `npm test` (`balance.test.ts` n'est joué que sur le Gué des Runes, H1 de la spec).

### Éléments de code
Signatures seulement, jamais de corps.
- `domain/model/types.ts` — `MapDef.id: string` (nouveau).
- `domain/catalog/map.ts` — `export const MAP_SPIRAL: MapDef`, `export const MAP_SEALS: MapDef` — dispositions de la spec §6, rochers réglés en jouant.
- `domain/catalog/map.ts` — `export const MAPS: MapDef[]` — `[MAP_CROSSING, MAP_SPIRAL, MAP_SEALS]`.

### Hypothèses
_Vide à l'écriture. Rempli par `/implement-tdd` : `Hn — [hypothèse] — à valider par [qui]`._

---

## Lot F3 — Choix de carte et records — ⬜

### Intention
L'écran titre fait choisir carte et difficulté, affiche le record de chaque couple et démarre sur la carte choisie. **RM** : RM-06, RM-07 · **CU** : CU-01

### Conception
| Point | Décision |
|-------|----------|
| Règles appliquées | ARCH-01 (`RecordBook`, `withRecord`, `importLegacyRecords`, `drawMapThumbnail`), ARCH-02 (`domain/rules/records.ts` ; `presentation` lit `localStorage` et appelle la règle ; vignette dans `infrastructure/render`), ARCH-03 (aucun ordre : la carte est passée au constructeur de `World`, rien n'est écrit dans `World` depuis `presentation`), ARCH-04 (tenue des records = fonctions pures), ARCH-05 (la graine reste tirée par `Game.createWorld` comme aujourd'hui ; carte + graine + journal suffisent au rejeu), ARCH-08 (étend `loadBest`/`saveBest`/`showStart` ; vignette via `Grid` existant) |
| Données | aucune nouvelle ; lit `MAPS` |
| Calcul pur | `withRecord`, `importLegacyRecords` dans `domain/rules/records.ts` |
| Ordre du joueur | aucun |
| Coût par tick | hors `step()` |

### Étapes et tests

#### Étape 1 — Un record par carte et difficulté, anciens records conservés — ⬜
| # | Test (`it`) | Fichier de test | RM |
|---|-------------|-----------------|----|
| 1 | `[RM-06] garde le meilleur résultat séparément pour chaque carte et difficulté` | `tests/domain/rules/records.test.ts` (nouveau) | RM-06 |
| 2 | `[RM-06] ne remplace pas un record par un résultat moins bon` | idem | RM-06 |
| 3 | `[RM-06] attribue les records existants au Gué des Runes quand on les importe` | idem | RM-06 |
| 4 | `[RM-06] garde le plus haut quand un ancien et un nouveau record existent pour la même difficulté` | idem | RM-06 |

**Production autorisée** : `src/domain/rules/records.ts` (nouveau, calqué sur `pricing.ts`), `src/presentation/Game.ts` (`BEST_KEY` v2, `loadBest`, `saveBest` avec l'id de la carte jouée).

#### Étape 2 — Le joueur choisit sa carte à l'écran titre — ⬜
| # | Test (`it`) | Fichier de test | RM |
|---|-------------|-----------------|----|
| 1 | `[CU-01] présélectionne Le Gué des Runes quand le joueur n'a rien choisi` | `tests/domain/catalog/map.test.ts` | CU-01 |
| 2 | `[RM-07] démarre la partie sur la carte passée en paramètre` | `tests/domain/model/World.test.ts` | RM-07 |

Écran (non testé en unitaire, vérifié par `npm run dev`) : groupe radio des cartes (nom + vignette), boutons de difficulté affichant le record de la carte sélectionnée, « Commencer » crée la partie sur le couple choisi.

**Production autorisée** : `src/presentation/Game.ts` (`mapId`, `createWorld(map, d)`, `newGame`, `showStart`), `src/infrastructure/render/sprites.ts` (`drawMapThumbnail`), `index.html` (style des cartes, calqué sur `.diff`).

#### Étape 3 — Vérification — ⬜
Pas de nouveau test. `npx tsc --noEmit` + `npm test`.

### Éléments de code
Signatures seulement, jamais de corps.
- `domain/rules/records.ts` — `export type RecordBook = Record<string, Partial<Record<Difficulty, number>>>`.
- `domain/rules/records.ts` — `export function withRecord(book: RecordBook, mapId: string, difficulty: Difficulty, reached: number): RecordBook` — nouveau carnet, maximum conservé.
- `domain/rules/records.ts` — `export function importLegacyRecords(book: RecordBook, legacy: Partial<Record<Difficulty, number>>, mapId: string): RecordBook` — fusion au maximum sous `mapId`.
- `infrastructure/render/sprites.ts` — `export function drawMapThumbnail(ctx: CanvasRenderingContext2D, map: MapDef, size: number): void` — une couleur `PAL` par nature de case, via `new Grid(map)`.
- `presentation/Game.ts` — `private createWorld(map: MapDef, d: Difficulty): World` ; `private mapId: string` (défaut `MAPS[0].id`).

### Hypothèses
_Vide à l'écriture. Rempli par `/implement-tdd` : `Hn — [hypothèse] — à valider par [qui]`._
