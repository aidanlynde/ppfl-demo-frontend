"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Plus, Minus, Play } from 'lucide-react';

interface ClientSetupProps {
  onStart: () => void;
  sessionId: string | null;
}

interface Client {
  id: number;
  dataSize: number;
  dataDistribution: string;
}

const ClientSetup: React.FC<ClientSetupProps> = ({ onStart, sessionId }) => {
  const [clients, setClients] = useState<Client[]>([
    { id: 1, dataSize: 1000, dataDistribution: 'normal' }
  ]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const addClient = (): void => {
    if (clients.length < 5) {
      const totalDataSize = clients.reduce((sum, client) => sum + client.dataSize, 0) + 1000;
      if (totalDataSize > 6000) {
        setError('Warning: Adding more clients would exceed recommended total data size');
        return;
      }
      setClients([...clients, {
        id: clients.length + 1,
        dataSize: 1000,
        dataDistribution: 'normal'
      }]);
    }
  };

  const removeClient = (id: number): void => {
    if (clients.length > 1) {
      setClients(clients.filter(client => client.id !== id));
      setError(null);
    }
  };

  const handleStart = async (): Promise<void> => {
    if (!sessionId) {
      setError('No active session');
      return;
    }

    const totalDataSize = clients.reduce((sum, client) => sum + client.dataSize, 0);
    if (totalDataSize > 6000) {
      setError('Total data size too large. Please reduce the number of samples or clients.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      console.log('Sending initialize request with session:', sessionId);
      
      const initializeData = {
        num_clients: clients.length,
        local_epochs: 1,
        batch_size: 32,
        noise_multiplier: 1.0,
        l2_norm_clip: 1.0
      };

      console.log('Request data:', initializeData);

      const response = await fetch('/api/fl/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        },
        body: JSON.stringify(initializeData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(errorText || 'Failed to initialize training');
      }

      const result = await response.json();
      console.log('Initialize success:', result);
      onStart();
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize training');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}

      <Card className="bg-gray-800 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-purple-400">Configure Your Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {clients.map((client) => (
              <div key={client.id} className="bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-purple-300">
                    Client {client.id}
                  </h3>
                  <button
                    onClick={() => removeClient(client.id)}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-300">Data Size</label>
                    <Slider
                      value={[client.dataSize]}
                      min={100}
                      max={2000} // Reduced from 5000
                      step={100}
                      className="mt-2"
                      onValueChange={(value) => {
                        const updatedClients = clients.map(c => 
                          c.id === client.id ? { ...c, dataSize: value[0] } : c
                        );
                        const totalDataSize = updatedClients.reduce((sum, c) => sum + c.dataSize, 0);
                        
                        if (totalDataSize > 6000) {
                          setError('Warning: Large total data size may affect performance');
                        } else {
                          setError(null);
                        }
                        
                        setClients(updatedClients);
                      }}
                    />
                    <span className="text-sm text-gray-400">{client.dataSize} samples</span>
                  </div>
                </div>
              </div>
            ))}

            <div className="mt-4 text-sm text-gray-400">
              Total Data Size: {clients.reduce((sum, client) => sum + client.dataSize, 0)} samples
              {clients.reduce((sum, client) => sum + client.dataSize, 0) > 4000 && (
                <span className="text-yellow-400 ml-2">
                  (High load may affect performance)
                </span>
              )}
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={addClient}
                disabled={clients.length >= 5}
                className="flex items-center space-x-2 px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
                <span>Add Client</span>
              </button>

              <button
                onClick={handleStart}
                disabled={isLoading || !sessionId}
                className={`flex items-center space-x-2 px-6 py-2 rounded bg-purple-500 hover:bg-purple-400 ${
                  (isLoading || !sessionId) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Play className="w-5 h-5" />
                <span>{isLoading ? 'Starting...' : 'Start Training'}</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientSetup;