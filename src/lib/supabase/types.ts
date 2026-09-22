export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

interface Table<Row, Insert, Update = Partial<Insert>> {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
}

export interface Database {
  public: {
    Tables: {
      profiles: Table<
        {
          id: string;
          name: string;
          onboarding_step: string;
          asset_categories: string[];
          liability_categories: string[];
          created_at: string;
          updated_at: string;
        },
        Partial<{
          id: string;
          name: string;
          onboarding_step: string;
          asset_categories: string[];
          liability_categories: string[];
          created_at: string;
          updated_at: string;
        }> & { id: string }
      >;
      cashflow: Table<
        {
          user_id: string;
          income: number;
          fixed_expense: number;
          lifestyle_expense: number;
          invest: number;
          updated_at: string;
        },
        Partial<{
          user_id: string;
          income: number;
          fixed_expense: number;
          lifestyle_expense: number;
          invest: number;
          updated_at: string;
        }> & { user_id: string }
      >;
      asset_holdings: Table<
        {
          id: string;
          user_id: string;
          category: string;
          data: Json;
          created_at: string;
          updated_at: string;
        },
        Partial<{
          id: string;
          user_id: string;
          category: string;
          data: Json;
          created_at: string;
          updated_at: string;
        }> & { user_id: string; category: string }
      >;
      liabilities: Table<
        {
          user_id: string;
          category: string;
          data: Json;
          updated_at: string;
        },
        Partial<{
          user_id: string;
          category: string;
          data: Json;
          updated_at: string;
        }> & { user_id: string; category: string }
      >;
      goals: Table<
        {
          id: string;
          user_id: string;
          name: string;
          target: number;
          current: number;
          target_date: string;
          created_at: string;
          updated_at: string;
        },
        Partial<{
          id: string;
          user_id: string;
          name: string;
          target: number;
          current: number;
          target_date: string;
          created_at: string;
          updated_at: string;
        }> & { user_id: string }
      >;
      expenses: Table<
        {
          id: string;
          user_id: string;
          expense_date: string;
          category: string;
          amount: number;
          description: string;
          created_at: string;
        },
        Partial<{
          id: string;
          user_id: string;
          expense_date: string;
          category: string;
          amount: number;
          description: string;
          created_at: string;
        }> & { user_id: string }
      >;
      custom_expense_categories: Table<
        {
          user_id: string;
          name: string;
          created_at: string;
        },
        Partial<{
          user_id: string;
          name: string;
          created_at: string;
        }> & { user_id: string; name: string }
      >;
      incomes: Table<
        {
          id: string;
          user_id: string;
          income_date: string;
          category: string;
          amount: number;
          description: string;
          created_at: string;
        },
        Partial<{
          id: string;
          user_id: string;
          income_date: string;
          category: string;
          amount: number;
          description: string;
          created_at: string;
        }> & { user_id: string }
      >;
      custom_income_categories: Table<
        {
          user_id: string;
          name: string;
          created_at: string;
        },
        Partial<{
          user_id: string;
          name: string;
          created_at: string;
        }> & { user_id: string; name: string }
      >;
      net_worth_snapshots: Table<
        {
          user_id: string;
          snapshot_date: string;
          net_worth: number;
          total_assets: number;
          total_liabilities: number;
          created_at: string;
        },
        Partial<{
          user_id: string;
          snapshot_date: string;
          net_worth: number;
          total_assets: number;
          total_liabilities: number;
          created_at: string;
        }> & { user_id: string }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
