"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Lock, Zap, BarChart } from 'lucide-react';

interface TrainingInfoProps {
  currentRound: number;
  isTraining: boolean;
  accuracy: number;
  privacyBudget: number;
}

const TrainingInfo: React.FC<TrainingInfoProps> = ({
  currentRound,
  isTraining,
  accuracy,
  privacyBudget
}) => {
  const steps = [
    {
      icon: <Activity className="w-6 h-6" />,
      title: "Local Training",
      description: "Each client is training the model on their private data",
      active: isTraining
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Privacy Protection",
      description: "Adding noise to protect individual privacy",
      active: isTraining
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Model Aggregation",
      description: "Combining improvements from all clients",
      active: isTraining
    },
    {
      icon: <BarChart className="w-6 h-6" />,
      title: "Progress Evaluation",
      description: "Measuring model performance and privacy guarantees",
      active: isTraining
    }
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            className={`p-4 rounded-lg ${
              step.active ? 'bg-purple-500/20' : 'bg-gray-700/20'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className={`${
                step.active ? 'text-purple-400' : 'text-gray-400'
              }`}>
                {step.icon}
              </div>
              <h3 className={`font-medium ${
                step.active ? 'text-purple-400' : 'text-gray-300'
              }`}>
                {step.title}
              </h3>
            </div>
            <p className="text-sm text-gray-400">
              {step.description}
            </p>
            {step.active && (
              <motion.div
                className="h-1 bg-purple-500 mt-2 rounded"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </motion.div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-700/20 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300">Current Accuracy</span>
            <span className="text-purple-400 font-medium">
              {accuracy.toFixed(2)}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-purple-500 rounded-full h-2"
              style={{ width: `${accuracy}%` }}
            />
          </div>
        </div>

        <div className="bg-gray-700/20 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300">Privacy Budget Used</span>
            <span className="text-purple-400 font-medium">
              ε = {privacyBudget.toFixed(4)}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-purple-500 rounded-full h-2"
              style={{ width: `${Math.min((privacyBudget / 10) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {isTraining && (
        <div className="mt-4 text-center text-sm text-gray-400">
          Training Round {currentRound} in progress...
        </div>
      )}
    </div>
  );
};

export default TrainingInfo;