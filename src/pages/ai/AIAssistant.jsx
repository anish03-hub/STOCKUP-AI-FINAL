import React, { useState, useRef, useEffect } from 'react';
import { FiMessageSquare, FiPaperclip, FiSend, FiTrash2 } from 'react-icons/fi';
import { TbRobot } from 'react-icons/tb';
import { BsStars } from 'react-icons/bs';
import ChatMessage from '../../components/ai/ChatMessage';
import TypingIndicator from '../../components/ai/TypingIndicator';
import SuggestedQuestions from '../../components/ai/SuggestedQuestions';
import { aiApi } from '../../services/api';
import '../../styles/ai/ai.css';

const AIAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(null); // null=checking, true=ok, false=error
  const messagesEndRef = useRef(null);

  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem('stockup_ai_chats');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentChatId, setCurrentChatId] = useState(Date.now());

  // Check backend health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const healthy = await aiApi.health();
        setIsConnected(healthy);
      } catch {
        setIsConnected(false);
      }
    };
    checkHealth();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (messages.length === 0) return;

    setConversations(prev => {
      const existingIdx = prev.findIndex(c => c.id === currentChatId);
      const firstUserMsg = messages.find(m => m.role === 'user');
      const fallbackTitle = firstUserMsg ? (firstUserMsg.content.length > 30 ? firstUserMsg.content.substring(0, 30) + '...' : firstUserMsg.content) : 'New Chat';
      const title = prev[existingIdx]?.title || fallbackTitle;

      const updatedChat = {
        id: currentChatId,
        title: title,
        messages: messages,
        updatedAt: new Date().toISOString()
      };

      let newConversations;
      if (existingIdx >= 0) {
        newConversations = [...prev];
        newConversations[existingIdx] = updatedChat;
      } else {
        newConversations = [updatedChat, ...prev];
      }

      localStorage.setItem('stockup_ai_chats', JSON.stringify(newConversations));
      return newConversations;
    });
  }, [messages, currentChatId]);

  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(Date.now());
  };

  // Build the conversation history from messages state (for context window)
  const buildHistory = (msgs) => {
    return msgs.map(m => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.content,
    }));
  };

  const handleSend = async (text) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const newUserMsg = {
      id: Date.now(),
      role: 'user',
      content: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    try {
      const data = await aiApi.chat(messageText);

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'ai',
          content: data.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          model: data.intent ? `StockUp ${data.intent} Engine` : "StockUp AI Data Engine",
        },
      ]);
    } catch (err) {
      let errorMsg = `❌ **Error:** ${err.message}`;

      if (isConnected === false) {
        errorMsg = '⚠️ **StockUp Backend is not running.** Please ensure your Spring Boot server is started on port 8080.';
      }

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'ai',
          content: errorMsg,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="ai-page">
      <div className="ai-sidebar">
        <div className="ai-sidebar-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ marginBottom: 0 }}>Recent Conversations</h3>
            <button onClick={startNewChat} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
              + New
            </button>
          </div>
          {conversations.length === 0 && <div style={{ fontSize: '13px', color: '#94a3b8', padding: '8px' }}>No recent chats.</div>}
          {conversations.map(conv => (
            <div
              key={conv.id}
              className={`history-item ${conv.id === currentChatId ? 'active' : ''}`}
              onClick={() => {
                setCurrentChatId(conv.id);
                setMessages(conv.messages);
              }}
              style={{
                background: conv.id === currentChatId ? '#eff6ff' : 'transparent',
                color: conv.id === currentChatId ? '#2563eb' : '#64748b',
                cursor: 'pointer'
              }}
            >
              <FiMessageSquare style={{ minWidth: '16px' }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.title}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="ai-main">
        <div className="ai-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2>StockUp AI Assistant</h2>
            {/* Connection status badge */}
            {isConnected === true && (
              <span style={{ fontSize: '12px', background: '#dcfce7', color: '#16a34a', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>
                ● Connected to StockUp Data
              </span>
            )}
            {isConnected === false && (
              <span style={{ fontSize: '12px', background: '#fee2e2', color: '#dc2626', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>
                ● Backend Offline
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {messages.length > 0 && (
              <button
                onClick={startNewChat}
                title="Clear chat"
                style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#6b7280', fontSize: '13px' }}
              >
                <FiTrash2 size={14} /> Clear
              </button>
            )}
          </div>
        </div>

        {isConnected === false && (
          <div style={{ margin: '0 20px 12px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', padding: '14px 18px', fontSize: '14px', color: '#92400e' }}>
            <strong>⚠️ Spring Boot backend is not running on port 8080.</strong> Please ensure the server is started:
            <code style={{ display: 'block', marginTop: '6px', background: '#1f2937', color: '#f9fafb', padding: '8px 12px', borderRadius: '8px' }}>
              mvn spring-boot:run
            </code>
          </div>
        )}

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="welcome-state">
              <TbRobot className="welcome-icon" />
              <h2>Hello! I'm your Inventory AI Assistant.</h2>
              <p>Ask me about demand forecasts, stock levels, or reorder recommendations.</p>
              <SuggestedQuestions onSelect={(q) => handleSend(q)} />
            </div>
          ) : (
            <>
              {messages.map(msg => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {isTyping && <TypingIndicator />}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-container">
          <div className="chat-input-bar">
            <button className="btn-attach" title="Attach file">
              <FiPaperclip />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about inventory, forecasts, or trends..."
              rows={1}
            />
            <button
              className="btn-send"
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
            >
              <FiSend />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
