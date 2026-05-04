/**
 * MP3 - Site Statistics Module
 * Fetches and displays dynamic statistics from Supabase
 */

const SiteStats = {
  stats: {},
  
  /**
   * Initialize stats
   */
  async init() {
    await this.fetchStats();
    this.displayStats();
  },
  
  /**
   * Fetch stats from Supabase
   */
  async fetchStats() {
    try {
      const db = await waitForSupabase();
      if (!db) {
        console.log('Supabase not available, showing empty stats');
        this.setEmptyStats();
        return;
      }
      
      const { data, error } = await db
        .from('site_stats')
        .select('*');
        
      if (error) {
        console.error('Error fetching stats:', error);
        this.setEmptyStats();
        return;
      }
      
      // If no data returned, show zeros
      if (!data || data.length === 0) {
        console.log('No stats data found, showing zeros');
        this.setEmptyStats();
        return;
      }
      
      // Convert array to object with stat_key as key
      data.forEach(stat => {
        this.stats[stat.stat_key] = {
          value: stat.stat_value,
          label: this.getLocalizedLabel(stat)
        };
      });
      
    } catch (error) {
      console.error('Error in fetchStats:', error);
      this.setEmptyStats();
    }
  },
  
  /**
   * Get label based on current language
   */
  getLocalizedLabel(stat) {
    const lang = window.I18n ? I18n.currentLang : 'ht';
    
    switch(lang) {
      case 'fr': return stat.stat_label_fr || stat.stat_label_ht;
      case 'en': return stat.stat_label_en || stat.stat_label_ht;
      default: return stat.stat_label_ht;
    }
  },
  
  /**
   * Set empty stats (0) when DB not available or no data
   */
  setEmptyStats() {
    this.stats = {
      active_members: { value: 0, label: 'Manm Aktif' },
      departments: { value: 0, label: 'Depatman' },
      total_donations: { value: 0, label: 'Total Ranmase' },
      events_count: { value: 0, label: 'Evenman' },
      volunteers: { value: 0, label: 'Volontè' }
    };
  },

  /**
   * Set demo stats for development (only used when explicitly enabled)
   */
  setDefaultStats() {
    this.stats = {
      active_members: { value: 2847, label: 'Manm Aktif' },
      departments: { value: 10, label: 'Depatman' },
      total_donations: { value: 1500000, label: 'Total Ranmase' },
      events_count: { value: 45, label: 'Evenman' },
      volunteers: { value: 850, label: 'Volontè' }
    };
  },
  
  /**
   * Display stats on the page
   */
  displayStats() {
    // Hero stats on homepage
    this.updateHeroStats();
    
    // Membership page stats
    this.updateMembershipStats();
    
    // Any other stats containers
    this.updateAllStatContainers();
    
    // Dispatch event to notify that stats are ready
    window.dispatchEvent(new CustomEvent('sitestats:ready', { 
      detail: { stats: this.stats } 
    }));
  },
  
  /**
   * Update hero section stats
   */
  updateHeroStats() {
    // Active members
    const memberStat = document.querySelector('.hero-stat-number[data-target]');
    if (memberStat && this.stats.active_members) {
      const target = this.stats.active_members.value;
      memberStat.textContent = this.formatNumber(target);
      memberStat.setAttribute('data-target', target);
    }
    
    // Departments
    const deptStat = document.querySelectorAll('.hero-stat-number[data-target]')[1];
    if (deptStat && this.stats.departments) {
      const target = this.stats.departments.value;
      deptStat.textContent = target;
      deptStat.setAttribute('data-target', target);
    }
  },
  
  /**
   * Update membership page stats
   */
  updateMembershipStats() {
    // Update member stats on membership page
    const statNumbers = document.querySelectorAll('.member-stat-number');
    const statLabels = document.querySelectorAll('.member-stat-label');
    
    if (statNumbers.length >= 2) {
      // First stat - active members
      if (this.stats.active_members) {
        statNumbers[0].textContent = this.formatNumber(this.stats.active_members.value) + '+';
        if (statLabels[0]) {
          statLabels[0].textContent = this.stats.active_members.label;
        }
      }
      
      // Second stat - departments
      if (this.stats.departments) {
        statNumbers[1].textContent = this.stats.departments.value;
        if (statLabels[1]) {
          statLabels[1].textContent = this.stats.departments.label;
        }
      }
    }
  },
  
  /**
   * Update all containers with data-stat attribute
   */
  updateAllStatContainers() {
    document.querySelectorAll('[data-stat]').forEach(container => {
      const statKey = container.getAttribute('data-stat');
      if (this.stats[statKey]) {
        const stat = this.stats[statKey];
        
        // Find value element - check for .stat-value or .hero-stat-number or .member-stat-number
        let valueEl = container.querySelector('.stat-value') || 
                      container.querySelector('.hero-stat-number') ||
                      container.querySelector('.member-stat-number');
        
        // If no specific value element found, use container itself if it has the number class
        if (!valueEl && container.classList.contains('hero-stat-number')) {
          valueEl = container;
        }
        if (!valueEl && container.classList.contains('member-stat-number')) {
          valueEl = container;
        }
        
        // Find label element
        let labelEl = container.querySelector('.stat-label') ||
                      container.querySelector('.hero-stat-label') ||
                      container.querySelector('.member-stat-label');
        
        // Update value with animation
        if (valueEl) {
          const currentValue = parseInt(valueEl.textContent.replace(/,/g, '')) || 0;
          const targetValue = stat.value;
          
          if (currentValue !== targetValue) {
            this.animateNumber(valueEl, currentValue, targetValue);
          }
        }
        
        // Update label
        if (labelEl) {
          labelEl.textContent = stat.label;
        }
      }
    });
  },
  
  /**
   * Animate number counting
   */
  animateNumber(element, start, end) {
    const duration = 1500;
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (end - start) * easeOut);
      
      element.textContent = this.formatNumber(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.textContent = this.formatNumber(end);
      }
    };
    
    requestAnimationFrame(animate);
  },
  
  /**
   * Format number with commas
   */
  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },
  
  /**
   * Get a specific stat value
   */
  getStat(key) {
    return this.stats[key] ? this.stats[key].value : 0;
  },
  
  /**
   * Refresh stats (call this after admin updates)
   */
  async refresh() {
    await this.fetchStats();
    this.displayStats();
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  SiteStats.init();
});

// Expose to window
window.SiteStats = SiteStats;
