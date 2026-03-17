import { IonButton } from '@ionic/react';
import { useRef } from 'react';

type ImageSourceFieldProps = {
  label: string;
  onFilesSelected: (files: FileList | null) => void;
  multiple?: boolean;
  galleryAccept?: string;
  galleryLabel?: string;
  cameraLabel?: string;
  disabled?: boolean;
};

const ImageSourceField: React.FC<ImageSourceFieldProps> = ({
  label,
  onFilesSelected,
  multiple = false,
  galleryAccept = 'image/*',
  galleryLabel = 'Galeria',
  cameraLabel = 'Usar câmara',
  disabled = false,
}) => {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="upload-field">
      <span>{label}</span>
      <div className="upload-source-row">
        <IonButton
          size="small"
          disabled={disabled}
          onClick={() => cameraInputRef.current?.click()}
        >
          {cameraLabel}
        </IonButton>
        <IonButton
          size="small"
          fill="outline"
          disabled={disabled}
          onClick={() => galleryInputRef.current?.click()}
        >
          {galleryLabel}
        </IonButton>
      </div>
      <input
        ref={cameraInputRef}
        className="visually-hidden-input"
        type="file"
        accept="image/*"
        capture="environment"
        disabled={disabled}
        onChange={(event) => {
          onFilesSelected(event.target.files);
          event.currentTarget.value = '';
        }}
      />
      <input
        ref={galleryInputRef}
        className="visually-hidden-input"
        type="file"
        accept={galleryAccept}
        multiple={multiple}
        disabled={disabled}
        onChange={(event) => {
          onFilesSelected(event.target.files);
          event.currentTarget.value = '';
        }}
      />
    </div>
  );
};

export default ImageSourceField;
