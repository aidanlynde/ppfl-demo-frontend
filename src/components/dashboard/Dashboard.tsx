"use client";

import React, { useState, useEffect, useRef } from 'react';
import TutorialOverlay from '@/components/dashboard/TutorialOverlay';
import ClientSetup from '@/components/dashboard/ClientSetup';
import ProgressBar from '@/components/dashboard/ProgressBar';
import TrainingStatus from '@/components/dashboard/TrainingStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, Users, Brain, Shield } from 'lucide-react';
import SessionStore from '@/lib/sessionStore';

interface TrainingMetrics {
  round_number: number;
  client_metrics: {
    [key: string]: {
      loss: number;
      accuracy: number;
    };
  };
  global_metrics: {
    test_loss: number;
    test_accuracy: number;
  };
  privacy_metrics: {
    noise_scale: number;
    clip_norm: number;
    clipped_updates: number;
    original_update_norms: number[];
    clipped_update_norms: number[];
  };
  privacy_budget: {
    epsilon: number;
    delta: number;
    noise_multiplier: number;
    l2_norm_clip: number;
  };
}

interface Metrics {
  status: string;
  training_history: {
    rounds: number[];
    training_metrics: TrainingMetrics[];
  };
}

interface CurrentState {
  status: string;
  current_round: number;
  total_rounds: number;
  privacy_settings: {
    noise_multiplier: number;
    l2_norm_clip: number;
  };
  training_active: boolean;
  latest_accuracy: number | null;
}

interface RoundState {
  isProcessing: boolean;
  lastCompletedRound: number;
}

