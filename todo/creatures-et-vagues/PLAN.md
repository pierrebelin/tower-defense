# PLAN — Créatures et vagues

> Spec : `todo/creatures-et-vagues/SPEC.md`

## Avancement

| Lot | Intention | RM/CU | Dépend de | État |
|-----|-----------|-------|-----------|------|
| F1 | Une vague est faite de groupes, chacun avec son délai et son intervalle ; l'aperçu les liste. | RM-01, RM-02, RM-03 / CU-01 | — | ⬜ |
| F2 | Garde runique, Coureur des dunes, Chaman et fureur de l'Ogre : capacités lues au combat et au déplacement. | RM-09, RM-10, RM-12, RM-13 / CU-03, CU-04 | — | ⬜ |
| F3 | Limon et Hydre font naître des rejetons qui comptent dans la vague. | RM-02, RM-11, RM-14 / CU-01, CU-03, CU-04 | F1, F2 | ⬜ |
| F4 | Sapeur gobelin et Seigneur des cendres détruisent périodiquement la tour la plus proche. | RM-04 à RM-08, RM-15, RM-16 / CU-02, CU-04 | F2 | ⬜ |
| F5 | La nouvelle campagne mixte est jouée, dessinée et équilibrée. | RM-01, RM-17 / CU-01, CU-04 | F1, F2, F3, F4 | ⬜ |

## Périmètre

- **Réutilisé** :
  - `Spawner` + boucle d'apparition `src/domain/systems/waves.ts:5`, `:72` — un groupe = un `Spawner` dont `timer` démarre au délai de départ.
  - `world.pending` / `creepGone` `src/domain/model/World.ts:53`, `:157` — décompte par vague, étendu aux rejetons.
  - `spawnCreep` `src/domain/systems/waves.ts:43` — PV et prime des rejetons (`creepHp`, `bountyFor`).
  - `hitCreep` `src/domain/systems/combat.ts:130` — point unique de tout coup (projectile, rebond, éclat) : bouclier et sprint s'y branchent.
  - `applyDamage` `src/domain/systems/combat.ts:135` — seul endroit où les PV baissent : scission et têtes s'y branchent.
  - Boucle de `updateStatuses` `src/domain/systems/status.ts:6` — minuteries du sprint.
  - Retrait d'une tour de `sell` `src/application/commands/sell.ts:10-14` — extrait en `World.removeTower`, réutilisé par la destruction.
  - Gel qui immobilise `src/domain/systems/movement.ts:6` ; chef jamais gelé `src/domain/systems/status.ts:35` (H2 confirmée).
  - `waveBriefing` `src/application/queries/waveBriefing.ts:16`, `briefingChip` / `briefingInfo` / `nextWaveInfo` `src/presentation/describe.ts:114-139`.
  - `CREEP_STYLE` `src/infrastructure/render/palette.ts:43`, `drawCreep` `src/infrastructure/render/sprites.ts:758`.
  - Bot `tests/support/bot.ts:29`, `newWorld` / `run` `tests/support/helpers.ts`.
- **Hors périmètre** : réparation automatique (spec § 7) ; mode infini à modificateurs, nouvelles cartes, bilan ; créatures volantes à capacité ; textes d'aide par capacité (étiquettes, conseils de contre) au-delà du nom et du nombre par groupe (RM-03) ; bannière et son de début de vague par groupe (ils gardent la créature du premier groupe).
- **Règles N/A** : aucune — ARCH-01 à ARCH-08 appliquées dans les lots.
- **Décisions** :
  - 2026-09-25 — RM-17 : `balance.test.ts` exige en Vétéran la victoire sur les 3 graines et `lives ≥ 8` (≤ 12 vies perdues, niveau actuel). Recrue : victoire inchangée.
  - 2026-09-25 — Le bot d'équilibrage reconstruit toute case de son plan libérée par une destruction (mur puis amélioration comme d'habitude).
  - 2026-09-25 — Les rejetons nés d'un coup (scission, têtes) ne subissent ni l'éclat ni la chaîne de ce coup : ils rejoignent `world.creeps` en fin de pas.
  - 2026-09-25 (sans question, défaut raisonnable) — Distance briseur → tour : du centre de la créature au centre de la case la plus proche de l'emprise 2×2. Portée inclusive.
  - 2026-09-25 (défaut) — Un « coup » (RM-10, RM-12) = un passage par `hitCreep` ; une dose de poison n'est jamais un coup.
  - 2026-09-25 (défaut) — Premier soin du Chaman 3 s après son apparition ; le gel ne suspend que le cycle du briseur (RM-04), pas le soin.
  - 2026-09-25 (défaut) — Un seul coup qui franchit plusieurs seuils de l'Hydre fait naître les têtes de chaque seuil franchi, coup mortel compris.
  - 2026-09-25 (défaut) — Rayons de collision des nouvelles créatures fixés à l'implémentation, calqués sur une créature voisine de même gabarit.
  - 2026-09-25 (défaut) — Un événement `destroyed` signale la destruction pour les effets et le son (sinon la tour disparaît sans retour visuel).

