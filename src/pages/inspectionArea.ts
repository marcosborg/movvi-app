export type InspectionListItem = {
  id: number;
  type: string;
  type_label: string;
  status: string;
  status_label: string;
  current_step: number;
  vehicle: {
    id: number | null;
    license_plate: string | null;
  };
  driver: {
    id: number | null;
    name: string | null;
  };
  started_at: string | null;
  locked_at: string | null;
  transfer_context?: {
    mode: string;
    mode_label: string;
    source_driver: {
      id: number;
      name: string;
    } | null;
  } | null;
};

export type InspectionListResponse = {
  data: InspectionListItem[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    is_admin: boolean;
    can_create: boolean;
  };
};

export type InspectionCreateOptionsResponse = {
  types: Array<{
    key: string;
    label: string;
  }>;
  vehicles: Array<{
    id: number;
    license_plate: string;
    driver_id: number | null;
    driver_name: string | null;
  }>;
  drivers: Array<{
    id: number;
    name: string;
  }>;
};

export type InspectionShowResponse = {
  inspection: {
    id: number;
    type: string;
    type_label: string;
    status: string;
    status_label: string;
    current_step: number;
    extra_observations: string | null;
    location: {
      text: string | null;
      lat: string | null;
      lng: string | null;
    };
    vehicle: {
      id: number | null;
      license_plate: string | null;
      brand: string | null;
      model: string | null;
      year: number | null;
    };
    driver: {
      id: number | null;
      name: string | null;
    };
    report_pdf_url: string | null;
    transfer_context?: {
      mode: string;
      mode_label: string;
      source_driver: {
        id: number;
        name: string;
      } | null;
    } | null;
  };
  driver_options: Array<{
    id: number;
    name: string;
  }>;
  steps: Record<string, string>;
  required_slots: {
    exterior: string[];
    interior: string[];
  };
  slot_labels: {
    exterior: Record<string, string>;
    interior: Record<string, string>;
  };
  document_keys: string[];
  operational_checks: string[];
  accessory_keys: string[];
  damage_locations: Record<string, string>;
  damage_types: Record<string, string>;
  damage_parts: Record<string, { label: string; sections: Record<string, string> }>;
  checklist: Record<string, Record<string, string | number | boolean | null>>;
  photos: Array<{
    id: number;
    category: string;
    slot: string | null;
    url: string;
    original_name: string | null;
  }>;
  damages: Array<{
    id: number;
    scope: string;
    location: string;
    part: string;
    part_section: string | null;
    damage_type: string;
    notes: string | null;
    is_resolved: boolean;
    photos: Array<{
      id: number;
      url: string;
      original_name: string | null;
    }>;
  }>;
  signatures: {
    responsible: string | null;
    driver: string | null;
  };
  meta: {
    is_admin: boolean;
  };
};

export type InspectionMutationResponse = {
  message: string;
  inspection_id?: number;
  current_step?: number;
  status?: string;
  report_pdf_url?: string | null;
};

export const documentLabels: Record<string, string> = {
  dua: 'DUA',
  insurance: 'Seguro',
  inspection_periodic: 'Inspecao periodica',
  tvde_stickers: 'Disticos TVDE',
  no_smoking_sticker: 'Autocolante proibicao de fumar',
};

export const accessoryLabels: Record<string, string> = {
  via_verde: 'Via Verde',
  charging_cable: 'Cabos de carregamento',
  charging_adapter: 'Adaptadores de carregamento',
  spare_tire: 'Pneu suplente',
  anti_puncture_kit: 'Kit anti-furos',
  jack_wrench: 'Macaco e chave de rodas',
  warning_triangle: 'Triangulo de sinalizacao',
  reflective_vest: 'Colete refletor',
};

export const operationalLabels: Record<string, string> = {
  cleanliness: 'Limpeza',
  fuel_energy: 'Combustivel / energia',
  mileage: 'Quilometragem',
  tire_condition: 'Estado dos pneus',
  panel_warnings: 'Avisos no painel',
};

export function getStepEntries(steps: Record<string, string>) {
  return Object.entries(steps)
    .map(([key, label]) => ({ key: Number(key), label }))
    .sort((a, b) => a.key - b.key);
}
