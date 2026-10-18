import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FcGoogle } from 'react-icons/fc';

const GoogleSignInButton = ({ onSuccess, onError, disabled = false, text = 'Continue with Google' }) => {
  const buttonRef = useRef(null);
  const containerRef = useRef(null);
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

  const getContainerWidth = useCallback(() => {
    if (containerRef.current) {
      const w = containerRef.current.clientWidth || containerRef.current.offsetWidth;
      if (w > 0) {
        // Google Identity Services renderButton requires pixel width in [200, 400]
        return Math.min(400, Math.max(200, Math.floor(w)));
      }
    }
    return 344; // Default to standard auth-card inner content width
  }, []);

  const renderGoogleButton = useCallback(() => {
    if (!buttonRef.current || !window.google?.accounts?.id || !clientId) {
      return;
    }

    const targetWidth = getContainerWidth();
    buttonRef.current.innerHTML = ''; // clear previous render
    window.google.accounts.id.renderButton(buttonRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'center',
      width: targetWidth,
    });
    setGoogleAvailable(true);
  }, [clientId, getContainerWidth]);

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

      renderGoogleButton();
    } catch (err) {
      console.warn('Failed to initialize Google Sign In button:', err);
    }
  }, [scriptLoaded, clientId, onSuccess, onError, renderGoogleButton]);

  // Handle responsive resizing so Google button adapts width to card
  useEffect(() => {
    if (!containerRef.current || !window.google?.accounts?.id || !clientId || !scriptLoaded) {
      return;
    }

    let timeoutId;
    let lastWidth = getContainerWidth();

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const currentWidth = getContainerWidth();
        if (Math.abs(currentWidth - lastWidth) > 8) {
          lastWidth = currentWidth;
          renderGoogleButton();
        }
      }, 150);
    };

    window.addEventListener('resize', handleResize);

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      clearTimeout(timeoutId);
    };
  }, [scriptLoaded, clientId, renderGoogleButton, getContainerWidth]);

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
    <div ref={containerRef} className="google-auth-container">
      {/* Container for Google rendered button if client_id exists */}
      <div
        ref={buttonRef}
        className="google-rendered-button"
        style={{
          display: googleAvailable && clientId ? 'flex' : 'none',
          justifyContent: 'center',
          width: '100%',
          minHeight: '44px'
        }}
      />

      {/* Visible styled button when Google GSI button isn't rendered or fallback */}
      {(!googleAvailable || !clientId) && (
        <button
          type="button"
          className="google-custom-auth-btn"
          onClick={handleFallbackClick}
          disabled={disabled}
        >
          <FcGoogle className="google-btn-icon" />
          <span>{text}</span>
        </button>
      )}
    </div>
  );
};

export default GoogleSignInButton;
