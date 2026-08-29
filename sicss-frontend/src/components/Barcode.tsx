/**
 * Barcode — renders a Code 128B barcode as inline SVG.
 * No external library. Pure TypeScript implementation.
 */
import React from 'react';

// Code 128B character table (ASCII 32–127)
const CODE128B_CHARS: Record<string, number> = {};
for (let i = 32; i <= 127; i++) {
  CODE128B_CHARS[String.fromCharCode(i)] = i - 32;
}

// Code 128 bar-width patterns indexed by value 0-106
// Each pattern is 11 bits (6 elements: bar,space,bar,space,bar,space widths 1-4)
const PATTERNS: number[][] = [
  [2,1,2,2,2,2],[2,2,2,1,2,2],[2,2,2,2,2,1],[1,2,1,2,2,3],[1,2,1,3,2,2],
  [1,3,1,2,2,2],[1,2,2,2,1,3],[1,2,2,3,1,2],[1,3,2,2,1,2],[2,2,1,2,1,3],
  [2,2,1,3,1,2],[2,3,1,2,1,2],[1,1,2,2,3,2],[1,2,2,1,3,2],[1,2,2,2,3,1],
  [1,1,3,2,2,2],[1,2,3,1,2,2],[1,2,3,2,2,1],[2,2,3,2,1,1],[2,2,1,1,3,2],
  [2,2,1,2,3,1],[2,1,3,2,1,2],[2,2,3,1,1,2],[3,1,2,1,3,1],[3,1,1,2,2,2],
  [3,2,1,1,2,2],[3,2,1,2,2,1],[3,1,2,2,1,2],[3,2,2,1,1,2],[3,2,2,2,1,1],
  [2,1,2,1,2,3],[2,1,2,3,2,1],[2,3,2,1,2,1],[1,1,1,3,2,3],[1,3,1,1,2,3],
  [1,3,1,3,2,1],[1,1,2,3,1,3],[1,3,2,1,1,3],[1,3,2,3,1,1],[2,1,1,3,1,3],
  [2,3,1,1,1,3],[2,3,1,3,1,1],[1,1,3,1,2,3],[1,1,3,3,2,1],[1,3,3,1,2,1],
  [1,1,2,1,3,3],[1,1,2,3,3,1],[1,3,2,1,3,1],[1,1,3,1,3,2],[1,1,3,2,3,1],
  [1,3,1,2,3,1],[2,1,1,1,3,3],[2,1,3,1,1,3],[2,1,3,3,1,1],[2,1,1,3,3,1],
  [2,3,3,1,1,1],[2,1,3,1,3,1],[3,1,1,1,2,3],[3,1,1,3,2,1],[3,3,1,1,2,1],
  [3,1,2,1,1,3],[3,1,2,3,1,1],[3,3,2,1,1,1],[3,1,4,1,1,1],[2,2,1,4,1,1],
  [4,3,1,1,1,1],[1,1,1,2,2,4],[1,1,1,4,2,2],[1,2,1,1,2,4],[1,2,1,4,2,1],
  [1,4,1,1,2,2],[1,4,1,2,2,1],[1,1,2,2,1,4],[1,1,2,4,1,2],[1,2,2,1,1,4],
  [1,2,2,4,1,1],[1,4,2,1,1,2],[1,4,2,2,1,1],[2,4,1,2,1,1],[2,2,1,1,1,4],
  [4,1,3,1,1,1],[2,4,1,1,1,2],[1,3,4,1,1,1],[1,1,1,2,4,2],[1,2,1,1,4,2],
  [1,2,1,2,4,1],[1,1,4,2,1,2],[1,2,4,1,1,2],[1,2,4,2,1,1],[4,1,1,2,1,2],
  [4,2,1,1,1,2],[4,2,1,2,1,1],[2,1,2,1,4,1],[2,1,4,1,2,1],[4,1,2,1,2,1],
  [1,1,1,1,4,3],[1,1,1,3,4,1],[1,3,1,1,4,1],[1,1,4,1,1,3],[1,1,4,3,1,1],
  [4,1,1,1,1,3],[4,1,1,3,1,1],[1,1,3,1,4,1],[1,1,4,1,3,1],[3,1,1,1,4,1],
  [4,1,1,1,3,1],[2,1,1,4,1,2],[2,1,1,2,1,4],[2,1,1,2,4,1],[2,3,3,1,1,1],
  [2,3,1,1,3,1],[2,1,3,1,3,1],[2,1,1,3,1,3],
];

const START_B = 104;
const STOP    = 106;
const STOP_BARS = [2,3,3,1,1,1,2];

function encode(text: string): number[] {
  const values: number[] = [START_B];
  let checksum = START_B;
  for (let i = 0; i < text.length; i++) {
    const val = CODE128B_CHARS[text[i]] ?? 0;
    values.push(val);
    checksum += val * (i + 1);
  }
  values.push(checksum % 103);
  values.push(STOP);
  return values;
}

function toBars(values: number[]): number[] {
  const bars: number[] = [];
  for (const v of values) {
    if (v === STOP) { bars.push(...STOP_BARS); }
    else { bars.push(...PATTERNS[v]); }
  }
  return bars;
}

interface BarcodeProps {
  value: string;
  width?: number;
  height?: number;
  showText?: boolean;
  style?: React.CSSProperties;
}

export default function Barcode({ value, width = 240, height = 52, showText = true, style }: BarcodeProps) {
  if (!value) return null;

  // Sanitise — keep only printable ASCII 32-127
  const safe = value.replace(/[^\x20-\x7E]/g, '').slice(0, 48);
  const bars = toBars(encode(safe));
  const totalUnits = bars.reduce((a, b) => a + b, 0) + 2; // +2 quiet zone
  const unitW = (width - 8) / totalUnits;
  const barH = showText ? height - 14 : height - 4;

  let x = 4 + unitW; // left quiet zone
  const rects: React.ReactNode[] = [];
  bars.forEach((w, i) => {
    const fill = i % 2 === 0 ? '#000' : 'none';
    if (fill === '#000') {
      rects.push(
        <rect key={i} x={x} y={2} width={w * unitW} height={barH} fill="#000" />
      );
    }
    x += w * unitW;
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      style={{ display: 'block', ...style }}
      aria-label={`Barcode: ${safe}`}
    >
      <rect width={width} height={height} fill="white" />
      {rects}
      {showText && (
        <text
          x={width / 2} y={height - 2}
          textAnchor="middle"
          fontSize={9}
          fontFamily="monospace"
          fill="#000"
          letterSpacing="0.08em"
        >
          {safe}
        </text>
      )}
    </svg>
  );
}
