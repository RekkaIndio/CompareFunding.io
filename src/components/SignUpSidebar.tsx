import React, { useEffect } from 'react';
import { Card } from './ui/card';
import cflogowhiteUrl from '@/assets/cflogowhite.png';
import '../styles/animations.css';

interface SignUpSidebarProps {
  title: string;
  description: string;
  children?: React.ReactNode;
  highlight?: string;
  tips?: string[];
  trustPilot?: boolean;
  step?: number;
}

const SignUpSidebar: React.FC<SignUpSidebarProps> = ({
  title,
  description,
  children,
  highlight,
  tips = [],
  trustPilot = true,
  step = 0,
}) => {
  useEffect(() => {
    // This empty effect will trigger a re-render when step changes
  }, [step]);

  return (
    <div className="flex flex-col items-center bg-[#2a3441] h-[100vh] fixed right-0 top-0 bottom-0 w-full lg:w-[33.333333%] z-10 p-0 m-0 transition-all duration-500">
      <div className="flex flex-col items-center justify-center w-full h-full" style={{ flex: 1 }}>
        <img src={cflogowhiteUrl} alt="Compare Funding Logo" className="h-20 mb-12" style={{ maxWidth: '220px' }} />
        <div className="flex flex-col justify-center w-full px-4" style={{ flex: 1 }}>
          <Card className="bg-white p-6 shadow-md border border-gray-100 mb-6 animate-fadeInScale">
            <h3 className="text-xl font-bold text-[#2a3441] mb-2">{title}</h3>
            <p className="text-[#2a3441] mb-3 animate-fadeIn delay-100">{description}</p>
            {highlight && <div className="text-[#ff8000] font-semibold mb-3 animate-fadeIn delay-200">{highlight}</div>}
            {tips.length > 0 && (
              <ul className="list-disc pl-5 text-[#2a3441] text-sm mb-3">
                {tips.map((tip, i) => <li key={i} className={`animate-slideIn delay-${(i + 3) * 100}`}>{tip}</li>)}
              </ul>
            )}
            {children}
          </Card>
          {trustPilot && (
            <Card className="bg-white p-6 border border-primary animate-fadeIn delay-400">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-3 text-[#2a3441]">Trust Pilot</h3>
                <div className="flex justify-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-primary fill-current" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
                <p className="font-semibold text-[#2a3441]">4.8/5 rating</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignUpSidebar;
