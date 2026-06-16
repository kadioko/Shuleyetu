'use client';

import React from 'react';

interface ChartProps {
  data: any[];
  width?: number;
  height?: number;
  className?: string;
}

export function BarChart({ data, width = 300, height = 200, className = '' }: ChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const barWidth = (width - 40) / data.length - 10;

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <svg width={width} height={height} className="overflow-visible">
        {/* Y-axis line */}
        <line x1="30" y1="10" x2="30" y2={height - 30} stroke="#475569" strokeWidth="1" />
        
        {/* X-axis line */}
        <line x1="30" y1={height - 30} x2={width - 10} y2={height - 30} stroke="#475569" strokeWidth="1" />
        
        {/* Bars */}
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * (height - 50);
          const x = 40 + index * (barWidth + 10);
          const y = height - 30 - barHeight;
          
          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="url(#barGradient)"
                rx="4"
                className="animate-pulse"
              />
              <text
                x={x + barWidth / 2}
                y={height - 10}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="10"
              >
                {item.label}
              </text>
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                fill="#e2e8f0"
                fontSize="10"
                fontWeight="bold"
              >
                {item.value}
              </text>
            </g>
          );
        })}
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.3" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export function LineChart({ data, width = 300, height = 200, className = '' }: ChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const valueRange = maxValue - minValue;
  const pointSpacing = (width - 60) / (data.length - 1);

  // Create path for line
  const pathData = data.map((item, index) => {
    const x = 30 + index * pointSpacing;
    const y = height - 30 - ((item.value - minValue) / valueRange) * (height - 50);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <svg width={width} height={height} className="overflow-visible">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((percent) => {
          const y = height - 30 - (percent / 100) * (height - 50);
          return (
            <line
              key={percent}
              x1="30"
              y1={y}
              x2={width - 10}
              y2={y}
              stroke="#334155"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
          );
        })}
        
        {/* Axes */}
        <line x1="30" y1="10" x2="30" y2={height - 30} stroke="#475569" strokeWidth="1" />
        <line x1="30" y1={height - 30} x2={width - 10} y2={height - 30} stroke="#475569" strokeWidth="1" />
        
        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke="#0ea5e9"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Area under line */}
        <path
          d={`${pathData} L ${width - 10} ${height - 30} L 30 ${height - 30} Z`}
          fill="url(#areaGradient)"
          opacity="0.3"
        />
        
        {/* Data points */}
        {data.map((item, index) => {
          const x = 30 + index * pointSpacing;
          const y = height - 30 - ((item.value - minValue) / valueRange) * (height - 50);
          
          return (
            <g key={index}>
              <circle cx={x} cy={y} r="4" fill="#0ea5e9" />
              <circle cx={x} cy={y} r="2" fill="#0284c7" />
              <text
                x={x}
                y={height - 10}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="10"
              >
                {item.label}
              </text>
            </g>
          );
        })}
        
        {/* Gradients */}
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export function PieChart({ data, width = 200, height = 200, className = '' }: ChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 20;
  
  let currentAngle = -90; // Start from top
  
  const colors = [
    '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'
  ];
  
  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <svg width={width} height={height}>
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100;
          const angle = (percentage / 100) * 360;
          const endAngle = currentAngle + angle;
          
          const x1 = centerX + radius * Math.cos((currentAngle * Math.PI) / 180);
          const y1 = centerY + radius * Math.sin((currentAngle * Math.PI) / 180);
          const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
          const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
          
          const largeArcFlag = angle > 180 ? 1 : 0;
          
          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ');
          
          currentAngle = endAngle;
          
          return (
            <g key={index}>
              <path
                d={pathData}
                fill={colors[index % colors.length]}
                stroke="#1e293b"
                strokeWidth="2"
                className="hover:opacity-80 transition-opacity cursor-pointer"
              />
              <text
                x={centerX + (radius / 2) * Math.cos(((currentAngle - angle / 2) * Math.PI) / 180)}
                y={centerY + (radius / 2) * Math.sin(((currentAngle - angle / 2) * Math.PI) / 180)}
                textAnchor="middle"
                fill="white"
                fontSize="12"
                fontWeight="bold"
              >
                {percentage.toFixed(0)}%
              </text>
            </g>
          );
        })}
      </svg>
      
      {/* Legend */}
      <div className="absolute top-0 right-0 space-y-1">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div 
              className="w-3 h-3 rounded" 
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className="text-slate-400">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatCard({ 
  title, 
  value, 
  change, 
  icon, 
  className = '' 
}: { 
  title: string; 
  value: string | number; 
  change?: number; 
  icon?: React.ReactNode; 
  className?: string; 
}) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;
  
  return (
    <div className={`surface-panel rounded-3xl p-6 transition-transform duration-200 hover:-translate-y-0.5 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-100">{value}</p>
          {change !== undefined && (
            <div className={`mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${
              isPositive ? 'text-emerald-400' : isNegative ? 'text-red-400' : 'text-slate-400'
            } ${
              isPositive ? 'bg-emerald-500/10' : isNegative ? 'bg-red-500/10' : 'bg-slate-500/10'
            }`}>
              {isPositive && (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
              {isNegative && (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              <span>{Math.abs(change)}% from last month</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="rounded-2xl border border-sky-400/10 bg-sky-500/10 p-3 text-sky-300 shadow-[inset_0_1px_0_rgba(125,211,252,0.15)]">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
