"use client";

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

interface MetricsData {
  round: number;
  accuracy: number;
  privacy_budget: {
    epsilon: number;
    delta: number;
  };
}

interface TrainingVisualizationProps {
  metricsHistory: MetricsData[];
  currentRound: number;
  totalRounds: number;
}

const TrainingVisualization: React.FC<TrainingVisualizationProps> = ({
  metricsHistory,
  currentRound,
  totalRounds
}) => {
  const tooltipContent = {
    accuracy: "Model accuracy shows how well the model performs across all clients without sharing raw data.",
    epsilon: "Privacy budget (ε) measures the strength of privacy guarantees. Lower values mean stronger privacy.",
    progress: "Watch how the model improves through collaborative learning while maintaining privacy."
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Accuracy Chart */}
      <Card className="bg-gray-800 border-purple-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-purple-400">Model Accuracy</CardTitle>
            <div className="group relative">
              <Info className="w-5 h-5 text-gray-400 cursor-help" />
              <div className="absolute right-0 w-64 p-2 bg-gray-700 text-sm text-gray-300 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                {tooltipContent.accuracy}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={metricsHistory}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="round"
                  stroke="#9CA3AF"
                  label={{ value: 'Training Round', position: 'insideBottom', offset: -10 }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                  labelStyle={{ color: '#9CA3AF' }}
                />
                <Legend />
                <Line 
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={{ fill: '#8B5CF6' }}
                  name="Accuracy"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Budget Chart */}
      <Card className="bg-gray-800 border-purple-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-purple-400">Privacy Budget</CardTitle>
            <div className="group relative">
              <Info className="w-5 h-5 text-gray-400 cursor-help" />
              <div className="absolute right-0 w-64 p-2 bg-gray-700 text-sm text-gray-300 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                {tooltipContent.epsilon}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={metricsHistory}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="round"
                  stroke="#9CA3AF"
                  label={{ value: 'Training Round', position: 'insideBottom', offset: -10 }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  label={{ value: 'Privacy Budget (ε)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                  labelStyle={{ color: '#9CA3AF' }}
                />
                <Legend />
                <Line 
                  type="monotone"
                  dataKey="privacy_budget.epsilon"
                  stroke="#EC4899"
                  strokeWidth={2}
                  dot={{ fill: '#EC4899' }}
                  name="Privacy Budget (ε)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainingVisualization;