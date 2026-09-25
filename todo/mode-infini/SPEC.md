# Mode infini à modificateurs

> Au-delà de la vague 30, un modificateur tiré au hasard s'ajoute toutes les 5 vagues et renforce pour de bon toutes les créatures. Pour le joueur qui a fini la campagne : chaque partie infinie prend une tournure différente et oblige à s'adapter.

## 1. Contexte

Le mode infini reprend les vagues 11 à 30 avec 20 % de créatures en plus et 8 % de PV en plus par vague (`src/domain/catalog/creeps.ts:34`, `src/domain/systems/waves.ts:39`). Seuls les PV montent : la même défense tient ou cède toujours de la même façon, et deux parties infinies se ressemblent.

## 2. Vocabulaire

| Terme | Définition |
|---|---|
| Modificateur | Effet permanent appliqué à toutes les créatures des vagues suivantes. |
| Palier | Vague à laquelle un modificateur s'ajoute : 31, 36, 41… |

## 4. Cas d'usage

### CU-01 — Subir un nouveau modificateur
**Acteur** joueur · **Intention** anticiper le renforcement des créatures.
**Scénario nominal :**
1. Pendant la vague qui précède un palier, l'aperçu de la prochaine vague annonce le modificateur qui va s'ajouter.
2. Le palier est lancé : le modificateur s'applique à toutes les créatures qui apparaissent à partir de cette vague.
3. Le HUD affiche en permanence les modificateurs actifs et le nombre de fois où chacun est sorti.

### CU-02 — Consulter les modificateurs actifs
**Acteur** joueur · **Intention** comprendre pourquoi les créatures résistent mieux.
**Scénario nominal :** le joueur survole la liste des modificateurs dans le HUD et lit l'effet cumulé de chacun (ex. « Carapace ×3 : +3 armure »).

## 5. Règles métier

### RM-01 — Tirage aux paliers
- **Énoncé** : à chaque palier (vague 31 puis toutes les 5 vagues), un modificateur est tiré au hasard, avec la même chance pour chacun, dans la liste du § 6. Il peut sortir de nouveau et se cumule alors. · **Origine** : choix de design · **Concerne** : CU-01

### RM-02 — Tirage connu à l'avance
- **Énoncé** : le modificateur d'un palier est connu, donc affichable, dès le lancement de la vague précédente, et il ne change plus. · **Origine** : choix de design (lisibilité) · **Concerne** : CU-01

### RM-03 — Portée des modificateurs
- **Énoncé** : un modificateur s'applique aux créatures apparues à partir de son palier, chefs, rejetons et têtes d'Hydre compris. Les créatures déjà en jeu ne changent pas. · **Origine** : choix de design · **Concerne** : CU-01

### RM-04 — Bornes
- **Énoncé** : Résistance ne réduit jamais la durée du ralentissement ou du gel de plus de 75 %. Avarice ne fait jamais descendre une prime sous 1 or. · **Origine** : choix de design · **Concerne** : CU-01

### RM-05 — Progression existante conservée
- **Énoncé** : la reprise en boucle des vagues 11 à 30, les 20 % de créatures en plus et les 8 % de PV en plus par vague au-delà de 30 restent en vigueur ; les modificateurs s'y ajoutent. · **Origine** : comportement existant · **Concerne** : transverse

### RM-06 — Déterminisme
- **Énoncé** : le tirage passe par le hasard de la partie : même graine et mêmes ordres donnent les mêmes modificateurs. · **Origine** : comportement existant · **Concerne** : transverse

### RM-07 — Campagne intacte
- **Énoncé** : aucun modificateur ne s'applique aux vagues 1 à 30. · **Origine** : choix de design · **Concerne** : transverse

## 6. Chiffres

| Modificateur | Effet par tirage (cumulable) |
|---|---|
| Carapace | +1 armure |
| Élan | +8 % de vitesse de base |
| Horde | +15 % de créatures par groupe (arrondi au plus proche, chefs exclus) |
| Vitalité | +0,5 % des PV max régénérés par seconde |
| Résistance | −15 % de durée des ralentissements et gels subis (plafond −75 %) |
| Avarice | −10 % de prime par créature (plancher 1 or) |
| Égide | +1 charge de bouclier, y compris pour les créatures qui n'en ont pas |
| Sapeurs | +1 Sapeur gobelin dans chaque vague, en groupe séparé |

Premier palier : vague 31. Intervalle entre paliers : 5 vagues.

## 8. Hors périmètre

| Exclusion | Raison |
|---|---|
| Choix du modificateur par le joueur | Écarté : exigerait un écran de choix et un nouvel ordre du joueur. |
| Classement en ligne | Aucune infrastructure réseau. Le record local par difficulté existe déjà. |

## 9. Hypothèses

| # | Hypothèse | À valider par |
|---|---|---|
| H1 | Égide et Sapeurs reposent sur le bouclier et le Sapeur gobelin de la spec `creatures-et-vagues`, qui doit donc être livrée d'abord. | ordre des lots |
