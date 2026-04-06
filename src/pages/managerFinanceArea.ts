export type CompanySummary = {
  id: number;
  name: string;
};

export type WeekSummary = {
  id: number;
  number: number | null;
  start_date: string;
  end_date: string;
  date_key: string;
  label: string;
};

export type FinanceEnvelope<T> = {
  company: CompanySummary;
  data: T;
};

export type FinancialMovementItem = {
  id: string | null;
  description: string;
  counterparty: string | null;
  category: string | null;
  status: string | null;
  date: string | null;
  amount: number;
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
  raw: {
    receivables: FinancialMovementItem[];
    payables: FinancialMovementItem[];
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
  movements: Array<FinancialMovementItem & {
    direction: 'incoming' | 'outgoing';
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
  items: FinancialMovementItem[];
}>;

export type CompanyReportResponse = {
  company: CompanySummary;
  week: {
    id: number;
    number: number | null;
    start_date: string;
    end_date: string;
    requested_date: string | null;
  };
  data: {
    drivers: Array<{
      id: number;
      name: string;
      license_plate: string | null;
      weekly_km: number;
      earnings_per_km: number;
      uber_net: number;
      bolt_net: number;
      tips_total: number;
      vat_value: number;
      fuel: number;
      adjustments: number;
      general_adjustments?: number;
      abatimento_aluguer?: number;
      diferenca_faturacao_minima?: number;
      caucao_recebida?: number;
      caucao_devolvida?: number;
      via_verde: number;
      percent_value: number;
      car_hire: number;
      total: number;
      last_balance: number;
      new_balance: number;
      manual_status?: string | null;
      manual_status_label?: string | null;
      validated: boolean;
    }>;
    totals: {
      net_uber: number;
      net_bolt: number;
      total_weekly_km: number;
      total_earnings_per_km: number;
      total_drivers: number;
      tips_total: number;
      total_iva_value: number;
      total_fuel_transactions: number;
      total_adjustments: number;
      total_general_adjustments?: number;
      total_rent_discounts?: number;
      total_minimum_billing_difference?: number;
      total_caution_received?: number;
      total_caution_returned?: number;
      total_car_track: number;
      total_percent_value: number;
      total_car_hire: number;
    };
  };
};

export type VehicleRevenueExportResponse = {
  message: string;
  company: CompanySummary;
  week: {
    id: number;
    number: number | null;
    start_date: string;
    end_date: string;
  };
  data: {
    exported: number;
    skipped: number;
    items: Array<{
      vehicle_item_id: number;
      license_plate: string;
      status: 'exported' | 'skipped' | 'error';
      amount?: number;
      message?: string;
    }>;
  };
};

export type VehicleRevenueExportsStatusResponse = {
  company: CompanySummary;
  selected_week: {
    id: number;
    number: number | null;
    start_date: string;
    end_date: string;
    summary: {
      total: number;
      exported: number;
      errors: number;
      amount: number;
      last_exported_at: string | null;
    };
    items: Array<{
      id: number;
      vehicle_item_id: number;
      license_plate: string;
      amount: number;
      description: string | null;
      status: 'exported' | 'error';
      error_message: string | null;
      conta_azul_event_id: string | null;
      conta_azul_installment_id: string | null;
      conta_azul_acquittance_id: string | null;
      exported_at: string | null;
    }>;
  } | null;
  recent_weeks: Array<{
    week: {
      id: number;
      number: number | null;
      start_date: string | null;
      end_date: string | null;
    };
    summary: {
      total: number;
      exported: number;
      errors: number;
      amount: number;
      last_exported_at: string | null;
    };
  }>;
};
