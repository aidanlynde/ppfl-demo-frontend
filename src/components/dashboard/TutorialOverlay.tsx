"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, Lock, Brain, Users, ShieldCheck, Database, Activity } from 'lucide-react';

interface TutorialOverlayProps {
 onComplete: () => void;
}

const tutorialSteps = [
 {
   title: "Welcome to Federated Learning (FL)!",
   content: "In this demo, you'll learn how FL works to train AI models while keeping all data private.",
   icon: <Brain className="w-12 h-12 text-purple-400" />,
   details: [
     "You'll train an AI model to look at images of handwritten numbers (0-9) and predict what number it sees",
     "We'll show you how multiple organizations can work together to train models without sharing their private data",
     "You'll be able to interact with inputting different parameters and seeing how the model gets better at recognizing numbers with each training round"
   ]
 },
 {
   title: "Understanding the Dataset",
   content: "We're using the MNIST dataset - a collection of thousands of handwritten numbers.",
   icon: <Database className="w-12 h-12 text-purple-400" />,
   details: [
     "Each client has their own set of handwritten number images",
     "The model tries to predict what number (0-9) is shown in each image",
     "Accuracy shows how often the model correctly guesses the right number",
     "For example, 90% accuracy means it correctly identifies 9 out of 10 numbers"
   ]
 },
 {
   title: "How Training Works",
   content: "You'll need to run multiple training rounds to improve the model's accuracy.",
   icon: <Activity className="w-12 h-12 text-purple-400" />,
   details: [
     "Each round: Clients use their private images to teach the model",
     "The model makes predictions, checks if it's right or wrong, and learns from its mistakes",
     "Only the lessons learned are shared, never the actual images",
     "With each round, the model should get better at recognizing numbers"
   ]
 },
 {
   title: "Privacy Protection",
   content: "Your data stays private while still helping to train the AI model.",
   icon: <Lock className="w-12 h-12 text-purple-400" />,
   details: [
     "Think of it like a study group where students share their insights, not their notes",
     "Each client keeps their number images private and local",
     "Only the model's learning progress is shared",
     "Random noise is added to further protect privacy"
   ]
 },
 {
   title: "Let's Get Started!",
   content: "First, you'll set up multiple clients to participate in training.",
   icon: <Users className="w-12 h-12 text-purple-400" />,
   details: [
     "Add at least 2 clients to begin training (more clients = better results)",
     "Each client will have their own set of number images to train with",
     "You'll run multiple training rounds to improve accuracy",
     "Watch the accuracy increase as the model learns to recognize numbers better!",
     "At any time you can return to the client setup and adjust the data/privacy parameters to see how that affects the outcome.."
   ]
 }
];

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
   <motion.div 
     className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
     initial={{ opacity: 0 }}
     animate={{ opacity: 1 }}
   >
     <motion.div 
       className="bg-gray-800 rounded-lg p-8 max-w-3xl w-full mx-4"
       initial={{ scale: 0.9, opacity: 0 }}
       animate={{ scale: 1, opacity: 1 }}
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
                 <li key={index} className="flex items-start text-gray-300">
                   <span className="text-purple-400 mr-2">•</span>
                   {detail}
                 </li>
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
           className="flex items-center space-x-2 px-4 py-2 rounded bg-purple-500 hover:bg-purple-400 text-white transition-colors"
         >
           <span>{currentStep === tutorialSteps.length - 1 ? "Start Demo" : "Next"}</span>
           <ChevronRight className="w-5 h-5" />
         </button>
       </div>
     </motion.div>
   </motion.div>
 );
};

export default TutorialOverlay;