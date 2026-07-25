'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trash2, RotateCcw, Copy, Clock, ExternalLink, Mail, Phone, MessageSquare, Wifi, User, MapPin, Calendar, Globe, Type } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import type { QRCodeHistoryItem, QRCodeType } from '@/types/qrcode';
import { formatQRCodeData } from '@/lib/qrcode-data';

interface QRCodeHistoryProps {
  history: QRCodeHistoryItem[];
  onSelect: (item: QRCodeHistoryItem) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onReuse: (item: QRCodeHistoryItem) => void;
}

const typeIcons: Record<QRCodeType, React.ReactNode> = {
  url: <Globe className="h-4 w-4" />,
  text: <Type className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  phone: <Phone className="h-4 w-4" />,
  sms: <MessageSquare className="h-4 w-4" />,
  wifi: <Wifi className="h-4 w-4" />,
  vcard: <User className="h-4 w-4" />,
  location: <MapPin className="h-4 w-4" />,
  event: <Calendar className="h-4 w-4" />,
};

const typeLabels: Record<QRCodeType, string> = {
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

const typeColors: Record<QRCodeType, string> = {
  url: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  text: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  email: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  phone: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  sms: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  wifi: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  vcard: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
  location: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  event: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
};

export function QRCodeHistory({
  history,
  onSelect,
  onDelete,
  onClear,
  onReuse,
}: QRCodeHistoryProps) {
  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">No history yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Generate your first QR code to see it here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <CardTitle className="text-lg">Recent QR Codes</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClear}>
          <Trash2 className="h-4 w-4 mr-1" />
          Clear All
        </Button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {history.map((item) => (
          <Card key={item.id} className="transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-lg shrink-0',
                    typeColors[item.type]
                  )}
                >
                  {typeIcons[item.type]}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <h4 className="font-medium truncate">{item.label}</h4>
                      <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted">
                        {typeLabels[item.type]}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(item.timestamp)}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground truncate mt-1 font-mono">
                    {formatQRCodeData(item.type, item.data).slice(0, 100)}
                    {formatQRCodeData(item.type, item.data).length > 100 && '...'}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onReuse(item)}
                    title="Reuse this QR code"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyToClipboard(formatQRCodeData(item.type, item.data))}
                    title="Copy data"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600"
                    onClick={() => onDelete(item.id)}
                    title="Delete from history"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error('Copy failed:', error);
  }
}