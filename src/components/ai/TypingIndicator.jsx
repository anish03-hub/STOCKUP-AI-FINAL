import React from 'react';
import { TbRobot } from 'react-icons/tb';
import '../../styles/ai/ai.css';

const TypingIndicator = () => {
  return (
    <div className="message-wrapper ai">
      <div className="ai-avatar">
        <TbRobot />
      </div>
      <div className="message-content">
        <div className="message-bubble" style={{ padding: '12px 16px' }}>
          <div className="typing-indicator">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
