// Uangku — Split Bill (Beta): pure allocation math, no I/O.
//
// Tax and service charge are allocated *proportionally* to each
// participant's assigned item-subtotal share — never split evenly — so
// someone who only ordered a drink isn't taxed as if they ate the whole
// table's food. Rounding to whole Rupiah can leave the per-person totals a
// few rupiah short of/over the receipt's stated total; the leftover is
// folded into the largest share so the split always reconciles exactly.

export interface SplitItem {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
}

export interface SplitParticipant {
  id: string;
  name: string;
  isCreator: boolean;
}

/** assignments[itemId][participantId] = how many units of that item this participant is taking. */
export type SplitAssignments = Record<string, Record<string, number>>;

/** sharedMode[itemId] = true means this item is split evenly (see sharedWith) instead of by per-unit assignment. */
export type SplitSharedMode = Record<string, boolean>;

/** sharedWith[itemId] = participant ids who split that item's full line total evenly ("Bagi Rata"). */
export type SplitSharedWith = Record<string, string[]>;

export interface SplitParticipantResult {
  participantId: string;
  name: string;
  isCreator: boolean;
  itemLines: { name: string; units: number; lineTotal: number }[];
  sharedLines: { name: string; amount: number }[];
  itemsSubtotal: number;
  taxShare: number;
  serviceShare: number;
  total: number;
}

export interface SplitResult {
  perParticipant: SplitParticipantResult[];
  itemsSubtotal: number;
  tax: number;
  service: number;
  grandTotal: number;
}

/**
 * Whether every item is resolved — gates moving past the assign step. An
 * item in "Bagi Rata" mode is resolved once at least one person is picked
 * to share it; otherwise it needs every unit assigned to someone.
 */
export function isFullyAssigned(
  items: SplitItem[],
  assignments: SplitAssignments,
  sharedMode: SplitSharedMode = {},
  sharedWith: SplitSharedWith = {},
): boolean {
  return items.every((item) => {
    if (sharedMode[item.id]) return (sharedWith[item.id]?.length ?? 0) > 0;
    const assigned = Object.values(assignments[item.id] ?? {}).reduce((a, b) => a + b, 0);
    return assigned === item.qty;
  });
}

export function assignedUnits(item: SplitItem, assignments: SplitAssignments): number {
  return Object.values(assignments[item.id] ?? {}).reduce((a, b) => a + b, 0);
}

export function allocateSplit(
  items: SplitItem[],
  participants: SplitParticipant[],
  assignments: SplitAssignments,
  tax: number,
  service: number,
  sharedMode: SplitSharedMode = {},
  sharedWith: SplitSharedWith = {},
): SplitResult {
  const itemsSubtotal = items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);

  // Per item in "Bagi Rata" mode: its full line total splits evenly across
  // the chosen people, with any leftover rupiah (from rounding) folded onto
  // the first few of them in order so the split reconciles exactly.
  const sharedAmountByItemThenParticipant: Record<string, Record<string, number>> = {};
  for (const item of items) {
    if (!sharedMode[item.id]) continue;
    const people = sharedWith[item.id] ?? [];
    if (people.length === 0) continue;
    const lineTotal = item.qty * item.unitPrice;
    const base = Math.floor(lineTotal / people.length);
    const remainder = lineTotal - base * people.length;
    const perPerson: Record<string, number> = {};
    people.forEach((participantId, i) => {
      perPerson[participantId] = base + (i < remainder ? 1 : 0);
    });
    sharedAmountByItemThenParticipant[item.id] = perPerson;
  }

  const perParticipant: SplitParticipantResult[] = participants.map((p) => {
    const itemLines = items
      .filter((item) => !sharedMode[item.id])
      .map((item) => ({
        name: item.name,
        units: assignments[item.id]?.[p.id] ?? 0,
        lineTotal: (assignments[item.id]?.[p.id] ?? 0) * item.unitPrice,
      }))
      .filter((line) => line.units > 0);
    const sharedLines = items
      .filter((item) => sharedMode[item.id])
      .map((item) => ({ name: item.name, amount: sharedAmountByItemThenParticipant[item.id]?.[p.id] ?? 0 }))
      .filter((line) => line.amount > 0);
    const subtotal =
      itemLines.reduce((sum, l) => sum + l.lineTotal, 0) + sharedLines.reduce((sum, l) => sum + l.amount, 0);
    return {
      participantId: p.id,
      name: p.name,
      isCreator: p.isCreator,
      itemLines,
      sharedLines,
      itemsSubtotal: subtotal,
      taxShare: 0,
      serviceShare: 0,
      total: 0,
    };
  });

  const assignedSubtotal = perParticipant.reduce((sum, p) => sum + p.itemsSubtotal, 0);
  const grandTotal = itemsSubtotal + tax + service;

  for (const p of perParticipant) {
    const proportion = assignedSubtotal > 0 ? p.itemsSubtotal / assignedSubtotal : 0;
    p.taxShare = Math.round(tax * proportion);
    p.serviceShare = Math.round(service * proportion);
    p.total = p.itemsSubtotal + p.taxShare + p.serviceShare;
  }

  // Reconcile rounding drift onto whoever has the largest share, so the
  // per-person totals always sum exactly to the receipt's grand total.
  if (perParticipant.length > 0) {
    const rawTotal = perParticipant.reduce((sum, p) => sum + p.total, 0);
    const diff = grandTotal - rawTotal;
    if (diff !== 0) {
      const largest = perParticipant.reduce((a, b) => (b.itemsSubtotal > a.itemsSubtotal ? b : a));
      largest.total += diff;
    }
  }

  return { perParticipant, itemsSubtotal, tax, service, grandTotal };
}
