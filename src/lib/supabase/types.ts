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
          profile_type: string | null;
          payday_day: number | null;
          created_at: string;
          updated_at: string;
        },
        Partial<{
          id: string;
          name: string;
          onboarding_step: string;
          asset_categories: string[];
          liability_categories: string[];
          profile_type: string | null;
          payday_day: number | null;
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
      recurring_incomes: Table<
        {
          id: string;
          user_id: string;
          label: string;
          amount: number;
          created_at: string;
          updated_at: string;
        },
        Partial<{
          id: string;
          user_id: string;
          label: string;
          amount: number;
          created_at: string;
          updated_at: string;
        }> & { user_id: string }
      >;
      recurring_expenses: Table<
        {
          id: string;
          user_id: string;
          label: string;
          amount: number;
          created_at: string;
          updated_at: string;
        },
        Partial<{
          id: string;
          user_id: string;
          label: string;
          amount: number;
          created_at: string;
          updated_at: string;
        }> & { user_id: string }
      >;
      budgets: Table<
        {
          user_id: string;
          category: string;
          monthly_limit: number;
          created_at: string;
          updated_at: string;
        },
        Partial<{
          user_id: string;
          category: string;
          monthly_limit: number;
          created_at: string;
          updated_at: string;
        }> & { user_id: string; category: string }
      >;
      asset_holdings: Table<
        {
          id: string;
          user_id: string;
          category: string;
          data: Json;
          goal_id: string | null;
          created_at: string;
          updated_at: string;
        },
        Partial<{
          id: string;
          user_id: string;
          category: string;
          data: Json;
          goal_id: string | null;
          created_at: string;
          updated_at: string;
        }> & { user_id: string; category: string }
      >;
      liabilities: Table<
        {
          id: string;
          user_id: string;
          category: string;
          data: Json;
          updated_at: string;
        },
        Partial<{
          id: string;
          user_id: string;
          category: string;
          data: Json;
          updated_at: string;
        }> & { user_id: string; category: string }
      >;
      billing_reminders_sent: Table<
        {
          liability_id: string;
          sent_date: string;
          created_at: string;
        },
        Partial<{
          liability_id: string;
          sent_date: string;
          created_at: string;
        }> & { liability_id: string }
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
          account_holding_id: string | null;
          created_at: string;
        },
        Partial<{
          id: string;
          user_id: string;
          expense_date: string;
          category: string;
          amount: number;
          description: string;
          account_holding_id: string | null;
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
          account_holding_id: string | null;
          created_at: string;
        },
        Partial<{
          id: string;
          user_id: string;
          income_date: string;
          category: string;
          amount: number;
          description: string;
          account_holding_id: string | null;
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
      asset_holding_snapshots: Table<
        {
          user_id: string;
          snapshot_date: string;
          holding_id: string;
          category: string;
          label: string;
          value: number;
          created_at: string;
          updated_at: string;
        },
        Partial<{
          user_id: string;
          snapshot_date: string;
          holding_id: string;
          category: string;
          label: string;
          value: number;
          created_at: string;
          updated_at: string;
        }> & { user_id: string; snapshot_date: string; holding_id: string }
      >;
      goal_interest_credits: Table<
        {
          id: string;
          user_id: string;
          goal_id: string;
          holding_id: string;
          credit_date: string;
          amount: number;
          created_at: string;
        },
        Partial<{
          id: string;
          user_id: string;
          goal_id: string;
          holding_id: string;
          credit_date: string;
          amount: number;
          created_at: string;
        }> & { user_id: string; goal_id: string; holding_id: string }
      >;
      goal_maturity_reminders_sent: Table<
        {
          holding_id: string;
          sent_date: string;
          created_at: string;
        },
        Partial<{
          holding_id: string;
          sent_date: string;
          created_at: string;
        }> & { holding_id: string }
      >;
      fcf_snapshots: Table<
        {
          user_id: string;
          snapshot_month: string;
          income: number;
          fixed_expense: number;
          lifestyle_expense: number;
          invest: number;
          fcf: number;
          saving_rate: number;
          created_at: string;
          updated_at: string;
        },
        Partial<{
          user_id: string;
          snapshot_month: string;
          income: number;
          fixed_expense: number;
          lifestyle_expense: number;
          invest: number;
          fcf: number;
          saving_rate: number;
          created_at: string;
          updated_at: string;
        }> & { user_id: string; snapshot_month: string }
      >;
      market_news: Table<
        {
          id: string;
          headline: string;
          summary: string;
          sources: Json;
          published_at: string;
          created_at: string;
        },
        Partial<{
          id: string;
          headline: string;
          summary: string;
          sources: Json;
          published_at: string;
          created_at: string;
        }> & { headline: string; summary: string }
      >;
      stock_prices: Table<
        {
          ticker: string;
          company_name: string;
          price: number;
          prev_close: number;
          change_pct: number;
          currency: string;
          as_of: string;
          updated_at: string;
        },
        Partial<{
          ticker: string;
          company_name: string;
          price: number;
          prev_close: number;
          change_pct: number;
          currency: string;
          as_of: string;
          updated_at: string;
        }> & { ticker: string }
      >;
      bill_splits: Table<
        {
          id: string;
          user_id: string;
          title: string;
          merchant: string | null;
          receipt_image_path: string | null;
          subtotal: number;
          tax: number;
          service: number;
          total: number;
          share_token: string;
          account_holding_id: string | null;
          creator_expense_id: string | null;
          status: string;
          created_at: string;
        },
        Partial<{
          id: string;
          user_id: string;
          title: string;
          merchant: string | null;
          receipt_image_path: string | null;
          subtotal: number;
          tax: number;
          service: number;
          total: number;
          share_token: string;
          account_holding_id: string | null;
          creator_expense_id: string | null;
          status: string;
          created_at: string;
        }> & { user_id: string; title: string }
      >;
      bill_split_participants: Table<
        {
          id: string;
          bill_split_id: string;
          name: string;
          is_creator: boolean;
          sort_order: number;
        },
        Partial<{
          id: string;
          bill_split_id: string;
          name: string;
          is_creator: boolean;
          sort_order: number;
        }> & { bill_split_id: string; name: string }
      >;
      bill_split_items: Table<
        {
          id: string;
          bill_split_id: string;
          name: string;
          qty: number;
          unit_price: number;
          sort_order: number;
        },
        Partial<{
          id: string;
          bill_split_id: string;
          name: string;
          qty: number;
          unit_price: number;
          sort_order: number;
        }> & { bill_split_id: string; name: string }
      >;
      bill_split_item_assignments: Table<
        {
          id: string;
          item_id: string;
          participant_id: string;
          units: number;
        },
        Partial<{
          id: string;
          item_id: string;
          participant_id: string;
          units: number;
        }> & { item_id: string; participant_id: string }
      >;
      bill_split_misreads: Table<
        {
          id: string;
          user_id: string;
          bill_split_id: string | null;
          image_path: string | null;
          note: string | null;
          created_at: string;
        },
        Partial<{
          id: string;
          user_id: string;
          bill_split_id: string | null;
          image_path: string | null;
          note: string | null;
          created_at: string;
        }> & { user_id: string }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
