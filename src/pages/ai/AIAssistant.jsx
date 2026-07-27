import React, { useState, useRef, useEffect } from 'react';
import { FiMessageSquare, FiPaperclip, FiSend, FiTrash2 } from 'react-icons/fi';
import { TbRobot } from 'react-icons/tb';
import { BsStars } from 'react-icons/bs';
import ChatMessage from '../../components/ai/ChatMessage';
import TypingIndicator from '../../components/ai/TypingIndicator';
import SuggestedQuestions from '../../components/ai/SuggestedQuestions';
import '../../styles/ai/ai.css';

const BACKEND_URL = 'http://localhost:8000';

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
        const res = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const data = await res.json();
          setIsConnected(true);
          // Warn if token isn't set
          if (!data.token_valid) {
            setMessages([{
              id: 1,
              role: 'ai',
              content: '⚠️ **HF Token not set.** Please add your Hugging Face token to `backend/.env` and restart the Python server.',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isError: true,
            }]);
          }
        } else {
          setIsConnected(false);
        }
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
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          history: buildHistory(messages), // send conversation history
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Backend error');
      }

      const data = await res.json();

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'ai',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          model: data.model,
        },
      ]);
    } catch (err) {
      let errorMsg = `❌ **Error:** ${err.message}`;

      if (isConnected === false) {
        errorMsg = '⚠️ **Backend not running.** Open your VS Code terminal and run this exact command:\n```bash\ncd /Users/anishkumarsah/Desktop/B-TECh && ./run-backend.sh\n```';
      } else if (err.message.toLowerCase().includes('401') || err.message.toLowerCase().includes('unauthorized') || err.message.toLowerCase().includes('invalid')) {
        errorMsg = '🔑 **Token Error — Your HF token is invalid or missing the right permissions.**\n\n**Fix it in 1 minute:**\n1. Go to 👉 https://huggingface.co/settings/tokens\n2. Click **"New token"** → set Type = **"Read"**\n3. Enable ✅ **"Make calls to the serverless Inference API"**\n4. Copy the token → paste into `backend/.env` as `HF_TOKEN=hf_xxx...`\n5. Restart the Python server';
      } else if (err.message.toLowerCase().includes('500')) {
        errorMsg = '⚠️ **All models failed.** Your token may not have Inference API permissions.\n\nPlease create a new token at https://huggingface.co/settings/tokens with **"Inference API"** access enabled.';
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
                ● Live
              </span>
            )}
            {isConnected === false && (
              <span style={{ fontSize: '12px', background: '#fee2e2', color: '#dc2626', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>
                ● Backend Offline
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="model-badge">
              <BsStars /> Qwen 2.5-72B via Hugging Face
            </div>
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
            <strong>⚠️ Python backend is not running.</strong> You must start it manually in your VS Code terminal:
            <code style={{ display: 'block', marginTop: '6px', background: '#1f2937', color: '#f9fafb', padding: '8px 12px', borderRadius: '8px' }}>
              cd /Users/anishkumarsah/Desktop/B-TECh && ./run-backend.sh
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
