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
        // Redirect to registration if not a member yet
        window.location.href = '/pages/devenir-membre.html';
      }
    } catch (error) {
      console.error('Error loading member data:', error);
    }
  },

  /**
   * Render member ID card
   */
  renderMemberCard() {
    const card = document.querySelector('.membre-id-card');
    if (!card || !this.member) return;

    const statusLabels = {
      pending: 'Pandan',
      active: 'Aktif',
      inactive: 'Inaktif',
      rejected: 'Rejte'
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
        <span><i data-lucide="map-pin" style="width: 12px; height: 12px;"></i> ${this.member.department || 'Pa defini'}</span>
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
      { label: 'Non Konplè', value: this.member.full_name },
      { label: 'Dat Nesans', value: I18n.formatDate(this.member.date_of_birth) },
      { label: 'NIN/CIN', value: this.member.nin || 'Pa provide' },
      { label: 'Depatman', value: this.member.department || 'Pa defini' },
      { label: 'Komin', value: this.member.commune || 'Pa defini' },
      { label: 'Adrès', value: this.member.address || 'Pa defini', fullWidth: true },
      { label: 'Telefòn', value: this.member.phone || 'Pa defini' },
      { label: 'Imèl', value: this.member.email }
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
      list.innerHTML = '<p class="text-muted" style="text-align: center; padding: var(--space-8);">Ou poko enskri nan okenn evènman.</p>';
      return;
    }

    list.innerHTML = this.rsvps.map(rsvp => {
      const event = rsvp.event;
      if (!event) return '';

      const date = new Date(event.event_date);
      const isPast = date < new Date();

      return `
        <div class="membre-agenda-item ${isPast ? 'past' : ''}">
          <div class="membre-agenda-date">
            <span class="membre-agenda-day">${date.getDate()}</span>
            <span class="membre-agenda-month">${date.toLocaleString('fr-FR', { month: 'short' })}</span>
          </div>
          <div class="membre-agenda-info">
            <h4 class="membre-agenda-title">${event.title}</h4>
            <div class="membre-agenda-location">
              <i data-lucide="map-pin" style="width: 14px; height: 14px;"></i>
              ${event.location || 'Kote pa defini'}
            </div>
          </div>
          <div class="membre-agenda-status">
            <span class="badge ${isPast ? 'badge-outline' : 'badge-gold'}">
              ${isPast ? 'Pase' : 'Pwoche'}
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
      home: 'Akèy',
      profile: 'Dosye Mwen',
      agenda: 'Ajanda',
      messages: 'Mesaj',
      settings: 'Paramèt'
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
      alert('Enfòmasyon yo mete ajou avèk siksè!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Erè pandan mete ajou. Tanpri eseye ankò.');
    }
  },

  /**
   * Download membership certificate
   */
  downloadCertificate() {
    if (!this.member || this.member.status !== 'active') {
      alert('Sètifika disponib sèlman pou manm aktif.');
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
