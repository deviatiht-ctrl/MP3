/**
 * MP3 - Supabase Client
 * Initializes Supabase connection for all pages
 */

// Supabase configuration - Replace with your actual credentials
const SUPABASE_URL = 'https://mdsozxohqoydegqyimrl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kc296eG9ocW95ZGVncXlpbXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3Nzc3OTUsImV4cCI6MjA5MzM1Mzc5NX0.Dxbv4uQJGGSkeDwWX6GPNymwwBfsQVukDZdHl3LTKwU';

// Initialize Supabase client
let db;

document.addEventListener('DOMContentLoaded', () => {
  // Check if Supabase library is loaded
  if (typeof supabase === 'undefined') {
    console.error('Supabase library not loaded. Please check your CDN script.');
    window.supabaseInitFailed = true;
    return;
  }
  
  // Create Supabase client
  try {
    db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.db = db;
    
    // Dispatch event to notify other scripts
    window.dispatchEvent(new CustomEvent('supabaseReady', { detail: db }));
    
    console.log('Supabase client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    window.supabaseInitFailed = true;
  }
});

// Helper function to wait for Supabase to be ready
async function waitForSupabase() {
  if (window.db) return window.db;
  if (window.supabaseInitFailed) return null;
  
  return new Promise((resolve) => {
    // Timeout of 2 seconds to prevent hanging if Supabase library fails to load
    const timeout = setTimeout(() => {
      console.warn('Supabase initialization timed out. Using offline fallback.');
      resolve(null);
    }, 2000);

    window.addEventListener('supabaseReady', (e) => {
      clearTimeout(timeout);
      resolve(e.detail);
    }, { once: true });
  });
}

// Generic error handler with Haitian Creole messages
function handleDbError(error, context = '') {
  console.error(`Database error${context ? ` in ${context}` : ''}:`, error);
  
  const messages = {
    network: 'Pwoblèm koneksyon. Tanpri eseye ankò.',
    auth: 'Sesyon ou a ekspire. Tanpri konekte ankò.',
    not_found: 'Enfòmasyon sa a pa disponib.',
    conflict: 'Enfòmasyon sa a egziste deja.',
    default: 'Yon erè fèt. Tanpri eseye ankò.'
  };
  
  let message = messages.default;
  
  if (error.message?.includes('network')) {
    message = messages.network;
  } else if (error.message?.includes('JWT') || error.message?.includes('auth')) {
    message = messages.auth;
  } else if (error.code === 'PGRST116') {
    message = messages.not_found;
  } else if (error.code === '23505') {
    message = messages.conflict;
  }
  
  return message;
}

// Export for use in other modules
window.waitForSupabase = waitForSupabase;
window.handleDbError = handleDbError;
