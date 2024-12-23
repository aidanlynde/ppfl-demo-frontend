"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Lock, Brain, Users, ShieldCheck } from 'lucide-react';

interface TutorialOverlayProps {
  onComplete: () => void;
}

interface TutorialStep {
  title: string;
  content: string;
  icon: React.ReactNode;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  const tutorialSteps: TutorialStep[] = [
    {
      title: "Welcome to Federated Learning!",
      content: "Imagine you want to train an AI model, but your data is spread across multiple devices and needs to stay private. That's where federated learning comes in! Let's learn how it works.",
      icon: <Brain className="w-12 h-12 text-purple-400" />
    },
    {
      title: "Privacy First",
      content: "In traditional machine learning, all data is collected in one place. But with federated learning, the data stays on each device, protecting privacy while still helping the model learn.",
      icon: <Lock className="w-12 h-12 text-purple-400" />
    },
    {
      title: "Meet Your Clients",
      content: "In this demo, you'll control multiple 'clients' (like phones or computers). Each client has its own private data but wants to help train a shared model.",
      icon: <Users className="w-12 h-12 text-purple-400" />
    },
    {
      title: "Let's Get Started!",
      content: "Ready to try it yourself? First, let's set up some clients with their own private data.",
      icon: <ShieldCheck className="w-12 h-12 text-purple-400" />
    }
  ];

  const handleNext = (): void => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = (): void => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="bg-gray-800 rounded-lg p-8 max-w-2xl w-full mx-4"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          <div className="flex flex-col items-center text-center mb-8">
            {tutorialSteps[currentStep].icon}
            <h2 className="text-2xl font-bold text-purple-400 mt-4">
              {tutorialSteps[currentStep].title}
            </h2>
            <p className="text-gray-300 mt-4">
              {tutorialSteps[currentStep].content}
            </p>
          </div>

          <div className="flex justify-between items-center mt-8">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`flex items-center space-x-2 px-4 py-2 rounded ${
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
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentStep ? 'bg-purple-400' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="flex items-center space-x-2 px-4 py-2 rounded bg-purple-500 hover:bg-purple-400 text-white"
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