/**
 * OfficialStamp — renders a round official school stamp as inline SVG.
 * Uses school name and motto from settings.
 */
import React from 'react';

interface OfficialStampProps {
  schoolName: string;
  motto?: string;
  size?: number;
  color?: string;
  opacity?: number;
  style?: React.CSSProperties;
}

export default function OfficialStamp({
  schoolName,
  motto = '',
  size = 110,
  color = '#1a3a6b',
  opacity = 0.85,
  style,
}: OfficialStampProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 3;
  const innerR = r - 7;
  const textR = r - 3.5;
  const innerTextR = innerR - 3;

  // Arc text is rendered manually per character below

  // Calculate start angle so text is centred on top arc
  const topText = schoolName.toUpperCase();
  const topTotalAngle = 200;
  const topStart = -topTotalAngle / 2 + 90; // centred at top

  const bottomText = motto.toUpperCase();
  const botTotalAngle = 160;
  const botStart = 90 + botTotalAngle / 2;

  const topAnglePerChar = topText.length > 1 ? topTotalAngle / (topText.length - 1) : 0;
  const botAnglePerChar = bottomText.length > 1 ? botTotalAngle / (bottomText.length - 1) : 0;

  return (
    <svg
      width={size} height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block', ...style }}
      aria-label="Official school stamp"
    >
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={2.5} opacity={opacity} />
      {/* Inner ring */}
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke={color} strokeWidth={1.2} opacity={opacity} />
      {/* Star / seal centre */}
      <text x={cx} y={cy + 2} textAnchor="middle" dominantBaseline="central"
        fontSize={22} fill={color} opacity={opacity} fontFamily='"Times New Roman", serif'>
        ✦
      </text>
      {/* "OFFICIAL" label */}
      <text x={cx} y={cy + 16} textAnchor="middle" dominantBaseline="central"
        fontSize={5.5} fill={color} opacity={opacity} fontFamily='"Times New Roman", serif'
        fontWeight="bold" letterSpacing="1.5">
        OFFICIAL
      </text>

      {/* Top arc — school name */}
      {topText.split('').map((ch, i) => {
        const deg = topStart + i * topAnglePerChar;
        const rad = (deg - 90) * (Math.PI / 180);
        const x = cx + textR * Math.cos(rad);
        const y = cy + textR * Math.sin(rad);
        return (
          <text key={`top-${i}`} x={x} y={y}
            textAnchor="middle" dominantBaseline="central"
            fontSize={7} fontWeight="bold"
            fontFamily='"Times New Roman", serif'
            fill={color} opacity={opacity}
            transform={`rotate(${deg}, ${x}, ${y})`}>
            {ch}
          </text>
        );
      })}

      {/* Bottom arc — motto */}
      {bottomText.split('').map((ch, i) => {
        const deg = botStart - i * botAnglePerChar;
        const rad = (deg - 90) * (Math.PI / 180);
        const x = cx + innerTextR * Math.cos(rad);
        const y = cy + innerTextR * Math.sin(rad);
        return (
          <text key={`bot-${i}`} x={x} y={y}
            textAnchor="middle" dominantBaseline="central"
            fontSize={6} fontFamily='"Times New Roman", serif'
            fill={color} opacity={opacity}
            transform={`rotate(${deg + 180}, ${x}, ${y})`}>
            {ch}
          </text>
        );
      })}

      {/* Separator dots */}
      {[0, 180].map((deg) => {
        const rad = (deg - 90) * (Math.PI / 180);
        return (
          <circle key={deg}
            cx={cx + (textR - 1) * Math.cos(rad)}
            cy={cy + (textR - 1) * Math.sin(rad)}
            r={1.5} fill={color} opacity={opacity} />
        );
      })}
    </svg>
  );
}
