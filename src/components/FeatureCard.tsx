
import React from 'react';

export interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const FeatureCard = ({ title, description, icon, className = '', style }: FeatureCardProps) => {
  return (
    <div 
      className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md ${className}`}
      style={style}
    >
      <div className="w-12 h-12 rounded-full bg-fundhub-light-blue flex items-center justify-center mb-4">
        <div className="text-fundhub-blue">{icon}</div>
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

export default FeatureCard;
