/**
 * MP3 - Hero Animations
 * GSAP-powered hero section animations
 */

const HeroAnimations = {
  init() {
    // Wait for GSAP to be ready
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.warn('GSAP not loaded, skipping hero animations');
      return;
    }
    
    this.animateHeroContent();
    this.animateHeroVisual();
    this.setupScrollAnimations();
    
    // Setup navbar scroll effect
    window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
    
    // Wait for site-stats to be ready before animating stats
    if (document.querySelector('.hero-stats')) {
      // Check if stats already loaded (from cache/default)
      if (window.SiteStats && window.SiteStats.stats && Object.keys(window.SiteStats.stats).length > 0) {
        this.animateStats();
      } else {
        // Wait for stats to be loaded from database
        window.addEventListener('sitestats:ready', () => {
          this.animateStats();
        }, { once: true });
        
        // Fallback: animate after 3 seconds if event never fires
        setTimeout(() => {
          this.animateStats();
        }, 3000);
      }
    }
  },

  /**
   * Animate hero text content
   */
  animateHeroContent() {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Eyebrow
    tl.from('.hero-eyebrow', {
      y: 30,
      opacity: 0,
      duration: 0.8
    })
    // Headline words
    .from('.hero-headline', {
      y: 50,
      opacity: 0,
      duration: 1
    }, '-=0.5')
    // Devise
    .from('.hero-devise', {
      y: 20,
      opacity: 0,
      duration: 0.6
    }, '-=0.6')
    // CTA buttons
    .from('.hero-cta', {
      y: 30,
      opacity: 0,
      duration: 0.6
    }, '-=0.4')
    // Stats
    .from('.hero-stats', {
      y: 30,
      opacity: 0,
      duration: 0.6
    }, '-=0.3');
  },

  /**
   * Animate hero visual elements
   */
  animateHeroVisual() {
    gsap.from('.hero-visual', {
      scale: 0.9,
      opacity: 0,
      duration: 1.2,
      ease: 'power2.out',
      delay: 0.3
    });

    // Animate bees with continuous rotation
    gsap.to('.bee', {
      rotation: 360,
      duration: 20,
      repeat: -1,
      ease: 'none',
      stagger: {
        each: 2,
        from: 'random'
      }
    });

    // Floating shapes
    gsap.utils.toArray('.geo-shape').forEach((shape, i) => {
      gsap.to(shape, {
        y: '+=15',
        rotation: '+=5',
        duration: 3 + i * 0.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    });
  },

  /**
   * Animate stats counter
   */
  animateStats() {
    const statNumbers = document.querySelectorAll('.hero-stat-number');
    
    statNumbers.forEach(stat => {
      // Read target from data-target attribute (set by site-stats.js or HTML)
      const target = parseInt(stat.getAttribute('data-target')) || 0;
      
      // Get suffix (like "+" or ",") from original text if any
      let suffix = '';
      const parent = stat.closest('[data-stat]');
      if (parent && parent.getAttribute('data-stat') === 'active_members') {
        suffix = '+';  // Add + suffix for member count
      }
      
      gsap.from(stat, {
        textContent: 0,
        duration: 2,
        ease: 'power2.out',
        snap: { textContent: 1 },
        stagger: 0.2,
        onUpdate: function() {
          const current = Math.ceil(this.targets()[0].textContent);
          stat.textContent = current.toLocaleString() + suffix;
        },
        onComplete: function() {
          // Ensure final value is correctly formatted
          stat.textContent = target.toLocaleString() + suffix;
        }
      });
    });
  },

  /**
   * Setup scroll-triggered animations
   */
  setupScrollAnimations() {
    // Mission section cards
    gsap.utils.toArray('.mission-pillar').forEach((card, i) => {
      gsap.from(card, {
        scrollTrigger: {
          trigger: card,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        delay: i * 0.15,
        ease: 'power3.out'
      });
    });

    // Candidate cards
    gsap.utils.toArray('.candidat-card').forEach((card, i) => {
      gsap.from(card, {
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        },
        y: 40,
        opacity: 0,
        duration: 0.6,
        delay: i * 0.1,
        ease: 'power2.out'
      });
    });

    // News cards
    gsap.utils.toArray('.actualite-card, .actualite-featured').forEach((card, i) => {
      gsap.from(card, {
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        },
        y: 30,
        opacity: 0,
        duration: 0.6,
        delay: i * 0.1,
        ease: 'power2.out'
      });
    });
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Delay to ensure GSAP is loaded
  setTimeout(() => HeroAnimations.init(), 100);
});

window.HeroAnimations = HeroAnimations;
