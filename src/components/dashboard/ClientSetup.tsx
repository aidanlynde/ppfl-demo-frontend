// File: src/components/dashboard/ClientSetup.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Plus, Minus, Play } from 'lucide-react';

interface ClientSetupProps {
  onStart: () => void;
}

interface Client {
  id: number;
  dataSize: number;
  dataDistribution: string;
}

const ClientSetup: React.FC<ClientSetupProps> = ({ onStart }) => {
  const [clients, setClients] = useState<Client[]>([
    { id: 1, dataSize: 1000, dataDistribution: 'normal' }
  ]);

  const addClient = (): void => {
    if (clients.length < 5) {
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
    }
  };

  const handleStart = async (): Promise<void> => {
    try {
      const response = await fetch('/api/fl/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clients: clients.map(client => ({
            client_id: client.id,
            data_size: client.dataSize,
            distribution: client.dataDistribution
          }))
        })
      });

      if (response.ok) {
        onStart();
      }
    } catch (error) {
      console.error('Error initializing training:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
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
                      max={5000}
                      step={100}
                      className="mt-2"
                      onValueChange={(value) => {
                        setClients(clients.map(c => 
                          c.id === client.id ? { ...c, dataSize: value[0] } : c
                        ));
                      }}
                    />
                    <span className="text-sm text-gray-400">{client.dataSize} samples</span>
                  </div>
                </div>
              </div>
            ))}

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
                className="flex items-center space-x-2 px-6 py-2 rounded bg-purple-500 hover:bg-purple-400"
              >
                <Play className="w-5 h-5" />
                <span>Start Training</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientSetup;