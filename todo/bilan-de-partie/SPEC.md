# Bilan de partie

> L'écran de fin de partie gagne un bilan détaillé : classement des tours, dégâts par famille, courbe vague par vague et pertes dues aux briseurs. Pour le joueur qui veut comprendre pourquoi il a gagné ou perdu, et quoi changer à la partie suivante.

## 1. Contexte

L'écran de fin n'affiche que cinq totaux : vagues, éliminations, évasions, plus long trajet et or gagné (`src/presentation/Game.ts:832`). Chaque tour compte déjà ses dégâts et ses éliminations (`src/domain/systems/combat.ts:142`), mais ces chiffres disparaissent quand la tour est vendue et ne sont montrés nulle part en fin de partie.

## 2. Vocabulaire

| Terme | Définition |
|---|---|
| Dégâts effectifs | PV réellement retirés à une créature : le surplus au-delà de ses PV restants ne compte pas, les coups annulés par un bouclier non plus. |
| Rendement | Dégâts effectifs divisés par l'or investi dans la tour. |
| Famille | Archers, Canon, Givre, Foudre, Venin, ou Hybrides pour toute tour issue d'une infusion. Les murs n'ont pas de famille de dégâts. |

## 4. Cas d'usage

### CU-01 — Lire le bilan
**Acteur** joueur · **Intention** comprendre sa partie.
**Scénario nominal :**
1. La partie se termine (victoire ou défaite). L'écran de fin affiche les cinq totaux existants.
2. En dessous, quatre onglets : « Tours », « Familles », « Vagues », « Briseurs ». « Tours » est ouvert par défaut.
3. Le joueur passe d'un onglet à l'autre, puis relance une partie ou continue en mode infini.
**Variantes :** en mode infini, le bilan s'affiche de la même façon à la défaite.

## 5. Règles métier

### RM-01 — Classement des tours
- **Énoncé** : l'onglet « Tours » liste toutes les tours posées pendant la partie, sauf les murs restés murs : tours en place, vendues ou détruites. Pour chacune : nom, état (en place, vendue, détruite), dégâts effectifs, éliminations, or investi et rendement. Le tri se fait par dégâts effectifs décroissants. · **Origine** : choix de design · **Concerne** : CU-01

### RM-02 — Attribution des dégâts
- **Énoncé** : les dégâts et éliminations reviennent à la tour qui a tiré, y compris ceux d'un poison qui continue d'agir après que sa tour a été vendue, détruite ou améliorée. Une tour améliorée reste une seule ligne, sous son nom actuel. · **Origine** : choix de design · **Concerne** : CU-01

### RM-03 — Dégâts par famille
- **Énoncé** : l'onglet « Familles » montre, pour chaque famille ayant infligé des dégâts, la somme de ses dégâts effectifs et sa part du total en pourcentage, sous forme de barres triées par ordre décroissant. · **Origine** : choix de design · **Concerne** : CU-01

### RM-04 — Courbe par vague
- **Énoncé** : l'onglet « Vagues » montre, pour chaque vague lancée, les vies perdues et l'or possédé au moment où la vague se termine. Une vague en cours à la défaite apparaît avec les vies perdues jusque-là. · **Origine** : choix de design · **Concerne** : CU-01

### RM-05 — Pertes aux briseurs
- **Énoncé** : l'onglet « Briseurs » affiche le nombre de tours détruites et l'or qu'elles représentaient (or investi). Sans aucune destruction, il affiche « Aucune tour perdue ». · **Origine** : choix de design · **Concerne** : CU-01

### RM-06 — Sans effet sur la partie
- **Énoncé** : relever ces chiffres ne change rien au déroulement : même graine et mêmes ordres donnent la même partie et le même bilan. · **Origine** : comportement existant · **Concerne** : transverse

## 8. Hors périmètre

| Exclusion | Raison |
|---|---|
| Bilan consultable en cours de partie | Non demandé. |
| Historique des parties précédentes | Non demandé. Seul le record existant est conservé. |
| Export ou partage du bilan | Non demandé. |

## 9. Hypothèses

| # | Hypothèse | À valider par |
|---|---|---|
| H1 | L'onglet « Briseurs » suppose la spec `creatures-et-vagues` livrée. Avant cela, il affiche « Aucune tour perdue ». | ordre des lots |
