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
  const [trainingHistory, setTrainingHistory] = useState<
    Array<{ round: number; accuracy: number }>
  >([]);

  // NEW STATE for showing the popup
  const [showResetPopup, setShowResetPopup] = useState(false);

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
        setTrainingHistory(prev => [
          ...prev,
          { round: currentRound + 1, accuracy: newMetrics.accuracy }
        ]);
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

  const handleReconfigure = async () => {
    if (!sessionId) {
      setError('No active session');
      return;
    }

    // Show the popup while resetting
    setShowResetPopup(true);

    try {
      setIsTraining(true); // Prevent multiple clicks
      console.log('Attempting reset with session ID:', sessionId);

      // Force no-cache on the request
      const response = await fetch('/api/fl/reset', {
        method: 'POST',
        headers: {
          'X-Session-ID': sessionId,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({}),
        cache: 'no-store'
      });

      console.log('Reset response received:', response.status);

      const data = await response.json();
      console.log('Reset response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset training');
      }

      // Reset all local state immediately
      setTrainingStarted(false);
      setCurrentRound(0);
      setStatus('Not started');
      setMetrics({
        loss: 0,
        accuracy: 0,
        privacy_budget: {
          epsilon: 0,
          delta: 0
        }
      });
      setTrainingHistory([]);
      setError(null);

      // Force an immediate render cycle
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (err) {
      console.error('Error during reset:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset training');
    } finally {
      setIsTraining(false);
      // Hide the popup after the reset completes or fails
      setShowResetPopup(false);
    }
  };

  return (
    <>
      <div className="block md:hidden fixed inset-0 bg-gray-900 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg p-6 text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl text-white font-bold mb-2">Desktop Required</h2>
          <p className="text-gray-300">
            Please access this application from a computer for the best experience.
            Minimum width required: 700px.
          </p>
        </div>
      </div>

      <div className="hidden md:block">
        <div className="min-h-screen bg-gray-900 text-white p-2 sm:p-4 md:p-6">
          {showTutorial && (
            <TutorialOverlay onComplete={() => setShowTutorial(false)} />
          )}

          <div className="w-full max-w-4xl mx-auto space-y-3 sm:space-y-6">
            {error && (
              <div className="mb-2 sm:mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-sm sm:text-base">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                <span className="text-red-400">{error}</span>
              </div>
            )}

            {!trainingStarted ? (
              <ClientSetup 
                onStart={handleTrainingStart}
                sessionId={sessionId}
              />
            ) : (
              <div className="space-y-3 sm:space-y-6">
                <Card className="bg-gray-800 border-purple-500/20">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <h2 className="text-xl sm:text-2xl font-semibold text-purple-400 mb-0">
                        Training Process
                      </h2>
                      <button
                        onClick={handleReconfigure}
                        disabled={isTraining}
                        className="w-full sm:w-auto px-3 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        Reconfigure
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
                      {[
                        {
                          icon: <Activity className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />,
                          title: "Local Training",
                          description: isTraining
                            ? "Each client is training on their private data"
                            : "Each client will train on their private data",
                          active: isTraining && status === 'Training'
                        },
                        {
                          icon: <Lock className="w-4 h-4 sm:w-6 sm:h-6" />,
                          title: "Privacy Protection",
                          description: isTraining
                            ? "Adding noise to protect individual privacy"
                            : "Noise will be added to protect individual privacy",
                          active: isTraining && status === 'Training'
                        },
                        {
                          icon: <Zap className="w-4 h-4 sm:w-6 sm:h-6" />,
                          title: "Model Aggregation",
                          description: isTraining
                            ? "Combining improvements from all clients"
                            : "Improvements from all clients will be combined",
                          active: isTraining && status === 'Training'
                        },
                        {
                          icon: <BarChart className="w-4 h-4 sm:w-6 sm:h-6" />,
                          title: "Progress Evaluation",
                          description: isTraining
                            ? "Measuring model performance"
                            : "Model performance will be measured",
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
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="w-full sm:w-auto">
                        <CardTitle className="text-xl sm:text-2xl text-purple-400">
                          Metrics Dashboard
                        </CardTitle>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center w-full sm:w-auto gap-3 sm:space-x-4">
                        <div className="flex items-center text-gray-400 text-xs sm:text-sm w-full sm:w-auto justify-center">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          ~1:30 per round
                        </div>
                        <div className="relative group w-full sm:w-auto">
                          <button
                            onClick={executeTrainingRound}
                            disabled={isTraining || currentRound >= totalRounds}
                            className="w-full sm:w-auto px-4 py-2 bg-purple-500 rounded-lg hover:bg-purple-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                          >
                            {isTraining
                              ? 'Training...'
                              : currentRound === 0
                              ? 'Run First Round'
                              : currentRound === totalRounds - 1
                              ? 'Run Last Round'
                              : 'Run Next Round'}
                            <Info className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          <div className="absolute invisible group-hover:visible w-48 sm:w-64 bg-gray-800 text-xs p-2 rounded-lg shadow-lg -top-20 sm:-top-24 left-1/2 transform -translate-x-1/2 z-10">
                            Each training round improves the model by learning from all clients 
                            while keeping their data private. More rounds generally lead to 
                            better accuracy while maintaining privacy.
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6 sm:space-y-10">
                      <ProgressBar
                        currentRound={currentRound}
                        totalRounds={totalRounds}
                        status={status}
                      />
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center mt-4">
                        <div className="bg-gray-700/50 rounded-lg p-2 sm:p-3 group relative">
                          <div className="text-gray-400 text-xs sm:text-sm flex items-center justify-center gap-1">
                            Accuracy
                            <div className="absolute invisible group-hover:visible w-48 sm:w-64 bg-gray-800 text-xs p-2 rounded-lg shadow-lg -top-20 sm:-top-24 left-1/2 transform -translate-x-1/2 z-10">
                              Model accuracy shows how well the model performs at recognizing handwritten digits.
                              Higher accuracy means better performance, with 100% being perfect recognition.
                            </div>
                          </div>
                          <div className="text-purple-400 text-lg sm:text-xl font-bold flex items-center justify-center gap-2">
                            {(metrics.accuracy * 100).toFixed(1)}%
                            <div
                              className={`h-2 w-2 rounded-full ${
                                metrics.accuracy > 0.9
                                  ? 'bg-green-400'
                                  : metrics.accuracy > 0.7
                                  ? 'bg-yellow-400'
                                  : 'bg-red-400'
                              }`}
                            />
                          </div>
                        </div>
                        <div className="bg-gray-700/50 rounded-lg p-2 sm:p-3 group relative">
                          <div className="text-gray-400 text-xs sm:text-sm flex items-center justify-center gap-1">
                            Privacy Budget (ε)
                            <div className="absolute invisible group-hover:visible w-48 sm:w-64 bg-gray-800 text-xs p-2 rounded-lg shadow-lg -top-20 sm:-top-24 left-1/2 transform -translate-x-1/2 z-10">
                              Privacy budget measures how much information we allow to be revealed 
                              during training. Lower values (closer to 0) mean stronger privacy protection.
                            </div>
                          </div>
                          <div className="text-purple-400 text-lg sm:text-xl font-bold flex items-center justify-center gap-2">
                            {metrics.privacy_budget.epsilon.toFixed(3)}
                            <div
                              className={`h-2 w-2 rounded-full ${
                                metrics.privacy_budget.epsilon < 3
                                  ? 'bg-green-400'
                                  : metrics.privacy_budget.epsilon < 7
                                  ? 'bg-yellow-400'
                                  : 'bg-red-400'
                              }`}
                            />
                          </div>
                        </div>
                        <div className="bg-gray-700/50 rounded-lg p-2 sm:p-3">
                          <div className="text-gray-400 text-xs sm:text-sm">Round</div>
                          <div className="text-purple-400 text-lg sm:text-xl font-bold">
                            {currentRound} / {totalRounds}
                          </div>
                        </div>
                      </div>

                      <div className="h-48 sm:h-64 mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trainingHistory}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis
                              dataKey="round"
                              stroke="#9CA3AF"
                              tick={{ fontSize: 12 }}
                            />
                            <YAxis
                              stroke="#9CA3AF"
                              domain={[0, 1]}
                              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                              tick={{ fontSize: 12 }}
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
                              dot={{ fill: '#8B5CF6', r: 3 }}
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
      </div>

      {/* POPUP OVERLAY: Displayed if showResetPopup is true */}
      {showResetPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-50">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-purple-500" />
            <p className="text-white mt-4">Resetting Session...</p>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;