/**
 * MP3 - Navbar Module
 * Handles navbar behavior, auth state, admin button visibility
 */

const Navbar = {
  settings: null,

  /**
   * Initialize navbar
   */
  async init() {
    await this.loadSettings();
    this.setupScrollBehavior();
    this.setupMobileNav();
    this.updateAuthState();
    
    // Listen for auth state changes
    window.addEventListener('authStateChanged', (e) => {
      this.updateAuthUI(e.detail.user, e.detail.isAdmin);
    });
  },

  /**
   * Load site settings
   */
  async loadSettings() {
    try {
      const db = await waitForSupabase();
      if (!db) return;

      const { data, error } = await db
        .from('mp3_settings')
        .select('*')
        .single();

      if (error) throw error;
      
      this.settings = data;
      this.updateNavbarContent();
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  },

  /**
   * Update navbar with settings
   */
  updateNavbarContent() {
    if (!this.settings) return;

    // Update logo
    const logoEl = document.querySelector('.navbar-logo');
    if (logoEl && this.settings.logo_url) {
      logoEl.src = this.settings.logo_url;
    }

    // Update party name
    const nameEl = document.querySelector('.navbar-party-name');
    if (nameEl && this.settings.party_name) {
      nameEl.textContent = this.settings.party_name;
    }
  },

  /**
   * Setup scroll behavior for navbar
   */
  setupScrollBehavior() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;
      
      // Add/remove scrolled class
      if (currentScroll > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
      
      lastScroll = currentScroll;
    }, { passive: true });
  },

  /**
   * Setup mobile navigation
   */
  setupMobileNav() {
    const mobileNav = document.querySelector('.mobile-nav');
    if (!mobileNav) return;

    // Highlight active tab based on current page
    const currentPath = window.location.pathname;
    const navItems = mobileNav.querySelectorAll('.mobile-nav-item');
    
    navItems.forEach(item => {
      const href = item.getAttribute('href');
      if (href && currentPath.includes(href.replace('../', '/').replace('./', ''))) {
        item.classList.add('active');
      }
    });
  },

  /**
   * Update auth state in navbar
   */
  async updateAuthState() {
    try {
      const user = await Auth.getCurrentUser();
      if (user) {
        const isAdmin = await Auth.checkAdmin(user.email);
        this.updateAuthUI(user, isAdmin);
      }
    } catch (error) {
      console.error('Error updating auth state:', error);
    }
  },

  /**
   * Update auth UI (login/profile button, admin button)
   */
  updateAuthUI(user, isAdmin) {
    const authBtn = document.querySelector('#authBtn');
    const adminBtn = document.querySelector('#adminBtn');
    const isRoot = !window.location.pathname.includes('/pages/');
    const membrePath = isRoot ? 'pages/membre.html' : 'membre.html';
    const loginPath = isRoot ? 'pages/login.html' : 'login.html';
    const adminPath = isRoot ? 'admin/index.html' : '../admin/index.html';

    if (user) {
      if (authBtn) {
        const initial = user.email.charAt(0).toUpperCase();
        authBtn.innerHTML = `<span style="width:28px;height:28px;border-radius:50%;background:var(--clr-gold);color:var(--clr-black);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;">${initial}</span>`;
        authBtn.title = user.email;
        authBtn.onclick = () => window.location.href = membrePath;
      }
      if (isAdmin && adminBtn) {
        adminBtn.style.display = 'flex';
        adminBtn.onclick = () => window.location.href = adminPath;
      } else if (adminBtn) {
        adminBtn.style.display = 'none';
      }
    } else {
      if (authBtn) {
        authBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>`;
        authBtn.title = 'Konekte';
        authBtn.onclick = () => window.location.href = loginPath;
      }
      if (adminBtn) adminBtn.style.display = 'none';
    }

    // Re-render Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  },

  /**
   * Highlight current nav item
   */
  highlightCurrentNav() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href) {
        const normalizedHref = href.replace('../', '/').replace('./', '/');
        if (currentPath.includes(normalizedHref) || 
            (normalizedHref === '/' && currentPath === '/') ||
            (normalizedHref === '/index.html' && (currentPath === '/' || currentPath === '/index.html'))) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      }
    });
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  Navbar.init();
  Navbar.highlightCurrentNav();
});

// Expose to window
window.Navbar = Navbar;
