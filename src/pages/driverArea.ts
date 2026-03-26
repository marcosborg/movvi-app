export type DriverDashboardResponse = {
  viewer: {
    id: number;
    name: string;
    email: string;
    roles: string[];
  };
  capabilities: {
    is_admin: boolean;
    is_manager: boolean;
    is_driver: boolean;
  };
  week: {
    id: number;
    number: number | null;
    start_date: string;
    end_date: string;
    requested_date: string | null;
  };
  financial_hub: {
    enabled: boolean;
    provider: string;
    status: string;
    modules: Array<{
      key: string;
      title: string;
      summary: string;
      status: string;
      scope?: string;
    }>;
  };
  operations_hub: {
    enabled: boolean;
    modules: Array<{
      key: string;
      title: string;
      summary: string;
      status: string;
    }>;
  };
  driver_hub: {
    enabled: boolean;
    status: string;
    reason?: string;
    driver: {
      id: number;
      code: string | null;
      name: string | null;
      email: string | null;
      phone: string | null;
      company: { id: number; name: string } | null;
      state?: { id: number; name: string } | null;
      contract_vat?: {
        id: number;
        name: string;
        percent: number;
        rf: number;
        iva: number;
      } | null;
    } | null;
    week: {
      id: number;
      number: number | null;
      start_date: string;
      end_date: string;
      requested_date: string | null;
    };
    statement_metrics: {
      uber_net: number;
      bolt_net: number;
      total: number;
      weekly_km: number;
      earnings_per_km: number;
    } | null;
    account_summary: Record<string, unknown> | null;
    balance: {
      final: number;
      value: number;
      last_balance: number;
      new_balance: number;
      vat: number;
      rf: number;
    } | null;
    vehicle: {
      id: number;
      license_plate: string;
      model: string | null;
    } | null;
    vehicle_profitability: unknown;
    combustion_transactions: Array<{
      id: number;
      card: string | null;
      amount: number;
      unit: string;
      total: number;
      date: string | null;
    }>;
    car_track_details: Array<{
      date: string | null;
      value: number;
    }>;
    recent_receipts: Array<{
      id: number;
      value: number;
      verified_value: number | null;
      amount_transferred: number | null;
      verified: boolean;
      paid: boolean;
      created_at: string | null;
      file_url: string | null;
    }>;
    actions: Array<{
      key: string;
      title: string;
      summary: string;
      status: string;
    }>;
  };
};

export type DriverWeekSummary = {
  id: number;
  number: number | null;
  start_date: string;
  end_date: string;
  date_key: string;
  label: string;
};

export type DriverReceiptsResponse = {
  driver: DriverDashboardResponse['driver_hub']['driver'];
  week: DriverDashboardResponse['week'] | null;
  submission: {
    balance: DriverDashboardResponse['driver_hub']['balance'] | null;
    can_submit_receipt: boolean;
    expense_receipt: {
      id: number;
      verified: boolean;
    } | null;
  };
  receipts: Array<{
    id: number;
    type: 'receipt';
    value: number;
    balance: number | null;
    verified_value: number | null;
    amount_transferred: number | null;
    verified: boolean;
    paid: boolean;
    created_at: string | null;
    tvde_week_id: number | null;
    file_url: string | null;
  }>;
  expense_receipts: Array<{
    id: number;
    type: 'expense_receipt';
    approved_value: number | null;
    verified: boolean;
    created_at: string | null;
    tvde_week_id: number | null;
    files: Array<{ name: string; url: string }>;
  }>;
  reimbursements: Array<{
    id: number;
    type: 'reimbursement';
    value: number;
    verified: boolean;
    created_at: string | null;
    tvde_week_id: number | null;
    file_url: string | null;
  }>;
};

export type DriverReceiptMutationResponse = {
  message: string;
};

export type DriverDocumentsResponse = {
  driver: DriverDashboardResponse['driver_hub']['driver'];
  documents: Array<{
    key: string;
    title: string;
    files: Array<{ name: string; url: string }>;
  }>;
};

export type DriverWeeklyEvaluationResponse = {
  driver: DriverDashboardResponse['driver_hub']['driver'];
  week: DriverDashboardResponse['week'];
  vehicles: Array<{
    id: number;
    license_plate: string;
    model: string | null;
    label: string;
  }>;
  options: {
    fuel_levels: Record<string, string>;
    tire_statuses: Record<string, string>;
    oil_levels: Record<string, string>;
  };
  evaluation: {
    id: number;
    vehicle_id: number;
    final_mileage: number | null;
    fuel_level: string | null;
    front_tire_status: string | null;
    rear_tire_status: string | null;
    oil_level: string | null;
    has_vehicle_issue: boolean;
    issue_notes: string | null;
    submitted_at: string | null;
  } | null;
};

export const euro = new Intl.NumberFormat('pt-PT', {
  style: 'currency',
  currency: 'EUR',
});

export function formatMoney(value?: number | null) {
  return euro.format(value ?? 0);
}

export function getAccountValue(accountSummary: Record<string, unknown> | null | undefined, path: string, fallback = 0) {
  if (!accountSummary) {
    return fallback;
  }

  const parts = path.split('.');
  let current: unknown = accountSummary;

  for (const part of parts) {
    if (!current || typeof current !== 'object' || !(part in current)) {
      return fallback;
    }

    current = (current as Record<string, unknown>)[part];
  }

  const value = Number(current);
  return Number.isFinite(value) ? value : fallback;
}
