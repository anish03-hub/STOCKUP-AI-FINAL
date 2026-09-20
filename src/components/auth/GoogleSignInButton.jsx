import React, { useEffect, useRef, useState } from 'react';
import { FcGoogle } from 'react-icons/fc';

const GoogleSignInButton = ({ onSuccess, onError, disabled = false, text = 'Continue with Google' }) => {
  const buttonRef = useRef(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [googleAvailable, setGoogleAvailable] = useState(false);

  useEffect(() => {
    const exists = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
    const hasLength = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').length > 0;
    console.log(`[GoogleSignInButton] VITE_GOOGLE_CLIENT_ID exists: ${exists}, length > 0: ${hasLength}`);
  }, []);

  useEffect(() => {
    // If gsi/client is already loaded
    if (window.google?.accounts?.id) {
      setScriptLoaded(true);
      return;
    }

    const scriptId = 'google-gsi-client';
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => setScriptLoaded(true);
      script.onerror = () => {
        console.warn('Google Identity Services SDK failed to load.');
      };
      document.head.appendChild(script);
    } else {
      setScriptLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !window.google?.accounts?.id || !clientId) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response && response.credential) {
            onSuccess(response.credential);
          } else if (onError) {
            onError('Google Sign-In returned no credential.');
          }
        },
      });

      if (buttonRef.current) {
        buttonRef.current.innerHTML = ''; // clear previous render
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: '100%',
        });
        setGoogleAvailable(true);
      }
    } catch (err) {
      console.warn('Failed to initialize Google Sign In button:', err);
    }
  }, [scriptLoaded, clientId, onSuccess, onError]);

  // Fallback custom button when VITE_GOOGLE_CLIENT_ID is not configured or while loading
  const handleFallbackClick = () => {
    if (!clientId) {
      if (onError) {
        onError('Google Client ID is missing. Please set VITE_GOOGLE_CLIENT_ID in your environment.');
      } else {
        alert('VITE_GOOGLE_CLIENT_ID is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.');
      }
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() && onError) {
          onError('Google Sign-In prompt suppressed. Please use Google button.');
        }
      });
    }
  };

  return (
    <div className="google-auth-container" style={{ width: '100%', marginBottom: '16px' }}>
      {/* Hidden container for Google rendered button if client_id exists */}
      <div 
        ref={buttonRef} 
        style={{ display: googleAvailable && clientId ? 'block' : 'none', width: '100%' }} 
      />

      {/* Visible styled button when Google GSI button isn't rendered or fallback */}
      {(!googleAvailable || !clientId) && (
        <button
          type="button"
          className="google-custom-auth-btn"
          onClick={handleFallbackClick}
          disabled={disabled}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            width: '100%',
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid var(--border-color, #cbd5e1)',
            background: 'var(--surface, #ffffff)',
            color: 'var(--text-primary, #0f172a)',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s, border-color 0.2s, box-shadow 0.2s',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}
        >
          <FcGoogle style={{ fontSize: '1.25rem', flexShrink: 0 }} />
          <span>{text}</span>
        </button>
      )}
    </div>
  );
};

export default GoogleSignInButton;
