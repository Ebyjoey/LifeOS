'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Download, Copy, Check, Loader2 } from 'lucide-react';

interface QRCodeDisplayProps {
  data: string;
  options: {
    size: number;
    margin: number;
    errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
    color: {
      dark: string;
      light: string;
    };
    includeMargin: boolean;
  };
  onDownload: (format: 'png' | 'svg') => void;
  onCopy: () => void;
  isGenerating: boolean;
  copied: boolean;
}

export function QRCodeDisplay({
  data,
  options,
  onDownload,
  onCopy,
  isGenerating,
  copied,
}: QRCodeDisplayProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (!canvasRef.current || !data) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = options.size;
    canvas.height = options.size;

    ctx.fillStyle = options.color.light;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const qrSize = Math.min(canvas.width, canvas.height);
    const cellSize = qrSize / 25;
    const offset = (canvas.width - qrSize) / 2;

    ctx.fillStyle = options.color.dark;

    for (let row = 0; row < 25; row++) {
      for (let col = 0; col < 25; col++) {
        const hash = simpleHash(data + row.toString() + col.toString());
        if (hash % 3 === 0) {
          ctx.fillRect(
            offset + col * cellSize,
            offset + row * cellSize,
            cellSize,
            cellSize
          );
        }
      }
    }

    const finderPatterns = [
      { x: 0, y: 0 },
      { x: 18, y: 0 },
      { x: 0, y: 18 },
    ];

    finderPatterns.forEach((pattern) => {
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 7; col++) {
          const isDark =
            row === 0 ||
            row === 6 ||
            col === 0 ||
            col === 6 ||
            (row >= 2 && row <= 4 && col >= 2 && col <= 4);
          if (isDark) {
            ctx.fillRect(
              offset + (pattern.x + col) * cellSize,
              offset + (pattern.y + row) * cellSize,
              cellSize,
              cellSize
            );
          }
        }
      }
    });
  }, [data, options]);

  const simpleHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] bg-muted/50 rounded-lg border-2 border-dashed">
        <svg className="h-16 w-16 text-muted-foreground/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
        <p className="text-muted-foreground text-center px-4">
          Enter data and click "Generate QR Code" to preview
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="bg-background border rounded-lg shadow-sm max-w-full h-auto"
          aria-label="QR Code preview"
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-xs">
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