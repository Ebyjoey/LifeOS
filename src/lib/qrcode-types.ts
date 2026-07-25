import type { QRCodeType, QRField, QRCodeData } from '@/types/qrcode';

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

export function getQRCodeTypeConfig(type: QRCodeType): QRCodeData | undefined {
  return QR_CODE_TYPES_CONFIG.find((t) => t.type === type);
}