import React, { useState, useEffect, useRef } from 'react';
import { 
  FiMessageCircle, 
  FiX, 
  FiMinus, 
  FiSend, 
  FiChevronRight,
  FiCpu,
  FiEye,
  FiEyeOff,
  FiCheckCircle
} from 'react-icons/fi';
import { supportBotService, INITIAL_GREETING } from '../../services/supportBotService';
import { authApi } from '../../services/api';
import './StockUpSupportBot.css';

const StockUpSupportBot = ({ onNavigateToLogin }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // State Machine for Password Recovery Flow:
  // 'IDLE' | 'ENTER_IDENTIFIER' | 'VERIFY_OTP' | 'NEW_PASSWORD' | 'RESET_SUCCESS'
  const [resetFlowState, setResetFlowState] = useState('IDLE');
  const [resetRequestId, setResetRequestId] = useState(null);
  const [resetToken, setResetToken] = useState(null);
  
  // Form Inputs
  const [otpInput, setOtpInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  
  const [resetError, setResetError] = useState('');
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen, resetFlowState, resetError]);

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle opening chatbot for the first time
  const handleToggleOpen = () => {
    if (!isOpen) {
      setIsOpen(true);
      if (!hasInitialized) {
        setMessages([INITIAL_GREETING]);
        setHasInitialized(true);
      }
    } else {
      setIsOpen(false);
    }
  };

  // Central Reset Function for Chatbot State Navigation
  const handleReturnToMainMenu = () => {
    if (resetRequestId || resetToken) {
      authApi.cancelPasswordReset(resetRequestId, resetToken);
    }

    setResetFlowState('IDLE');
    setResetRequestId(null);
    setResetToken(null);
    setOtpInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setResetError('');
    setIsSubmittingReset(false);
    setResendCooldown(0);
    setInputText('');

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'bot',
        text: `What else can I help you with today?`,
        options: INITIAL_GREETING.options
      }
    ]);
  };

  // Handle Quick Option Click
  const handleOptionClick = async (option) => {
    setResetError('');
    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: option.label
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    if (option.value === 'forgot_password') {
      setIsTyping(false);
      setResetFlowState('ENTER_IDENTIFIER');
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: `No problem. I can help you recover access to your account.\n\nPlease enter the email address or phone number registered with your StockUp AI account.`
        }
      ]);
      setTimeout(() => inputRef.current?.focus(), 100);
      return;
    }

    if (option.value === 'main_menu') {
      setIsTyping(false);
      handleReturnToMainMenu();
      return;
    }

    const botResponse = await supportBotService.handleOptionSelect(option.value);
    setIsTyping(false);
    setMessages((prev) => [...prev, botResponse]);

    if (botResponse.focusInput) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Handle Free-Form Text Submit
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText || !inputText.trim() || isTyping || isSubmittingReset) return;

    const userText = inputText.trim();
    setInputText('');

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // If waiting for email/phone identifier in password reset flow
    if (resetFlowState === 'ENTER_IDENTIFIER') {
      // Check if user entered phone number
      const isPhone = /^[\d\s+\-()]{7,15}$/.test(userText) && !userText.includes('@');
      if (isPhone) {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'bot',
            text: `Email verification is currently available. Phone verification will be available once SMS verification is configured.\n\nPlease enter your registered email address.`
          }
        ]);
        return;
      }

      try {
        const res = await authApi.requestPasswordReset(userText);
        setIsTyping(false);

        if (res.isGoogleOnly) {
          setResetFlowState('IDLE');
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              sender: 'bot',
              text: `This account uses Google Sign-In. You can continue with Google from the login page.`,
              options: [
                { label: '⬅️ Back to Main Options', value: 'main_menu' }
              ]
            }
          ]);
        } else {
          setResetRequestId(res.resetRequestId);
          setResetFlowState('VERIFY_OTP');
          setOtpInput('');
          setResetError('');
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              sender: 'bot',
              text: res.message || `If an account matches the information provided, a 6-digit verification code has been sent to your registered email.\n\nPlease enter the 6-digit verification code.`
            }
          ]);
        }
      } catch (err) {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'bot',
            text: err.message || `We couldn't request a password reset at this time. Please try again.`,
            options: [{ label: '⬅️ Try Again', value: 'forgot_password' }]
          }
        ]);
      }
      return;
    }

    // Standard conversational handling
    const botResponse = await supportBotService.handleUserMessage(userText);
    setIsTyping(false);
    setMessages((prev) => [...prev, botResponse]);
  };

  // Handle Resend OTP Code
  const handleResendOtp = async () => {
    if (!resetRequestId || resendCooldown > 0) return;
    setIsSubmittingReset(true);
    setResetError('');

    try {
      const res = await authApi.resendPasswordResetOtp(resetRequestId);
      setResendCooldown(60);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: res.message || `A new verification code has been sent to your registered email.`
        }
      ]);
    } catch (err) {
      setResetError(err.message || 'Failed to resend code.');
    } finally {
      setIsSubmittingReset(false);
    }
  };

  // Handle Verify OTP Code Submit
  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otpInput || otpInput.trim().length !== 6 || isSubmittingReset) return;

    setIsSubmittingReset(true);
    setResetError('');

    try {
      const res = await authApi.verifyPasswordResetOtp(resetRequestId, otpInput.trim());
      setResetToken(res.resetToken);
      setResetFlowState('NEW_PASSWORD');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      setResetError('');

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: `Verification successful. 🔐\n\nPlease create a new password for your account.`
        }
      ]);
    } catch (err) {
      setResetError(err.message || 'That verification code is incorrect. Please try again.');
    } finally {
      setIsSubmittingReset(false);
    }
  };

  // Handle Complete Password Reset Submit
  const handleCompleteResetSubmit = async (e) => {
    e.preventDefault();
    setResetError('');

    if (!newPasswordInput) {
      setResetError('New password is required.');
      return;
    }

    if (newPasswordInput.length < 8) {
      setResetError('Password must be at least 8 characters long.');
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setResetError('Passwords do not match.');
      return;
    }

    setIsSubmittingReset(true);

    try {
      await authApi.completePasswordReset(resetToken, newPasswordInput);
      setResetFlowState('RESET_SUCCESS');
      setResetError('');

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: `Your password has been reset successfully. 🔐\n\nYou can now log in using your new password.`
        }
      ]);
    } catch (err) {
      setResetError(err.message || 'Failed to reset password.');
    } finally {
      setIsSubmittingReset(false);
    }
  };

  return (
    <>
      {/* ── 1. Floating Launcher Button ──────────────────────────────── */}
      {!isOpen && (
        <button
          type="button"
          className="support-bot-launcher"
          onClick={handleToggleOpen}
          aria-label="Open StockUp AI Assistant"
        >
          <FiMessageCircle />
          <span className="support-bot-status-dot" />
          <span className="support-bot-tooltip">Need help? Ask StockUp AI</span>
        </button>
      )}

      {/* ── 2. Interactive Chat Panel ────────────────────────────────── */}
      {isOpen && (
        <div 
          className="support-bot-panel" 
          role="dialog" 
          aria-label="StockUp AI Assistant Panel"
        >
          {/* Header */}
          <div className="support-bot-header">
            <div className="support-bot-header-info">
              <div className="support-bot-avatar">
                <FiCpu />
              </div>
              <div className="support-bot-header-text">
                <span className="support-bot-title">StockUp AI Assistant</span>
                <span className="support-bot-status">● Online</span>
              </div>
            </div>

            <div className="support-bot-controls">
              <button
                type="button"
                className="support-bot-control-btn"
                onClick={() => setIsOpen(false)}
                title="Minimize chat"
                aria-label="Minimize StockUp AI Assistant"
              >
                <FiMinus />
              </button>
              <button
                type="button"
                className="support-bot-control-btn"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                aria-label="Close StockUp AI Assistant"
              >
                <FiX />
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="support-bot-messages">
            {messages.map((msg, index) => {
              const isLastMessage = index === messages.length - 1;
              return (
                <div key={msg.id || index} className={`support-msg-row ${msg.sender}`}>
                  <div className="support-msg-bubble">
                    {msg.text}
                  </div>

                  {/* Render Option Buttons under Bot Message */}
                  {msg.sender === 'bot' && msg.options && isLastMessage && !isTyping && (
                    <div className="support-bot-options">
                      {msg.options.map((opt, optIdx) => (
                        <button
                          key={opt.value + optIdx}
                          type="button"
                          className="support-option-btn"
                          onClick={() => handleOptionClick(opt)}
                        >
                          <span>{opt.label}</span>
                          <FiChevronRight className="support-option-arrow" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Identifier Screen Back Option */}
            {resetFlowState === 'ENTER_IDENTIFIER' && !isTyping && (
              <div style={{ marginTop: '4px' }}>
                <button
                  type="button"
                  className="support-back-menu-btn"
                  onClick={handleReturnToMainMenu}
                >
                  ← Back to Main Options
                </button>
              </div>
            )}

            {/* OTP Verification Form */}
            {resetFlowState === 'VERIFY_OTP' && !isTyping && (
              <form onSubmit={handleVerifyOtpSubmit} className="support-inline-form">
                <div className="support-form-field">
                  <label className="support-form-label">6-Digit Verification Code</label>
                  <input
                    type="text"
                    className="support-form-input otp"
                    placeholder="------"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    autoFocus
                  />
                </div>

                {resetError && <div className="support-form-error">{resetError}</div>}

                <div className="support-form-actions">
                  <button 
                    type="submit" 
                    className="support-form-btn primary" 
                    disabled={isSubmittingReset || otpInput.trim().length !== 6}
                  >
                    {isSubmittingReset ? 'Verifying...' : 'Verify Code'}
                  </button>
                  <button 
                    type="button" 
                    className="support-form-btn secondary" 
                    onClick={handleResendOtp}
                    disabled={isSubmittingReset || resendCooldown > 0}
                  >
                    {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Code'}
                  </button>
                </div>

                <button
                  type="button"
                  className="support-back-menu-btn"
                  onClick={handleReturnToMainMenu}
                >
                  ← Back to Main Options
                </button>
              </form>
            )}

            {/* New Password Form */}
            {resetFlowState === 'NEW_PASSWORD' && !isTyping && (
              <form onSubmit={handleCompleteResetSubmit} className="support-inline-form">
                <div className="support-form-field">
                  <label className="support-form-label">New Password</label>
                  <div className="support-input-pwd-wrap">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      className="support-form-input"
                      placeholder="Min. 8 characters"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      autoFocus
                    />
                    <button 
                      type="button" 
                      className="support-pwd-toggle" 
                      onClick={() => setShowNewPw(!showNewPw)}
                      aria-label={showNewPw ? "Hide password" : "Show password"}
                    >
                      {showNewPw ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <div className="support-form-field">
                  <label className="support-form-label">Confirm New Password</label>
                  <div className="support-input-pwd-wrap">
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      className="support-form-input"
                      placeholder="Re-enter new password"
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    />
                    <button 
                      type="button" 
                      className="support-pwd-toggle" 
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      aria-label={showConfirmPw ? "Hide password" : "Show password"}
                    >
                      {showConfirmPw ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                {resetError && <div className="support-form-error">{resetError}</div>}

                <div className="support-form-actions">
                  <button 
                    type="submit" 
                    className="support-form-btn primary" 
                    disabled={isSubmittingReset}
                  >
                    {isSubmittingReset ? 'Resetting Password...' : 'Reset Password'}
                  </button>
                </div>

                <button
                  type="button"
                  className="support-back-menu-btn"
                  onClick={handleReturnToMainMenu}
                >
                  ← Back to Main Options
                </button>
              </form>
            )}

            {/* Reset Success Action Buttons */}
            {resetFlowState === 'RESET_SUCCESS' && (
              <div className="support-form-actions" style={{ flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="support-form-btn primary"
                  onClick={() => {
                    setIsOpen(false);
                    handleReturnToMainMenu();
                    onNavigateToLogin?.();
                  }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <FiCheckCircle />
                  <span>Go to Login</span>
                </button>

                <button
                  type="button"
                  className="support-back-menu-btn"
                  onClick={handleReturnToMainMenu}
                >
                  ← Back to Main Options
                </button>
              </div>
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="support-msg-row bot">
                <div className="support-bot-typing">
                  <span className="support-typing-dot" />
                  <span className="support-typing-dot" />
                  <span className="support-typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Panel Footer Input Form */}
          <div className="support-bot-footer">
            <form onSubmit={handleSendMessage} className="support-bot-input-form">
              <input
                ref={inputRef}
                type="text"
                className="support-bot-input"
                placeholder={resetFlowState === 'ENTER_IDENTIFIER' ? "Enter email or phone..." : "Type your question..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={resetFlowState === 'VERIFY_OTP' || resetFlowState === 'NEW_PASSWORD'}
              />
              <button
                type="submit"
                className="support-bot-send-btn"
                disabled={!inputText.trim() || isTyping || isSubmittingReset || resetFlowState === 'VERIFY_OTP' || resetFlowState === 'NEW_PASSWORD'}
                aria-label="Send Message"
              >
                <FiSend />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default StockUpSupportBot;
