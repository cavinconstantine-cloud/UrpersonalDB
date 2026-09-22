export type FieldType = "text" | "number" | "select" | "date";

export interface FieldOption {
  value: string;
  label: string;
}

export interface SchemaField {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  step?: string;
  default?: string;
  options?: FieldOption[];
}

/** Free-form key/value bag for one holding or one liability — shape depends on category. */
export type HoldingData = Record<string, string | number | undefined>;

/** Holding data is always plain strings/numbers — safe to store as jsonb. */
export function holdingDataToJson(data: HoldingData): import("@/lib/supabase/types").Json {
  return data as import("@/lib/supabase/types").Json;
}

export interface AssetSchema {
  fields: SchemaField[];
  value: (h: HoldingData) => number;
  buyValue?: (h: HoldingData) => number;
  note?: (h: HoldingData) => string;
}

export interface LiabilitySchema {
  fields: SchemaField[];
  monthlyPayment: (h: HoldingData) => number;
  note?: (h: HoldingData) => string;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  targetDate: string; // ISO date
}

export interface Expense {
  id: string;
  date: string; // ISO date
  category: string;
  amount: number;
  description: string;
}

export interface Income {
  id: string;
  date: string; // ISO date
  category: string;
  amount: number;
  description: string;
}

export interface AssetHolding {
  id: string;
  category: string;
  data: HoldingData;
}

export interface CashflowInputs {
  income: number;
  fixedExpense: number;
  lifestyleExpense: number;
  invest: number;
}
