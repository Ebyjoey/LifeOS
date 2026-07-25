'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { QRField } from '@/types/qrcode';

interface QRCodeFormProps {
  fields: QRField[];
  data: Record<string, string>;
  onDataChange: (data: Record<string, string>) => void;
  className?: string;
}

export function QRCodeForm({ fields, data, onDataChange, className }: QRCodeFormProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {fields.map((field) => (
        <div key={field.name} className="space-y-1.5">
          <Label htmlFor={field.name} className="text-sm font-medium">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </Label>
          {field.type === 'textarea' ? (
            <Textarea
              id={field.name}
              placeholder={field.placeholder}
              value={data[field.name] || ''}
              onChange={(e) => onDataChange({ ...data, [field.name]: e.target.value })}
              required={field.required}
              rows={4}
            />
          ) : field.type === 'select' ? (
            <Select
              value={data[field.name] || (field.options?.[0]?.value || '')}
              onValueChange={(value) => onDataChange({ ...data, [field.name]: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : field.type === 'switch' ? (
            <div className="flex items-center gap-2">
              <Switch
                id={field.name}
                checked={data[field.name] === 'true'}
                onCheckedChange={(checked) => onDataChange({ ...data, [field.name]: checked.toString() })}
              />
              <Label htmlFor={field.name}>{field.label}</Label>
            </div>
          ) : (
            <Input
              id={field.name}
              type={field.type as React.InputHTMLAttributes<HTMLInputElement>['type']}
              placeholder={field.placeholder}
              value={data[field.name] || ''}
              onChange={(e) => onDataChange({ ...data, [field.name]: e.target.value })}
              required={field.required}
            />
          )}
        </div>
      ))}
    </div>
  );
}