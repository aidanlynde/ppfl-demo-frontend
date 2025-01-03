"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ClientSetup from './ClientSetup';
import ProgressBar from './ProgressBar';
import TutorialOverlay from './TutorialOverlay';
import { AlertCircle, Clock, Activity, Lock, Zap, BarChart, Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface TrainingMetrics {
  loss: number;
  accuracy: number;
  privacy_budget: {
    epsilon: number;
    delta: number;
  };
}

interface StateResponse {
  status: string;
  current_round: number;
  training_active: boolean;
  latest_accuracy: number;
}

// Training step animation component
const TrainingStep: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  active: boolean;
}> = ({ icon, title, description, active }) => (
  <motion.div
    className={`p-4 rounded-lg ${active ? 'bg-purple-500/20' : 'bg-gray-700/20'}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="flex items-center space-x-3 mb-2">
      <div className={active ? 'text-purple-400' : 'text-gray-400'}>
        {icon}
      </div>
      <h3 className={`font-medium ${active ? 'text-purple-400' : 'text-gray-300'}`}>
        {title}
      </h3>
    </div>
    <p className="text-sm text-gray-400">
      {description}
    </p>
    {active && (
      <motion.div
        className="h-1 bg-purple-500 mt-2 rounded"
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ duration: 1, repeat: Infinity }}
      />
    )}
  </motion.div>
);

const Dashboard: React.FC = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(true);
  const [trainingStarted, setTrainingStarted] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds] = useState(10);
  const [status, setStatus] = useState('Not started');
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<TrainingMetrics>({
    loss: 0,
    accuracy: 0,
    privacy_budget: {
      epsilon: 0,
      delta: 0
    }
  });
  const [isTraining, setIsTraining] = useState(false);
  const [trainingHistory, setTrainingHistory] = useState<Array<{round: number; accuracy: number}>>([]);
  const [estimatedTimePerRound] = useState(30); // seconds per round

  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    try {
      const response = await fetch('/api/session/new', { method: 'POST' });
      const data = await response.json();
      if (data.session_id) {
        setSessionId(data.session_id);
      } else {
        throw new Error('No session ID received');
      }
    } catch (err) {
      setError('Failed to initialize session');
      console.error('Session initialization error:', err);
    }
  };

  const executeTrainingRound = async () => {
    if (!sessionId || isTraining) return;

    try {
      setIsTraining(true);
      setStatus('Training');
      
      console.log('Executing training round...');
      const response = await fetch('/api/fl/train_round', {
        method: 'POST',
        headers: {
          'X-Session-ID': sessionId,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Training round failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Training response:', data);
      
      if (data.status === 'success' && data.metrics) {
        const newMetrics: TrainingMetrics = {
          loss: data.metrics.global_metrics.test_loss ?? 0,
          accuracy: data.metrics.global_metrics.test_accuracy ?? 0,
          privacy_budget: {
            epsilon: data.metrics.privacy_budget.epsilon ?? 0,
            delta: data.metrics.privacy_budget.delta ?? 0
          }
        };
        setMetrics(newMetrics);
        setTrainingHistory(prev => [...prev, {
          round: currentRound + 1,
          accuracy: newMetrics.accuracy
        }]);
        setCurrentRound(prev => prev + 1);
        setStatus('Complete');
      }
    } catch (err) {
      setError('Training round failed');
      setStatus('Failed');
      console.error('Training error:', err);
    } finally {
      setIsTraining(false);
    }
  };

  const handleTrainingStart = useCallback(async () => {
    try {
      setTrainingStarted(true);
      await executeTrainingRound();
    } catch (err) {
      setError('Failed to start training');
      setIsTraining(false);
    }
  }, []);

  const getEstimatedTimeRemaining = () => {
    const remainingRounds = totalRounds - currentRound;
    const totalSeconds = remainingRounds * estimatedTimePerRound;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  const trainingSteps = [
    {
      icon: <Activity className="w-6 h-6" />,
      title: "Local Training",
      description: "Each client is training on their private data",
      active: isTraining && status === 'Training'
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Privacy Protection",
      description: "Adding noise to protect individual privacy",
      active: isTraining && status === 'Training'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Model Aggregation",
      description: "Combining improvements from all clients",
      active: isTraining && status === 'Training'
    },
    {
      icon: <BarChart className="w-6 h-6" />,
      title: "Progress Evaluation",
      description: "Measuring model performance",
      active: isTraining && status === 'Training'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {showTutorial && (
        <TutorialOverlay onComplete={() => setShowTutorial(false)} />
      )}

      <div className="max-w-4xl mx-auto space-y-6">

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
            <AlertCircle className="text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {!trainingStarted ? (
          <ClientSetup 
            onStart={handleTrainingStart}
            sessionId={sessionId}
          />
        ) : (
          <div className="space-y-6">
            <Card className="bg-gray-800 border-purple-500/20">
              <CardHeader>
                <h2 className="text-2xl font-semibold text-purple-400 mb-0">Training Process</h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      icon: <Activity className="w-6 h-6" />,
                      title: "Local Training",
                      description: isTraining ? "Each client is training on their private data" : "Each client will train on their private data",
                      active: isTraining && status === 'Training'
                    },
                    {
                      icon: <Lock className="w-6 h-6" />,
                      title: "Privacy Protection",
                      description: isTraining ? "Adding noise to protect individual privacy" : "Noise will be added to protect individual privacy",
                      active: isTraining && status === 'Training'
                    },
                    {
                      icon: <Zap className="w-6 h-6" />,
                      title: "Model Aggregation",
                      description: isTraining ? "Combining improvements from all clients" : "Improvements from all clients will be combined",
                      active: isTraining && status === 'Training'
                    },
                    {
                      icon: <BarChart className="w-6 h-6" />,
                      title: "Progress Evaluation",
                      description: isTraining ? "Measuring model performance" : "Model performance will be measured",
                      active: isTraining && status === 'Training'
                    }
                  ].map((step, index) => (
                    <TrainingStep key={index} {...step} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-purple-500/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl text-purple-400">Metrics Dashboard</CardTitle>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-gray-400 text-sm">
                      <Clock className="w-4 h-4 mr-2" />
                      Est. remaining: {getEstimatedTimeRemaining()}
                    </div>
                    <div className="relative group">
                      <button
                        onClick={executeTrainingRound}
                        disabled={isTraining || currentRound >= totalRounds}
                        className="px-6 py-2 bg-purple-500 rounded-lg hover:bg-purple-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isTraining ? 'Training...' : 
                         currentRound === 0 ? 'Run First Round' :
                         currentRound === totalRounds - 1 ? 'Run Last Round' :
                         'Run Next Round'}
                        <Info className="w-4 h-4" />
                      </button>
                      <div className="absolute invisible group-hover:visible w-64 bg-gray-800 text-xs p-2 rounded-lg shadow-lg -top-24 left-1/2 transform -translate-x-1/2">
                        Each training round improves the model by learning from all clients while keeping their data private.
                        More rounds generally lead to better accuracy while maintaining privacy.
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <ProgressBar
                    currentRound={currentRound}
                    totalRounds={totalRounds}
                    status={status}
                  />
                  
                  <div className="grid grid-cols-3 gap-4 text-center mt-4">
                    <div className="bg-gray-700/50 rounded-lg p-3 group relative">
                      <div className="text-gray-400 text-sm flex items-center justify-center gap-1">
                        Accuracy
                        <div className="absolute invisible group-hover:visible w-64 bg-gray-800 text-xs p-2 rounded-lg shadow-lg -top-24 left-1/2 transform -translate-x-1/2">
                          Model accuracy shows how well the model performs at recognizing handwritten digits.
                          Higher accuracy means better performance, with 100% being perfect recognition.
                        </div>
                      </div>
                      <div className="text-purple-400 text-xl font-bold flex items-center justify-center gap-2">
                        {(metrics.accuracy * 100).toFixed(1)}%
                        <div className={`h-2 w-2 rounded-full ${
                          metrics.accuracy > 0.9 ? 'bg-green-400' : 
                          metrics.accuracy > 0.7 ? 'bg-yellow-400' : 
                          'bg-red-400'
                        }`} />
                      </div>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-3 group relative">
                      <div className="text-gray-400 text-sm flex items-center justify-center gap-1">
                        Privacy Budget (ε)
                        <div className="absolute invisible group-hover:visible w-64 bg-gray-800 text-xs p-2 rounded-lg shadow-lg -top-24 left-1/2 transform -translate-x-1/2">
                          Privacy budget measures how much information we allow to be revealed during training.
                          Lower values (closer to 0) mean stronger privacy protection.
                        </div>
                      </div>
                      <div className="text-purple-400 text-xl font-bold flex items-center justify-center gap-2">
                        {metrics.privacy_budget.epsilon.toFixed(3)}
                        <div className={`h-2 w-2 rounded-full ${
                          metrics.privacy_budget.epsilon < 3 ? 'bg-green-400' : 
                          metrics.privacy_budget.epsilon < 7 ? 'bg-yellow-400' : 
                          'bg-red-400'
                        }`} />
                      </div>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <div className="text-gray-400 text-sm">Round</div>
                      <div className="text-purple-400 text-xl font-bold">
                        {currentRound} / {totalRounds}
                      </div>
                    </div>
                  </div>

                  <div className="h-64 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trainingHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="round" stroke="#9CA3AF" />
                        <YAxis
                          stroke="#9CA3AF"
                          domain={[0, 1]}
                          tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                          labelStyle={{ color: '#9CA3AF' }}
                          formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                        />
                        <Line
                          type="monotone"
                          dataKey="accuracy"
                          stroke="#8B5CF6"
                          strokeWidth={2}
                          dot={{ fill: '#8B5CF6' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;