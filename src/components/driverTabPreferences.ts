import type { ComponentProps } from 'react';
import type { IonIcon } from '@ionic/react';
import {
  analyticsOutline,
  barChartOutline,
  carSportOutline,
  clipboardOutline,
  documentTextOutline,
  documentsOutline,
  gridOutline,
  settingsOutline,
  swapHorizontalOutline,
} from 'ionicons/icons';

export type DriverTabPreferenceContext = {
  isAdmin: boolean;
  isGestor: boolean;
  canViewFinance: boolean;
  hasDriverProfile: boolean;
};

export type DriverTabDefinition = {
  key: string;
  label: string;
  href: string;
  icon: ComponentProps<typeof IonIcon>['icon'];
  visible: (context: DriverTabPreferenceContext) => boolean;
};

export const DRIVER_TAB_ORDER_STORAGE_KEY = 'movvi:driver-tab-order';

export const DRIVER_TAB_DEFINITIONS: DriverTabDefinition[] = [
  {
    key: 'finance',
    label: 'Financeiro',
    href: '/dashboard/finance',
    icon: barChartOutline,
    visible: (context) => context.canViewFinance,
  },
  {
    key: 'company-reports',
    label: 'Relatorios',
    href: '/dashboard/company-reports',
    icon: clipboardOutline,
    visible: (context) => context.canViewFinance,
  },
  {
    key: 'overview',
    label: 'Resumo',
    href: '/dashboard/overview',
    icon: gridOutline,
    visible: (context) => context.hasDriverProfile,
  },
  {
    key: 'statement',
    label: 'Extrato',
    href: '/dashboard/statement',
    icon: analyticsOutline,
    visible: (context) => context.hasDriverProfile,
  },
  {
    key: 'receipts',
    label: 'Recibos',
    href: '/dashboard/receipts',
    icon: documentTextOutline,
    visible: (context) => context.hasDriverProfile,
  },
  {
    key: 'inspections',
    label: 'Inspecoes',
    href: '/dashboard/inspections',
    icon: carSportOutline,
    visible: (context) => context.isAdmin,
  },
  {
    key: 'transfers',
    label: 'Passagens',
    href: '/dashboard/transfers',
    icon: swapHorizontalOutline,
    visible: (context) => context.isAdmin,
  },
  {
    key: 'weekly-evaluation',
    label: 'Semanal',
    href: '/dashboard/weekly-evaluation',
    icon: clipboardOutline,
    visible: (context) => context.hasDriverProfile,
  },
  {
    key: 'documents',
    label: 'Documentos',
    href: '/dashboard/documents',
    icon: documentsOutline,
    visible: (context) => context.hasDriverProfile,
  },
  {
    key: 'preferences',
    label: 'Abas',
    href: '/dashboard/preferences',
    icon: settingsOutline,
    visible: () => true,
  },
];

export function getVisibleDriverTabs(context: DriverTabPreferenceContext) {
  return DRIVER_TAB_DEFINITIONS.filter((tab) => tab.visible(context));
}

export function readDriverTabOrder(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(DRIVER_TAB_ORDER_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function writeDriverTabOrder(order: string[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(DRIVER_TAB_ORDER_STORAGE_KEY, JSON.stringify(order));
  window.dispatchEvent(new CustomEvent('movvi:driver-tab-order-changed', { detail: order }));
}

export function sortDriverTabsByPreference<T extends { key: string }>(tabs: T[], preferredOrder: string[]) {
  const order = preferredOrder.length > 0
    ? preferredOrder
    : tabs.map((tab) => tab.key);

  const orderIndex = new Map(order.map((key, index) => [key, index]));

  return [...tabs].sort((left, right) => {
    const leftIndex = orderIndex.get(left.key) ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = orderIndex.get(right.key) ?? Number.MAX_SAFE_INTEGER;

    if (leftIndex === rightIndex) {
      return 0;
    }

    return leftIndex - rightIndex;
  });
}
