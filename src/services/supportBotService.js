/**
 * StockUp AI — Support Assistant Service
 * 
 * Provides guided conversation flows, intent matching, and response generation
 * for unauthenticated users on the login page.
 * 
 * Architecture allows seamless replacement with `POST /api/support/chat` in the future.
 */

export const INITIAL_GREETING = {
  id: 'init-greeting',
  sender: 'bot',
  text: `Hi there! 👋\n\nI'm your StockUp AI Assistant.\n\nI can help you with login, password reset, account setup, inventory questions, technical issues, and more.\n\nWhat would you like help with today?`,
  options: [
    { label: "🔐 I can't login", value: 'cant_login' },
    { label: "🔑 I forgot my password", value: 'forgot_password' },
    { label: "👤 Account / Registration help", value: 'account_help' },
    { label: "💊 Inventory or product issue", value: 'inventory_issue' },
    { label: "⚙️ Technical issue", value: 'technical_issue' },
    { label: "💬 Something else", value: 'something_else' }
  ]
};

export const supportBotService = {
  /**
   * Process option click selection
   */
  handleOptionSelect: async (optionValue) => {
    // Simulate natural AI thinking delay
    await new Promise(res => setTimeout(res, 400));

    switch (optionValue) {
      case 'cant_login':
        return {
          id: Date.now().toString(),
          sender: 'bot',
          text: `I can help you troubleshoot your login.\n\nWhich problem are you experiencing?`,
          options: [
            { label: 'Invalid email or password', value: 'invalid_credentials' },
            { label: "Google Sign-In isn't working", value: 'google_signin_issue' },
            { label: "Login button isn't working", value: 'login_button_issue' },
            { label: 'Something else', value: 'something_else' }
          ]
        };

      case 'invalid_credentials':
        return {
          id: Date.now().toString(),
          sender: 'bot',
          text: `Please check that:\n1. Your email address is correct.\n2. Your password is correct.\n3. Caps Lock is not enabled.\n\nIf you recently changed your password, try logging out and using your new password.\n\nIf you still cannot log in, tell me what error message you see.`,
          options: [
            { label: "🔑 I forgot my password", value: 'forgot_password' },
            { label: "Google Sign-In isn't working", value: 'google_signin_issue' },
            { label: '⬅️ Back to Main Options', value: 'main_menu' }
          ]
        };

      case 'google_signin_issue':
        return {
          id: Date.now().toString(),
          sender: 'bot',
          text: `If Google Sign-In isn't working, please check that:\n1. Pop-ups are allowed in your web browser.\n2. You are logged into an active Google account.\n3. No restrictive browser extensions are blocking OAuth.\n\nIf you registered with email and password, click 'Login' to sign in with your password instead.`,
          options: [
            { label: '👤 Account / Registration help', value: 'account_help' },
            { label: '⬅️ Back to Main Options', value: 'main_menu' }
          ]
        };

      case 'login_button_issue':
        return {
          id: Date.now().toString(),
          sender: 'bot',
          text: `If the Login button is not responding:\n1. Make sure both email and password fields are filled out.\n2. Verify that your internet connection is active.\n3. Try refreshing the page and submitting again.`,
          options: [
            { label: '⚙️ Technical issue', value: 'technical_issue' },
            { label: '⬅️ Back to Main Options', value: 'main_menu' }
          ]
        };

      case 'forgot_password':
        return {
          id: Date.now().toString(),
          sender: 'bot',
          text: `No problem. I can help you recover access to your account.\n\nDo you want to reset your password?`,
          options: [
            { label: 'Reset Password', value: 'confirm_reset_pw' },
            { label: 'Go Back', value: 'main_menu' }
          ]
        };

      case 'confirm_reset_pw':
        return {
          id: Date.now().toString(),
          sender: 'bot',
          text: `Password recovery is not currently available through this assistant. Please use the account recovery process when it is available.`,
          options: [
            { label: '⬅️ Back to Main Options', value: 'main_menu' }
          ]
        };

      case 'account_help':
        return {
          id: Date.now().toString(),
          sender: 'bot',
          text: `Here is how account setup and sign-in work on StockUp AI. What would you like to know?`,
          options: [
            { label: 'How do I create an account?', value: 'how_create_account' },
            { label: 'How does Google Sign-In work?', value: 'how_google_work' },
            { label: 'How do I set up my pharmacy/hospital?', value: 'how_setup_pharmacy' },
            { label: 'I already have an account', value: 'already_have_account' }
          ]
        };

      case 'how_create_account':
        return {
          id: Date.now().toString(),
          sender: 'bot',
          text: `New users can click 'Continue with Google' on the login screen. StockUp AI will automatically set up your account and prompt you for your pharmacy or hospital details.`,
          options: [
            { label: 'How do I set up my pharmacy/hospital?', value: 'how_setup_pharmacy' },
            { label: '⬅️ Back to Main Options', value: 'main_menu' }
          ]
        };

      case 'how_google_work':
        return {
          id: Date.now().toString(),
          sender: 'bot',
          text: `Google Sign-In allows you to sign in securely using your official Google credentials without creating or remembering a separate password.`,
          options: [
            { label: 'How do I create an account?', value: 'how_create_account' },
            { label: '⬅️ Back to Main Options', value: 'main_menu' }
          ]
        };

      case 'how_setup_pharmacy':
        return {
          id: Date.now().toString(),
          sender: 'bot',
          text: `When signing in with Google for the first time, StockUp AI will guide you through entering your Pharmacy or Hospital Name, Business Type, Phone, and Address.`,
          options: [
            { label: '⬅️ Back to Main Options', value: 'main_menu' }
          ]
        };

      case 'already_have_account':
        return {
          id: Date.now().toString(),
          sender: 'bot',
          text: `If you registered using Google, click 'Continue with Google'. If you registered using email and password, click 'Already have an account? Login' to enter your credentials.`,
          options: [
            { label: "🔐 I can't login", value: 'cant_login' },
            { label: '⬅️ Back to Main Options', value: 'main_menu' }
          ]
        };

      case 'inventory_issue':
        return {
          id: Date.now().toString(),
          sender: 'bot',
          text: `I can help with inventory questions. What specific issue are you experiencing?`,
          options: [
            { label: 'Medicine not showing', value: 'inv_sub_issue' },
            { label: 'Stock quantity problem', value: 'inv_sub_issue' },
            { label: 'Low-stock problem', value: 'inv_sub_issue' },
            { label: 'Expiry alert problem', value: 'inv_sub_issue' },
            { label: 'Other inventory issue', value: 'inv_sub_issue' }
          ]
        };

      case 'inv_sub_issue':
        return {
          id: Date.now().toString(),
          sender: 'bot',
          text: `Please log in first so I can securely access your StockUp AI account information.`,
          options: [
            { label: '⬅️ Back to Main Options', value: 'main_menu' }
          ]
        };

      case 'technical_issue':
        return {
          id: Date.now().toString(),
          sender: 'bot',
          text: `What technical issue are you experiencing?`,
          options: [
            { label: "Page isn't loading", value: 'tech_page_load' },
            { label: "Something isn't responding", value: 'tech_not_responding' },
            { label: 'Error message', value: 'tech_error_msg' },
            { label: 'Other technical problem', value: 'something_else' }
          ]
        };

      case 'tech_page_load':
        return {
          id: Date.now().toString(),
          sender: 'bot',
          text: `If pages are loading slowly or failing to open:\n1. Clear your web browser cache and cookies.\n2. Ensure your internet connection is active.\n3. Try using Google Chrome, Microsoft Edge, or Mozilla Firefox.`,
          options: [
            { label: '⬅️ Back to Main Options', value: 'main_menu' }
          ]
        };

      case 'tech_not_responding':
        return {
          id: Date.now().toString(),
          sender: 'bot',
          text: `If interactive buttons or forms aren't responding:\n1. Refresh the web page.\n2. Check if a browser extension or ad-blocker is interfering.\n3. Ensure JavaScript is enabled in your browser.`,
          options: [
            { label: '⬅️ Back to Main Options', value: 'main_menu' }
          ]
        };

      case 'tech_error_msg':
        return {
          id: Date.now().toString(),
          sender: 'bot',
          text: `If you see an error banner:\n• 'Invalid email or password' — Check your email & password spelling.\n• 'Google authentication failed' — Verify your internet connection and pop-up settings.\n• 'Unable to connect to backend' — The backend server may be undergoing maintenance. Try again in a few moments.`,
          options: [
            { label: '⬅️ Back to Main Options', value: 'main_menu' }
          ]
        };

      case 'something_else':
        return {
          id: Date.now().toString(),
          sender: 'bot',
          text: `Sure — tell me what you're having trouble with, and I'll do my best to help.`,
          focusInput: true
        };

      case 'main_menu':
      default:
        return {
          id: Date.now().toString(),
          sender: 'bot',
          text: `What else can I help you with today?`,
          options: INITIAL_GREETING.options
        };
    }
  },

  /**
   * Process custom user text input message
   */
  handleUserMessage: async (userText) => {
    await new Promise(res => setTimeout(res, 500));
    const lower = userText.toLowerCase().trim();

    if (lower.includes('login') || lower.includes('sign in') || lower.includes('signin') || lower.includes('log in')) {
      return {
        id: Date.now().toString(),
        sender: 'bot',
        text: `I can help with login issues. If you are having trouble signing in, check your email spelling and password, or use 'Continue with Google'.`,
        options: [
          { label: "🔐 I can't login", value: 'cant_login' },
          { label: "Google Sign-In isn't working", value: 'google_signin_issue' }
        ]
      };
    }

    if (lower.includes('password') || lower.includes('reset') || lower.includes('forgot')) {
      return {
        id: Date.now().toString(),
        sender: 'bot',
        text: `For password recovery and account access, I can guide you through the available options.`,
        options: [
          { label: "🔑 I forgot my password", value: 'forgot_password' }
        ]
      };
    }

    if (lower.includes('google')) {
      return {
        id: Date.now().toString(),
        sender: 'bot',
        text: `Google Sign-In allows single click authentication. New users are guided through pharmacy setup, and returning Google users sign in automatically.`,
        options: [
          { label: 'How does Google Sign-In work?', value: 'how_google_work' }
        ]
      };
    }

    if (lower.includes('inventory') || lower.includes('medicine') || lower.includes('stock') || lower.includes('expiry')) {
      return {
        id: Date.now().toString(),
        sender: 'bot',
        text: `Please log in first so I can securely access your StockUp AI account information.`,
        options: [
          { label: '⬅️ Back to Main Options', value: 'main_menu' }
        ]
      };
    }

    if (lower.includes('register') || lower.includes('create') || lower.includes('signup') || lower.includes('account')) {
      return {
        id: Date.now().toString(),
        sender: 'bot',
        text: `Creating an account is quick and easy. Click 'Continue with Google' to create your account and set up your hospital or pharmacy.`,
        options: [
          { label: 'How do I create an account?', value: 'how_create_account' }
        ]
      };
    }

    if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey')) {
      return {
        id: Date.now().toString(),
        sender: 'bot',
        text: `Hello! 👋 How can I assist you with StockUp AI today?`,
        options: INITIAL_GREETING.options
      };
    }

    if (lower.includes('thank') || lower.includes('thanks')) {
      return {
        id: Date.now().toString(),
        sender: 'bot',
        text: `You're very welcome! Feel free to ask if you need any more assistance with StockUp AI.`,
        options: [
          { label: '⬅️ Back to Main Options', value: 'main_menu' }
        ]
      };
    }

    // Default intelligent fallback
    return {
      id: Date.now().toString(),
      sender: 'bot',
      text: `I understand you're asking about "${userText}". Here are the common topics I can assist you with:`,
      options: INITIAL_GREETING.options
    };
  }
};
