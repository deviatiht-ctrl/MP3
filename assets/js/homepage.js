/**
 * MP3 - Homepage Data Loading
 * Fetches and renders dynamic content from Supabase
 */

const Homepage = {
  async init() {
    await this.loadSettings();
    await this.loadCandidates();
    await this.loadActualites();
    await this.loadAgenda();
    this.loadMissionContent();

    window.addEventListener('languageChanged', () => {
      if (this.candidatesData) this.renderCandidates(document.querySelector('.candidats-grid'), this.candidatesData);
      if (this.articlesData) this.renderActualites(document.querySelector('.actualites-grid'), this.articlesData);
      if (this.agendaData) this.renderAgenda(document.querySelector('.agenda-timeline'), this.agendaData);
    });
  },

  translatePosition(position) {
    if (!position) return '';
    const pos = position.toLowerCase();
    if (pos.includes('prezidan') || pos.includes('president')) return I18n.t('candidates.position_president', position);
    if (pos.includes('senatè') || pos.includes('senator')) return I18n.t('candidates.position_senator', position);
    if (pos.includes('depite') || pos.includes('deputy')) return I18n.t('candidates.position_deputy', position);
    if (pos.includes('majistra') || pos.includes('mayor')) return I18n.t('candidates.position_mayor', position);
    return position;
  },

  translateCategory(category) {
    if (!category) return '';
    const cat = category.toLowerCase();
    if (cat === 'campagne' || cat === 'campaign' || cat === 'kanpay') return I18n.t('news.category_campaign', category);
    if (cat === 'economy' || cat === 'économie' || cat === 'ekonomi') return I18n.t('news.category_economy', category);
    if (cat === 'region' || cat === 'région' || cat === 'rejyon') return I18n.t('news.category_region', category);
    return category;
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

      // Update mission section
      if (data.devise) {
        const deviseEl = document.querySelector('.hero-devise');
        if (deviseEl) deviseEl.textContent = data.devise;
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  },

  /**
   * Load featured candidates
   */
  async loadCandidates() {
    const container = document.querySelector('.candidats-grid');
    if (!container) return;

    try {
      const db = await waitForSupabase();
      if (!db) {
        this.renderCandidatesSkeleton(container, 4);
        return;
      }

      const { data, error } = await db
        .from('mp3_candidats')
        .select('*')
        .eq('is_featured', true)
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(4);

      if (error) throw error;

      if (data && data.length > 0) {
        this.candidatesData = data;
        this.renderCandidates(container, data);
      } else {
        container.innerHTML = `<p class="text-center text-muted">${I18n.t('candidates.no_candidates')}</p>`;
      }
    } catch (error) {
      console.error('Error loading candidates:', error);
      container.innerHTML = `<p class="text-center text-muted">${I18n.t('candidates.load_error')}</p>`;
    }
  },

  /**
   * Render candidates grid
   */
  renderCandidates(container, candidates) {
    container.innerHTML = candidates.map(c => `
      <div class="candidat-card" data-id="${c.id}">
        <img src="${c.photo_url || 'assets/img/logo-placeholder.svg'}" 
             alt="${c.full_name}" 
             class="candidat-card-image"
             loading="lazy">
        <div class="candidat-card-overlay">
          <h3 class="candidat-card-name">${c.full_name}</h3>
          <p class="candidat-card-position">${this.translatePosition(c.position)}</p>
          <p class="candidat-card-bio">${c.bio || ''}</p>
          <a href="pages/candidats.html?id=${c.id}" class="candidat-card-btn">
            ${I18n.t('candidates.see_more')}
            <i data-lucide="arrow-right" class="icon" style="width: 14px; height: 14px;"></i>
          </a>
        </div>
        <span class="candidat-badge">${this.translatePosition(c.position)}</span>
      </div>
    `).join('');

    // Re-render icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  },

  /**
   * Render skeleton loading state
   */
  renderCandidatesSkeleton(container, count) {
    container.innerHTML = Array(count).fill(0).map(() => `
      <div class="candidat-card skeleton" style="aspect-ratio: 3/4;">
        <div style="width: 100%; height: 100%; background: var(--clr-bg-soft);"></div>
      </div>
    `).join('');
  },

  /**
   * Load recent news
   */
  async loadActualites() {
    const container = document.querySelector('.actualites-grid');
    if (!container) return;

    try {
      const db = await waitForSupabase();
      if (!db) {
        this.renderActualitesSkeleton(container);
        return;
      }

      const { data, error } = await db
        .from('mp3_actualites')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(3);

      if (error) throw error;

      if (data && data.length > 0) {
        this.articlesData = data;
        this.renderActualites(container, data);
      } else {
        container.innerHTML = `<p class="text-center text-muted">${I18n.t('news.no_news')}</p>`;
      }
    } catch (error) {
      console.error('Error loading actualites:', error);
      container.innerHTML = `<p class="text-center text-muted">${I18n.t('news.load_error')}</p>`;
    }
  },

  /**
   * Render news grid
   */
  renderActualites(container, articles) {
    const [featured, ...others] = articles;
    
    container.innerHTML = `
      <article class="actualite-featured">
        <div class="actualite-featured-image">
          <img src="${featured.cover_image_url || 'assets/img/logo-placeholder.svg'}" 
               alt="${featured.title}" loading="lazy">
        </div>
        <div class="actualite-featured-content">
          <span class="actualite-category ${featured.category}">${this.translateCategory(featured.category)}</span>
          <h3 class="actualite-title">${featured.title}</h3>
          <p class="actualite-excerpt">${featured.excerpt || ''}</p>
          <time class="actualite-date">${I18n.formatDate(featured.published_at)}</time>
        </div>
      </article>
      ${others.map(a => `
        <article class="actualite-card">
          <div class="actualite-card-image">
            <img src="${a.cover_image_url || 'assets/img/logo-placeholder.svg'}" 
                 alt="${a.title}" loading="lazy">
          </div>
          <div class="actualite-card-content">
            <span class="actualite-category ${a.category}">${this.translateCategory(a.category)}</span>
            <h3 class="actualite-title">${a.title}</h3>
            <p class="actualite-excerpt">${a.excerpt || ''}</p>
            <time class="actualite-date">${I18n.formatDate(a.published_at)}</time>
          </div>
        </article>
      `).join('')}
    `;
  },

  renderActualitesSkeleton(container) {
    container.innerHTML = `
      <div class="skeleton" style="grid-row: span 2; aspect-ratio: 1;"></div>
      <div class="skeleton" style="aspect-ratio: 16/10;"></div>
      <div class="skeleton" style="aspect-ratio: 16/10;"></div>
    `;
  },

  /**
   * Load upcoming events
   */
  async loadAgenda() {
    const container = document.querySelector('.agenda-timeline');
    if (!container) return;

    try {
      const db = await waitForSupabase();
      if (!db) {
        this.renderAgendaSkeleton(container, 4);
        return;
      }

      const { data, error } = await db
        .from('mp3_agenda')
        .select('*')
        .eq('is_published', true)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(4);

      if (error) throw error;

      if (data && data.length > 0) {
        this.agendaData = data;
        this.renderAgenda(container, data);
      } else {
        container.innerHTML = `<p class="text-center text-muted" style="color: rgba(255,255,255,0.6);">${I18n.t('agenda.no_upcoming')}</p>`;
      }
    } catch (error) {
      console.error('Error loading agenda:', error);
    }
  },

  /**
   * Render agenda timeline
   */
  renderAgenda(container, events) {
    const langLocales = {
      ht: 'fr-FR',
      fr: 'fr-FR',
      en: 'en-US',
      es: 'es-ES'
    };
    const currentLocale = langLocales[I18n.currentLang] || 'fr-FR';

    container.innerHTML = events.map(e => {
      const date = new Date(e.event_date);
      return `
        <div class="agenda-item">
          <div class="agenda-date">
            <span class="agenda-day">${date.getDate()}</span>
            <span class="agenda-month">${date.toLocaleString(currentLocale, { month: 'short' })}</span>
          </div>
          <h3 class="agenda-title">${e.title}</h3>
          <div class="agenda-location">
            <i data-lucide="map-pin" style="width: 16px; height: 16px;"></i>
            ${e.location || I18n.t('agenda.location_undefined')}
          </div>
          ${e.rsvp_enabled ? `
            <button class="agenda-btn" onclick="window.location.href='pages/agenda.html'">
              ${I18n.t('agenda.register_btn')}
              <i data-lucide="arrow-right" style="width: 14px; height: 14px;"></i>
            </button>
          ` : ''}
        </div>
      `;
    }).join('');

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  },

  renderAgendaSkeleton(container, count) {
    container.innerHTML = Array(count).fill(0).map(() => `
      <div class="agenda-item skeleton" style="min-width: 200px; height: 200px;"></div>
    `).join('');
  },

  /**
   * Load mission content
   */
  loadMissionContent() {
    // Mission content is static from specs, but pillars can be loaded from settings
    // For now using static content as per design
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  Homepage.init();
});

window.Homepage = Homepage;
