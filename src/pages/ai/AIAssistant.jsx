import React, { useState, useRef, useEffect } from 'react';
import { 
  FiMessageSquare, FiPaperclip, FiSend, FiTrash2, FiFileText, 
  FiUploadCloud
} from 'react-icons/fi';
import { TbRobot } from 'react-icons/tb';
import ChatMessage from '../../components/ai/ChatMessage';
import TypingIndicator from '../../components/ai/TypingIndicator';
import SuggestedQuestions from '../../components/ai/SuggestedQuestions';
import DocumentUploadArea from '../../components/ai/DocumentUploadArea';
import DocumentAnalysisPreview from '../../components/ai/DocumentAnalysisPreview';
import RecentDocumentsList from '../../components/ai/RecentDocumentsList';
import { aiApi } from '../../services/api';
import '../../styles/ai/ai.css';

const AIAssistant = () => {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'documents'
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(null); // null=checking, true=ok, false=error
  const messagesEndRef = useRef(null);

  // Document processing states
  const [activeAnalysis, setActiveAnalysis] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docsRefreshTrigger, setDocsRefreshTrigger] = useState(0);

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
    if (activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, isTyping, activeTab]);

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
    setActiveAnalysis(null);
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

  const handleAnalysisComplete = (analysisResult) => {
    setActiveAnalysis(analysisResult);
    setShowUploadModal(false);
    setDocsRefreshTrigger(prev => prev + 1);

    // Also inject conversational summary into chat
    const itemsCount = analysisResult.items ? analysisResult.items.length : 0;
    const docType = analysisResult.documentType ? analysisResult.documentType.replace('_', ' ') : 'Document';
    const supplier = analysisResult.detectedSupplier ? ` from **${analysisResult.detectedSupplier}**` : '';
    const invoiceNo = analysisResult.detectedInvoiceNumber ? ` (Invoice: \`${analysisResult.detectedInvoiceNumber}\`)` : '';
    
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        role: 'ai',
        content: `📄 **Document Extracted Successfully:** I have parsed **${analysisResult.fileName}** (${docType}${supplier}${invoiceNo}).\n\nFound **${itemsCount} line items**. You can inspect the live inventory diff and confirm the database update.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: "StockUp AI Document Engine",
      }
    ]);
  };

  const handleDocumentApplied = (applyResult) => {
    setDocsRefreshTrigger(prev => prev + 1);
    
    // Inject confirmation into chat
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        role: 'ai',
        content: `✅ **Document Applied to Inventory:** ${applyResult.message}\n\n- **Items Created:** ${applyResult.itemsCreated || 0}\n- **Items Updated:** ${applyResult.itemsUpdated || 0}\n- **Stock Changes Applied:** ${applyResult.stockDeltasApplied || 0}\n- **Sales/PO Transactions:** ${(applyResult.salesTransactionsCreated || 0) + (applyResult.purchaseOrdersCreated || 0)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: "StockUp AI Data Sync",
      }
    ]);
  };

  return (
    <div className="ai-page">
      {/* Sidebar Navigation */}
      <div className="ai-sidebar">
        {/* Tab Selector */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('chat')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: activeTab === 'chat' ? '1px solid #3b82f6' : '1px solid var(--border, #cbd5e1)',
              background: activeTab === 'chat' ? '#eff6ff' : 'transparent',
              color: activeTab === 'chat' ? '#2563eb' : 'var(--text-secondary, #64748b)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <FiMessageSquare /> Chat
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: activeTab === 'documents' ? '1px solid #3b82f6' : '1px solid var(--border, #cbd5e1)',
              background: activeTab === 'documents' ? '#eff6ff' : 'transparent',
              color: activeTab === 'documents' ? '#2563eb' : 'var(--text-secondary, #64748b)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <FiFileText /> Documents
          </button>
        </div>

        {activeTab === 'chat' ? (
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
        ) : (
          <div className="ai-sidebar-section">
            <h3 style={{ marginBottom: '12px' }}>Document Tools</h3>
            <button
              onClick={() => {
                setActiveAnalysis(null);
                setShowUploadModal(true);
              }}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
              }}
            >
              <FiUploadCloud /> Upload New Document
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="ai-main">
        {/* Top Header */}
        <div className="ai-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2>{activeTab === 'chat' ? 'StockUp AI Assistant' : 'AI Document Intelligence & Processing'}</h2>
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
            {activeTab === 'chat' && (
              <button
                onClick={() => {
                  setActiveTab('documents');
                  setShowUploadModal(true);
                }}
                style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#2563eb',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                <FiUploadCloud /> Upload Document
              </button>
            )}
            {messages.length > 0 && activeTab === 'chat' && (
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
          <div style={{ margin: '16px 20px 0', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', padding: '14px 18px', fontSize: '14px', color: '#92400e' }}>
            <strong>⚠️ Spring Boot backend is not running on port 8080.</strong> Please ensure the server is started:
            <code style={{ display: 'block', marginTop: '6px', background: '#1f2937', color: '#f9fafb', padding: '8px 12px', borderRadius: '8px' }}>
              mvn spring-boot:run
            </code>
          </div>
        )}

        {/* Tab 1: Chat View */}
        {activeTab === 'chat' && (
          <>
            <div className="chat-messages">
              {/* Optional Inline Analysis Card if active */}
              {activeAnalysis && (
                <DocumentAnalysisPreview
                  analysis={activeAnalysis}
                  onApplied={handleDocumentApplied}
                  onDismiss={() => setActiveAnalysis(null)}
                />
              )}

              {messages.length === 0 && !activeAnalysis ? (
                <div className="welcome-state">
                  <TbRobot className="welcome-icon" />
                  <h2>Hello! I'm your Inventory AI Assistant.</h2>
                  <p>Ask me about demand forecasts, stock levels, reorder recommendations, or upload invoices & datasheets.</p>
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
                <button
                  className="btn-attach"
                  title="Upload Document (PDF / CSV)"
                  onClick={() => {
                    setActiveTab('documents');
                    setShowUploadModal(true);
                  }}
                >
                  <FiPaperclip />
                </button>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about inventory, forecasts, trends, or type 'process document'..."
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
          </>
        )}

        {/* Tab 2: Document Intelligence View */}
        {activeTab === 'documents' && (
          <div style={{ padding: '24px', overflowY: 'auto', flexGrow: 1 }}>
            {/* Active Analysis Preview if present */}
            {activeAnalysis ? (
              <DocumentAnalysisPreview
                analysis={activeAnalysis}
                onApplied={handleDocumentApplied}
                onDismiss={() => setActiveAnalysis(null)}
              />
            ) : showUploadModal ? (
              <DocumentUploadArea
                onAnalysisComplete={handleAnalysisComplete}
                onCancel={() => setShowUploadModal(false)}
              />
            ) : (
              <DocumentUploadArea
                onAnalysisComplete={handleAnalysisComplete}
              />
            )}

            {/* Recent Documents Table */}
            <RecentDocumentsList
              refreshTrigger={docsRefreshTrigger}
              onSelectDocument={(doc) => {
                setActiveAnalysis(doc);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;
