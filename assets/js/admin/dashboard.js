/**
 * MP3 - Admin Dashboard
 * Statistics, charts, and recent activity
 */

const AdminDashboard = {
  stats: {},
  charts: {},

  async init() {
    await Auth.requireAdmin();
    await this.loadStats();
    await this.loadCharts();
    this.loadRecentActivity();
  },

  /**
   * Load dashboard statistics
   */
  async loadStats() {
    try {
      const db = await waitForSupabase();
      if (!db) return;

      // Get member count
      const { count: memberCount } = await db
        .from('mp3_members')
        .select('*', { count: 'exact', head: true });

      // Get total donations
      const { data: donations } = await db
        .from('mp3_donations')
        .select('amount, currency')
        .eq('status', 'confirmed');

      let totalDonations = 0;
      donations?.forEach(d => {
        if (d.currency === 'HTG') totalDonations += d.amount;
        else if (d.currency === 'USD') totalDonations += d.amount * 130;
        else if (d.currency === 'EUR') totalDonations += d.amount * 140;
      });

      // Get upcoming events count
      const { count: eventsCount } = await db
        .from('mp3_agenda')
        .select('*', { count: 'exact', head: true })
        .gte('event_date', new Date().toISOString())
        .eq('is_published', true);

      // Get news count
      const { count: newsCount } = await db
        .from('mp3_actualites')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true);

      this.stats = {
        members: memberCount || 0,
        donations: totalDonations,
        events: eventsCount || 0,
        news: newsCount || 0
      };

      this.renderStats();
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  },

  /**
   * Render statistics cards
   */
  renderStats() {
    document.querySelector('.stat-members .admin-stat-value').textContent = this.stats.members.toLocaleString('fr-FR');
    document.querySelector('.stat-donations .admin-stat-value').textContent = 
      'HTG ' + (this.stats.donations / 1000).toFixed(1) + 'K';
    document.querySelector('.stat-events .admin-stat-value').textContent = this.stats.events;
    document.querySelector('.stat-news .admin-stat-value').textContent = this.stats.news;
  },

  /**
   * Load and render charts
   */
  async loadCharts() {
    await this.loadDonationsChart();
    await this.loadMembersChart();
  },

  /**
   * Load donations by month chart
   */
  async loadDonationsChart() {
    try {
      const db = await waitForSupabase();
      if (!db) return;

      const { data, error } = await db
        .from('mp3_donations')
        .select('amount, currency, created_at')
        .eq('status', 'confirmed')
        .gte('created_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Group by month
      const monthlyData = {};
      const months = ['Jan', 'Fev', 'Mas', 'Avr', 'Me', 'Jen'];
      months.forEach(m => monthlyData[m] = 0);

      data?.forEach(d => {
        const date = new Date(d.created_at);
        const month = months[date.getMonth()];
        if (month && monthlyData[month] !== undefined) {
          let amount = d.amount;
          if (d.currency === 'USD') amount *= 130;
          else if (d.currency === 'EUR') amount *= 140;
          monthlyData[month] += amount;
        }
      });

      const ctx = document.getElementById('donationsChart');
      if (!ctx) return;

      this.charts.donations = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: Object.keys(monthlyData),
          datasets: [{
            label: 'Don (HTG)',
            data: Object.values(monthlyData),
            backgroundColor: '#C9A000',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(0,0,0,0.05)' }
            },
            x: {
              grid: { display: false }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error loading donations chart:', error);
    }
  },

  /**
   * Load members by department chart
   */
  async loadMembersChart() {
    try {
      const db = await waitForSupabase();
      if (!db) return;

      const { data, error } = await db
        .from('mp3_members')
        .select('department');

      if (error) throw error;

      // Count by department
      const deptCounts = {};
      data?.forEach(m => {
        const dept = m.department || 'Pa defini';
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      });

      const ctx = document.getElementById('membersChart');
      if (!ctx) return;

      this.charts.members = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: Object.keys(deptCounts),
          datasets: [{
            data: Object.values(deptCounts),
            backgroundColor: [
              '#C9A000',
              '#0A0A0A',
              '#F5C518',
              '#CC0000',
              '#5A5A5A',
              '#9A9A9A'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right'
            }
          }
        }
      });
    } catch (error) {
      console.error('Error loading members chart:', error);
    }
  },

  /**
   * Load recent activity
   */
  async loadRecentActivity() {
    try {
      const db = await waitForSupabase();
      if (!db) return;

      // Get recent members
      const { data: members } = await db
        .from('mp3_members')
        .select('full_name, created_at, status')
        .order('created_at', { ascending: false })
        .limit(5);

      // Get recent donations
      const { data: donations } = await db
        .from('mp3_donations')
        .select('donor_name, amount, currency, created_at')
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false })
        .limit(5);

      const activities = [];

      members?.forEach(m => {
        activities.push({
          type: 'member',
          text: `${m.full_name} enskri kòm manm`,
          date: m.created_at,
          icon: 'user-plus',
          status: m.status
        });
      });

      donations?.forEach(d => {
        activities.push({
          type: 'donation',
          text: `${d.donor_name || 'Anonim'} fè yon don ${I18n.formatCurrency(d.amount, d.currency)}`,
          date: d.created_at,
          icon: 'heart'
        });
      });

      // Sort by date
      activities.sort((a, b) => new Date(b.date) - new Date(a.date));

      this.renderActivity(activities.slice(0, 10));
    } catch (error) {
      console.error('Error loading activity:', error);
    }
  },

  /**
   * Render activity feed
   */
  renderActivity(activities) {
    const container = document.querySelector('.admin-activity-feed');
    if (!container) return;

    if (activities.length === 0) {
      container.innerHTML = '<p class="text-muted" style="text-align: center; padding: var(--space-8);">Pa gen aktivite resan.</p>';
      return;
    }

    container.innerHTML = activities.map(a => `
      <div class="admin-activity-item">
        <div class="admin-activity-icon">
          <i data-lucide="${a.icon}" style="width: 16px; height: 16px;"></i>
        </div>
        <div class="admin-activity-content">
          <p>${a.text}</p>
          <span>${I18n.formatDate(a.date)}</span>
        </div>
      </div>
    `).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  AdminDashboard.init();
});

window.AdminDashboard = AdminDashboard;
