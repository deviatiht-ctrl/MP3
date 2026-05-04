/**
 * MP3 - Admin Panel Unified Module
 * Handles candidates, news, agenda, members, donations, and settings
 */

const Admin = {
  currentEntity: null,
  currentData: [],
  editingId: null,

  async init(entity) {
    this.currentEntity = entity;
    await Auth.requireAdmin();
    await this.loadData();
    this.setupTable();
    this.setupModal();
  },

  /**
   * Load data based on entity type
   */
  async loadData() {
    try {
      const db = await waitForSupabase();
      if (!db) return;

      let query = db.from(`mp3_${this.currentEntity}`).select('*');

      // Special handling for different entities
      if (this.currentEntity === 'candidats') {
        query = query.order('display_order', { ascending: true });
      } else if (this.currentEntity === 'actualites') {
        query = query.order('published_at', { ascending: false });
      } else if (this.currentEntity === 'agenda') {
        query = query.order('event_date', { ascending: true });
      } else if (this.currentEntity === 'members') {
        query = query.order('created_at', { ascending: false });
      } else if (this.currentEntity === 'donations') {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      this.currentData = data || [];
      this.renderTable();
    } catch (error) {
      console.error(`Error loading ${this.currentEntity}:`, error);
    }
  },

  /**
   * Render data table
   */
  renderTable() {
    const tbody = document.querySelector('.admin-table tbody');
    if (!tbody) return;

    if (this.currentData.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: var(--space-8);">Pa gen done.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.currentData.map(item => this.renderTableRow(item)).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  /**
   * Render single table row based on entity
   */
  renderTableRow(item) {
    const configs = {
      candidats: {
        photo: item.photo_url,
        title: item.full_name,
        subtitle: item.position,
        badge: item.department,
        status: item.is_active ? 'active' : 'inactive'
      },
      actualites: {
        photo: item.cover_image_url,
        title: item.title,
        subtitle: item.category,
        badge: I18n.formatDate(item.published_at),
        status: item.is_published ? 'active' : 'pending'
      },
      agenda: {
        photo: item.cover_image_url,
        title: item.title,
        subtitle: I18n.formatDate(item.event_date),
        badge: item.location,
        status: item.is_published ? 'active' : 'pending'
      },
      members: {
        photo: item.photo_url,
        title: item.full_name,
        subtitle: item.member_code,
        badge: item.department,
        status: item.status
      },
      donations: {
        photo: null,
        title: item.donor_name || 'Anonim',
        subtitle: item.cause,
        badge: I18n.formatCurrency(item.amount, item.currency),
        status: item.status
      }
    };

    const config = configs[this.currentEntity];

    return `
      <tr data-id="${item.id}">
        <td class="admin-table-cell-photo">
          ${config.photo ? `<img src="${config.photo}" alt="">` : '<div style="width:40px;height:40px;background:var(--clr-bg-soft);border-radius:50%;"></div>'}
        </td>
        <td class="admin-table-cell-name">${config.title}</td>
        <td class="admin-table-cell-secondary">${config.subtitle}</td>
        <td>${config.badge || '-'}</td>
        <td><span class="status-badge ${config.status}">${config.status}</span></td>
        <td>
          <div class="admin-table-actions">
            <button class="admin-table-btn" onclick="Admin.editItem('${item.id}')" title="Modifye">
              <i data-lucide="pencil" style="width: 16px; height: 16px;"></i>
            </button>
            <button class="admin-table-btn delete" onclick="Admin.deleteItem('${item.id}')" title="Efase">
              <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  },

  /**
   * Setup modal form
   */
  setupModal() {
    const modal = document.querySelector('.admin-modal');
    const overlay = document.querySelector('.admin-modal-overlay');
    const addBtn = document.querySelector('.admin-add-btn');
    const closeBtns = document.querySelectorAll('.admin-modal-close, .admin-modal-cancel');
    const form = document.querySelector('.admin-form');

    if (addBtn) {
      addBtn.addEventListener('click', () => this.openModal());
    }

    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => this.closeModal());
    });

    overlay?.addEventListener('click', () => this.closeModal());

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveItem();
    });
  },

  /**
   * Open modal for create/edit
   */
  openModal(id = null) {
    this.editingId = id;
    const modal = document.querySelector('.admin-modal');
    const overlay = document.querySelector('.admin-modal-overlay');
    const title = document.querySelector('.admin-modal-title');
    const form = document.querySelector('.admin-form');

    title.textContent = id ? 'Modifye' : 'Ajoute Nouvo';

    if (id) {
      const item = this.currentData.find(i => i.id === id);
      if (item) this.populateForm(item);
    } else {
      form?.reset();
    }

    modal?.classList.add('active');
    overlay?.classList.add('active');
  },

  /**
   * Close modal
   */
  closeModal() {
    const modal = document.querySelector('.admin-modal');
    const overlay = document.querySelector('.admin-modal-overlay');
    modal?.classList.remove('active');
    overlay?.classList.remove('active');
    this.editingId = null;
  },

  /**
   * Populate form with item data
   */
  populateForm(item) {
    const form = document.querySelector('.admin-form');
    if (!form) return;

    Object.keys(item).forEach(key => {
      const input = form.querySelector(`[name="${key}"]`);
      if (input) {
        if (input.type === 'checkbox') {
          input.checked = item[key];
        } else {
          input.value = item[key] || '';
        }
      }
    });
  },

  /**
   * Save item (create or update)
   */
  async saveItem() {
    const form = document.querySelector('.admin-form');
    if (!form) return;

    const formData = new FormData(form);
    const data = {};

    formData.forEach((value, key) => {
      const input = form.querySelector(`[name="${key}"]`);
      if (input?.type === 'checkbox') {
        data[key] = input.checked;
      } else if (input?.type === 'number') {
        data[key] = parseFloat(value) || null;
      } else {
        data[key] = value || null;
      }
    });

    try {
      const db = await waitForSupabase();
      if (!db) return;

      let result;
      if (this.editingId) {
        result = await db.from(`mp3_${this.currentEntity}`).update(data).eq('id', this.editingId);
      } else {
        result = await db.from(`mp3_${this.currentEntity}`).insert(data);
      }

      if (result.error) throw result.error;

      this.closeModal();
      await this.loadData();
      alert(this.editingId ? 'Modifikasyon anrejistre!' : 'Nouvo antre kreye!');
    } catch (error) {
      console.error('Save error:', error);
      alert('Erè pandan anrejistreman. Tanpri eseye ankò.');
    }
  },

  /**
   * Edit item
   */
  editItem(id) {
    this.openModal(id);
  },

  /**
   * Delete item
   */
  async deleteItem(id) {
    if (!confirm('Èske ou sèten ou vle efase sa a?')) return;

    try {
      const db = await waitForSupabase();
      if (!db) return;

      const { error } = await db.from(`mp3_${this.currentEntity}`).delete().eq('id', id);
      if (error) throw error;

      await this.loadData();
      alert('Efase avèk siksè!');
    } catch (error) {
      console.error('Delete error:', error);
      alert('Erè pandan efase. Tanpri eseye ankò.');
    }
  },

  /**
   * Setup table interactions
   */
  setupTable() {
    // Search functionality
    const searchInput = document.querySelector('.admin-table-search input');
    searchInput?.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      this.filterTable(query);
    });
  },

  /**
   * Filter table by search query
   */
  filterTable(query) {
    const rows = document.querySelectorAll('.admin-table tbody tr');
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(query) ? '' : 'none';
    });
  },

  /**
   * Export data to CSV
   */
  exportCSV() {
    if (this.currentData.length === 0) {
      alert('Pa gen done pou ekspòte');
      return;
    }

    const headers = Object.keys(this.currentData[0]);
    const csvContent = [
      headers.join(','),
      ...this.currentData.map(row => 
        headers.map(h => {
          const val = row[h];
          return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mp3-${this.currentEntity}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
};

// Settings-specific functions
const AdminSettings = {
  async init() {
    await Auth.requireAdmin();
    await this.loadSettings();
    this.setupTabs();
    this.setupForm();
  },

  async loadSettings() {
    try {
      const db = await waitForSupabase();
      if (!db) return;

      const { data, error } = await db.from('mp3_settings').select('*').single();
      if (error) throw error;

      if (data) {
        Object.keys(data).forEach(key => {
          const input = document.querySelector(`[name="${key}"]`);
          if (input) input.value = data[key] || '';
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  },

  setupTabs() {
    document.querySelectorAll('.admin-settings-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        document.querySelectorAll('.admin-settings-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        document.querySelectorAll('.admin-settings-content').forEach(c => {
          c.style.display = c.getAttribute('data-tab') === tabName ? 'block' : 'none';
        });
      });
    });
  },

  setupForm() {
    document.querySelector('.admin-settings-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(e.target);
      const data = {};
      formData.forEach((value, key) => data[key] = value);

      try {
        const db = await waitForSupabase();
        if (!db) return;

        const { error } = await db.from('mp3_settings').update(data).eq('id', 1);
        if (error) throw error;

        alert('Anviwònman anrejistre!');
      } catch (error) {
        console.error('Save settings error:', error);
        alert('Erè pandan anrejistreman.');
      }
    });
  }
};

window.Admin = Admin;
window.AdminSettings = AdminSettings;
