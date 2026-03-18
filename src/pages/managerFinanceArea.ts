export type CompanySummary = {
  id: number;
  name: string;
};

export type FinanceEnvelope<T> = {
  company: CompanySummary;
  data: T;
};

export type ProfitLossResponse = FinanceEnvelope<{
  summary: {
    revenue: number;
    expenses: number;
    gross_result: number;
    net_result: number;
  };
  revenue_categories: Array<{
    category: string;
    amount: number;
    count: number;
  }>;
  expense_categories: Array<{
    category: string;
    amount: number;
    count: number;
  }>;
  totals: {
    receivables_count: number;
    payables_count: number;
  };
}>;

export type MovementsResponse = FinanceEnvelope<{
  accounts: {
    items: Array<{
      id: string | null;
      name: string;
      type: string | null;
      active: boolean | null;
      balance: number;
    }>;
    totals: {
      current_balance: number;
    };
  };
  summary: {
    incoming_total: number;
    outgoing_total: number;
    net_cashflow: number;
    movements_count: number;
  };
  movements: Array<{
    id: string | null;
    direction: 'incoming' | 'outgoing';
    description: string;
    counterparty: string | null;
    category: string | null;
    status: string | null;
    date: string | null;
    amount: number;
  }>;
}>;

export type ExpensesResponse = FinanceEnvelope<{
  summary: {
    total_expenses: number;
    open_expenses: number;
    paid_expenses: number;
    overdue_expenses: number;
    items_count: number;
  };
  categories: {
    expense_breakdown: Array<{
      category: string;
      amount: number;
      count: number;
    }>;
    catalog: Array<{
      id: string | null;
      name: string;
      type: string | null;
    }>;
  };
  items: Array<{
    id: string | null;
    description: string;
    counterparty: string | null;
    category: string | null;
    status: string | null;
    date: string | null;
    amount: number;
  }>;
}>;
