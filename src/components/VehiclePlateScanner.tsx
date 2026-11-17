import { Camera, CameraDirection, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { NativeOcr } from 'capacitor-native-ocr';
import { IonButton, IonIcon, IonSpinner } from '@ionic/react';
import { cameraOutline } from 'ionicons/icons';
import { useState } from 'react';

export type ScannableVehicle = {
  id: number;
  license_plate: string;
};

type VehiclePlateScannerProps<T extends ScannableVehicle> = {
  vehicles: T[];
  onVehicleSelected: (vehicle: T) => void;
  disabled?: boolean;
};

const OCR_EQUIVALENT_CHARACTERS = [
  new Set(['0', 'O', 'Q', 'D']),
  new Set(['1', 'I', 'L']),
  new Set(['2', 'Z']),
  new Set(['5', 'S']),
  new Set(['6', 'G']),
  new Set(['8', 'B']),
];

export function normalizePlate(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function isOcrEquivalent(left: string, right: string) {
  return OCR_EQUIVALENT_CHARACTERS.some((group) => group.has(left) && group.has(right));
}

function ocrDistance(left: string, right: string) {
  if (left.length !== right.length) return Number.POSITIVE_INFINITY;

  let distance = 0;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] === right[index]) continue;
    if (!isOcrEquivalent(left[index], right[index])) return Number.POSITIVE_INFINITY;
    distance += 1;
  }

  return distance;
}

export function findVehicleFromRecognizedText<T extends ScannableVehicle>(text: string, vehicles: T[]): T | null {
  const recognizedLines = text
    .split(/\r?\n/)
    .map(normalizePlate)
    .filter(Boolean);
  const recognizedText = normalizePlate(text);
  const normalizedVehicles = vehicles.map((vehicle) => ({
    vehicle,
    plate: normalizePlate(vehicle.license_plate),
  })).filter((item) => item.plate.length >= 5);

  const exactMatches = normalizedVehicles.filter(({ plate }) => (
    recognizedLines.some((line) => line.includes(plate)) || recognizedText.includes(plate)
  ));
  if (exactMatches.length === 1) return exactMatches[0].vehicle;
  if (exactMatches.length > 1) return null;

  const probableMatches = normalizedVehicles.filter(({ plate }) => recognizedLines.some((line) => {
    if (line.length < plate.length) return false;
    for (let start = 0; start <= line.length - plate.length; start += 1) {
      if (ocrDistance(line.slice(start, start + plate.length), plate) === 1) return true;
    }
    return false;
  }));

  return probableMatches.length === 1 ? probableMatches[0].vehicle : null;
}

export async function readPlateTextFromCamera() {
  const photo = await Camera.getPhoto({
    source: CameraSource.Camera,
    direction: CameraDirection.Rear,
    resultType: CameraResultType.Base64,
    quality: 92,
    allowEditing: false,
    saveToGallery: false,
    correctOrientation: true,
    width: 1920,
  });

  if (!photo.base64String) {
    throw new Error('A fotografia não ficou disponível para leitura.');
  }

  const result = await NativeOcr.recognize({
    base64: photo.base64String,
    languages: ['pt'],
    level: 'accurate',
    languageCorrection: false,
  });

  return result.text;
}

const VehiclePlateScanner = <T extends ScannableVehicle>({
  vehicles,
  onVehicleSelected,
  disabled = false,
}: VehiclePlateScannerProps<T>) => {
  const [isScanning, setIsScanning] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const isNative = Capacitor.isNativePlatform();

  if (!isNative) return null;

  async function scanPlate() {
    if (vehicles.length === 0 || disabled) return;

    setIsScanning(true);
    setFeedback(null);

    try {
      const recognizedText = await readPlateTextFromCamera();
      const vehicle = findVehicleFromRecognizedText(recognizedText, vehicles);

      if (!vehicle) {
        setFeedback({
          type: 'error',
          message: 'Não consegui associar a matrícula a uma única viatura. Aproxima a câmara e tenta novamente, ou escolhe manualmente.',
        });
        return;
      }

      onVehicleSelected(vehicle);
      setFeedback({ type: 'success', message: `Matrícula ${vehicle.license_plate} reconhecida. Confirma a viatura antes de continuar.` });
    } catch (scanError) {
      const message = scanError instanceof Error ? scanError.message : 'Não foi possível ler a matrícula.';
      if (!/cancel/i.test(message)) {
        setFeedback({ type: 'error', message });
      }
    } finally {
      setIsScanning(false);
    }
  }

  return (
    <div className="vehicle-plate-scanner">
      <IonButton
        type="button"
        fill="outline"
        expand="block"
        onClick={() => void scanPlate()}
        disabled={disabled || isScanning || vehicles.length === 0}
      >
        {isScanning ? <IonSpinner name="crescent" /> : <IonIcon className="vehicle-plate-scanner-icon" icon={cameraOutline} aria-hidden="true" />}
        {isScanning ? 'A ler matrícula...' : 'Ler matrícula com a câmara'}
      </IonButton>
      <p className="dashboard-help">Enquadra apenas a matrícula, com boa luz. A seleção manual continua disponível.</p>
      {feedback ? <p className={feedback.type === 'success' ? 'status-success' : 'status-warning'}>{feedback.message}</p> : null}
    </div>
  );
};

export default VehiclePlateScanner;
