import { describe, expect, it } from 'vitest';
import { getGeneralAdjustmentDetails } from './driverArea';

describe('getGeneralAdjustmentDetails', () => {
  it('keeps the adjustment name and applies the debit sign', () => {
    expect(getGeneralAdjustmentDetails({
      adjustments_array: [
        { id: 1, name: 'Lavagem', type: 'deduct', amount: '10.00', category: 'general' },
        { id: 2, name: 'Prémio', type: 'refund', amount: 5, category: 'ajuste_manual' },
      ],
    })).toEqual([
      { id: 1, name: 'Lavagem', signedAmount: -10 },
      { id: 2, name: 'Prémio', signedAmount: 5 },
    ]);
  });

  it('shows excess kilometres but leaves separately displayed categories out', () => {
    expect(getGeneralAdjustmentDetails({
      adjustment_details: [
        { id: 3, name: 'KM excedidos', type: 'deduct', amount: 14.78, category: 'quilometros_excedentes' },
        { id: 4, name: 'Caução', type: 'deduct', amount: 50, category: 'caucao_recebida' },
      ],
    })).toEqual([
      { id: 3, name: 'KM excedidos', signedAmount: -14.78 },
    ]);
  });
});
