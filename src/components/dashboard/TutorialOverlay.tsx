"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Lock, Brain, Users, ShieldCheck, Database, Activity } from 'lucide-react';

interface TutorialStep {
  title: string;
  content: string;
  icon: React.ReactNode;
  details: string[];
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Welcome to Federated Learning!",
    content: "Discover how we can train AI models while keeping data private and secure.",
    icon: <Brain className="w-12 h-12 text-purple-400" />,
    details: [
      "Traditional AI requires centralizing all data in one place",
      "Federated learning keeps data where it originates",
      "Learn through collaboration without compromising privacy"
    ]
  },
  {
    title: "Privacy First",
    content: "Your data stays where it belongs - with you.",
    icon: <Lock className="w-12 h-12 text-purple-400" />,
    details: [
      "Data never leaves its source",
      "Only model updates are shared",
      "Perfect for sensitive data like healthcare records or financial information"
    ]
  },
  {
    title: "How It Works",
    content: "Understanding the federated learning process step by step.",
    icon: <Activity className="w-12 h-12 text-purple-400" />,
    details: [
      "1. Initial model is distributed to all participants",
      "2. Each participant trains on their local data",
      "3. Only model improvements are shared back",
      "4. A new, improved model is created from all contributions"
    ]
  },
  {
    title: "Real-World Applications",
    content: "See how federated learning is transforming industries.",
    icon: <Database className="w-12 h-12 text-purple-400" />,
    details: [
      "Healthcare: Train on patient data while maintaining privacy",
      "Mobile Devices: Improve user experience without sharing personal data",
      "Finance: Detect fraud patterns across institutions",
      "IoT: Learn from device data while respecting user privacy"
    ]
  },
  {
    title: "Your Turn!",
    content: "Experience federated learning in action through this interactive demo.",
    icon: <Users className="w-12 h-12 text-purple-400" />,
    details: [
      "Configure multiple clients with different data distributions",
      "Watch the model improve through collaborative learning",
      "Monitor privacy metrics in real-time",
      "See how accuracy improves without sharing raw data"
    ]
  }
];

interface TutorialOverlayProps {
  onComplete: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="bg-gray-800 rounded-lg p-8 max-w-3xl w-full mx-4"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          <div className="flex flex-col items-center text-center mb-8">
            {tutorialSteps[currentStep].icon}
            <h2 className="text-2xl font-bold text-purple-400 mt-4">
              {tutorialSteps[currentStep].title}
            </h2>
            <p className="text-gray-300 mt-4 text-lg">
              {tutorialSteps[currentStep].content}
            </p>

            <div className="mt-6 text-left w-full">
              <div className="bg-gray-700/50 rounded-lg p-4">
                <ul className="space-y-2">
                  {tutorialSteps[currentStep].details.map((detail, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start text-gray-300"
                    >
                      <span className="text-purple-400 mr-2">•</span>
                      {detail}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-8">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`flex items-center space-x-2 px-4 py-2 rounded transition-colors ${
                currentStep === 0
                  ? 'text-gray-500 cursor-not-allowed'
                  : 'text-purple-400 hover:text-purple-300'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Previous</span>
            </button>

            <div className="flex space-x-2">
              {tutorialSteps.map((_, index) => (
                <motion.div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentStep ? 'bg-purple-400' : 'bg-gray-600'
                  }`}
                  animate={{
                    scale: index === currentStep ? 1.2 : 1
                  }}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="flex items-center space-x-2 px-4 py-2 rounded bg-purple-500 hover:bg-purple-400 text-white transition-colors"
            >
              <span>{currentStep === tutorialSteps.length - 1 ? "Start Demo" : "Next"}</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TutorialOverlay;