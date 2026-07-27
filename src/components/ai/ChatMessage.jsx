import React from 'react';
import { TbRobot } from 'react-icons/tb';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '../../styles/ai/ai.css';

const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`message-wrapper ${isUser ? 'user' : 'ai'}`}>
      {!isUser && (
        <div className="ai-avatar">
          <TbRobot />
        </div>
      )}
      <div className="message-content">
        <div className="message-bubble">
          {isUser ? (
            message.content
          ) : (
            <div className="markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
          
          {message.cards && message.cards.map((card, idx) => (
            <div key={idx} className="ai-recommendation-card">
              <h4>{card.title}</h4>
              <p>{card.content}</p>
            </div>
          ))}
          
          <span className="message-time">{message.timestamp}</span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
