import React from 'react';
import '../../styles/ai/ai.css';

const questions = [
  'Why is Paracetamol demand increasing?',
  'Which medicines should I reorder?',
  'Generate inventory summary',
  'Show medicines expiring this week',
  'What is the demand forecast for Amoxicillin?'
];

const SuggestedQuestions = ({ onSelect }) => {
  return (
    <div className="suggested-questions">
      {questions.map((q, index) => (
        <button 
          key={index} 
          className="suggested-pill"
          onClick={() => onSelect(q)}
        >
          {q}
        </button>
      ))}
    </div>
  );
};

export default SuggestedQuestions;
