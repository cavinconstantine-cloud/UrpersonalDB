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

export interface SplitParticipantResult {
  participantId: string;
  name: string;
  isCreator: boolean;
  itemLines: { name: string; units: number; lineTotal: number }[];
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

/** Whether every unit of every item has been assigned to someone — gates moving past the assign step. */
export function isFullyAssigned(items: SplitItem[], assignments: SplitAssignments): boolean {
  return items.every((item) => {
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
): SplitResult {
  const itemsSubtotal = items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);

  const perParticipant: SplitParticipantResult[] = participants.map((p) => {
    const itemLines = items
      .map((item) => ({
        name: item.name,
        units: assignments[item.id]?.[p.id] ?? 0,
        lineTotal: (assignments[item.id]?.[p.id] ?? 0) * item.unitPrice,
      }))
      .filter((line) => line.units > 0);
    const subtotal = itemLines.reduce((sum, l) => sum + l.lineTotal, 0);
    return {
      participantId: p.id,
      name: p.name,
      isCreator: p.isCreator,
      itemLines,
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
