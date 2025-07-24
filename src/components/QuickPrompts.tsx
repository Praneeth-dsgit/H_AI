import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { PlusCircle, ChevronDown, ChevronUp } from 'lucide-react';

export type Capability = 'general' | 'radiology' | 'lab';

interface QuickPromptsProps {
  onSelectPrompt: (prompt: string) => void;
  capability?: Capability | null;
}

const QuickPrompts: React.FC<QuickPromptsProps> = ({ onSelectPrompt, capability }: QuickPromptsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Reset expanded state when capability changes
  useEffect(() => {
    setIsExpanded(false);
  }, [capability]);

  const getCapabilityPrompts = (cap: Capability | null) => {
    switch (cap) {
      case 'radiology':
        return [
          "How to interpret a chest X-ray?",
          "What are the signs of pneumonia on imaging?",
          "How to identify fractures on X-ray?",
          "What does a normal CT scan of the brain look like?",
          "How to read an MRI of the spine?",
          "What are the radiological signs of stroke?",
          "How to interpret abdominal ultrasound?",
          "What imaging is best for joint problems?",
          "How to identify kidney stones on CT?",
          "What are the signs of appendicitis on imaging?",
          "How to read a mammography report?",
          "What does lung edema look like on X-ray?",
          "How to interpret cardiac imaging?",
          "What are the radiological signs of cancer?",
          "How to identify gallstones on ultrasound?",
          "What imaging is needed for head trauma?",
          "How to read pediatric radiographs?",
          "What are contrast reactions and how to manage them?",
          "How to interpret bone density scans?",
          "What are the signs of pulmonary embolism on CT?"
        ];
      
      case 'lab':
        return [
          "How to interpret CBC results?",
          "What do elevated liver enzymes mean?",
          "How to read lipid panel results?",
          "What are normal kidney function values?",
          "How to interpret thyroid function tests?",
          "What does high CRP indicate?",
          "How to read blood glucose levels?",
          "What are normal electrolyte ranges?",
          "How to interpret cardiac enzyme results?",
          "What does elevated troponin mean?",
          "How to read coagulation studies?",
          "What are normal hemoglobin A1C levels?",
          "How to interpret urinalysis results?",
          "What do abnormal protein levels indicate?",
          "How to read arterial blood gas results?",
          "What are critical lab values?",
          "How to interpret tumor markers?",
          "What does high ESR suggest?",
          "How to read vitamin D levels?",
          "What are normal ranges for different age groups?"
        ];
      
      case 'general':
      default:
        return [
          "What are the symptoms of diabetes?",
          "How can I lower my blood pressure?",
          "What causes frequent headaches?",
          "What should I do if I have a fever?",
          "What are the side effects of paracetamol?",
          "How do I know if I have COVID-19?",
          "What is a normal heart rate?",
          "How much sleep do adults need?",
          "What are the signs of a heart attack?",
          "How can I treat a cold at home?",
          "Can I take ibuprofen on an empty stomach?",
          "How do I reduce anxiety naturally?",
          "What foods are good for weight loss?",
          "How much water should I drink each day?",
          "What causes fatigue and low energy?",
          "What is the difference between a cold and the flu?",
          "How do I treat a sprained ankle?",
          "When should I see a doctor for a sore throat?",
          "What is BMI and how is it calculated?",
          "Are multivitamins necessary?",
          "What are the symptoms of high cholesterol?",
          "How can I improve my immune system?",
          "What should I do in case of a minor burn?",
          "How can I manage stress effectively?",
          "Is it normal to feel dizzy sometimes?",
          "What is insulin and how does it work?",
          "How do I know if I'm dehydrated?",
          "What causes muscle cramps?",
          "Can allergies cause a sore throat?",
          "What is the best treatment for acne?",
          "What are the early signs of pregnancy?",
          "How often should I get a medical check-up?",
          "What vaccines do adults need?",
          "Is it safe to exercise every day?",
          "How do antibiotics work?",
          "What are probiotics and should I take them?",
          "How do I treat constipation naturally?",
          "What causes high blood sugar?",
          "What is the best way to quit smoking?",
          "When should I get a flu shot?",
          "Can stress cause physical symptoms?",
          "What should I eat before a workout?",
          "How is high blood pressure diagnosed?",
          "What is sleep apnea?",
          "Are headaches a symptom of COVID-19?",
          "What should I do if I have chest pain?",
          "How can I tell if I have food poisoning?",
          "Is it okay to drink coffee every day?",
          "What are good ways to boost mental health?",
          "Can dehydration cause headaches?"
        ];
    }
  };

  const prompts = getCapabilityPrompts(capability || null);

  // Shuffle array using Fisher-Yates algorithm
  const shuffleArray = (array: string[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Memoize the shuffled prompts so they don't reshuffle on every re-render, but re-shuffle when capability changes
  const shuffledPrompts = useMemo(() => shuffleArray(prompts), [capability, prompts]);

  // Display only first 6 prompts when not expanded
  const visiblePrompts = isExpanded ? shuffledPrompts : shuffledPrompts.slice(0, 3);

  const getCapabilityLabel = (cap: Capability | null) => {
    switch (cap) {
      case 'radiology': return 'Radiology Quick Questions:';
      case 'lab': return 'Lab Interpretation Quick Questions:';
      case 'general': 
      default: return 'FAQ:';
    }
  };

  return (
    <div className="mb-2">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-sm font-medium text-indigo-700">{getCapabilityLabel(capability || null)}</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
        >
          {isExpanded ? (
            <>Show less <ChevronUp size={10} className="ml-1" /></>
          ) : (
            <>Show more <ChevronDown size={16} className="ml-1" /></>
          )}
        </button>
      </div>
      <div
        className={`flex flex-wrap gap-1 transition-all duration-300 ${
          isExpanded ? 'max-h-[400px]' : 'max-h-9'
        } overflow-y-auto pr-1 hide-scrollbar`}
      >
        {shuffledPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onSelectPrompt(prompt)}
            className="px-2 py-1.5 bg-blue-100 border border-blue-300 rounded-full text-sm text-blue-800 hover:bg-blue-200 hover:text-blue-900 transition-colors flex items-center"
          >
            <PlusCircle size={14} className="mr-1.5 flex-shrink-0" />
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickPrompts;