"use client";

import React, { useState, useEffect } from 'react';
import TutorialOverlay from '@/components/dashboard/TutorialOverlay';
import ClientSetup from '@/components/dashboard/ClientSetup';
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
  latest_accuracy: number;
}

const Dashboard: React.FC = () => {
  const [showTutorial, setShowTutorial] = useState<boolean>(true);
  const [showSetup, setShowSetup] = useState<boolean>(false);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [currentState, setCurrentState] = useState<CurrentState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const id = await SessionStore.initSession();
        setSessionId(id);
      } catch (error) {
        console.error('Failed to initialize session:', error);
        setError('Failed to initialize session');
      }
    };

    if (!sessionId) {
      initializeSession();
    }
  }, [sessionId]);

  useEffect(() => {
  if (isTraining && sessionId) {
    const fetchData = async (): Promise<void> => {
      try {
        const headers = {
          'X-Session-ID': sessionId
        };

        const [metricsResponse, stateResponse] = await Promise.all([
          fetch('/api/fl/metrics', { headers }),
          fetch('/api/fl/current_state', { headers })
        ]);

        if (!metricsResponse.ok || !stateResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const metricsData = await metricsResponse.json();
        const stateData = await stateResponse.json();

        console.log('Metrics data:', metricsData);
        console.log('State data:', stateData);

        setMetrics(metricsData);
        setCurrentState(stateData);
        setError(null);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch data');
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }
}, [isTraining, sessionId]);

  const handleTutorialComplete = (): void => {
    setShowTutorial(false);
    setShowSetup(true);
  };

  const handleSetupComplete = (): void => {
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