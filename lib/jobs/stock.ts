// Stock top-up rule (PRD v2): keep at least `target` unused items per content kind,
// and generate nothing (no AI quota) for kinds that are already full.

export const STOCK_TARGET = 5;

/** How many items to generate for each kind that has a generator. */
export function planTopUp(ready: Record<string, number>, target = STOCK_TARGET): Record<string, number> {
  return Object.fromEntries(
    Object.entries(ready).map(([kind, n]) => [kind, Math.max(0, target - n)])
  );
}
