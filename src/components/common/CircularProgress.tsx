import React from 'react';

interface CircularProgressProps {
  value: number; // 0..100
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 140,
  strokeWidth = 12,
  label = 'Score',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  let strokeColor = '#0d9488'; // Teal
  if (value < 50) strokeColor = '#ef4444'; // Red
  else if (value < 75) strokeColor = '#f59e0b'; // Amber

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Animated Dynamic Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Inner Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mt-0.5">{label}</span>
      </div>
    </div>
  );
};
