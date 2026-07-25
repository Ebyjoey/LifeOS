export type QRCodeType =
  | 'url'
  | 'text'
  | 'email'
  | 'phone'
  | 'sms'
  | 'wifi'
  | 'vcard'
  | 'location'
  | 'event';

export interface QRField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'email' | 'tel' | 'url' | 'number' | 'select' | 'switch';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

export interface QRCodeData {
  type: QRCodeType;
  label: string;
  icon: string;
  fields: QRField[];
}

export interface QRCodeOptions {
  size: number;
  margin: number;
  color: {
    dark: string;
    light: string;
  };
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  includeMargin: boolean;
  logo?: {
    src: string;
    width: number;
    height: number;
  };
}

export interface QRCodeHistoryItem {
  id: string;
  type: QRCodeType;
  data: Record<string, string>;
  options: QRCodeOptions;
  timestamp: number;
  label: string;
}

export interface QRCodeGeneratorProps {
  type: QRCodeType;
  data: Record<string, string>;
  options: QRCodeOptions;
  onDataChange: (data: Record<string, string>) => void;
  onOptionsChange: (options: Partial<QRCodeOptions>) => void;
  onDownload: (format: 'png' | 'svg') => void;
  onCopy: () => void;
}