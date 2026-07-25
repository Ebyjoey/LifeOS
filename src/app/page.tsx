'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Moon, Sun, QrCode, Sparkles, Shield, Palette, History, RotateCcw, Download, Copy, Check, ExternalLink } from 'lucide-react';
import { QRCodeForm } from '@/components/qrcode/qrcode-form';
import { QRCodeDisplay } from '@/components/qrcode/qrcode-display';
import { QRCodeCustomization } from '@/components/qrcode/qrcode-customization';
import { QRCodeHistory } from '@/components/qrcode/qrcode-history';
import { formatQRCodeData, generateQRCodeLabel, QR_CODE_TYPES_CONFIG } from '@/lib/qrcode-data';
import { getHistory, addToHistory, removeFromHistory, clearHistory, QRCodeHistoryItem } from '@/lib/history';
import type { QRCodeType, QRCodeOptions } from '@/types/qrcode';
import { cn } from '@/lib/utils';

const DEFAULT_OPTIONS = {
  size: 256,
  margin: 4,
  errorCorrectionLevel: 'M' as const,
  color: {
    dark: '#000000',
    light: '#ffffff',
  },
  includeMargin: true,
};

function getDefaultDataForType(type: QRCodeType): Record<string, string> {
  const config = QR_CODE_TYPES_CONFIG.find((c) => c.type === type);
  if (!config) return {};
  const data: Record<string, string> = {};
  config.fields.forEach((field) => {
    data[field.name] = '';
  });
  return data;
}

export default function QRCodeGeneratorPage() {
  const [activeType, setActiveType] = useState<QRCodeType>('url');
  const [formData, setFormData] = useState<Record<string, string>>(getDefaultDataForType('url'));
  const [options, setOptions] = useState<QRCodeOptions>(DEFAULT_OPTIONS);
  const [history, setHistory] = useState<QRCodeHistoryItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const generatedData = formatQRCodeData(activeType, formData);
  const hasValidData = generatedData.trim().length > 0;

  useEffect(() => {
    const savedHistory = getHistory();
    setHistory(savedHistory);

    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setDarkMode(mediaQuery.matches);
      const handler = (e: MediaQueryListEvent) => setDarkMode(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, []);

  useEffect(() => {
    setFormData(getDefaultDataForType(activeType));
    setShowPreview(false);
  }, [activeType]);

  const handleDataChange = useCallback((data: Record<string, string>) => {
    setFormData(data);
  }, []);

  const handleOptionsChange = useCallback((newOptions: Partial<QRCodeOptions>) => {
    setOptions((prev) => ({ ...prev, ...newOptions }));
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!hasValidData) return;
    setIsGenerating(true);
    setShowPreview(true);
    
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    const label = generateQRCodeLabel(activeType, formData);
    const newItem = addToHistory(activeType, formData, options, label);
    setHistory((prev) => [newItem, ...prev].slice(0, 50));
    setIsGenerating(false);
  }, [activeType, formData, options, hasValidData]);

  const handleDownload = useCallback(async (format: 'png' | 'svg') => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    try {
      if (format === 'png') {
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `qr-code-${activeType}-${Date.now()}.png`;
            link.click();
            URL.revokeObjectURL(url);
          }
        }, 'image/png');
      } else {
        const svgData = canvasToSVG(canvas);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `qr-code-${activeType}-${Date.now()}.svg`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  }, [activeType]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  }, [generatedData]);

  const handleHistorySelect = useCallback((item: QRCodeHistoryItem) => {
    setActiveType(item.type);
    setFormData(item.data);
    setOptions(item.options);
    setShowPreview(true);
  }, []);

  const handleHistoryReuse = useCallback((item: QRCodeHistoryItem) => {
    setActiveType(item.type);
    setFormData(item.data);
    setOptions(item.options);
    setShowPreview(true);
  }, []);

  const handleHistoryDelete = useCallback((id: string) => {
    removeFromHistory(id);
    setHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleHistoryClear = useCallback(() => {
    clearHistory();
    setHistory([]);
  }, []);

  return (
    <div className={cn('min-h-screen bg-background transition-colors', darkMode && 'dark')}>
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <QrCode className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">QR Code Generator Pro</span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDarkMode(!darkMode)}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Create QR Code
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeType} onValueChange={(value) => setActiveType(value as QRCodeType)} className="w-full">
                  <TabsList className="grid w-full grid-cols-5 gap-1 mb-6">
                    {QR_CODE_TYPES_CONFIG.map((type) => (
                      <TabsTrigger key={type.type} value={type.type} className="text-xs py-2">
                        {type.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {QR_CODE_TYPES_CONFIG.map((type) => (
                    <TabsContent key={type.type} value={type.type} className="space-y-4">
                      <QRCodeForm
                        fields={type.fields}
                        data={formData}
                        onDataChange={handleDataChange}
                      />
                    </TabsContent>
                  ))}
                </Tabs>

                <div className="flex gap-4 pt-4 border-t mt-6">
                  <Button
                    size="lg"
                    className="flex-1"
                    onClick={handleGenerate}
                    disabled={isGenerating || !hasValidData}
                  >
                    {isGenerating ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <QrCode className="h-4 w-4 mr-2" />
                        Generate QR Code
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setFormData(getDefaultDataForType(activeType));
                      setShowPreview(false);
                    }}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Clear Form
                  </Button>
                </div>
              </CardContent>
            </Card>

            {showPreview && hasValidData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <QRCodeDisplay
                    data={generatedData}
                    options={options}
                    onDownload={handleDownload}
                    onCopy={handleCopy}
                    isGenerating={isGenerating}
                    copied={copied}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Customize
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QRCodeCustomization options={options} onOptionsChange={handleOptionsChange} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    History
                  </CardTitle>
                  {history.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={handleHistoryClear}>
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <QRCodeHistory
                  history={history}
                  onSelect={handleHistorySelect}
                  onDelete={handleHistoryDelete}
                  onClear={handleHistoryClear}
                  onReuse={handleHistoryReuse}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t py-8 mt-12">
        <div className="container px-4 text-center text-muted-foreground">
          <p className="text-sm">
            QR Code Generator Pro - Create professional QR codes instantly
          </p>
          <div className="flex justify-center gap-6 mt-4 text-xs">
            <a href="https://github.com/Ebyjoey/QR-Code-Generator-React-Tailwind" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
              GitHub Repository
            </a>
            <span>Built with Next.js 15, React 19, TypeScript & Tailwind CSS</span>
          </div>
        </div>
      </footer>
    </div>
  );
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