# PLAN — Bilan de partie

> Spec : `todo/bilan-de-partie/SPEC.md`

## Avancement

| Lot | Intention | RM/CU | Dépend de | État |
|-----|-----------|-------|-----------|------|
| F1 | La simulation garde la trace de chaque tour posée et de chaque vague lancée, sans rien changer au déroulement. | RM-01, RM-02, RM-04, RM-06 | — | ✅ |
| F2 | Les quatre calculs du bilan (classement, familles, courbe, pertes) sont des règles pures. | RM-01, RM-03, RM-04, RM-05 | F1 | ✅ |
| F3 | L'écran de fin affiche le bilan en quatre onglets. | RM-01, RM-03, RM-04, RM-05 / CU-01 | F2 | ⬜ |

## Périmètre

- **Réutilisé** :
  - `Tower.damage`, `Tower.kills`, `Tower.spent` (`src/domain/model/types.ts:108`) : déjà incrémentés par `applyDamage` (`src/domain/systems/combat.ts:136`), surplus déjà exclu (`Math.min(dmg, dmg + c.hp)`, `combat.ts:143`).
  - `Stats` et `world.stats` (`src/domain/model/World.ts:20`, `:59`) : étendus plutôt qu'un nouvel objet de relevé (ARCH-08).
  - `poisons[].towerId` (`src/domain/model/types.ts:97`) : l'attribution d'un poison à sa tour existe déjà ; seule la recherche de la tour change.
  - `launchWave` (`src/domain/systems/waves.ts:26`), boucle des vagues terminées (`waves.ts:84`), `advanceLeg` (`src/domain/systems/movement.ts:69`) : points d'accroche du relevé par vague.
  - `FAMILY_LABEL`, `fmt0`, `fmt1` (`src/presentation/describe.ts:26`, `:10`) : libellés et formats.
  - `showEnd` (`src/presentation/Game.ts:823`) et styles `.endstats` (`index.html:167`).
- **Hors périmètre** : bilan en cours de partie, historique, export (spec § 8). Destruction de tour par un briseur : livrée par `creatures-et-vagues`, qui posera `fate = 'destroyed'`. Bouclier : livré par `creatures-et-vagues`, qui devra annuler le coup avant l'incrément de `Tower.damage`.
- **Règles N/A** :
  - ARCH-03 — N/A : aucun nouvel ordre du joueur ; le relevé est écrit par la simulation et les commandes existantes, le bilan est en lecture seule.
  - ARCH-06 — N/A : aucun contenu de jeu ajouté ; la famille « Hybrides » se déduit de la propriété existante `TowerDef.elements`.
