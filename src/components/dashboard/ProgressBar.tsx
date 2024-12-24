// src/components/dashboard/ProgressBar.tsx
import React from 'react';

interface ProgressBarProps {
  currentRound: number;
  totalRounds: number;
  status: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentRound, totalRounds, status }) => {
  const progress = (currentRound / totalRounds) * 100;
  
  return (
    <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
      <div 
        className="bg-purple-500 h-4 rounded-full transition-all duration-500 ease-in-out"
        style={{ width: `${progress}%` }}
      >
      </div>
      <div className="mt-2 text-sm text-gray-400 flex justify-between">
        <span>Round {currentRound} of {totalRounds}</span>
        <span className="text-purple-400">{status}</span>
      </div>
    </div>
  );
};

export default ProgressBar;