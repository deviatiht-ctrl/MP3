/**
 * MP3 - Authentication Module
 * Handles login, logout, session management, and admin checks
 */

const Auth = {
  currentUser: null,
  isAdmin: false,

  /**
   * Initialize auth state
   */
  async init() {
    const db = await waitForSupabase();
    if (!db) return;

    try {
      const { data: { user }, error } = await db.auth.getUser();
      
      if (error) throw error;
      
      if (user) {
        this.currentUser = user;
        this.isAdmin = await this.checkAdmin(user.email);
        
        // Dispatch auth state change event
        window.dispatchEvent(new CustomEvent('authStateChanged', {
          detail: { user, isAdmin: this.isAdmin }
        }));
      }
    } catch (error) {
      if (error.name !== 'AuthSessionMissingError') {
        console.error('Auth init error:', error);
      }
    }
  },

  /**
   * Check if email is in admin list
   */
  async checkAdmin(email) {
    if (!email) return false;
    
    const db = window.db;
    if (!db) return false;

    try {
      const { data, error } = await db
        .from('mp3_admins')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      
      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Admin check error:', error);
      return false;
    }
  },

  /**
   * Get current user
   */
  async getCurrentUser() {
    const db = await waitForSupabase();
    if (!db) return null;

    try {
      const { data: { user }, error } = await db.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      if (error.name !== 'AuthSessionMissingError') {
        console.error('Get user error:', error);
      }
      return null;
    }
  },

  /**
   * Get relative path to login page based on current location
   */
  _loginPath() {
    const p = window.location.pathname;
    if (p.includes('/admin/')) return '../pages/login.html';
    if (p.includes('/pages/')) return 'login.html';
    return 'pages/login.html';
  },

  /**
   * Require authentication - redirect if not logged in
   */
  async requireAuth() {
    const user = await this.getCurrentUser();
    if (!user) {
      window.location.href = this._loginPath() + '?redirect=' + encodeURIComponent(window.location.href);
      return false;
    }
    return true;
  },

  /**
   * Require admin access - redirect if not admin
   */
  async requireAdmin() {
    const user = await this.getCurrentUser();
    if (!user) {
      window.location.href = this._loginPath() + '?redirect=' + encodeURIComponent(window.location.href);
      return false;
    }

    const isAdmin = await this.checkAdmin(user.email);
    if (!isAdmin) {
      alert('Ou pa gen aksè administratè.');
      const p = window.location.pathname;
      window.location.href = p.includes('/admin/') ? '../index.html' : (p.includes('/pages/') ? '../index.html' : 'index.html');
      return false;
    }
    return true;
  },

  /**
   * Sign in with email/password
   */
  async signIn(email, password) {
    const db = await waitForSupabase();
    if (!db) {
      return { error: { message: 'Sistèm pa disponib' } };
    }

    try {
      const { data, error } = await db.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      this.currentUser = data.user;
      this.isAdmin = await this.checkAdmin(data.user.email);

      window.dispatchEvent(new CustomEvent('authStateChanged', {
        detail: { user: data.user, isAdmin: this.isAdmin }
      }));

      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
  },

  /**
   * Sign up new user
   */
  async signUp(email, password, metadata = {}) {
    const db = await waitForSupabase();
    if (!db) {
      return { error: { message: 'Sistèm pa disponib' } };
    }

    try {
      const { data, error } = await db.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    }
  },

  /**
   * Sign out
   */
  async signOut() {
    const db = await waitForSupabase();
    if (!db) return;

    try {
      await db.auth.signOut();
      this.currentUser = null;
      this.isAdmin = false;

      window.dispatchEvent(new CustomEvent('authStateChanged', {
        detail: { user: null, isAdmin: false }
      }));

      const p = window.location.pathname;
      window.location.href = p.includes('/admin/') ? '../index.html' : (p.includes('/pages/') ? '../index.html' : 'index.html');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  },

  /**
   * Reset password
   */
  async resetPassword(email) {
    const db = await waitForSupabase();
    if (!db) {
      return { error: { message: 'Sistèm pa disponib' } };
    }

    try {
      const { data, error } = await db.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/pages/reset-password.html'
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { data: null, error };
    }
  },

  /**
   * Update password
   */
  async updatePassword(newPassword) {
    const db = await waitForSupabase();
    if (!db) {
      return { error: { message: 'Sistèm pa disponib' } };
    }

    try {
      const { data, error } = await db.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Update password error:', error);
      return { data: null, error };
    }
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
});

// Expose to window
window.Auth = Auth;