- **Décisions** (2026-09-25, avec l'utilisateur) :
  - Une tour infusée compte tous ses dégâts dans sa famille actuelle (« Hybrides »), y compris ceux d'avant l'infusion.
  - Or d'une vague = or possédé après prime de fin de vague et intérêts. Vague non terminée à la défaite = or au moment de la défaite.
  - Libellés de famille = `FAMILY_LABEL` existant (« Artillerie » pour la famille Canon) ; seul « Hybrides » est ajouté.
  - Vies perdues par une évasion plafonnées aux vies restantes (une vague ne peut pas coûter plus que ce qu'il restait).

## Traçabilité

| RM/CU | Porté par | Lot |
|-------|-----------|-----|
| RM-01 — registre de toutes les tours posées, avec état | `Stats.towers`, `Tower.fate` ; `build`, `sell` | F1 |
| RM-01 — classement trié, murs exclus, rendement | `domain/rules/debrief.ts` `towerRanking()`, `towerYield()` | F2 |
| RM-01 — onglet « Tours » | `presentation/describe.ts` `debriefTowers()` | F3 |
| RM-02 — dégâts d'un poison après vente créditent la tour | `applyDamage` lit `world.stats.towers` (`combat.ts`) | F1 |
| RM-02 — tour améliorée = une seule ligne, nom actuel | même `Tower` (id inchangé) dans `Stats.towers` | F1 |
| RM-03 — dégâts et part par famille | `domain/rules/debrief.ts` `familyDamage()` ; `describe.ts` `debriefFamilies()` | F2, F3 |
| RM-04 — vies perdues et or par vague | `Stats.waves` ; `launchWave`, vagues terminées, `advanceLeg` | F1 |
| RM-04 — courbe, vague inachevée à la défaite | `domain/rules/debrief.ts` `waveCurve()` ; `describe.ts` `debriefWaves()` | F2, F3 |
| RM-05 — tours détruites et or investi | `domain/rules/debrief.ts` `breakerLosses()` ; `describe.ts` `debriefBreakers()` | F2, F3 |
| RM-06 — même graine + mêmes ordres = même bilan | aucun aléatoire dans le relevé ; test de rejeu | F1 |
| CU-01 — lire le bilan, 4 onglets, « Tours » par défaut | `Game.showEnd()` | F3 |

---

## Lot F1 — Relevé pendant la partie — ✅

### Intention
La simulation conserve chaque tour posée (même vendue) avec son état, attribue les dégâts posthumes à la bonne tour, et note vies perdues et or par vague. **RM** : RM-01, RM-02, RM-04, RM-06

### Conception
| Point | Décision |
|-------|----------|
| Règles appliquées | ARCH-01, ARCH-02, ARCH-05, ARCH-07, ARCH-08 |
| Données | `Tower.fate` ; `Stats.towers: Map<number, Tower>` (toutes les tours posées, ordre de pose) ; `Stats.waves: WaveTally[]` (indexé par vague). Noms : « sort » de la tour, « décompte » de vague (ARCH-01). Tout dans `domain/model` (ARCH-02). |
| Calcul pur | aucun (écritures de compteurs) |
| Ordre du joueur | aucun ; `build` et `sell` existants complétés |
| Aléatoire | aucun (ARCH-05) |
| Coût par tick | `applyDamage` : une lecture de `Map` au lieu d'une autre, O(1) ; `advanceLeg` et vagues terminées : O(1) par évènement (ARCH-07) |
| Réutilisation | `towerById` non réutilisé pour le registre : les commandes s'en servent pour trouver une tour **en place** ; y garder les tours vendues rendrait `sell`/`upgrade` possibles sur elles (ARCH-08). |

### Étapes et tests
Tests écrits et **rouges avant toute ligne de production** de l'étape. Ordre : cas nominal d'abord (il fixe les signatures), refus ensuite.

#### Étape 1 — Le registre garde toute tour posée avec son sort — ✅
| # | Test (`it`) | Fichier de test | RM |
|---|-------------|-----------------|----|
| 1 | `[RM-01] inscrit la tour posée au registre, en place` | `tests/application/commands/build.test.ts` | RM-01 |
| 2 | `[RM-01] garde la tour vendue au registre, marquée vendue, avec ses dégâts et éliminations` | `tests/application/commands/sell.test.ts` | RM-01 |
| 3 | `[RM-02] garde une seule entrée sous le nom amélioré quand la tour est améliorée` | `tests/application/commands/upgrade.test.ts` | RM-02 |

**Production autorisée** : `src/domain/model/types.ts` (`TowerFate`, `Tower.fate`), `src/domain/model/World.ts` (`Stats.towers`), `src/application/commands/build.ts`, `src/application/commands/sell.ts`.

#### Étape 2 — Les dégâts posthumes reviennent à la tour qui a tiré — ✅
| # | Test (`it`) | Fichier de test | RM |
|---|-------------|-----------------|----|
| 1 | `[RM-02] crédite la tour vendue des dégâts de son poison encore actif` | `tests/domain/systems/status.test.ts` | RM-02 |
| 2 | `[RM-02] crédite la tour vendue de l'élimination faite par son poison` | idem | RM-02 |
| 3 | `[RM-01] ne compte pas le surplus de dégâts au-delà des PV restants` | idem | RM-01 |

**Production autorisée** : `src/domain/systems/combat.ts` (`applyDamage` : recherche de la tour dans `world.stats.towers`).

#### Étape 3 — Chaque vague lancée note ses vies perdues et l'or à sa fin — ✅
| # | Test (`it`) | Fichier de test | RM |
|---|-------------|-----------------|----|
| 1 | `[RM-04] note les vies perdues de la vague quand ses créatures s'échappent` | `tests/domain/model/World.test.ts` | RM-04 |
| 2 | `[RM-04] note l'or possédé après prime et intérêts quand la vague se termine` | idem | RM-04 |
| 3 | `[RM-04] impute l'évasion à la vague de la créature quand deux vagues se chevauchent` | idem | RM-04 |
| 4 | `[RM-04] laisse l'or non renseigné et garde les vies perdues quand la vague est en cours à la défaite` | idem | RM-04 |
| 5 | `[RM-04] ne compte pas plus de vies perdues que les vies restantes` | idem | RM-04 |
| 6 | `[RM-04] ne compte aucune vie perdue au-delà de la défaite quand plusieurs créatures s'échappent au même tick` | idem | RM-04 |

**Production autorisée** : `src/domain/model/types.ts` (`WaveTally`), `src/domain/model/World.ts` (`Stats.waves`), `src/domain/systems/waves.ts` (`launchWave`, boucle des vagues terminées), `src/domain/systems/movement.ts` (`advanceLeg`).

#### Étape 4 — Le relevé se rejoue à l'identique — ✅
| # | Test (`it`) | Fichier de test | RM |
|---|-------------|-----------------|----|
| 1 | `[RM-06] produit le même registre de tours et le même décompte de vagues quand la partie est rejouée depuis le journal` | `tests/domain/model/World.test.ts` | RM-06 |

**Production autorisée** : aucune (doit passer avec les étapes 1-3 ; sinon corriger dans les fichiers déjà autorisés).

#### Étape 5 — Vérification — ✅
Pas de nouveau test. `npx tsc --noEmit` + `npm test` (inclut `balance.test.ts` : aucun chiffre de `catalog/` ne bouge, il doit rester vert tel quel).

### Éléments de code
Signatures seulement, jamais de corps.
- `domain/model/types.ts` — `export type TowerFate = 'standing' | 'sold' | 'destroyed'` (nouveau) ; `Tower.fate: TowerFate` (nouveau)
- `domain/model/types.ts` — `export interface WaveTally { livesLost: number; gold: number | null }` (nouveau) — `gold` à `null` tant que la vague n'est pas terminée
- `domain/model/World.ts` — `Stats.towers: Map<number, Tower>`, `Stats.waves: WaveTally[]` (nouveaux) ; initialisés vides
- `application/commands/build.ts` — pose `fate: 'standing'`, inscrit la tour dans `world.stats.towers`
- `application/commands/sell.ts` — pose `fate: 'sold'` ; la tour reste dans `world.stats.towers`
- `domain/systems/combat.ts` — `applyDamage` : tour cherchée dans `world.stats.towers` au lieu de `world.towerById`
- `domain/systems/waves.ts` — `launchWave` : `stats.waves[index] = { livesLost: 0, gold: null }` ; vague terminée : `gold = world.gold` après `addGold`
- `domain/systems/movement.ts` — `advanceLeg` : ajoute `max(0, min(leak, vies restantes))` au décompte de `c.wave` avant de retirer les vies ; créature sans vague lancée (tests directs) : ignorée

### Hypothèses
- H1 — Le test `[RM-06]` de l'étape 4 passe vert dès l'écriture (prévu par le plan) ; gardé car non couvert ailleurs et capable d'échouer (contre-preuve : journal amputé de sa dernière commande, rouge). — à valider par l'utilisateur
- H2 — Le test `[RM-04] ne compte pas plus de vies perdues que les vies restantes` observe la somme des `livesLost` de toutes les vagues, pas `waves[w.wave]` : la créature qui s'échappe peut appartenir à une vague antérieure à la dernière lancée. — à valider par l'utilisateur
- H3 — Imputation d'une fuite bornée à 0 (`max(0, min(leak, vies restantes))`) : après la défaite, les vies ne sont plus ramenées à 0 et deviennent négatives quand plusieurs créatures s'échappent au même tick ; sans plancher, le décompte baisserait. Couvert par le test n° 6 de l'étape 3. — à valider par l'utilisateur

---

## Lot F2 — Calculs du bilan — ✅

### Intention
Classement des tours, dégâts par famille, courbe par vague et pertes aux briseurs, en fonctions pures lues par l'écran. **RM** : RM-01, RM-03, RM-04, RM-05

### Conception
| Point | Décision |
|-------|----------|
| Règles appliquées | ARCH-01, ARCH-02, ARCH-04, ARCH-05, ARCH-08 |
| Données | `DebriefFamily = Exclude<Family, 'wall'> \| 'hybrid'` ; lignes de résultat typées dans le même fichier |
| Calcul pur | `domain/rules/debrief.ts` (nouveau, calqué sur `pricing.ts`) — reçoit les tours et décomptes, jamais `World` (ARCH-04) |
| Ordre du joueur | aucun |
| Aléatoire | aucun ; égalités départagées par id de tour (ARCH-05) |
| Coût par tick | hors `step()` : appelé une fois à l'affichage de l'écran de fin |
| Réutilisation | pas de query `application/` (contrairement à `waveBriefing`) : les calculs ne lisent que `world.stats`, `presentation` peut appeler `domain/rules` comme elle le fait pour `refundValue` (ARCH-08). « Bilan » = `debrief` (ARCH-01). |

### Étapes et tests
Tests écrits et **rouges avant toute ligne de production** de l'étape. Ordre : cas nominal d'abord (il fixe les signatures), refus ensuite.

#### Étape 1 — Classement des tours par dégâts effectifs — ✅
| # | Test (`it`) | Fichier de test | RM |
|---|-------------|-----------------|----|
| 1 | `[RM-01] classe les tours par dégâts effectifs décroissants, vendues comprises` | `tests/domain/rules/debrief.test.ts` | RM-01 |
| 2 | `[RM-01] exclut les murs restés murs et garde un mur transformé en tour` | idem | RM-01 |
| 3 | `[RM-01] calcule le rendement en dégâts par pièce d'or investie` | idem | RM-01 |
| 4 | `[RM-01] départage deux tours à dégâts égaux par ordre de pose` | idem | RM-01 |

**Production autorisée** : `src/domain/rules/debrief.ts` (`towerRanking`, `towerYield`).

#### Étape 2 — Dégâts et part de chaque famille — ✅
| # | Test (`it`) | Fichier de test | RM |
|---|-------------|-----------------|----|
| 1 | `[RM-03] somme les dégâts par famille avec leur part du total, triés par ordre décroissant` | `tests/domain/rules/debrief.test.ts` | RM-03 |
| 2 | `[RM-03] range une tour infusée dans les hybrides, dégâts d'avant l'infusion compris` | idem | RM-03 |
| 3 | `[RM-03] omet les familles sans dégâts et rend une liste vide quand aucun dégât n'a été infligé` | idem | RM-03 |

**Production autorisée** : `src/domain/rules/debrief.ts` (`familyDamage`, `DebriefFamily`).

#### Étape 3 — Courbe vague par vague — ✅
| # | Test (`it`) | Fichier de test | RM |
|---|-------------|-----------------|----|
| 1 | `[RM-04] donne pour chaque vague lancée ses vies perdues et l'or à sa fin` | `tests/domain/rules/debrief.test.ts` | RM-04 |
| 2 | `[RM-04] donne l'or de fin de partie à une vague inachevée à la défaite` | idem | RM-04 |

**Production autorisée** : `src/domain/rules/debrief.ts` (`waveCurve`).

#### Étape 4 — Pertes aux briseurs — ✅
| # | Test (`it`) | Fichier de test | RM |
|---|-------------|-----------------|----|
| 1 | `[RM-05] compte les tours détruites et l'or qu'elles avaient coûté` | `tests/domain/rules/debrief.test.ts` | RM-05 |
| 2 | `[RM-05] rend zéro perte quand aucune tour n'a été détruite, vendues ignorées` | idem | RM-05 |

**Production autorisée** : `src/domain/rules/debrief.ts` (`breakerLosses`).

#### Étape 5 — Vérification — ✅
Pas de nouveau test. `npx tsc --noEmit` + `npm test`.

### Éléments de code
Signatures seulement, jamais de corps.
- `domain/rules/debrief.ts` — `export type DebriefFamily = Exclude<Family, 'wall'> | 'hybrid'`
- `domain/rules/debrief.ts` — `export function towerRanking(towers: Iterable<Tower>): Tower[]` — exclut `def.family === 'wall'` ; tri `damage` décroissant puis `id` croissant
- `domain/rules/debrief.ts` — `export function towerYield(t: Tower): number` — `damage / spent`
- `domain/rules/debrief.ts` — `export function familyDamage(towers: Iterable<Tower>): { family: DebriefFamily; damage: number; share: number }[]` — famille = `'hybrid'` si `def.elements`, sinon `def.family` ; murs et familles à 0 omis ; `share` entre 0 et 1 ; tri décroissant
- `domain/rules/debrief.ts` — `export function waveCurve(waves: WaveTally[], finalGold: number): { wave: number; livesLost: number; gold: number }[]` — `gold` `null` remplacé par `finalGold`
- `domain/rules/debrief.ts` — `export function breakerLosses(towers: Iterable<Tower>): { count: number; gold: number }` — tours `fate === 'destroyed'`, somme de `spent`

### Hypothèses
_Vide à l'écriture. Rempli par `/implement-tdd` : `Hn — [hypothèse] — à valider par [qui]`._

---

## Lot F3 — Écran du bilan — ⬜

### Intention
Sous les cinq totaux de l'écran de fin, quatre onglets « Tours », « Familles », « Vagues », « Briseurs », « Tours » ouvert par défaut. **RM** : RM-01, RM-03, RM-04, RM-05 · **CU** : CU-01

### Conception
| Point | Décision |
|-------|----------|
| Règles appliquées | ARCH-01, ARCH-02, ARCH-08 |
| Données | `FAMILY_LABEL.hybrid = 'Hybrides'` ; `FATE_LABEL: Record<TowerFate, string>` (« En place », « Vendue », « Détruite ») |
| Calcul pur | aucun nouveau : `describe.ts` met en forme les sorties de `debrief.ts` (textes testables) ; `Game.showEnd` assemble et bascule les onglets (DOM, non testé) |
| Ordre du joueur | aucun (lecture seule de `world.stats`) |
| Coût par tick | hors `step()` |
| Réutilisation | `describe.ts` étendu (déjà porteur des textes testés : `towerInfo`, `briefingInfo`) plutôt qu'un nouveau module ; styles calqués sur `.endstats` (ARCH-08) |

### Étapes et tests
Tests écrits et **rouges avant toute ligne de production** de l'étape. Ordre : cas nominal d'abord (il fixe les signatures), refus ensuite.

#### Étape 1 — Textes des quatre onglets — ⬜
| # | Test (`it`) | Fichier de test | RM |
|---|-------------|-----------------|----|
| 1 | `[RM-01] liste chaque tour avec nom, état, dégâts, éliminations, or investi et rendement` | `tests/presentation/describe.test.ts` | RM-01 |
| 2 | `[RM-03] affiche chaque famille avec son libellé, ses dégâts et sa part en pourcentage, hybrides compris` | idem | RM-03 |
| 3 | `[RM-04] affiche chaque vague avec ses vies perdues et son or` | idem | RM-04 |
| 4 | `[RM-05] affiche le nombre de tours détruites et l'or qu'elles représentaient` | idem | RM-05 |
| 5 | `[RM-05] affiche « Aucune tour perdue » quand aucune tour n'a été détruite` | idem | RM-05 |

**Production autorisée** : `src/presentation/describe.ts` (`FAMILY_LABEL`, `FATE_LABEL`, `debriefTowers`, `debriefFamilies`, `debriefWaves`, `debriefBreakers`).

#### Étape 2 — Onglets sur l'écran de fin — ⬜
Pas de test unitaire (DOM, `.claude/rules/presentation.md`). Contrôle manuel via `npm run dev` : victoire, défaite et défaite en mode infini affichent les cinq totaux puis les quatre onglets, « Tours » ouvert, bascule au clic, boutons « Nouvelle partie » / « Continuer en mode infini » inchangés. **CU** : CU-01.

**Production autorisée** : `src/presentation/Game.ts` (`showEnd`), `index.html` (styles des onglets et barres, à côté de `.endstats`).

#### Étape 3 — Vérification — ⬜
Pas de nouveau test. `npx tsc --noEmit` + `npm test`.

### Éléments de code
Signatures seulement, jamais de corps.
- `presentation/describe.ts` — `FAMILY_LABEL` : entrée `hybrid: 'Hybrides'` (ajout)
- `presentation/describe.ts` — `export const FATE_LABEL: Record<TowerFate, string>` (nouveau)
- `presentation/describe.ts` — `export function debriefTowers(towers: Tower[]): string` — tableau, rendement via `towerYield`
- `presentation/describe.ts` — `export function debriefFamilies(rows: ReturnType<typeof familyDamage>): string` — barres, part en %
- `presentation/describe.ts` — `export function debriefWaves(rows: ReturnType<typeof waveCurve>): string`
- `presentation/describe.ts` — `export function debriefBreakers(losses: ReturnType<typeof breakerLosses>): string` — « Aucune tour perdue » si `count === 0`
- `presentation/Game.ts` — `showEnd()` : ajoute la barre d'onglets et les quatre panneaux sous `.endstats`, « Tours » actif par défaut

### Hypothèses
_Vide à l'écriture. Rempli par `/implement-tdd` : `Hn — [hypothèse] — à valider par [qui]`._
