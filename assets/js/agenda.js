/**
 * MP3 - Agenda/Events Page
 * Events listing with RSVP functionality
 */

const AgendaPage = {
  events: [],
  currentFilter: 'upcoming',
  calendar: null,

  async init() {
    await this.loadEvents();
    this.setupFilters();
    this.setupViewToggle();
    this.setupRSVP();
  },

  /**
   * Load events from Supabase
   */
  async loadEvents() {
    const list = document.querySelector('.agenda-list');
    if (!list) return;

    try {
      const db = await waitForSupabase();
      if (!db) {
        list.innerHTML = '<p class="text-center">Erè koneksyon. Tanpri eseye ankò.</p>';
        return;
      }

      let query = db
        .from('mp3_agenda')
        .select('*')
        .eq('is_published', true)
        .order('event_date', { ascending: true });

      // Apply filter
      if (this.currentFilter === 'upcoming') {
        query = query.gte('event_date', new Date().toISOString());
      } else if (this.currentFilter === 'past') {
        query = query.lt('event_date', new Date().toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      this.events = data || [];
      this.renderEvents();
    } catch (error) {
      console.error('Error loading events:', error);
      list.innerHTML = '<p class="text-center">Erè nan chajman evènman yo.</p>';
    }
  },

  /**
   * Render events list
   */
  renderEvents() {
    const list = document.querySelector('.agenda-list');
    if (!list) return;

    if (this.events.length === 0) {
      list.innerHTML = `
        <div class="agenda-empty">
          <i data-lucide="calendar-x" class="agenda-empty-icon"></i>
          <h3 class="agenda-empty-title">Pa gen evènman</h3>
          <p class="agenda-empty-text">
            ${this.currentFilter === 'upcoming' ? 'Pa gen evènman k ap vini pou kounye a.' : 'Pa gen evènman pase pou montre.'}
          </p>
        </div>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    list.innerHTML = this.events.map(e => {
      const date = new Date(e.event_date);
      const isPast = date < new Date();
      const isFull = e.max_attendees && e.rsvp_count >= e.max_attendees;
      
      return `
        <div class="agenda-event-card ${isPast ? 'past' : ''}" data-id="${e.id}">
          <div class="agenda-event-date">
            <span class="agenda-event-day">${date.getDate()}</span>
            <span class="agenda-event-month">${date.toLocaleString('fr-FR', { month: 'short' })}</span>
            <span class="agenda-event-year">${date.getFullYear()}</span>
          </div>
          <div class="agenda-event-info">
            <h3 class="agenda-event-title">${e.title}</h3>
            <div class="agenda-event-meta">
              <span>
                <i data-lucide="clock" style="width: 14px; height: 14px;"></i>
                ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span>
                <i data-lucide="map-pin" style="width: 14px; height: 14px;"></i>
                ${e.location || 'Kote pa defini'}
              </span>
              ${e.max_attendees ? `
                <span>
                  <i data-lucide="users" style="width: 14px; height: 14px;"></i>
                  ${e.rsvp_count || 0}/${e.max_attendees} patisipan
                </span>
              ` : ''}
            </div>
            <p class="agenda-event-desc">${e.description || ''}</p>
            ${!isPast && e.rsvp_enabled ? `
              <span class="rsvp-badge ${isFull ? 'full' : 'open'}">
                <i data-lucide="${isFull ? 'x-circle' : 'check-circle'}" style="width: 12px; height: 12px;"></i>
                ${isFull ? 'Konplete' : 'Enskripsyon ouvè'}
              </span>
            ` : ''}
          </div>
          <div class="agenda-event-actions">
            ${e.cover_image_url ? `
              <div class="agenda-event-image">
                <img src="${e.cover_image_url}" alt="${e.title}" loading="lazy">
              </div>
            ` : ''}
            ${!isPast && e.rsvp_enabled && !isFull ? `
              <button class="btn btn-primary rsvp-btn" data-event-id="${e.id}">
                Enskri
              </button>
            ` : ''}
            ${e.location_url ? `
              <a href="${e.location_url}" target="_blank" rel="noopener" class="btn btn-ghost btn-sm">
                <i data-lucide="map" style="width: 14px; height: 14px;"></i>
                Wè sou kat
              </a>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  },

  /**
   * Setup filter buttons
   */
  setupFilters() {
    document.querySelectorAll('.agenda-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.agenda-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        this.currentFilter = btn.getAttribute('data-filter') || 'upcoming';
        this.loadEvents();
      });
    });
  },

  /**
   * Setup list/calendar view toggle
   */
  setupViewToggle() {
    const viewBtns = document.querySelectorAll('.agenda-view-btn');
    const listView = document.querySelector('.agenda-list');
    const calendarView = document.querySelector('.agenda-calendar');

    if (!viewBtns.length || !calendarView) return;

    viewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view');
        
        viewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (view === 'list') {
          listView.style.display = 'flex';
          calendarView.style.display = 'none';
        } else {
          listView.style.display = 'none';
          calendarView.style.display = 'block';
          this.initCalendar();
        }
      });
    });
  },

  /**
   * Initialize FullCalendar
   */
  initCalendar() {
    if (typeof FullCalendar === 'undefined') {
      console.warn('FullCalendar not loaded');
      return;
    }

    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;

    if (this.calendar) {
      this.calendar.destroy();
    }

    this.calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek'
      },
      events: this.events.map(e => ({
        id: e.id,
        title: e.title,
        start: e.event_date,
        end: e.event_end_date,
        location: e.location,
        extendedProps: {
          description: e.description,
          rsvpEnabled: e.rsvp_enabled
        }
      })),
      eventClick: (info) => {
        this.showEventDetails(info.event);
      },
      locale: I18n.currentLang === 'ht' ? 'fr' : I18n.currentLang
    });

    this.calendar.render();
  },

  /**
   * Show event details modal
   */
  showEventDetails(event) {
    const eventData = this.events.find(e => e.id === event.id);
    if (!eventData) return;

    // Simple alert for now - can be replaced with modal
    alert(`${eventData.title}\n\n${eventData.description || ''}\n\nKote: ${eventData.location || 'Pa defini'}`);
  },

  /**
   * Setup RSVP button handlers
   */
  setupRSVP() {
    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('.rsvp-btn');
      if (!btn) return;

      const eventId = btn.getAttribute('data-event-id');
      if (!eventId) return;

      // Check if user is logged in
      const user = await Auth.getCurrentUser();
      if (!user) {
        const goToLogin = confirm('Ou dwe konekte pou enskri. Ale nan paj koneksyon?');
        if (goToLogin) {
          window.location.href = `/pages/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
        }
        return;
      }

      try {
        const db = await waitForSupabase();
        if (!db) return;

        // Check if already registered
        const { data: existing } = await db
          .from('mp3_rsvps')
          .select('*')
          .eq('event_id', eventId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (existing) {
          alert('Ou deja enskri pou evènman sa a!');
          return;
        }

        // Create RSVP
        const { error } = await db
          .from('mp3_rsvps')
          .insert({
            event_id: eventId,
            user_id: user.id,
            member_name: user.user_metadata?.full_name || user.email,
            member_email: user.email
          });

        if (error) throw error;

        alert('Enskripsyon reyisi! Nou konte wè ou nan evènman an.');
        btn.textContent = 'Enskri';
        btn.disabled = true;
      } catch (error) {
        console.error('RSVP error:', error);
        alert('Erè pandan enskripsyon. Tanpri eseye ankò.');
      }
    });
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  AgendaPage.init();
});

window.AgendaPage = AgendaPage;
