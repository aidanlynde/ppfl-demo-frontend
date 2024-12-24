// src/components/dashboard/TrainingStatus.tsx
import React from 'react';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface TrainingStatusProps {
  status: string;
  error: string | null;
  currentRound: number;
  totalRounds: number;
  accuracy: number;
}

const TrainingStatus: React.FC<TrainingStatusProps> = ({ 
  status, 
  error, 
  currentRound,
  totalRounds,
  accuracy 
}) => {
  const getStatusIcon = () => {
    if (error) return <AlertCircle className="text-red-400" />;
    if (currentRound === totalRounds) return <CheckCircle className="text-green-400" />;
    return <Clock className="text-purple-400 animate-spin" />;
  };

  const getStatusMessage = () => {
    if (error) return `Error: ${error}`;
    if (currentRound === totalRounds) return 'Training Complete!';
    return `Training in Progress - Round ${currentRound}/${totalRounds}`;
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex items-center gap-2 mb-2">
        {getStatusIcon()}
        <span className="font-medium">{getStatusMessage()}</span>
      </div>
      {!error && (
        <div className="text-sm text-gray-400">
          <p>Current Accuracy: {(accuracy * 100).toFixed(2)}%</p>
          <p>Status: {status}</p>
        </div>
      )}
    </div>
  );
};

export default TrainingStatus;