import { describe, expect, it } from 'vitest';
import { findVehicleFromRecognizedText, normalizePlate } from './VehiclePlateScanner';

const vehicles = [
  { id: 1, license_plate: 'AA-01-AA' },
  { id: 2, license_plate: '23-XZ-45' },
];

describe('vehicle plate recognition matching', () => {
  it('normalizes separators and casing', () => {
    expect(normalizePlate(' aa 01-aa ')).toBe('AA01AA');
  });

  it('matches a known plate inside recognized text', () => {
    expect(findVehicleFromRecognizedText('PORTUGAL\nAA 01 AA', vehicles)?.id).toBe(1);
  });

  it('accepts one common OCR character confusion', () => {
    expect(findVehicleFromRecognizedText('AA-O1-AA', vehicles)?.id).toBe(1);
  });

  it('does not guess when the recognition is ambiguous', () => {
    const ambiguous = [
      { id: 3, license_plate: 'AA-01-AA' },
      { id: 4, license_plate: 'AA-O1-AA' },
    ];
    expect(findVehicleFromRecognizedText('AA Q1 AA', ambiguous)).toBeNull();
  });

  it('does not accept unrelated text', () => {
    expect(findVehicleFromRecognizedText('MOVVI FROTA', vehicles)).toBeNull();
  });
});