## Traçabilité

| RM/CU | Porté par | Lot |
|-------|-----------|-----|
| RM-01 — vague = groupes (délai, intervalle) | `WaveGroup`, `WaveDef.groups` ; `launchWave` pousse un `Spawner` par groupe | F1 |
| RM-01 — campagne 6-30 du § 6 | `WAVES` dans `domain/catalog/creeps.ts` | F5 |
| RM-02 — fin de vague unique | `launchWave` : `pending` = somme des groupes ; `updateWaves` inchangé | F1 |
| RM-02 — rejetons comptés | `spawnOffspring` incrémente `pending` | F3 |
| RM-03 — aperçu par groupe, chef en premier | `waveBriefing` → `groups[]` triés chef d'abord ; `briefingChip` / `briefingInfo` / `nextWaveInfo` | F1 |
| RM-04 — cycle du briseur | `CreepDef.breaker`, `Creep.breaker` ; `updateAbilities` | F4 |
| RM-05 — destruction de la tour la plus proche | `nearestTowers()` `domain/rules/breaker.ts` ; `World.removeTower` | F4 |
| RM-06 — aucune tour à portée | `updateAbilities` passe en recharge sans destruction | F4 |
| RM-07 — briseur mort ne détruit rien | `updateAbilities` ignore les créatures mortes | F4 |
| RM-08 — briseur chargé visible | `Creep.breaker.phase === 'window'` lu par `drawCreep` | F4 |
| RM-09 — soin du Chaman | `CreepDef.heal`, `Creep.healTimer` ; `updateAbilities` | F2 |
| RM-10 — bouclier | `CreepDef.shield`, `Creep.shield` ; `hitCreep` | F2 |
| RM-11 — scission du Limon | `CreepDef.split` ; `applyDamage` → `spawnOffspring` | F3 |
| RM-12 — sprint | `CreepDef.sprint`, `Creep.sprint` / `sprintCooldown` ; `hitCreep`, `updateStatuses`, `creepSpeed` | F2 |
| RM-13 — fureur de l'Ogre | `CreepDef.fury` ; `creepSpeed()` `domain/rules/speed.ts` | F2 |
| RM-14 — têtes de l'Hydre | `CreepDef.brood`, `Creep.brood` ; `applyDamage` → `spawnOffspring` | F3 |
| RM-15 — Seigneur des cendres briseur | `CREEPS.ashlord.breaker` | F4 |
| RM-16 — déterminisme | `world.rng` : instant tiré, égalité entre tours | F4 |
| RM-17 — équilibrage | `tests/balance.test.ts`, bot qui reconstruit | F5 |
| CU-01 — affronter une vague mixte | F1 (groupes, aperçu, fin unique) + F3 (rejetons) + F5 (campagne) | F1, F3, F5 |
| CU-02 — perdre une tour face à un briseur | `updateAbilities` + `World.removeTower` + `refreshPaths` | F4 |
| CU-03 — tuer une créature à capacité | Chaman, Garde, Coureur (F2) ; Limon (F3) | F2, F3 |
| CU-04 — vaincre un chef | Ogre (F2), Hydre (F3), Seigneur (F4), vague 30 escortée (F5) | F2, F3, F4, F5 |

---

## Lot F1 — Vagues mixtes — ⬜

### Intention
Une vague aligne plusieurs groupes décalés, se termine une seule fois, et l'aperçu montre chaque groupe. La campagne reste identique (chaque vague actuelle = un seul groupe). **RM** : RM-01, RM-02, RM-03 · **CU** : CU-01

