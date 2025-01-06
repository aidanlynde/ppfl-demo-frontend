import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Plus, Minus, Play, Shield } from 'lucide-react';

interface ClientSetupProps {
  onStart: () => void;
  sessionId: string | null;
}

interface Client {
  id: number;
  dataSize: number;
  dataDistribution: string;
}

interface PrivacyConfig {
  noiseMultiplier: number;
  l2NormClip: number;
}

const ClientSetup: React.FC<ClientSetupProps> = ({ onStart, sessionId }) => {
  const [clients, setClients] = useState<Client[]>([
    { id: 1, dataSize: 800, dataDistribution: 'normal' }
  ]);
  const [privacyConfig, setPrivacyConfig] = useState<PrivacyConfig>({
    noiseMultiplier: 1.0,
    l2NormClip: 1.0
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [initializationAttempts, setInitializationAttempts] = useState(0);

  const addClient = useCallback((): void => {
    if (clients.length < 5) {
      const totalDataSize = clients.reduce((sum, client) => sum + client.dataSize, 0) + 800;
      if (totalDataSize > 6000) {
        setError('Warning: Adding more clients would exceed recommended total data size');
        return;
      }
      setClients(prev => [...prev, {
        id: prev.length + 1,
        dataSize: 800,
        dataDistribution: 'normal'
      }]);
    }
  }, [clients]);

  const removeClient = useCallback((id: number): void => {
    if (clients.length > 1) {
      setClients(prev => prev.filter(client => client.id !== id));
      setError(null);
    }
  }, [clients.length]);

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
        noise_multiplier: privacyConfig.noiseMultiplier,
        l2_norm_clip: privacyConfig.l2NormClip
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

      let errorMessage = '';

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || 'Failed to initialize training';
        } else {
          errorMessage = await response.text() || 'Failed to initialize training';
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Initialize success:', result);
      
      if (result.status === 'success') {
        onStart();
      } else {
        throw new Error(result.error || 'Initialization failed');
      }
    } catch (error) {
      console.error('Error:', error);
      
      setInitializationAttempts(prev => {
        const newCount = prev + 1;
        if (newCount >= 3) {
          setError('Failed to initialize after multiple attempts. Please refresh and try again.');
        } else {
          setError(error instanceof Error ? error.message : 'Failed to initialize training');
        }
        return newCount;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isStartDisabled = isLoading || !sessionId || initializationAttempts >= 3 || clients.length <= 1;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}

      <Card className="bg-gray-800 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-purple-400">Configure Training</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Privacy Settings Section */}
            <div className="bg-gray-700/50 p-4 rounded-lg space-y-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-medium text-purple-300">Privacy Settings</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="group relative">
                    <label className="text-sm text-gray-300 flex items-center space-x-2">
                      <span>Noise Multiplier</span>
                    </label>
                    <div className="absolute invisible group-hover:visible w-64 bg-gray-800 text-sm p-2 rounded-lg shadow-lg -top-16 right-0 text-gray-300">
                      Higher values provide stronger privacy but may reduce model accuracy
                    </div>
                  </div>
                  <Slider
                    value={[privacyConfig.noiseMultiplier]}
                    min={0.1}
                    max={2.0}
                    step={0.1}
                    className="mt-2"
                    disabled={isLoading}
                    onValueChange={(value) => {
                      setPrivacyConfig(prev => ({
                        ...prev,
                        noiseMultiplier: value[0]
                      }));
                    }}
                  />
                  <span className="text-sm text-gray-400">{privacyConfig.noiseMultiplier.toFixed(1)}</span>
                </div>

                <div>
                  <div className="group relative">
                    <label className="text-sm text-gray-300 flex items-center space-x-2">
                      <span>L2 Norm Clip</span>
                    </label>
                    <div className="absolute invisible group-hover:visible w-64 bg-gray-800 text-sm p-2 rounded-lg shadow-lg -top-20 right-0 text-gray-300">
                      Limits the influence of individual client results on the global model. Lower values mean stronger privacy.
                    </div>
                  </div>
                  <Slider
                    value={[privacyConfig.l2NormClip]}
                    min={0.1}
                    max={2.0}
                    step={0.1}
                    className="mt-2"
                    disabled={isLoading}
                    onValueChange={(value) => {
                      setPrivacyConfig(prev => ({
                        ...prev,
                        l2NormClip: value[0]
                      }));
                    }}
                  />
                  <span className="text-sm text-gray-400">{privacyConfig.l2NormClip.toFixed(1)}</span>
                </div>
              </div>
            </div>

            {/* Client Configuration Section */}
            {clients.map((client) => (
              <div key={client.id} className="bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-purple-300">
                    Client {client.id}
                  </h3>
                  <button
                    onClick={() => removeClient(client.id)}
                    className="text-gray-400 hover:text-red-400"
                    disabled={isLoading}
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
                      max={1500}
                      step={100}
                      className="mt-2"
                      disabled={isLoading}
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
                disabled={clients.length >= 5 || isLoading}
                className="flex items-center space-x-2 px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
                <span>Add Client</span>
              </button>

              <div className="relative group">
                <button
                  onClick={handleStart}
                  disabled={isStartDisabled}
                  className={`flex items-center space-x-2 px-6 py-2 rounded bg-purple-500 hover:bg-purple-400 ${
                    isStartDisabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Play className="w-5 h-5" />
                  <span>
                    {isLoading ? 'Starting...' : 'Start Training'}
                  </span>
                </button>
                {clients.length <= 1 && (
                  <div className="absolute invisible group-hover:visible w-64 bg-gray-800 text-sm p-2 rounded-lg shadow-lg -top-12 right-0 text-gray-300">
                    Please add more clients to begin training. Federated learning requires multiple clients to be effective.
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientSetup;