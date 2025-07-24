import React from 'react';
import { Bot, Brain, FileText, Stethoscope, Users } from 'lucide-react';

export type Capability = 'general' | 'radiology' | 'lab' | 'engagement';

interface CapabilitySelectorProps {
  onSelectCapability: (capability: Capability) => void;
}

const CapabilitySelector: React.FC<CapabilitySelectorProps> = ({ onSelectCapability }) => {
  const capabilities = [
    {
      id: 'general' as Capability,
      title: 'General Assistance',
      description: 'Get comprehensive medical guidance, general health information, and treatment recommendations.',
      icon: Stethoscope,
      color: 'bg-blue-500 hover:bg-blue-600',
      cardHover: 'hover:border-blue-300 hover:shadow-blue-100',
      textHover: 'group-hover:text-blue-900',
      features: [
        'Differential diagnosis support',
        'Treatment recommendations',
        'Drug dosages',
        'Clinical decision',
        'Consultation support' 
      ]
    },
    {
      id: 'radiology' as Capability,
      title: 'Radiology Assistance',
      description: 'Specialized support for medical imaging interpretation, radiological findings analysis.',
      icon: Brain,
      color: 'bg-purple-500 hover:bg-purple-600',
      cardHover: 'hover:border-purple-300 hover:shadow-purple-100',
      textHover: 'group-hover:text-purple-900',
      features: [
        'Medical image interpretation',
        'Radiological findings analysis',
        'Imaging technique recommendations',
        'Differential diagnosis from imaging',
        'Follow-up imaging suggestions'
      ]
    },
    {
      id: 'lab' as Capability,
      title: 'Lab Report Interpretation',
      description: 'Expert analysis of laboratory results, clinical correlation, further testing and follow-up.',
      icon: FileText,
      color: 'bg-green-500 hover:bg-green-600',
      cardHover: 'hover:border-green-300 hover:shadow-green-100',
      textHover: 'group-hover:text-green-900',
      features: [
        'Lab result interpretation',
        'Critical value alerts',
        'Clinical correlation guidance',
        'Follow-up testing recommendations',
        'Reference range analysis'
      ]
    },
         {
       id: 'engagement' as Capability,
       title: 'Patient Engagement',
       description: 'Comprehensive support for patient communication and care coordination to enhance patient experience.',
       icon: Users,
       color: 'bg-orange-500 hover:bg-orange-600',
       cardHover: 'hover:border-orange-300 hover:shadow-orange-100',
       textHover: 'group-hover:text-orange-900',
       features: [
         'Patient education materials',
         'Treatment adherence support',
         'Care plan communication',
         'Follow-up coordination',
         'Patient satisfaction enhancement'
       ]
     }

  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-8 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full h-[99vh] mx-auto transform scale-x-100 scale-y-80 border border-gray-100">
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-4 mr-4 shadow-xl">
                <Stethoscope size={26} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">MedChat</h1>
            </div>
            <p className="text-gray-600 text-base">
              Select the specialized medical assistance mode that best fits your current needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {capabilities.map((capability) => {
              const IconComponent = capability.icon;
              return (
                <div
                  key={capability.id}
                  className={`bg-white border border-gray-200 rounded-2xl p-4 h-[295px] hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group hover:bg-gradient-to-br hover:from-white hover:to-gray-50 ${capability.cardHover} flex flex-col`}
                  onClick={() => onSelectCapability(capability.id)}
                >
                  <div className="text-center mb-3 flex-shrink-0">
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-2xl ${capability.color} text-white mb-3 group-hover:scale-110 transition-transform shadow-lg`}>
                      <IconComponent size={26} />
                    </div>
                    <h3 className={`text-lg font-semibold text-gray-800 mb-2 transition-colors ${capability.textHover}`}>
                      {capability.title}
                    </h3>
                    <p className="text-gray-600 text-xs leading-relaxed group-hover:text-gray-700 transition-colors">
                      {capability.description}
                    </p>
                  </div>

                  <div className="space-y-1.5 flex-grow">
                    <h4 className="font-medium text-gray-700 text-xs group-hover:text-gray-800 transition-colors">Key Features:</h4>
                    <ul className="space-y-0.5">
                      {capability.features.map((feature, index) => (
                        <li key={index} className="text-xs text-gray-600 flex items-center group-hover:text-gray-700 transition-colors">
                          <div className="w-1 h-1 bg-gray-400 rounded-full mr-2 flex-shrink-0 group-hover:bg-gray-500 transition-colors"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto pt-3">
                    <button className={`w-full px-3 py-2.5 rounded-xl text-white font-medium transition-colors text-sm ${capability.color}`}>
                      Select {capability.id === 'engagement' ? 'Engagement' : capability.title.split(' ')[0]} Mode
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

          <div className="mt-8 text-center px-8">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4"> 
              <div className="flex items-center justify-center mb-1">
                <Bot size={16} className="text-amber-600 mr-2" />
                <span className="font-medium text-amber-800 text-sm">Professional Use Only</span>
              </div>
              <p className="text-amber-700 text-xs">
                This AI assistant is designed for healthcare professionals to support clinical decision-making. 
                It is not a replacement for professional medical judgment or patient examination.
              </p>
            </div>
          </div>
        
      </div>
    </div>
  );
};

export default CapabilitySelector; 