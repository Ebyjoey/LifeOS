import type { QRCodeType, QRCodeOptions } from '@/types/qrcode';

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function generateQRCodeData(type: QRCodeType, data: Record<string, string>): string {
  switch (type) {
    case 'url':
      return data.url || '';
    case 'text':
      return data.text || '';
    case 'email': {
      const email = data.email || '';
      const subject = data.subject ? `?subject=${encodeURIComponent(data.subject)}` : '';
      const body = data.body ? `&body=${encodeURIComponent(data.body)}` : '';
      return `mailto:${email}${subject}${body}`;
    }
    case 'phone':
      return `tel:${data.phone || ''}`;
    case 'sms': {
      const phone = data.phone || '';
      const body = data.message ? `?body=${encodeURIComponent(data.message)}` : '';
      return `sms:${phone}${body}`;
    }
    case 'wifi': {
      const ssid = data.ssid || '';
      const password = data.password || '';
      const encryption = data.encryption || 'WPA';
      const hidden = data.hidden === 'true' ? 'true' : 'false';
      return `WIFI:T:${encryption};S:${ssid};P:${password};H:${hidden};;`;
    }
    case 'vcard': {
      const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
      if (data.firstName || data.lastName) {
        lines.push(`N:${data.lastName || ''};${data.firstName || ''};;;`);
        lines.push(`FN:${data.firstName || ''} ${data.lastName || ''}`.trim());
      }
      if (data.organization) lines.push(`ORG:${data.organization}`);
      if (data.title) lines.push(`TITLE:${data.title}`);
      if (data.phone) lines.push(`TEL;TYPE=WORK,VOICE:${data.phone}`);
      if (data.mobile) lines.push(`TEL;TYPE=CELL,VOICE:${data.mobile}`);
      if (data.email) lines.push(`EMAIL:${data.email}`);
      if (data.url) lines.push(`URL:${data.url}`);
      if (data.address) lines.push(`ADR;TYPE=WORK:;;${data.address.replace(/\n/g, ';')};;;`);
      if (data.note) lines.push(`NOTE:${data.note}`);
      lines.push('END:VCARD');
      return lines.join('\n');
    }
    case 'location': {
      const lat = data.latitude || '';
      const lng = data.longitude || '';
      const query = data.query ? `?q=${encodeURIComponent(data.query)}` : '';
      return `geo:${lat},${lng}${query}`;
    }
    case 'event': {
      const formatDate = (date: string, time?: string) => {
        const d = date.replace(/-/g, '');
        const t = time?.replace(/:/g, '') || '000000';
        return `${d}T${t}Z`;
      };

      const lines = ['BEGIN:VEVENT'];
      if (data.title) lines.push(`SUMMARY:${data.title}`);
      if (data.description) lines.push(`DESCRIPTION:${data.description}`);
      if (data.location) lines.push(`LOCATION:${data.location}`);
      if (data.startDate) lines.push(`DTSTART:${formatDate(data.startDate, data.startTime)}`);
      if (data.endDate) {
        lines.push(`DTEND:${formatDate(data.endDate, data.endTime)}`);
      } else if (data.startDate) {
        lines.push(`DTEND:${formatDate(data.startDate, data.startTime)}`);
      }
      lines.push('END:VEVENT');
      return lines.join('\n');
    }
    default:
      return JSON.stringify(data);
  }
}

export function generateQRCodeLabel(type: QRCodeType, data: Record<string, string>): string {
  switch (type) {
    case 'url':
      return data.url?.slice(0, 50) || 'Website URL';
    case 'text':
      return data.text?.slice(0, 50) || 'Plain Text';
    case 'email':
      return data.email || 'Email';
    case 'phone':
      return data.phone || 'Phone Number';
    case 'sms':
      return data.phone || 'SMS';
    case 'wifi':
      return data.ssid || 'WiFi Network';
    case 'vcard':
      return [data.firstName, data.lastName].filter(Boolean).join(' ') || 'Contact';
    case 'location':
      return data.query || `${data.latitude}, ${data.longitude}` || 'Location';
    case 'event':
      return data.title || 'Event';
    default:
      return 'QR Code';
  }
}

export function getQRCodeOptionsDefaults(): QRCodeOptions {
  return {
    size: 256,
    margin: 4,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
    includeMargin: true,
  };
}

export function downloadQRCode(
  canvas: HTMLCanvasElement,
  filename: string,
  format: 'png' | 'svg' = 'png'
): void {
  if (format === 'svg') {
    const svgData = canvasToSVG(canvas);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    downloadBlob(blob, `${filename}.svg`);
  } else {
    canvas.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, `${filename}.png`);
      }
    }, 'image/png');
  }
}

function canvasToSVG(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">`;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      const alpha = pixels[i + 3];
      if (alpha > 128) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        svg += `<rect x="${x}" y="${y}" width="1" height="1" fill="rgb(${r},${g},${b})"/>`;
      }
    }
  }

  svg += '</svg>';
  return svg;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

  return date.toLocaleDateString();
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}