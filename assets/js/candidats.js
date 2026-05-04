/**
 * MP3 - Candidates Page
 * Full candidates listing with filtering and detail panel
 */

const CandidatsPage = {
  candidates: [],
  filteredCandidates: [],
  currentFilter: 'all',
  selectedCandidate: null,

  async init() {
    await this.loadCandidates();
    this.setupFilters();
    this.setupSearch();
    this.setupPanel();
  },

  /**
   * Load all candidates from Supabase
   */
  async loadCandidates() {
    const grid = document.querySelector('.candidats-grid-full');
    if (!grid) return;

    try {
      const db = await waitForSupabase();
      if (!db) {
        grid.innerHTML = '<p class="text-center">Erè koneksyon. Tanpri eseye ankò.</p>';
        return;
      }

      const { data, error } = await db
        .from('mp3_candidats')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      this.candidates = data || [];
      this.filteredCandidates = [...this.candidates];
      this.renderCandidates();
    } catch (error) {
      console.error('Error loading candidates:', error);
      grid.innerHTML = '<p class="text-center">Erè nan chajman kandida yo.</p>';
    }
  },

  /**
   * Render candidates grid
   */
  renderCandidates() {
    const grid = document.querySelector('.candidats-grid-full');
    if (!grid) return;

    if (this.filteredCandidates.length === 0) {
      grid.innerHTML = '<p class="text-center" style="grid-column: 1/-1; padding: var(--space-12);">Pa gen kandida ki koresponn ak rechèch ou a.</p>';
      return;
    }

    grid.innerHTML = this.filteredCandidates.map(c => `
      <div class="candidat-card-full" data-id="${c.id}" data-position="${c.position}">
        <div class="candidat-card-image-wrap">
          <img src="${c.photo_url || 'assets/img/logo-placeholder.svg'}" 
               alt="${c.full_name}" loading="lazy">
          <span class="candidat-position-badge ${this.getPositionClass(c.position)}">
            ${c.position}
          </span>
        </div>
        <div class="candidat-card-content">
          <h3 class="candidat-card-name">${c.full_name}</h3>
          <p class="candidat-card-position-text">${c.position}</p>
          <p class="candidat-card-department">
            <i data-lucide="map-pin" style="width: 14px; height: 14px; display: inline;"></i>
            ${c.department || 'Tout Ayiti'}
          </p>
          <div class="candidat-card-footer">
            <button class="btn btn-sm btn-secondary" onclick="CandidatsPage.openPanel('${c.id}')">
              Profil Konplè
            </button>
          </div>
        </div>
      </div>
    `).join('');

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    // Add click handlers to cards
    grid.querySelectorAll('.candidat-card-full').forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
          const id = card.getAttribute('data-id');
          this.openPanel(id);
        }
      });
    });
  },

  /**
   * Get CSS class for position badge
   */
  getPositionClass(position) {
    const map = {
      'Kandida Prezidan': 'prezidan',
      'Kandida Senatè': 'senatè',
      'Kandida Depite': 'depite',
      'Kandida Majistra': 'majistra'
    };
    return map[position] || '';
  },

  /**
   * Setup filter buttons
   */
  setupFilters() {
    const buttons = document.querySelectorAll('.filter-tab');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        this.currentFilter = btn.getAttribute('data-filter') || 'all';
        this.applyFilters();
      });
    });
  },

  /**
   * Setup search input
   */
  setupSearch() {
    const searchInput = document.querySelector('.filter-search input');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.applyFilters();
    });
  },

  /**
   * Apply filters and search
   */
  applyFilters() {
    this.filteredCandidates = this.candidates.filter(c => {
      // Position filter
      if (this.currentFilter !== 'all') {
        const positionMap = {
          'prezidan': 'Prezidan',
          'senatè': 'Senatè',
          'depite': 'Depite',
          'majistra': 'Majistra',
          'rejyonal': 'Rejyonal'
        };
        if (!c.position.toLowerCase().includes(positionMap[this.currentFilter]?.toLowerCase() || '')) {
          return false;
        }
      }

      // Search filter
      if (this.searchQuery) {
        const searchable = `${c.full_name} ${c.position} ${c.department || ''} ${c.bio || ''}`.toLowerCase();
        if (!searchable.includes(this.searchQuery)) {
          return false;
        }
      }

      return true;
    });

    this.renderCandidates();
  },

  /**
   * Setup side panel
   */
  setupPanel() {
    const overlay = document.querySelector('.candidat-panel-overlay');
    const closeBtn = document.querySelector('.candidat-panel-close');

    if (overlay) {
      overlay.addEventListener('click', () => this.closePanel());
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closePanel());
    }

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closePanel();
    });
  },

  /**
   * Open candidate detail panel
   */
  openPanel(candidateId) {
    const candidate = this.candidates.find(c => c.id === candidateId);
    if (!candidate) return;

    this.selectedCandidate = candidate;
    this.renderPanel(candidate);

    const overlay = document.querySelector('.candidat-panel-overlay');
    const panel = document.querySelector('.candidat-panel');

    if (overlay && panel) {
      overlay.classList.add('active');
      panel.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  /**
   * Close candidate panel
   */
  closePanel() {
    const overlay = document.querySelector('.candidat-panel-overlay');
    const panel = document.querySelector('.candidat-panel');

    if (overlay && panel) {
      overlay.classList.remove('active');
      panel.classList.remove('active');
      document.body.style.overflow = '';
    }

    this.selectedCandidate = null;
  },

  /**
   * Render panel content
   */
  renderPanel(candidate) {
    const panel = document.querySelector('.candidat-panel');
    if (!panel) return;

    const accomplishments = candidate.accomplishments || [];
    
    panel.querySelector('.candidat-panel-image img').src = 
      candidate.photo_url || 'assets/img/logo-placeholder.svg';
    panel.querySelector('.candidat-panel-position').textContent = candidate.position;
    panel.querySelector('.candidat-panel-name').textContent = candidate.full_name;
    panel.querySelector('.candidat-panel-dept').innerHTML = `
      <i data-lucide="map-pin" style="width: 16px; height: 16px;"></i>
      ${candidate.department || 'Tout Ayiti'}
    `;
    panel.querySelector('.candidat-panel-bio').textContent = candidate.bio || 'Pa gen biyografi disponib.';

    const accList = panel.querySelector('.candidat-accomplishments');
    if (accList) {
      if (accomplishments.length > 0) {
        accList.innerHTML = accomplishments.map(acc => `<li>${acc}</li>`).join('');
      } else {
        accList.innerHTML = '<li style="list-style: none; opacity: 0.6;">Pa gen reyalizasyon lisadwe.</li>';
      }
    }

    // Social links
    const socialContainer = panel.querySelector('.candidat-social');
    if (socialContainer) {
      let socialHtml = '';
      if (candidate.facebook_url) {
        socialHtml += `<a href="${candidate.facebook_url}" target="_blank" rel="noopener">
          <i data-lucide="facebook" style="width: 18px; height: 18px;"></i>
        </a>`;
      }
      if (candidate.instagram_url) {
        socialHtml += `<a href="${candidate.instagram_url}" target="_blank" rel="noopener">
          <i data-lucide="instagram" style="width: 18px; height: 18px;"></i>
        </a>`;
      }
      socialContainer.innerHTML = socialHtml;
    }

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  CandidatsPage.init();
});

window.CandidatsPage = CandidatsPage;
