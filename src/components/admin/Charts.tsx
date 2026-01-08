// Simple Chart Components for Admin Dashboard
// Using CSS-only for lightweight visualization

import React from 'react';

interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartData[];
  height?: number;
  showLabels?: boolean;
  showValues?: boolean;
}

export function BarChart({ data, height = 120, showLabels = true, showValues = true }: BarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height }}>
      {data.map((item, index) => (
        <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {showValues && (
            <span style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>
              {item.value}
            </span>
          )}
          <div 
            style={{ 
              width: '100%', 
              height: `${(item.value / maxValue) * (height - 30)}px`,
              background: item.color || 'var(--color-primary)',
              borderRadius: '4px 4px 0 0',
              transition: 'height 0.3s ease-out',
              minHeight: '4px',
            }} 
          />
          {showLabels && (
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px', textAlign: 'center' }}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

interface LineChartData {
  label: string;
  value: number;
}

interface LineChartProps {
  data: LineChartData[];
  height?: number;
  color?: string;
  showDots?: boolean;
  showArea?: boolean;
}

export function LineChart({ data, height = 100, color = 'var(--color-primary)', showDots = true, showArea = true }: LineChartProps) {
  if (data.length < 2) return null;
  
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const range = maxValue - minValue || 1;
  
  const width = 100;
  const getX = (index: number) => (index / (data.length - 1)) * width;
  const getY = (value: number) => height - ((value - minValue) / range) * (height - 20);
  
  const points = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');
  const areaPoints = `0,${height} ${points} ${width},${height}`;
  
  return (
    <div style={{ position: 'relative', height, width: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
        {showArea && (
          <polygon 
            points={areaPoints} 
            fill={color} 
            opacity="0.1"
          />
        )}
        <polyline 
          points={points} 
          fill="none" 
          stroke={color} 
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {showDots && data.map((d, i) => (
          <circle 
            key={i}
            cx={getX(i)} 
            cy={getY(d.value)} 
            r="3" 
            fill={color}
          />
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
        {data.map((d, i) => i === 0 || i === data.length - 1 ? (
          <span key={i}>{d.label}</span>
        ) : null)}
      </div>
    </div>
  );
}

interface DonutChartData {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutChartData[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string | number;
}

export function DonutChart({ data, size = 120, thickness = 20, centerLabel, centerValue }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  
  let currentOffset = 0;
  
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-surface)"
          strokeWidth={thickness}
        />
        {data.map((d, i) => {
          const strokeDasharray = (d.value / total) * circumference;
          const offset = currentOffset;
          currentOffset += strokeDasharray;
          
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth={thickness}
              strokeDasharray={`${strokeDasharray} ${circumference}`}
              strokeDashoffset={-offset}
              style={{ transition: 'stroke-dasharray 0.5s ease-out' }}
            />
          );
        })}
      </svg>
      {(centerLabel || centerValue) && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}>
          {centerValue && <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{centerValue}</div>}
          {centerLabel && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{centerLabel}</div>}
        </div>
      )}
    </div>
  );
}

interface MiniSparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export function MiniSparkline({ data, color = 'var(--color-primary)', width = 60, height = 20 }: MiniSparklineProps) {
  if (data.length < 2) return null;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const getX = (i: number) => (i / (data.length - 1)) * width;
  const getY = (v: number) => height - ((v - min) / range) * (height - 4);
  
  const points = data.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');
  
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
