/**
 * MP3 - Member Dashboard
 * Member portal with profile, agenda, and messages
 */

const MembreDashboard = {
  member: null,
  rsvps: [],

  async init() {
    // Check authentication
    const isAuth = await Auth.requireAuth('/pages/login.html');
    if (!isAuth) return;

    await this.loadMemberData();
    this.setupNavigation();
    this.setupTabSwitching();
    this.setupLanguageSelector();

    // Show default tab
    this.showTab('home');
  },

  /**
   * Load member data
   */
  async loadMemberData() {
    try {
      const user = await Auth.getCurrentUser();
      if (!user) return;

      const db = await waitForSupabase();
      if (!db) return;

      // Get member record
      const { data, error } = await db
        .from('mp3_members')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        this.member = data;
        this.renderMemberCard();
        this.renderProfileTab();
        this.loadRSVPs();
      } else {
        // Check if user is admin
        const isAdmin = await Auth.checkAdmin(user.email);
        if (isAdmin) {
          window.location.href = '../admin/index.html';
          return;
        }
        // Redirect to registration if not a member yet
        window.location.href = 'devenir-membre.html';
      }
    } catch (error) {
      console.error('Error loading member data:', error);
    }
  },

  setupLanguageSelector() {
    const select = document.getElementById('languageSelect');
    if (select) {
      select.value = I18n.currentLang;
      select.addEventListener('change', (e) => {
        I18n.setLanguage(e.target.value);
      });
    }

    window.addEventListener('languageChanged', (e) => {
      if (select) select.value = e.detail.lang;
      this.renderMemberCard();
      this.renderProfileTab();
      this.renderAgendaTab();
      const activeItem = document.querySelector('.membre-nav-item.active');
      if (activeItem) {
        const tab = activeItem.getAttribute('data-tab');
        this.showTab(tab);
      }
    });
  },

  /**
   * Render member ID card
   */
  renderMemberCard() {
    const card = document.querySelector('.membre-id-card');
    if (!card || !this.member) return;

    const statusLabels = {
      pending: I18n.t('membre.status_labels.pending'),
      active: I18n.t('membre.status_labels.active'),
      inactive: I18n.t('membre.status_labels.inactive'),
      rejected: I18n.t('membre.status_labels.rejected')
    };

    const statusClass = this.member.status;

    card.querySelector('.membre-id-name').textContent = this.member.full_name;
    card.querySelector('.membre-id-code').textContent = this.member.member_code;
    
    if (this.member.photo_url) {
      card.querySelector('.membre-id-photo').src = this.member.photo_url;
    }

    const statusEl = card.querySelector('.membre-id-status');
    if (statusEl) {
      statusEl.textContent = statusLabels[this.member.status] || this.member.status;
      statusEl.className = `membre-id-status ${statusClass}`;
    }

    // Update meta
    const metaEl = card.querySelector('.membre-id-meta');
    if (metaEl) {
      metaEl.innerHTML = `
        <span><i data-lucide="map-pin" style="width: 12px; height: 12px;"></i> ${this.member.department || I18n.t('agenda.location_undefined')}</span>
        <span><i data-lucide="calendar" style="width: 12px; height: 12px;"></i> ${I18n.formatDate(this.member.created_at)}</span>
      `;
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  /**
   * Render profile tab
   */
  renderProfileTab() {
    if (!this.member) return;

    const grid = document.querySelector('.membre-profile-grid');
    if (!grid) return;

    const fields = [
      { label: I18n.t('membre.info_labels.full_name'), value: this.member.full_name },
      { label: I18n.t('membre.info_labels.date_of_birth'), value: I18n.formatDate(this.member.date_of_birth) },
      { label: I18n.t('membre.info_labels.nin'), value: this.member.nin || I18n.t('membership.select') },
      { label: I18n.t('membre.info_labels.department'), value: this.member.department || I18n.t('agenda.location_undefined') },
      { label: I18n.t('membre.info_labels.commune'), value: this.member.commune || I18n.t('agenda.location_undefined') },
      { label: I18n.t('membre.info_labels.address'), value: this.member.address || I18n.t('agenda.location_undefined'), fullWidth: true },
      { label: I18n.t('membre.info_labels.phone'), value: this.member.phone || I18n.t('agenda.location_undefined') },
      { label: I18n.t('membre.info_labels.email'), value: this.member.email }
    ];

    grid.innerHTML = fields.map(f => `
      <div class="membre-info-item ${f.fullWidth ? 'full-width' : ''}">
        <span class="membre-info-label">${f.label}</span>
        <span class="membre-info-value">${f.value}</span>
      </div>
    `).join('');
  },

  /**
   * Load member RSVPs
   */
  async loadRSVPs() {
    if (!this.member) return;

    try {
      const db = await waitForSupabase();
      if (!db) return;

      const { data, error } = await db
        .from('mp3_rsvps')
        .select(`
          *,
          event:mp3_agenda(*)
        `)
        .eq('user_id', this.member.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.rsvps = data || [];
      this.renderAgendaTab();
    } catch (error) {
      console.error('Error loading RSVPs:', error);
    }
  },

  /**
   * Render agenda tab with member's events
   */
  renderAgendaTab() {
    const list = document.querySelector('.membre-agenda-list');
    if (!list) return;

    if (this.rsvps.length === 0) {
      list.innerHTML = `<p class="text-muted" style="text-align: center; padding: var(--space-8);">${I18n.t('membre.no_events_registered')}</p>`;
      return;
    }

    const langLocales = {
      ht: 'fr-FR',
      fr: 'fr-FR',
      en: 'en-US',
      es: 'es-ES'
    };
    const currentLocale = langLocales[I18n.currentLang] || 'fr-FR';

    list.innerHTML = this.rsvps.map(rsvp => {
      const event = rsvp.event;
      if (!event) return '';

      const date = new Date(event.event_date);
      const isPast = date < new Date();

      return `
        <div class="membre-agenda-item ${isPast ? 'past' : ''}">
          <div class="membre-agenda-date">
            <span class="membre-agenda-day">${date.getDate()}</span>
            <span class="membre-agenda-month">${date.toLocaleString(currentLocale, { month: 'short' })}</span>
          </div>
          <div class="membre-agenda-info">
            <h4 class="membre-agenda-title">${event.title}</h4>
            <div class="membre-agenda-location">
              <i data-lucide="map-pin" style="width: 14px; height: 14px;"></i>
              ${event.location || I18n.t('agenda.location_undefined')}
            </div>
          </div>
          <div class="membre-agenda-status">
            <span class="badge ${isPast ? 'badge-outline' : 'badge-gold'}">
              ${isPast ? I18n.t('agenda.past') : I18n.t('agenda.upcoming')}
            </span>
          </div>
        </div>
      `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  /**
   * Setup sidebar navigation
   */
  setupNavigation() {
    document.querySelectorAll('.membre-nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = item.getAttribute('data-tab');
        if (tab) {
          this.showTab(tab);
        }
      });
    });

    // Logout button
    const logoutBtn = document.querySelector('.membre-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => Auth.signOut());
    }
  },

  /**
   * Setup tab switching
   */
  setupTabSwitching() {
    // Tab content switching handled in showTab
  },

  /**
   * Show specific tab
   */
  showTab(tabName) {
    // Update sidebar active state
    document.querySelectorAll('.membre-nav-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-tab') === tabName);
    });

    // Hide all tab content
    document.querySelectorAll('.membre-tab-content').forEach(content => {
      content.style.display = 'none';
    });

    // Show selected tab
    const selectedTab = document.querySelector(`.membre-tab-content[data-tab="${tabName}"]`);
    if (selectedTab) {
      selectedTab.style.display = 'block';
    }

    // Update page title
    const titles = {
      home: I18n.t('membre.tab_titles.home'),
      profile: I18n.t('membre.tab_titles.profile'),
      agenda: I18n.t('membre.tab_titles.agenda'),
      messages: I18n.t('membre.tab_titles.messages'),
      settings: I18n.t('membre.tab_titles.settings')
    };

    const titleEl = document.querySelector('.membre-page-title');
    if (titleEl) {
      titleEl.textContent = titles[tabName] || tabName;
    }
  },

  /**
   * Update member info
   */
  async updateProfile(updates) {
    if (!this.member) return;

    try {
      const db = await waitForSupabase();
      if (!db) return;

      const { error } = await db
        .from('mp3_members')
        .update(updates)
        .eq('id', this.member.id);

      if (error) throw error;

      // Reload member data
      await this.loadMemberData();
      alert(I18n.t('membre.update_success'));
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(I18n.t('membre.update_error'));
    }
  },

  /**
   * Download membership certificate
   */
  downloadCertificate() {
    if (!this.member || this.member.status !== 'active') {
      alert(I18n.t('membre.certificate_active_only'));
      return;
    }

    if (typeof jspdf === 'undefined') {
      alert('PDF library not loaded');
      return;
    }

    const { jsPDF } = jspdf;
    const doc = new jsPDF();

    // Certificate design
    doc.setFontSize(24);
    doc.text('Mouvman Pèp pou Pwosperite ak Pwogrè', 105, 40, { align: 'center' });

    doc.setFontSize(18);
    doc.text('Sètifika Manm', 105, 60, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Nou sètifye ke`, 105, 80, { align: 'center' });

    doc.setFontSize(20);
    doc.setTextColor(201, 160, 0); // Gold color
    doc.text(this.member.full_name, 105, 100, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`se yon manm aktif nan pati nou an.`, 105, 120, { align: 'center' });

    doc.text(`Kòd Manm: ${this.member.member_code}`, 105, 140, { align: 'center' });
    doc.text(`Dat Enskripsyon: ${I18n.formatDate(this.member.created_at)}`, 105, 155, { align: 'center' });

    doc.setFontSize(10);
    doc.text('Delmas, Haïti', 105, 200, { align: 'center' });
    doc.text(new Date().toLocaleDateString('fr-FR'), 105, 210, { align: 'center' });

    doc.save(`MP3-Sètifika-${this.member.member_code}.pdf`);
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  MembreDashboard.init();
});

window.MembreDashboard = MembreDashboard;
