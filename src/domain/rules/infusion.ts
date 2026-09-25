import type { Family, TowerDef } from '../model/types';
import { INFUSION_WAVE } from '../catalog/towers';

export function infusionBlocker(from: TowerDef, to: TowerDef, wave: number, others: TowerDef[]): string | null {
  if (wave < INFUSION_WAVE - 1) return `Infusion possible à partir de la vague ${INFUSION_WAVE}.`;
  const missing = to.elements?.find((e) => e !== from.family) as Family;
  const hasElement = others.some((o) => (o.family === missing && o.tier >= 2) || o.elements?.includes(missing));
  return hasElement ? null : `Il faut une tour de ${missing} de niveau 2.`;
}
