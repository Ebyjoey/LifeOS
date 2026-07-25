'use client';

import * as React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { QRCodeOptions } from '@/types/qrcode';

interface QRCodeDisplayProps {
  data: string;
  options: QRCodeOptions;
  onDownload: (format: 'png' | 'svg') => void;
  onCopy: () => void;
  isGenerating?: boolean;
  copied?: boolean;
}

export function QRCodeDisplay({ data, options, onDownload, onCopy, isGenerating, copied }: QRCodeDisplayProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 w-full bg-muted/50 rounded-lg border-2 border-dashed border-border">
        <div className="text-center text-muted-foreground">
          <svg className="mx-auto h-16 w-16 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-4 text-lg">Enter data to generate QR code</p>
          <p className="text-sm">Fill in the form and click "Generate QR Code"</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="relative w-full max-w-xs mx-auto">
        <div
          className={cn(
            'inline-flex items-center justify-center p-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm',
            options.includeMargin && 'p-8'
          )}
          style={{
            backgroundColor: options.color.light,
            minWidth: options.size + (options.includeMargin ? options.margin * 2 : 0),
            minHeight: options.size + (options.includeMargin ? options.margin * 2 : 0),
          }}
        >
          <QRCodeCanvas
            ref={canvasRef}
            value={data}
            size={options.size}
            level={options.errorCorrectionLevel}
            bgColor={options.color.light}
            fgColor={options.color.dark}
            includeMargin={options.includeMargin}
            imageSettings={options.logo?.src ? {
              src: options.logo.src,
              width: options.logo.width,
              height: options.logo.height,
              excavate: true,
            } : undefined}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 w-full max-w-xs">
        <Button
          variant="default"
          size="sm"
          className="flex-1 min-w-[120px]"
          onClick={() => onDownload('png')}
          disabled={isGenerating}
        >
          <Download className="h-4 w-4 mr-2" />
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Generating...
            </>
          ) : (
            'Download PNG'
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 min-w-[120px]"
          onClick={() => onDownload('svg')}
          disabled={isGenerating}
        >
          <Download className="h-4 w-4 mr-2" />
          Download SVG
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10"
          onClick={onCopy}
          aria-label={copied ? 'Copied!' : 'Copy data'}
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center px-4">
        {data.length} characters • {options.errorCorrectionLevel} error correction • {options.size}px
      </p>
    </div>
  );
}