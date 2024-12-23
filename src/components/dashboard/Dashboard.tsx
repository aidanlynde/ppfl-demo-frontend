// File: src/components/dashboard/Dashboard.tsx

"use client";

import React, { useState, useEffect } from 'react';
import TutorialOverlay from '@/components/dashboard/TutorialOverlay';
import ClientSetup from '@/components/dashboard/ClientSetup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, Users, Brain, Shield } from 'lucide-react';

interface Metrics {
  accuracy_history: number[];
}

interface Client {
  id: number;
  status: string;
  data_size: number;
  last_update: string;
}

interface CurrentState {
  status: string;
  active_clients: number;
  current_round: number;
  privacy_budget: number;
  clients?: Client[];
}

const Dashboard: React.FC = () => {
  const [showTutorial, setShowTutorial] = useState<boolean>(true);
  const [showSetup, setShowSetup] = useState<boolean>(false);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [currentState, setCurrentState] = useState<CurrentState | null>(null);

  useEffect(() => {
    if (isTraining) {
      const fetchData = async (): Promise<void> => {
        try {
          const [metricsResponse, stateResponse] = await Promise.all([
            fetch('/api/fl/metrics'),
            fetch('/api/fl/current_state')
          ]);
          
          const metricsData = await metricsResponse.json();
          const stateData = await stateResponse.json();
          
          setMetrics(metricsData);
          setCurrentState(stateData);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };

      fetchData();
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [isTraining]);

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
    return <ClientSetup onStart={handleSetupComplete} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-purple-400">Federated Learning Dashboard</h1>
        
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
                {currentState?.status || 'Loading...'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-purple-400 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Active Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-400">
                {currentState?.active_clients || 0}
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
                Privacy Budget
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-400">
                {currentState?.privacy_budget || 'N/A'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gray-800 border-purple-500/20 mb-8">
          <CardHeader>
            <CardTitle className="text-purple-400">Training Progress</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            {metrics?.accuracy_history && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.accuracy_history.map((acc, round) => ({ round, acc }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="round" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                    labelStyle={{ color: '#9CA3AF' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="acc" 
                    stroke="#A78BFA" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-purple-400">Client Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentState?.clients?.map((client) => (
                <Card key={client.id} className="bg-gray-700 border-purple-500/20">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Client {client.id}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        client.status === 'active' ? 'bg-green-500/20 text-green-400' : 
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {client.status}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-400">
                      <p>Data size: {client.data_size}</p>
                      <p>Last update: {new Date(client.last_update).toLocaleString()}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;