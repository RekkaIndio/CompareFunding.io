import React from 'react';

interface CircularProgressBarProps {
  value: number; // 0-100
  size?: number; // px
  strokeWidth?: number; // px
  label?: string;
  isNewlyIncorporated?: boolean; // Flag to determine if company is newly incorporated
}

// Helper to get color based on score and company type
const getProgressColor = (score: number, isNewlyIncorporated: boolean = false) => {
  // Color scale for newly incorporated companies (using the score ranges from the table)
  if (isNewlyIncorporated) {
    if (score >= 51) return '#22c55e'; // green-500 for Low Risk (51-100)
    if (score >= 30) return '#22c55e'; // green-500 for Moderate Risk (30-50)
    return '#ef4444'; // red-500 for Caution - High Risk (1-29)
  }
  
  // Color scale for established companies with financials (using the score ranges from the table)
  if (score >= 71) return '#22c55e'; // green-500 for Very Low Risk (71-100)
  if (score >= 51) return '#22c55e'; // green-500 for Low Risk (51-70)
  if (score >= 30) return '#22c55e'; // green-500 for Moderate Risk (30-50)
  if (score >= 21) return '#ef4444'; // red-500 for High Risk (21-29)
  return '#ef4444'; // red-500 for Very High Risk (1-20)
};

const CircularProgressBar: React.FC<CircularProgressBarProps> = ({
  value,
  size = 80,
  strokeWidth = 8,
  label,
  isNewlyIncorporated = false,
}) => {
  // Enhanced with shadow and glow effect
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, value));
  const offset = circumference - (progress / 100) * circumference;
  const color = getProgressColor(progress, isNewlyIncorporated);

  return (
    <svg width={size} height={size} className="circular-progress-bar" style={{ display: 'block', filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.2))' }}>
      {/* Drop shadow filter */}
      <defs>
        <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="#fff"
        stroke="#eee"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(.4,2,.3,1)', filter: 'url(#glow)' }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size * 0.35}
        fontWeight="bold"
        fill={color}
        style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)' }}
      >
        {value}
      </text>
      {label && (
        <text
          x="50%"
          y="70%"
          textAnchor="middle"
          fontSize={size * 0.16}
          fill="#6b7280"
        >
          {label}
        </text>
      )}
    </svg>
  );
};

export default CircularProgressBar;
