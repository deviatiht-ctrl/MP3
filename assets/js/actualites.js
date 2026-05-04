/**
 * MP3 - News/Actualites Page
 * News listing and article detail
 */

const ActualitesPage = {
  articles: [],
  currentPage: 1,
  itemsPerPage: 9,
  totalArticles: 0,

  async init() {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');

    if (slug) {
      // Article detail page
      await this.loadArticleDetail(slug);
    } else {
      // News listing page
      await this.loadArticles();
      this.setupPagination();
    }
  },

  /**
   * Load articles list
   */
  async loadArticles() {
    const grid = document.querySelector('.actualites-grid-full');
    if (!grid) return;

    try {
      const db = await waitForSupabase();
      if (!db) {
        grid.innerHTML = '<p class="text-center">Erè koneksyon. Tanpri eseye ankò.</p>';
        return;
      }

      const { data, error, count } = await db
        .from('mp3_actualites')
        .select('*', { count: 'exact' })
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .range((this.currentPage - 1) * this.itemsPerPage, this.currentPage * this.itemsPerPage - 1);

      if (error) throw error;

      this.articles = data || [];
      this.totalArticles = count || 0;
      this.renderArticles();
      this.updatePagination();
    } catch (error) {
      console.error('Error loading articles:', error);
      grid.innerHTML = '<p class="text-center">Erè nan chajman nouvèl yo.</p>';
    }
  },

  /**
   * Render articles grid
   */
  renderArticles() {
    const grid = document.querySelector('.actualites-grid-full');
    if (!grid) return;

    if (this.articles.length === 0) {
      grid.innerHTML = '<p class="text-center" style="grid-column: 1/-1;">Pa gen nouvèl ki disponib kounye a.</p>';
      return;
    }

    grid.innerHTML = this.articles.map(a => `
      <article class="actualite-card-full">
        <div class="actualite-card-image">
          <img src="${a.cover_image_url || 'assets/img/logo-placeholder.svg'}" 
               alt="${a.title}" loading="lazy">
        </div>
        <div class="actualite-card-content">
          <span class="actualite-category ${a.category}">${a.category}</span>
          <h3 class="actualite-title">${a.title}</h3>
          <p class="actualite-excerpt">${a.excerpt || ''}</p>
          <time class="actualite-date">${I18n.formatDate(a.published_at)}</time>
        </div>
      </article>
    `).join('');

    // Add click handlers
    grid.querySelectorAll('.actualite-card-full').forEach((card, i) => {
      card.addEventListener('click', () => {
        window.location.href = `actualite-detail.html?slug=${this.articles[i].slug}`;
      });
      card.style.cursor = 'pointer';
    });
  },

  /**
   * Load single article detail
   */
  async loadArticleDetail(slug) {
    try {
      const db = await waitForSupabase();
      if (!db) return;

      const { data, error } = await db
        .from('mp3_actualites')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) throw error;

      if (data) {
        this.renderArticleDetail(data);
        // Increment views
        this.incrementViews(data.id);
      } else {
        document.querySelector('.actualite-detail-page').innerHTML = 
          '<div class="content-wrapper" style="padding-top: 200px; text-align: center;"><h1>Atik la pa jwenn</h1></div>';
      }
    } catch (error) {
      console.error('Error loading article:', error);
    }
  },

  /**
   * Render article detail
   */
  renderArticleDetail(article) {
    const cover = document.querySelector('.actualite-detail-cover img');
    const title = document.querySelector('.actualite-detail-title');
    const category = document.querySelector('.actualite-detail-category');
    const meta = document.querySelector('.actualite-detail-meta');
    const content = document.querySelector('.actualite-detail-content');

    if (cover) cover.src = article.cover_image_url || 'assets/img/logo-placeholder.svg';
    if (title) title.textContent = article.title;
    if (category) {
      category.textContent = article.category;
      category.className = `actualite-category ${article.category} actualite-detail-category`;
    }
    if (meta) {
      meta.innerHTML = `
        <span>
          <i data-lucide="calendar" style="width: 14px; height: 14px;"></i>
          ${I18n.formatDate(article.published_at)}
        </span>
        <span>
          <i data-lucide="user" style="width: 14px; height: 14px;"></i>
          ${article.author}
        </span>
        <span>
          <i data-lucide="eye" style="width: 14px; height: 14px;"></i>
          ${article.views || 0} lekti
        </span>
      `;
    }
    if (content) content.innerHTML = article.content || '<p>Pa gen kontini disponib.</p>';

    // Update page title
    document.title = `${article.title} | MP3`;

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    // Setup share buttons
    this.setupShareButtons(article);
  },

  /**
   * Increment article views
   */
  async incrementViews(articleId) {
    try {
      const db = await waitForSupabase();
      if (!db) return;

      await db.rpc('increment_article_views', { article_id: articleId });
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  },

  /**
   * Setup pagination
   */
  setupPagination() {
    const pagination = document.querySelector('.pagination');
    if (!pagination) return;

    pagination.addEventListener('click', (e) => {
      const btn = e.target.closest('.pagination-btn');
      if (!btn) return;

      const page = btn.getAttribute('data-page');
      if (page) {
        this.currentPage = parseInt(page);
        this.loadArticles();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  },

  /**
   * Update pagination UI
   */
  updatePagination() {
    const pagination = document.querySelector('.pagination');
    if (!pagination) return;

    const totalPages = Math.ceil(this.totalArticles / this.itemsPerPage);
    
    let html = `
      <button class="pagination-btn" data-page="${this.currentPage - 1}" 
              ${this.currentPage === 1 ? 'disabled' : ''}>
        <i data-lucide="chevron-left" style="width: 16px; height: 16px;"></i>
      </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    html += `
      <button class="pagination-btn" data-page="${this.currentPage + 1}" 
              ${this.currentPage === totalPages ? 'disabled' : ''}>
        <i data-lucide="chevron-right" style="width: 16px; height: 16px;"></i>
      </button>
    `;

    pagination.innerHTML = html;

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  },

  /**
   * Setup share buttons
   */
  setupShareButtons(article) {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(article.title);

    document.querySelectorAll('.actualite-share-btn').forEach(btn => {
      const platform = btn.getAttribute('data-platform');
      let shareUrl = '';

      switch (platform) {
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
          break;
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
          break;
        case 'linkedin':
          shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
          break;
        case 'whatsapp':
          shareUrl = `https://wa.me/?text=${title}%20${url}`;
          break;
      }

      if (shareUrl) {
        btn.addEventListener('click', () => {
          window.open(shareUrl, '_blank', 'width=600,height=400');
        });
      }
    });
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  ActualitesPage.init();
});

window.ActualitesPage = ActualitesPage;
