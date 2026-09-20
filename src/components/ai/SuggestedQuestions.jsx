import React from 'react';
import '../../styles/ai/ai.css';

const questions = [
  'Do we have Humulin in stock?',
  'Who can supply Insulin?',
  'Which medicines are expiring soon?',
  'What items need immediate reorder?',
  'Give me an executive inventory summary',
  'What is the stock of NDC 0002-0213?'
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
