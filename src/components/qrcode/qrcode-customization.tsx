'use client';

import * as React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { QRCodeOptions } from '@/types/qrcode';

interface QRCodeCustomizationProps {
  options: QRCodeOptions;
  onOptionsChange: (options: Partial<QRCodeOptions>) => void;
}

export function QRCodeCustomization({ options, onOptionsChange }: QRCodeCustomizationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Customization
          <div className="flex items-center gap-2">
            <Label htmlFor="include-margin" className="cursor-pointer mb-0">
              <Switch
                id="include-margin"
                checked={options.includeMargin}
                onCheckedChange={(checked) => onOptionsChange({ includeMargin: checked })}
              />
              <span className="ml-2 text-sm">Quiet Zone</span>
            </Label>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="size">Size: {options.size}px</Label>
          <Slider
            id="size"
            min={64}
            max={1024}
            step={16}
            value={options.size}
            onChange={(e) => onOptionsChange({ size: Number(e.target.value) })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="margin">Quiet Zone: {options.margin} modules</Label>
          <Slider
            id="margin"
            min={0}
            max={20}
            step={1}
            value={options.margin}
            onChange={(e) => onOptionsChange({ margin: Number(e.target.value) })}
          />
        </div>

        <div className="space-y-2">
          <Label>Error Correction Level</Label>
          <Select
            value={options.errorCorrectionLevel}
            onValueChange={(value) => onOptionsChange({ errorCorrectionLevel: value as 'L' | 'M' | 'Q' | 'H' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="L">L - Low (~7% recovery)</SelectItem>
              <SelectItem value="M">M - Medium (~15% recovery)</SelectItem>
              <SelectItem value="Q">Q - Quartile (~25% recovery)</SelectItem>
              <SelectItem value="H">H - High (~30% recovery)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dark-color">Foreground Color</Label>
            <div className="flex items-center gap-2">
              <input
                id="dark-color"
                type="color"
                value={options.color.dark}
                onChange={(e) => onOptionsChange({ color: { ...options.color, dark: e.target.value } })}
                className="h-10 w-10 rounded border cursor-pointer"
              />
              <Input
                value={options.color.dark}
                onChange={(e) => onOptionsChange({ color: { ...options.color, dark: e.target.value } })}
                placeholder="#000000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="light-color">Background Color</Label>
            <div className="flex items-center gap-2">
              <input
                id="light-color"
                type="color"
                value={options.color.light}
                onChange={(e) => onOptionsChange({ color: { ...options.color, light: e.target.value } })}
                className="h-10 w-10 rounded border cursor-pointer"
              />
              <Input
                value={options.color.light}
                onChange={(e) => onOptionsChange({ color: { ...options.color, light: e.target.value } })}
                placeholder="#ffffff"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Label>Add Logo (Optional)</Label>
          <div className="space-y-2">
            <Input
              placeholder="Logo image URL"
              value={options.logo?.src || ''}
              onChange={(e) => onOptionsChange({ logo: { src: e.target.value, width: options.logo?.width || 0, height: options.logo?.height || 0 } })}
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="logoWidth">Logo Width: {options.logo?.width || 0}px</Label>
                <Slider
                  id="logoWidth"
                  min={0}
                  max={100}
                  step={5}
                  value={options.logo?.width || 0}
                  onChange={(e) => onOptionsChange({ logo: { src: options.logo?.src || '', width: Number(e.target.value), height: options.logo?.height || 0 } })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logoHeight">Logo Height: {options.logo?.height || 0}px</Label>
                <Slider
                  id="logoHeight"
                  min={0}
                  max={100}
                  step={5}
                  value={options.logo?.height || 0}
                  onChange={(e) => onOptionsChange({ logo: { src: options.logo?.src || '', width: options.logo?.width || 0, height: Number(e.target.value) } })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            <strong>Tip:</strong> For best scanning results, use high contrast colors. The foreground should be darker than the background.
            Higher error correction allows the QR code to be read even if partially damaged or obscured.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}