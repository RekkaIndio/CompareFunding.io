import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Search, Building2, TrendingUp, Star, Clock, PoundSterling, CheckCircle } from 'lucide-react';

interface LenderSearchLoadingProps {
  applicationAmount?: number;
  productType?: string;
  onComplete?: () => void;
  onLenderFound?: (lender: any) => void;
  foundLendersCount?: number;
  isOverlay?: boolean;
}

const LenderSearchLoading: React.FC<LenderSearchLoadingProps> = ({ 
  applicationAmount, 
  productType,
  onComplete,
  onLenderFound,
  foundLendersCount = 0,
  isOverlay = false
}) => {
  const [progress, setProgress] = useState(0);
  const [foundLenders, setFoundLenders] = useState<number>(foundLendersCount);
  const [currentMessage, setCurrentMessage] = useState(0);

  const messages = [
    'Scanning our network of 100+ specialist lenders',
    `Finding perfect matches for ${productType} funding`,
    'Analyzing interest rates and requirements',
    'Ranking lenders by suitability score',
    'Preparing your personalized results'
  ];

  // Update found lenders count from parent
  useEffect(() => {
    if (foundLendersCount !== undefined) {
      setFoundLenders(foundLendersCount);
    }
  }, [foundLendersCount]);

  // Simulate progressive lender discovery only if not using external count
  useEffect(() => {
    if (foundLendersCount !== undefined) return; // Don't simulate if parent is controlling count
    
    const lenderInterval = setInterval(() => {
      setFoundLenders(prev => {
        const newCount = prev + Math.floor(Math.random() * 3) + 1;
        return Math.min(newCount, 15); // Cap at realistic number
      });
    }, 400);

    return () => clearInterval(lenderInterval);
  }, [foundLendersCount]);

  // Rotate through messages
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % messages.length);
    }, 1200);

    return () => clearInterval(messageInterval);
  }, [messages.length]);

  // Handle smooth progress animation
  useEffect(() => {
    const duration = 4000; // 4 seconds total
    const intervalTime = 50; // Update every 50ms
    const increment = 100 / (duration / intervalTime);
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + increment;
        
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => onComplete?.(), 300);
          return 100;
        }
        
        return newProgress;
      });
    }, intervalTime);

    return () => clearInterval(progressInterval);
  }, [onComplete]);

  return (
    <div className={`${isOverlay ? 'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm' : 'min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'} flex items-center justify-center p-6`}>
      <div className="w-full max-w-2xl space-y-8">
        {/* Main Loading Card */}
        <Card className="bg-white/95 backdrop-blur-sm border-slate-200/50 shadow-2xl rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <CardContent className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-[#ff8000] to-[#ffaa00] rounded-xl">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Finding Your Perfect Lenders
                </h1>
              </div>
              <p className="text-gray-600">
                We're searching our network to find the best funding options for your business
              </p>
            </div>

            {/* Current Step */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-6 transition-all duration-500">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-lg shadow-sm border-blue-200 border">
                  <Search className="h-6 w-6 text-[#ff8000] animate-pulse" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Finding Your Matches
                  </h3>
                  <p className="text-gray-700 text-sm transition-all duration-500">
                    {messages[currentMessage]}
                  </p>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-white rounded-full h-3 shadow-inner">
                  <div 
                    className="h-3 rounded-full transition-all duration-200 ease-out bg-gradient-to-r from-[#ff8000] to-[#ffaa00]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1 transition-all duration-300">
                  {foundLenders}
                </div>
                <div className="text-sm text-gray-600">Lenders Found</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {applicationAmount ? `£${applicationAmount.toLocaleString()}` : '£0'}
                </div>
                <div className="text-sm text-gray-600">Requested Amount</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  100+
                </div>
                <div className="text-sm text-gray-600">Network Size</div>
              </div>
            </div>

            {/* Animated Icons */}
            <div className="flex justify-center space-x-8">
              {[Search, Target, TrendingUp, Star].map((Icon, index) => (
                <div
                  key={index}
                  className={`flex flex-col items-center space-y-2 transition-all duration-300 ${
                    Math.floor(progress / 25) >= index ? 'scale-110 opacity-100' : 'scale-90 opacity-50'
                  }`}
                >
                  <div
                    className={`p-2 rounded-full border-2 transition-all duration-300 ${
                      Math.floor(progress / 25) >= index
                        ? 'bg-[#ff8000] border-[#ff8000] text-white'
                        : 'bg-gray-100 border-gray-200 text-gray-400'
                    }`}
                  >
                    {Math.floor(progress / 25) > index ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className={`h-5 w-5 ${Math.floor(progress / 25) === index ? 'animate-pulse' : ''}`} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {!isOverlay && (
          /* Fun Facts - Only show when not overlay */
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Did you know?</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-500" />
                  <span>Our fastest approval time is under 24 hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <PoundSterling className="h-4 w-4 text-blue-500" />
                  <span>Average funding amount is £125,000</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  <span>98% of our matches result in successful funding</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-purple-500" />
                  <span>We work with 100+ specialist lenders</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LenderSearchLoading;