const Dashboard: React.FC = () => {
  // State declarations
  const [showTutorial, setShowTutorial] = useState<boolean>(true);
  const [showSetup, setShowSetup] = useState<boolean>(false);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [currentState, setCurrentState] = useState<CurrentState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Use refs for controlling async operations and intervals
  const abortControllerRef = useRef<AbortController | null>(null);
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const trainingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTrainingRoundActiveRef = useRef<boolean>(false);
  const sessionRenewalTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize or renew session
  const initializeSession = async (renewExisting: boolean = false) => {
    try {
      let session_id;
      
      if (renewExisting && sessionId) {
        // Check if existing session is still valid
        const response = await fetch(`/api/session/${sessionId}/status`);
        if (response.ok) {
          const { valid } = await response.json();
          if (valid) {
            session_id = sessionId;
          }
        }
      }
      
      if (!session_id) {
        // Create new session
        const response = await fetch('/api/session/new', { method: 'POST' });
        if (!response.ok) throw new Error('Failed to create session');
        const data = await response.json();
        session_id = data.session_id;
      }
      
      // Initialize FL manager with the session
      const initResponse = await fetch('/api/fl/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': session_id
        },
        body: JSON.stringify({
          num_clients: 3,
          local_epochs: 1,
          batch_size: 32,
          noise_multiplier: 1,
          l2_norm_clip: 1
        })
      });

      if (!initResponse.ok) {
        throw new Error('Failed to initialize federated learning');
      }

      setSessionId(session_id);
      setError(null);

      // Schedule session renewal before timeout
      if (sessionRenewalTimeoutRef.current) {
        clearTimeout(sessionRenewalTimeoutRef.current);
      }
      sessionRenewalTimeoutRef.current = setTimeout(() => {
        initializeSession(true);
      }, 25 * 60 * 1000); // Renew 5 minutes before 30-minute timeout
      
      return session_id;
    } catch (err) {
      console.error('Session initialization failed:', err);
      setError('Failed to initialize session. Please refresh the page.');
      setIsTraining(false);
      throw err;
    }
  };

  // Fetch current metrics and state
  const fetchData = async (): Promise<boolean> => {
    if (!sessionId || !isTraining) return false;

    try {
      const [metricsResponse, stateResponse] = await Promise.all([
        fetch('/api/fl/metrics', {
          headers: { 'X-Session-ID': sessionId }
        }),
        fetch('/api/fl/current_state', {
          headers: { 'X-Session-ID': sessionId }
        })
      ]);

      // Handle session expiry
      if (metricsResponse.status === 401 || stateResponse.status === 401) {
        await initializeSession(true);
        return false;
      }

      if (!metricsResponse.ok || !stateResponse.ok) {
        throw new Error(`Failed to fetch data: ${metricsResponse.status}, ${stateResponse.status}`);
      }

      const [metricsData, stateData] = await Promise.all([
        metricsResponse.json(),
        stateResponse.json()
      ]);

      setMetrics(metricsData);
      setCurrentState(stateData);
      setError(null);

      // Check if training should stop
      if (stateData.current_round >= stateData.total_rounds || !stateData.training_active) {
        setIsTraining(false);
      }

      return true;
    } catch (err) {
      console.error('Error fetching data:', err);
      if (err instanceof Error) setError(err.message);
      return false;
    }
  };

  // Execute training round
  const trainRound = async (): Promise<void> => {
    if (!sessionId || isTrainingRoundActiveRef.current || !isTraining) return;

    try {
      isTrainingRoundActiveRef.current = true;
      
      const response = await fetch('/api/fl/train_round', {
        method: 'POST',
        headers: {
          'X-Session-ID': sessionId,
          'Content-Type': 'application/json'
        }
      });

      // Handle session expiry
      if (response.status === 401) {
        await initializeSession(true);
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Training round failed: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        // Wait for backend state to update
        let retries = 3;
        while (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          const success = await fetchData();
          if (success) break;
          retries--;
        }
      }
    } catch (err) {
      console.error('Error in training round:', err);
      if (err instanceof Error) setError(err.message);
      setIsTraining(false);
    } finally {
      isTrainingRoundActiveRef.current = false;
    }
  };

  // Initialize session effect
  useEffect(() => {
    if (!sessionId) {
      initializeSession();
    }

    return () => {
      if (sessionRenewalTimeoutRef.current) {
        clearTimeout(sessionRenewalTimeoutRef.current);
      }
    };
  }, [sessionId]);

  // Training management effect
  useEffect(() => {
    if (!isTraining || !sessionId) return;

    const scheduleNextRound = () => {
      if (trainingTimeoutRef.current) {
        clearTimeout(trainingTimeoutRef.current);
      }

      trainingTimeoutRef.current = setTimeout(() => {
        if (isTraining && !isTrainingRoundActiveRef.current) {
          trainRound().then(() => {
            if (isTraining) scheduleNextRound();
          });
        }
      }, 30000); // 30 seconds between rounds
    };

    // Start first round and schedule next
    trainRound().then(() => {
      if (isTraining) scheduleNextRound();
    });

    return () => {
      if (trainingTimeoutRef.current) {
        clearTimeout(trainingTimeoutRef.current);
      }
      isTrainingRoundActiveRef.current = false;
    };
  }, [isTraining, sessionId]);

  // Metrics polling effect
  useEffect(() => {
    if (!isTraining || !sessionId) return;

    const pollMetrics = () => {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }

      fetchData();
      metricsIntervalRef.current = setInterval(fetchData, 10000);
    };

    pollMetrics();

    return () => {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
    };
  }, [isTraining, sessionId]);

  // Component cleanup
  useEffect(() => {
    return () => {
      if (metricsIntervalRef.current) clearInterval(metricsIntervalRef.current);
      if (trainingTimeoutRef.current) clearTimeout(trainingTimeoutRef.current);
      if (sessionRenewalTimeoutRef.current) clearTimeout(sessionRenewalTimeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      isTrainingRoundActiveRef.current = false;
    };
  }, []);

  // Event handlers
  const handleTutorialComplete = () => {
    setShowTutorial(false);
    setShowSetup(true);
  };

  const handleSetupComplete = () => {
    setShowSetup(false);
    setIsTraining(true);
  };

  if (showTutorial) {
    return <TutorialOverlay onComplete={handleTutorialComplete} />;
  }

  if (showSetup) {
    return <ClientSetup onStart={handleSetupComplete} sessionId={sessionId} />;
  }

  const getChartData = () => {
    if (!metrics?.training_history?.training_metrics) return [];
    return metrics.training_history.training_metrics.map((metric) => ({
      round: metric.round_number,
      accuracy: metric.global_metrics.test_accuracy * 100
    }));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-purple-400">Federated Learning Dashboard</h1>

        <div className="mb-8">
          <TrainingStatus 
            status={currentState?.status || 'Initializing'}
            error={error}
            currentRound={currentState?.current_round || 0}
            totalRounds={currentState?.total_rounds || 10}
            accuracy={currentState?.latest_accuracy || 0}
          />
          <ProgressBar 
            currentRound={currentState?.current_round || 0}
            totalRounds={currentState?.total_rounds || 10}
            status={currentState?.status || 'Initializing'}
          />
        </div>
                
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-purple-400 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Training Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-400">
                {currentState?.training_active ? 'Active' : 'Inactive'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-purple-400 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Rounds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-400">
                {currentState?.total_rounds || 0}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-purple-400 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Current Round
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-400">
                {currentState?.current_round || 0}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-purple-400 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Latest Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-400">
                {currentState?.latest_accuracy 
                  ? `${(currentState.latest_accuracy * 100).toFixed(1)}%` 
                  : 'N/A'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gray-800 border-purple-500/20 mb-8">
          <CardHeader>
            <CardTitle className="text-purple-400">Training Progress</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            {metrics?.training_history?.training_metrics && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="round" 
                    stroke="#9CA3AF"
                    label={{ value: 'Round', position: 'bottom', fill: '#9CA3AF' }}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    label={{ value: 'Accuracy (%)', angle: -90, position: 'left', fill: '#9CA3AF' }}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                    labelStyle={{ color: '#9CA3AF' }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Accuracy']}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="accuracy" 
                    stroke="#A78BFA" 
                    strokeWidth={2}
                    dot={false}
                    name="Model Accuracy"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-purple-400">Privacy Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Noise Multiplier</p>
                <p className="text-xl font-bold text-green-400">
                  {currentState?.privacy_settings.noise_multiplier || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">L2 Norm Clip</p>
                <p className="text-xl font-bold text-green-400">
                  {currentState?.privacy_settings.l2_norm_clip || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;