### Conception
| Point | Décision |
|-------|----------|
| Règles appliquées | ARCH-01 (`WaveGroup`, `groups`), ARCH-02 (catalogue/système en `domain`, aperçu en `application`, textes en `presentation`), ARCH-05 (aucun aléatoire ajouté), ARCH-06 (vague = donnée de `catalog/`), ARCH-07, ARCH-08 (un groupe = un `Spawner` existant, `timer` initial = délai ; pas de nouveau type d'apparition) |
| Données | `WaveGroup { creep, count, interval, delay }` ; `WaveDef { groups: WaveGroup[] }` remplace `{ creep, count, interval }` |
| Calcul pur | `waveDuration(index)` = max des `delay + (count − 1) × interval` |
| Ordre du joueur | aucun |
| Coût par tick | O(groupes en cours), inchangé |

### Étapes et tests
Tests écrits et **rouges avant toute ligne de production** de l'étape. Ordre : cas nominal d'abord (il fixe les signatures), refus ensuite.

#### Étape 1 — Chaque groupe apparaît à son rythme — ⬜
| # | Test (`it`) | Fichier de test | RM |
|---|-------------|-----------------|----|
| 1 | `[RM-01] fait apparaître chaque groupe au bout de son délai de départ puis à son intervalle` | `tests/domain/systems/waves.test.ts` (nouveau) | RM-01 |
| 2 | `[RM-01] fait apparaître le nombre de créatures de chaque groupe quand la vague est mixte` | idem | RM-01 |
| 3 | `[RM-01] fixe la vague suivante après l'apparition du groupe le plus tardif` | idem | RM-01 |
| 4 | `[RM-01] multiplie chaque groupe par 1,2 en mode infini sauf un chef seul` | idem | RM-01 |

**Production autorisée** : `src/domain/model/types.ts` (`WaveGroup`, `WaveDef`), `src/domain/catalog/creeps.ts` (helpers `G`, `W`, `WAVES` réécrit à l'identique, `waveAt`), `src/domain/systems/waves.ts` (`waveDuration`, `launchWave`).

#### Étape 2 — La vague mixte se termine une seule fois — ⬜
| # | Test (`it`) | Fichier de test | RM |
|---|-------------|-----------------|----|
| 1 | `[RM-02] verse prime et intérêts une seule fois quand toutes les créatures des groupes sont mortes ou sorties` | `tests/domain/systems/waves.test.ts` | RM-02 |
| 2 | `[RM-02] ne termine pas la vague quand un groupe retardé n'est pas encore apparu` | idem | RM-02 |

**Production autorisée** : `src/domain/systems/waves.ts` (`launchWave` : `pending` = somme des `count`).

#### Étape 3 — L'aperçu liste chaque groupe, chef en premier — ⬜
| # | Test (`it`) | Fichier de test | RM |
|---|-------------|-----------------|----|
| 1 | `[RM-03] annonce chaque groupe avec sa créature, son nombre et ses PV` (test existant adapté à `groups`) | `tests/application/queries/waveBriefing.test.ts` | RM-03 |
| 2 | `[RM-03] place le chef en premier quand la vague a un chef` | idem | RM-03 |
| 3 | `[RM-03] résume chaque groupe dans la barre du haut quand la vague est mixte` | `tests/presentation/describe.test.ts` | RM-03 |
| 4 | `[RM-03] détaille les PV et la prime de chaque groupe au survol` | idem | RM-03 |

**Production autorisée** : `src/application/queries/waveBriefing.ts`, `src/presentation/describe.ts` (`briefingChip`, `briefingInfo`, `nextWaveInfo`), `src/presentation/Game.ts` (panneau d'unité et portrait : premier groupe), `src/infrastructure/render/Effects.ts` et `src/infrastructure/audio/Sfx.ts` si le type de `waveStart` l'exige.

#### Étape 4 — Vérification — ⬜
Pas de nouveau test. `npx tsc --noEmit` + `npm test` (`balance.test.ts` doit donner exactement les mêmes résultats : campagne inchangée).

### Éléments de code
- `domain/model/types.ts` — `interface WaveGroup { creep: string; count: number; interval: number; delay: number }` (nouveau) ; `interface WaveDef { groups: WaveGroup[] }` (modifié) ; `GameEvent.waveStart` garde `creep` = créature du premier groupe, `boss` = un groupe a un chef.
- `domain/catalog/creeps.ts` — `const G = (creep, count, interval = 0.8, delay = 0): WaveGroup` ; `const W = (...groups: WaveGroup[]): WaveDef` ; `waveAt(index): WaveDef` — boucle infinie : chaque groupe de `count > 1` × 1,2 arrondi.
- `domain/systems/waves.ts` — `waveDuration(index): number` — max sur les groupes ; `launchWave(world)` — un `Spawner` par groupe avec `timer = delay`, `pending.set(index, Σ count)`.
- `application/queries/waveBriefing.ts` — `interface WaveBriefing { wave: number; groups: { creep: CreepDef; count: number; hp: number; bounty: number }[] }` — groupes du catalogue, chef d'abord (tri stable).
- `presentation/describe.ts` — `briefingChip(b)`, `briefingInfo(b)`, `nextWaveInfo(b)` — une ligne par groupe.

### Hypothèses
_Vide à l'écriture. Rempli par `/implement-tdd` : `Hn — [hypothèse] — à valider par [qui]`._

---

## Lot F2 — Capacités de combat — ⬜

### Intention
Garde runique (bouclier), Coureur des dunes (sprint), Chaman (soin) entrent au catalogue ; l'Ogre gagne sa fureur. **RM** : RM-09, RM-10, RM-12, RM-13 · **CU** : CU-03, CU-04

### Conception
| Point | Décision |
|-------|----------|
| Règles appliquées | ARCH-01 (`shield`, `sprint`, `heal`, `fury`, `creepSpeed`, `updateAbilities`), ARCH-02 (tout en `domain` ; `describe` lit `creepSpeed`), ARCH-04 (`creepSpeed` pure), ARCH-05 (aucun aléatoire), ARCH-06 (propriétés de `CreepDef`, aucun `if` sur un id), ARCH-07, ARCH-08 (bouclier et sprint dans `hitCreep`, minuteries dans `updateStatuses` ; nouveau système seulement pour le soin, qui agit sur les voisins) |
| Données | `CreepDef.shield?`, `sprint?`, `heal?`, `fury?` ; `Creep.shield`, `sprint`, `sprintCooldown`, `healTimer` ; entrées `runeguard`, `dunerunner`, `shaman` (§ 6) ; `ogre.fury` |
| Calcul pur | `creepSpeed(c) → number` dans `domain/rules/speed.ts` |
| Ordre du joueur | aucun |
| Coût par tick | `creepSpeed` O(1) par créature ; soin O(Chamans × créatures) une fois toutes les 3 s par Chaman ; aucune allocation par tick |

### Étapes et tests

#### Étape 1 — Le bouclier de la Garde runique absorbe les premiers coups — ⬜
| # | Test (`it`) | Fichier de test | RM |
|---|-------------|-----------------|----|
| 1 | `[RM-10] n'inflige aucun dégât aux 4 premiers coups puis blesse au 5e quand la créature a un bouclier de 4` | `tests/domain/systems/combat.test.ts` (nouveau, calqué sur `status.test.ts`) | RM-10 |
| 2 | `[RM-10] n'applique ni ralentissement ni poison quand le coup est absorbé` | idem | RM-10 |
| 3 | `[RM-10] consomme une charge par créature touchée quand un éclat de zone les atteint` | idem | RM-10 |
| 4 | `[RM-10] laisse passer le poison déjà appliqué sans consommer de charge` | idem | RM-10 |

**Production autorisée** : `src/domain/model/types.ts` (`CreepDef.shield`, `Creep.shield`), `src/domain/catalog/creeps.ts` (`runeguard`), `src/domain/systems/waves.ts` (`spawnCreep` initialise `shield`), `src/domain/systems/combat.ts` (`hitCreep` exporté, garde du bouclier).

#### Étape 2 — Le Coureur sprinte quand il est touché — ⬜
| # | Test (`it`) | Fichier de test | RM |
|---|-------------|-----------------|----|
| 1 | `[RM-12] double la vitesse pendant le sprint` | `tests/domain/rules/speed.test.ts` (nouveau) | RM-12 |
| 2 | `[RM-12] applique le ralentissement à la vitesse doublée` | idem | RM-12 |
| 3 | `[RM-12] lance un sprint d'1 s quand le Coureur est touché et que son sprint est disponible` | `tests/domain/systems/combat.test.ts` | RM-12 |
| 4 | `[RM-12] ne relance pas le sprint quand il se recharge encore 4 s après sa fin` | `tests/domain/systems/status.test.ts` | RM-12 |
| 5 | `[RM-12] reste immobile quand le Coureur en sprint est gelé` | idem | RM-12 |

**Production autorisée** : `src/domain/rules/speed.ts` (nouveau, `creepSpeed`), `src/domain/model/types.ts` (`CreepDef.sprint`, `Creep.sprint`, `Creep.sprintCooldown`), `src/domain/catalog/creeps.ts` (`dunerunner`), `src/domain/systems/waves.ts` (`spawnCreep`), `src/domain/systems/combat.ts` (`hitCreep`), `src/domain/systems/status.ts` (minuteries), `src/domain/systems/movement.ts` (lit `creepSpeed`), `src/presentation/describe.ts` (`creepInfo` lit `creepSpeed`).

#### Étape 3 — L'Ogre entre en fureur sous 50 % de PV — ⬜
| # | Test (`it`) | Fichier de test | RM |
|---|-------------|-----------------|----|
| 1 | `[RM-13] multiplie la vitesse par 1,5 quand l'Ogre est sous 50 % de ses PV max` | `tests/domain/rules/speed.test.ts` | RM-13 |
| 2 | `[RM-13] rend la vitesse normale quand l'Ogre repasse à 50 % ou plus` | idem | RM-13 |

**Production autorisée** : `src/domain/model/types.ts` (`CreepDef.fury`), `src/domain/catalog/creeps.ts` (`ogre.fury`), `src/domain/rules/speed.ts`.

#### Étape 4 — Le Chaman soigne ses voisins — ⬜
| # | Test (`it`) | Fichier de test | RM |
|---|-------------|-----------------|----|
| 1 | `[RM-09] rend 25 % des PV max du Chaman à chaque voisin à 2,5 cases ou moins toutes les 3 s` | `tests/domain/systems/abilities.test.ts` (nouveau) | RM-09 |
| 2 | `[RM-09] ne dépasse pas les PV max du soigné` | idem | RM-09 |
| 3 | `[RM-09] ne soigne ni le Chaman lui-même ni une créature au-delà de 2,5 cases` | idem | RM-09 |
| 4 | `[RM-09] ne soigne pas avant 3 s après l'apparition du Chaman` | idem | RM-09 |

**Production autorisée** : `src/domain/systems/abilities.ts` (nouveau, `updateAbilities`), `src/domain/model/World.ts` (appel dans `step()` après `updateStatuses`), `src/domain/model/types.ts` (`CreepDef.heal`, `Creep.healTimer`), `src/domain/catalog/creeps.ts` (`shaman`), `src/domain/systems/waves.ts` (`spawnCreep`).

#### Étape 5 — Vérification — ⬜
Pas de nouveau test. `npx tsc --noEmit` + `npm test` (`balance.test.ts` : la fureur de l'Ogre touche la vague 10 ; retoucher `fury` n'est pas permis, régler la vague 10 seulement si le plancher actuel casse).

### Éléments de code
- `domain/model/types.ts` — `CreepDef.shield?: number` ; `CreepDef.sprint?: { mult: number; duration: number; cooldown: number }` ; `CreepDef.fury?: { below: number; mult: number }` ; `CreepDef.heal?: { pct: number; radius: number; every: number }` ; `Creep.shield: number`, `sprint: number`, `sprintCooldown: number`, `healTimer: number` (nouveaux).
- `domain/rules/speed.ts` — `export function creepSpeed(c: Pick<Creep, 'def' | 'hp' | 'maxHp' | 'slowPct' | 'sprint'>): number` — `def.speed` × `sprint.mult` si sprint en cours × `fury.mult` si `hp < fury.below × maxHp` × `(1 − slowPct)`.
- `domain/systems/combat.ts` — `export function hitCreep(world, towerId, defId, a, c, raw): void` — bouclier > 0 : décrémente et s'arrête ; sinon effets, déclenche le sprint s'il est disponible, dégâts.
- `domain/systems/status.ts` — `updateStatuses` décompte `sprint` puis `sprintCooldown` (la recharge commence à la fin du sprint).
- `domain/systems/abilities.ts` — `export function updateAbilities(world: World, dt: number): void` — pour chaque Chaman vivant : `healTimer` écoulé → soigne les autres créatures vivantes dans `heal.radius`, plafonné à `maxHp`, réarme à `heal.every`.

### Hypothèses
_Vide à l'écriture. Rempli par `/implement-tdd` : `Hn — [hypothèse] — à valider par [qui]`._

---

## Lot F3 — Rejetons — ⬜

### Intention
Le Limon se scinde à sa mort et l'Hydre fait naître des têtes à ses seuils ; ces rejetons comptent dans la vague. **RM** : RM-02, RM-11, RM-14 · **CU** : CU-01, CU-03, CU-04

### Conception
| Point | Décision |
|-------|----------|
| Règles appliquées | ARCH-01 (`split`, `brood`, `spawnOffspring`, `offspring`), ARCH-05 (même consommation de `world.rng` que `spawnCreep`), ARCH-06 (`CreepDef.split`, `CreepDef.brood`), ARCH-07, ARCH-08 (`spawnOffspring` réutilise la construction de `spawnCreep` ; deux usages réels : scission et têtes) |
| Données | `CreepDef.split?`, `CreepDef.brood?` ; `Creep.brood` (seuils déjà franchis) ; `World.offspring: Creep[]` ; entrées `slime`, `slimelet`, `hydrahead` (§ 6) ; `hydra.brood` |
| Calcul pur | aucun nouveau (PV et prime par `creepHp`, `bountyFor`) |
| Ordre du joueur | aucun |
| Coût par tick | O(1) par dégât infligé ; fusion de `offspring` dans `step()` seulement quand non vide |

### Étapes et tests

#### Étape 1 — Le Limon tué se scinde en deux petits Limons — ⬜
| # | Test (`it`) | Fichier de test | RM |
|---|-------------|-----------------|----|
| 1 | `[RM-11] fait naître 2 petits Limons à la position et sur le tronçon du Limon tué` | `tests/domain/systems/combat.test.ts` | RM-11 |
| 2 | `[RM-11] verse la prime de chaque petit Limon tué` | idem | RM-11 |
| 3 | `[RM-11] ne scinde pas un petit Limon tué` | idem | RM-11 |
| 4 | `[RM-11] ne scinde pas un Limon qui atteint la sortie` | `tests/domain/model/World.test.ts` | RM-11 |
| 5 | `[RM-11] épargne les petits Limons quand l'éclat de zone qui tue leur parent les atteindrait` | `tests/domain/systems/combat.test.ts` | RM-11 |

**Production autorisée** : `src/domain/model/types.ts` (`CreepDef.split`), `src/domain/catalog/creeps.ts` (`slime`, `slimelet`), `src/domain/systems/waves.ts` (`spawnOffspring`), `src/domain/systems/combat.ts` (`applyDamage`), `src/domain/model/World.ts` (`offspring`, fusion en fin de `step()`).

#### Étape 2 — Les rejetons prolongent la vague — ⬜
| # | Test (`it`) | Fichier de test | RM |
|---|-------------|-----------------|----|
| 1 | `[RM-02] ne verse la prime de fin de vague qu'après la mort des petits Limons` | `tests/domain/systems/waves.test.ts` | RM-02 |

**Production autorisée** : `src/domain/systems/waves.ts` (`spawnOffspring` incrémente `pending`).

#### Étape 3 — L'Hydre fait naître des têtes à 75, 50 et 25 % — ⬜
| # | Test (`it`) | Fichier de test | RM |
|---|-------------|-----------------|----|
| 1 | `[RM-14] fait naître 2 têtes quand l'Hydre passe sous 75 % de ses PV max` | `tests/domain/systems/combat.test.ts` | RM-14 |
| 2 | `[RM-14] fait naître 6 têtes au total quand l'Hydre passe les trois seuils` | idem | RM-14 |
| 3 | `[RM-14] ne refait pas naître de têtes quand l'Hydre régénérée repasse un seuil déjà franchi` | idem | RM-14 |
| 4 | `[RM-14] fait naître les têtes de chaque seuil quand un seul coup en franchit plusieurs` | idem | RM-14 |

**Production autorisée** : `src/domain/model/types.ts` (`CreepDef.brood`, `Creep.brood`), `src/domain/catalog/creeps.ts` (`hydrahead`, `hydra.brood`), `src/domain/systems/waves.ts` (`spawnCreep` initialise `brood`), `src/domain/systems/combat.ts` (`applyDamage`).

#### Étape 4 — Vérification — ⬜
Pas de nouveau test. `npx tsc --noEmit` + `npm test` (`balance.test.ts` : les têtes touchent la vague 20).

### Éléments de code
- `domain/model/types.ts` — `CreepDef.split?: { creep: string; count: number }` ; `CreepDef.brood?: { creep: string; count: number; below: number[] }` ; `Creep.brood: number` (nombre de seuils franchis).
- `domain/model/World.ts` — `offspring: Creep[] = []` ; `step()` : après `updateProjectiles`, les rejetons rejoignent `creeps`.
- `domain/systems/waves.ts` — `export function spawnOffspring(world: World, parent: Creep, defId: string, count: number): void` — crée `count` créatures (PV, prime de la vague du parent) à la position, au tronçon et à la case visée du parent, les place dans `world.offspring`, ajoute `count` à `pending` de la vague.
- `domain/systems/combat.ts` — `applyDamage` : après la baisse des PV, pour chaque seuil `brood.below` franchi et pas encore compté → `spawnOffspring` ; à la mort, `split` → `spawnOffspring`.

### Hypothèses
_Vide à l'écriture. Rempli par `/implement-tdd` : `Hn — [hypothèse] — à valider par [qui]`._

---

## Lot F4 — Briseurs — ⬜

### Intention
Le Sapeur gobelin et le Seigneur des cendres chargent, puis détruisent sans remboursement la tour la plus proche à portée, ce qui rouvre le passage. **RM** : RM-04, RM-05, RM-06, RM-07, RM-08, RM-15, RM-16 · **CU** : CU-02, CU-04

### Conception
| Point | Décision |
|-------|----------|
| Règles appliquées | ARCH-01 (`breaker`, `nearestTowers`, `removeTower`, `destroyed`), ARCH-02 (règle et système en `domain` ; `sell` en `application` appelle `World.removeTower` ; rendu en `infrastructure`), ARCH-03 (la destruction n'est pas un ordre du joueur : elle vient de `step()`, rien n'est journalisé), ARCH-04 (`nearestTowers` pure), ARCH-05 (instant tiré et égalité par `world.rng`), ARCH-06 (`CreepDef.breaker`), ARCH-07, ARCH-08 (retrait extrait de `sell`, cycle dans `updateAbilities` créé en F2) |
| Données | `CreepDef.breaker?: { charge, window, cooldown, range }` ; `Creep.breaker?: { phase, timer }` ; entrée `sapper` ; `ashlord.breaker` (§ 6) ; `GameEvent` `destroyed` |
| Calcul pur | `nearestTowers(towers, x, y, range) → Tower[]` dans `domain/rules/breaker.ts` |
| Ordre du joueur | aucun |
| Coût par tick | O(briseurs) ; à l'instant tiré seulement : O(tours × 4 cases) + un `refreshPaths()` (la grille change, comme à la vente) |

### Étapes et tests

#### Étape 1 — Le briseur enchaîne charge, fenêtre et recharge — ⬜
| # | Test (`it`) | Fichier de test | RM |
|---|-------------|-----------------|----|
| 1 | `[RM-04] ouvre la fenêtre 2 s après l'apparition du Sapeur` | `tests/domain/systems/abilities.test.ts` | RM-04 |
| 2 | `[RM-04] passe en recharge à l'instant tiré dans la fenêtre puis recharge 20 s avant une nouvelle charge` | idem | RM-04 |
| 3 | `[RM-04] suspend le cycle tant que le Sapeur est gelé` | idem | RM-04 |
| 4 | `[RM-08] distingue le Sapeur en fenêtre d'un Sapeur en charge ou en recharge` | idem | RM-08 |

**Production autorisée** : `src/domain/model/types.ts` (`CreepDef.breaker`, `Creep.breaker`), `src/domain/catalog/creeps.ts` (`sapper`), `src/domain/systems/waves.ts` (`spawnCreep` initialise `breaker`), `src/domain/systems/abilities.ts`, `src/infrastructure/render/sprites.ts` (aura du briseur en fenêtre), `src/infrastructure/render/palette.ts`.

#### Étape 2 — La tour la plus proche est détruite sans remboursement — ⬜
| # | Test (`it`) | Fichier de test | RM |
|---|-------------|-----------------|----|
| 1 | `[RM-05] retient le mur à 1 case plutôt que le Canon à 2 cases` | `tests/domain/rules/breaker.test.ts` (nouveau) | RM-05 |
| 2 | `[RM-05] retient toutes les tours à égalité de distance` | idem | RM-05 |
| 3 | `[RM-05] ne retient aucune tour au-delà de la portée` | idem | RM-05 |
| 4 | `[RM-05] détruit la tour sans rendre d'or et raccourcit le trajet aussitôt quand elle fermait un détour` | `tests/domain/systems/abilities.test.ts` | RM-05 |
| 5 | `[RM-05] redirige les créatures déjà en route par le passage rouvert` | idem | RM-05 |
| 6 | `[RM-06] passe en recharge sans rien détruire quand aucune tour n'est à portée` | idem | RM-06 |
| 7 | `[RM-16] détruit les mêmes tours au même instant quand la graine et le journal sont les mêmes` | `tests/domain/model/World.test.ts` | RM-16 |

**Production autorisée** : `src/domain/rules/breaker.ts` (nouveau), `src/domain/model/World.ts` (`removeTower`), `src/application/commands/sell.ts` (appelle `removeTower`), `src/domain/model/types.ts` (`GameEvent` `destroyed`), `src/domain/systems/abilities.ts`, `src/infrastructure/render/Effects.ts` et `src/infrastructure/audio/Sfx.ts` (réaction à `destroyed`).

#### Étape 3 — Un briseur mort ne détruit rien — ⬜
| # | Test (`it`) | Fichier de test | RM |
|---|-------------|-----------------|----|
| 1 | `[RM-07] ne détruit aucune tour quand le Sapeur meurt pendant sa fenêtre` | `tests/domain/systems/abilities.test.ts` | RM-07 |

**Production autorisée** : `src/domain/systems/abilities.ts`.

#### Étape 4 — Le Seigneur des cendres casse des tours à son rythme — ⬜
| # | Test (`it`) | Fichier de test | RM |
|---|-------------|-----------------|----|
| 1 | `[RM-15] détruit la tour la plus proche à 4 cases dans une fenêtre de 5 s puis recharge 12 s` | `tests/domain/systems/abilities.test.ts` | RM-15 |

**Production autorisée** : `src/domain/catalog/creeps.ts` (`ashlord.breaker`).

#### Étape 5 — Vérification — ⬜
Pas de nouveau test. `npx tsc --noEmit` + `npm test` (`sell.test.ts` garde la vente intacte ; `balance.test.ts` : le Seigneur touche la vague 30).

### Éléments de code
- `domain/model/types.ts` — `CreepDef.breaker?: { charge: number; window: number; cooldown: number; range: number }` ; `Creep.breaker?: { phase: 'charge' | 'window' | 'cooldown'; timer: number }` ; `GameEvent` `{ t: 'destroyed'; x: number; y: number }`.
- `domain/rules/breaker.ts` — `export function nearestTowers(towers: Tower[], x: number, y: number, range: number): Tower[]` — distance au centre de la case la plus proche de l'emprise 2×2 ; garde celles ≤ `range` ; renvoie toutes celles à la distance minimale.
- `domain/model/World.ts` — `removeTower(t: Tower): void` — retire de `towers` et `towerById`, libère l'emprise, `refreshPaths()`.
- `domain/systems/abilities.ts` — `updateAbilities` : briseur vivant et non gelé → décompte ; charge écoulée → fenêtre, `timer = world.rng.range(0, window)` ; fenêtre écoulée → `nearestTowers`, tirage `world.rng.int` si plusieurs, `removeTower` + `destroyed`, puis recharge ; recharge écoulée → charge.
- `application/commands/sell.ts` — `sell` rembourse puis `world.removeTower(t)`.

### Hypothèses
_Vide à l'écriture. Rempli par `/implement-tdd` : `Hn — [hypothèse] — à valider par [qui]`._

---

## Lot F5 — Campagne mixte et équilibrage — ⬜

### Intention
Les vagues 6 à 30 suivent la table du § 6, chaque nouvelle créature est dessinée, et le bot reste gagnant. **RM** : RM-01, RM-17 · **CU** : CU-01, CU-04

### Conception
| Point | Décision |
|-------|----------|
| Règles appliquées | ARCH-02 (styles en `infrastructure`), ARCH-03 (le bot reconstruit par `dispatch`), ARCH-06 (campagne = données de `WAVES`), ARCH-07 (aucun code de `step()` touché), ARCH-08 (`G`/`W` de F1, `CREEP_STYLE` étendu, `mazePlan` réutilisé pour la reconstruction) |
| Données | `WAVES` 6-30 ; `interval` / `delay` réglés ; `CREEP_STYLE` des 7 nouvelles créatures |
| Calcul pur | aucun |
| Ordre du joueur | aucun (le bot utilise `build` / `upgrade` existants) |
| Coût par tick | inchangé |

### Étapes et tests

#### Étape 1 — La campagne aligne les vagues mixtes du § 6 — ⬜
| # | Test (`it`) | Fichier de test | RM |
|---|-------------|-----------------|----|
| 1 | `[RM-01] garde les vagues 1 à 5 inchangées` | `tests/domain/catalog/creeps.test.ts` (nouveau) | RM-01 |
| 2 | `[RM-01] compose les vagues 6 à 30 des groupes et nombres de la table` (table dans le test) | idem | RM-01 |
| 3 | `[RM-01] ne fait paraître chaque nouvelle créature seule qu'avant ses mélanges` | idem | RM-01 |

**Production autorisée** : `src/domain/catalog/creeps.ts` (`WAVES`).

#### Étape 2 — Chaque créature a son dessin — ⬜
| # | Test (`it`) | Fichier de test | RM |
|---|-------------|-----------------|----|
| 1 | `donne un style à chaque créature du catalogue` | `tests/infrastructure/render/sprites.test.ts` | — (CU-03 : reconnaître la créature) |

**Production autorisée** : `src/infrastructure/render/palette.ts` (`CREEP_STYLE`).

#### Étape 3 — Le bot gagne la nouvelle campagne en reconstruisant — ⬜
| # | Test (`it`) | Fichier de test | RM |
|---|-------------|-----------------|----|
| 1 | `[RM-17] gagne la campagne en Recrue sur trois graines` | `tests/balance.test.ts` | RM-17 |
| 2 | `[RM-17] gagne la campagne en Vétéran avec au moins 8 vies sur trois graines` | idem | RM-17 |

**Production autorisée** : `tests/support/bot.ts` (reconstruit les cases libérées de `mazePlan`), `src/domain/catalog/creeps.ts` (`interval`, `delay` des vagues 6-30 uniquement ; créatures et nombres figés par l'étape 1).

#### Étape 4 — Vérification — ⬜
Pas de nouveau test. `npx tsc --noEmit` + `npm test`.

### Éléments de code
- `domain/catalog/creeps.ts` — `WAVES` : vagues 1-5 identiques ; 6-30 en `W(G(…), G(…))`, chef en premier groupe.
- `infrastructure/render/palette.ts` — `CREEP_STYLE.sapper`, `shaman`, `slime`, `slimelet`, `runeguard`, `dunerunner`, `hydrahead`.
- `tests/support/bot.ts` — `Bot.act()` : plan épuisé → rebâtit la première case de `mazePlan` redevenue libre avant d'améliorer.

### Hypothèses
_Vide à l'écriture. Rempli par `/implement-tdd` : `Hn — [hypothèse] — à valider par [qui]`._
