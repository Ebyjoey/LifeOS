import type { QRCodeType, QRCodeData, QRField } from '@/types/qrcode';

export function formatQRCodeData(type: QRCodeType, data: Record<string, string>): string {
  switch (type) {
    case 'url':
      return formatURL(data.url);
    case 'text':
      return data.text || '';
    case 'email':
      return formatEmail(data.email, data.subject, data.body);
    case 'phone':
      return formatPhone(data.phone);
    case 'sms':
      return formatSMS(data.phone, data.message);
    case 'wifi':
      return formatWiFi(data.ssid, data.password, data.encryption as 'WPA' | 'WEP' | 'nopass', data.hidden === 'true');
    case 'vcard':
      return formatVCard(data);
    case 'location':
      return formatLocation(data.latitude, data.longitude, data.query);
    case 'event':
      return formatEvent(data);
    default:
      return '';
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

function formatURL(url: string): string {
  if (!url) return '';
  try {
    new URL(url);
    return url;
  } catch {
    return `https://${url}`;
  }
}

function formatEmail(email: string, subject?: string, body?: string): string {
  if (!email) return '';
  const params = new URLSearchParams();
  if (subject) params.append('subject', subject);
  if (body) params.append('body', body);
  const query = params.toString();
  return `mailto:${email}${query ? `?${query}` : ''}`;
}

function formatPhone(phone: string): string {
  if (!phone) return '';
  return `tel:${phone.replace(/\s+/g, '')}`;
}

function formatSMS(phone: string, message?: string): string {
  if (!phone) return '';
  const params = new URLSearchParams();
  if (message) params.append('body', message);
  const query = params.toString();
  return `sms:${phone.replace(/\s+/g, '')}${query ? `?${query}` : ''}`;
}

function formatWiFi(
  ssid: string,
  password: string,
  encryption: 'WPA' | 'WEP' | 'nopass' = 'WPA',
  hidden: boolean = false
): string {
  if (!ssid) return '';
  const parts = ['WIFI:'];
  parts.push(`T:${encryption};`);
  parts.push(`S:${escapeWiFiString(ssid)};`);
  if (encryption !== 'nopass' && password) {
    parts.push(`P:${escapeWiFiString(password)};`);
  }
  if (hidden) {
    parts.push('H:true;');
  }
  parts.push(';');
  return parts.join('');
}

function escapeWiFiString(str: string): string {
  return str.replace(/[\\;:,"]/g, '\\$&');
}

function formatVCard(data: Record<string, string>): string {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];

  if (data.firstName || data.lastName) {
    lines.push(`N:${data.lastName || ''};${data.firstName || ''};;;`);
    lines.push(`FN:${data.firstName || ''} ${data.lastName || ''}`.trim());
  }
  if (data.organization) lines.push(`ORG:${data.organization}`);
  if (data.title) lines.push(`TITLE:${data.title}`);
  if (data.phone) lines.push(`TEL;TYPE=WORK,VOICE:${data.phone}`);
  if (data.mobile) lines.push(`TEL;TYPE=CELL,VOICE:${data.mobile}`);
  if (data.email) lines.push(`EMAIL;TYPE=WORK:${data.email}`);
  if (data.url) lines.push(`URL:${data.url}`);
  if (data.address) lines.push(`ADR;TYPE=WORK:;;${data.address};;;;`);
  if (data.note) lines.push(`NOTE:${data.note}`);

  lines.push('END:VCARD');
  return lines.join('\r\n');
}

function formatLocation(
  latitude: string,
  longitude: string,
  query?: string
): string {
  if (!latitude || !longitude) return '';
  const coords = `${latitude},${longitude}`;
  return query ? `geo:${coords}?q=${encodeURIComponent(query)}` : `geo:${coords}`;
}

function formatEvent(data: Record<string, string>): string {
  const lines = [
    'BEGIN:VEVENT',
    'VERSION:2.0',
    'PRODID:-//QR Code Generator//EN',
  ];

  if (data.title) lines.push(`SUMMARY:${escapeVCal(data.title)}`);
  if (data.description) lines.push(`DESCRIPTION:${escapeVCal(data.description)}`);
  if (data.location) lines.push(`LOCATION:${escapeVCal(data.location)}`);

  if (data.startDate) {
    lines.push(`DTSTART:${formatVCalDate(data.startDate, data.startTime)}`);
  }
  if (data.endDate) {
    lines.push(`DTEND:${formatVCalDate(data.endDate, data.endTime)}`);
  }

  lines.push('END:VEVENT');
  return lines.join('\r\n');
}

function escapeVCal(str: string): string {
  return str.replace(/([\\;,])/g, '\\$1').replace(/\n/g, '\\n');
}

function formatVCalDate(date: string, time?: string): string {
  const dateStr = date.replace(/-/g, '');
  if (time) {
    const timeStr = time.replace(/:/g, '');
    return `${dateStr}T${timeStr}00`;
  }
  return `${dateStr}T000000`;
}

export function getQRCodeTypeLabel(type: QRCodeType): string {
  const labels: Record<QRCodeType, string> = {
    url: 'Website URL',
    text: 'Plain Text',
    email: 'Email',
    phone: 'Phone Number',
    sms: 'SMS',
    wifi: 'WiFi Network',
    vcard: 'Contact (vCard)',
    location: 'Location',
    event: 'Event',
  };
  return labels[type];
}

export function getQRCodeTypeDescription(type: QRCodeType): string {
  const descriptions: Record<QRCodeType, string> = {
    url: 'Create a QR code that opens a website',
    text: 'Encode any plain text message',
    email: 'Create an email with pre-filled subject and body',
    phone: 'Create a click-to-call phone number',
    sms: 'Pre-fill a phone number and message',
    wifi: 'Share WiFi credentials instantly',
    vcard: 'Share contact information as vCard',
    location: 'Share a map location or coordinates',
    event: 'Create a calendar event',
  };
  return descriptions[type];
}

export const QR_CODE_TYPES: QRCodeType[] = [
  'url',
  'text',
  'email',
  'phone',
  'sms',
  'wifi',
  'vcard',
  'location',
  'event',
];

export const QR_CODE_TYPES_CONFIG: QRCodeData[] = [
  {
    type: 'url',
    label: 'Website URL',
    icon: 'globe',
    fields: [
      {
        name: 'url',
        label: 'Website URL',
        type: 'url',
        placeholder: 'https://example.com',
        required: true,
      },
    ],
  },
  {
    type: 'text',
    label: 'Plain Text',
    icon: 'type',
    fields: [
      {
        name: 'text',
        label: 'Text Content',
        type: 'textarea',
        placeholder: 'Enter any text...',
        required: true,
      },
    ],
  },
  {
    type: 'email',
    label: 'Email',
    icon: 'mail',
    fields: [
      {
        name: 'email',
        label: 'Email Address',
        type: 'email',
        placeholder: 'example@domain.com',
        required: true,
      },
      {
        name: 'subject',
        label: 'Subject (optional)',
        type: 'text',
        placeholder: 'Subject line',
      },
      {
        name: 'body',
        label: 'Message Body (optional)',
        type: 'textarea',
        placeholder: 'Message content',
      },
    ],
  },
  {
    type: 'phone',
    label: 'Phone Number',
    icon: 'phone',
    fields: [
      {
        name: 'phone',
        label: 'Phone Number',
        type: 'tel',
        placeholder: '+1 (555) 123-4567',
        required: true,
      },
    ],
  },
  {
    type: 'sms',
    label: 'SMS',
    icon: 'message-square',
    fields: [
      {
        name: 'phone',
        label: 'Phone Number',
        type: 'tel',
        placeholder: '+1 (555) 123-4567',
        required: true,
      },
      {
        name: 'message',
        label: 'Message (optional)',
        type: 'textarea',
        placeholder: 'Pre-filled message',
      },
    ],
  },
  {
    type: 'wifi',
    label: 'WiFi Network',
    icon: 'wifi',
    fields: [
      {
        name: 'ssid',
        label: 'Network Name (SSID)',
        type: 'text',
        placeholder: 'MyWiFiNetwork',
        required: true,
      },
      {
        name: 'password',
        label: 'Password (optional for open networks)',
        type: 'text',
        placeholder: 'password123',
      },
      {
        name: 'encryption',
        label: 'Encryption Type',
        type: 'select',
        required: true,
        options: [
          { value: 'WPA', label: 'WPA/WPA2/WPA3 (Most common)' },
          { value: 'WEP', label: 'WEP (Legacy)' },
          { value: 'nopass', label: 'No Password (Open network)' },
        ],
      },
      {
        name: 'hidden',
        label: 'Hidden Network',
        type: 'select',
        options: [
          { value: 'false', label: 'No (Visible network)' },
          { value: 'true', label: 'Yes (Hidden SSID)' },
        ],
      },
    ],
  },
  {
    type: 'vcard',
    label: 'Contact (vCard)',
    icon: 'user',
    fields: [
      {
        name: 'firstName',
        label: 'First Name',
        type: 'text',
        placeholder: 'John',
      },
      {
        name: 'lastName',
        label: 'Last Name',
        type: 'text',
        placeholder: 'Doe',
      },
      {
        name: 'organization',
        label: 'Organization',
        type: 'text',
        placeholder: 'Acme Inc.',
      },
      {
        name: 'title',
        label: 'Job Title',
        type: 'text',
        placeholder: 'Software Engineer',
      },
      {
        name: 'phone',
        label: 'Work Phone',
        type: 'tel',
        placeholder: '+1 (555) 123-4567',
      },
      {
        name: 'mobile',
        label: 'Mobile Phone',
        type: 'tel',
        placeholder: '+1 (555) 987-6543',
      },
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        placeholder: 'john@acme.com',
      },
      {
        name: 'url',
        label: 'Website',
        type: 'url',
        placeholder: 'https://acme.com',
      },
      {
        name: 'address',
        label: 'Work Address',
        type: 'textarea',
        placeholder: '123 Main St, City, State 12345',
      },
      {
        name: 'note',
        label: 'Notes',
        type: 'textarea',
        placeholder: 'Additional notes',
      },
    ],
  },
  {
    type: 'location',
    label: 'Location',
    icon: 'map-pin',
    fields: [
      {
        name: 'latitude',
        label: 'Latitude',
        type: 'number',
        placeholder: '40.7128',
        required: true,
      },
      {
        name: 'longitude',
        label: 'Longitude',
        type: 'number',
        placeholder: '-74.0060',
        required: true,
      },
      {
        name: 'query',
        label: 'Location Name (optional)',
        type: 'text',
        placeholder: 'Statue of Liberty',
      },
    ],
  },
  {
    type: 'event',
    label: 'Event',
    icon: 'calendar',
    fields: [
      {
        name: 'title',
        label: 'Event Title',
        type: 'text',
        placeholder: 'Team Meeting',
        required: true,
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        placeholder: 'Weekly team sync',
      },
      {
        name: 'location',
        label: 'Location',
        type: 'text',
        placeholder: 'Conference Room A / Zoom',
      },
      {
        name: 'startDate',
        label: 'Start Date',
        type: 'text',
        placeholder: '2024-12-25',
        required: true,
      },
      {
        name: 'startTime',
        label: 'Start Time',
        type: 'text',
        placeholder: '10:00',
      },
      {
        name: 'endDate',
        label: 'End Date',
        type: 'text',
        placeholder: '2024-12-25',
      },
      {
        name: 'endTime',
        label: 'End Time',
        type: 'text',
        placeholder: '11:00',
      },
    ],
  },
];