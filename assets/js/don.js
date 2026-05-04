/**
 * MP3 - Donation Page
 * Multi-step donation wizard with payment methods
 */

const DonPage = {
  currentStep: 1,
  totalSteps: 5,
  donation: {
    cause: null,
    amount: null,
    currency: 'HTG',
    paymentMethod: null,
    donorInfo: {}
  },
  stripe: null,
  cardElement: null,

  async init() {
    await this.loadCauses();
    await this.loadImpactData();
    this.setupSteps();
    this.setupAmounts();
    this.setupPaymentMethods();
    this.setupForm();
  },

  /**
   * Load donation causes
   */
  async loadCauses() {
    try {
      const db = await waitForSupabase();
      if (!db) return;

      const { data, error } = await db
        .from('mp3_causes')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      this.renderCauses(data || []);
    } catch (error) {
      console.error('Error loading causes:', error);
    }
  },

  /**
   * Render causes selection
   */
  renderCauses(causes) {
    const grid = document.querySelector('.don-causes-grid');
    if (!grid) return;

    grid.innerHTML = causes.map(c => `
      <div class="don-cause-card" data-cause="${c.name}">
        <div class="don-cause-icon">
          <i data-lucide="${c.icon || 'heart'}" style="width: 24px; height: 24px;"></i>
        </div>
        <h4 class="don-cause-name">${c.name}</h4>
        <p class="don-cause-desc">${c.description || ''}</p>
        ${c.goal_amount ? `
          <div style="margin-top: var(--space-3); font-size: var(--text-xs); color: var(--clr-text-muted);">
            Objektif: ${I18n.formatCurrency(c.goal_amount, 'HTG')}
          </div>
        ` : ''}
      </div>
    `).join('');

    // Add click handlers
    grid.querySelectorAll('.don-cause-card').forEach(card => {
      card.addEventListener('click', () => {
        grid.querySelectorAll('.don-cause-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.donation.cause = card.getAttribute('data-cause');
      });
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  /**
   * Load impact data (total raised, recent donations)
   */
  async loadImpactData() {
    try {
      const db = await waitForSupabase();
      if (!db) return;

      // Get total confirmed donations
      const { data: totalData, error: totalError } = await db
        .from('mp3_donations')
        .select('amount, currency')
        .eq('status', 'confirmed');

      if (totalError) throw totalError;

      // Calculate total in HTG (simplified conversion)
      let totalHTG = 0;
      totalData.forEach(d => {
        if (d.currency === 'HTG') totalHTG += d.amount;
        else if (d.currency === 'USD') totalHTG += d.amount * 130; // Approximate rate
        else if (d.currency === 'EUR') totalHTG += d.amount * 140;
      });

      // Update total display
      const totalEl = document.querySelector('.don-total-value');
      if (totalEl) {
        totalEl.textContent = totalHTG.toLocaleString('fr-FR');
      }

      // Get recent donations
      const { data: recentData, error: recentError } = await db
        .from('mp3_donations')
        .select('*')
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;

      this.renderRecentDonations(recentData || []);
    } catch (error) {
      console.error('Error loading impact data:', error);
    }
  },

  /**
   * Render recent donations list
   */
  renderRecentDonations(donations) {
    const list = document.querySelector('.don-recent-list');
    if (!list) return;

    list.innerHTML = donations.map(d => {
      const name = d.is_anonymous ? 'Anonim' : (d.donor_name || 'Yon zanmi');
      const initial = name.charAt(0).toUpperCase();
      const amount = I18n.formatCurrency(d.amount, d.currency);

      return `
        <div class="don-recent-item">
          <div class="don-recent-donor">
            <div class="don-recent-avatar">${initial}</div>
            <span class="don-recent-name">${name}</span>
          </div>
          <span class="don-recent-amount">${amount}</span>
        </div>
      `;
    }).join('');
  },

  /**
   * Setup step navigation
   */
  setupSteps() {
    document.querySelectorAll('.don-step-next').forEach(btn => {
      btn.addEventListener('click', () => this.nextStep());
    });

    document.querySelectorAll('.don-step-prev').forEach(btn => {
      btn.addEventListener('click', () => this.prevStep());
    });

    this.updateStepIndicator();
  },

  /**
   * Go to next step
   */
  nextStep() {
    if (this.validateCurrentStep()) {
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
        this.showStep(this.currentStep);
      }
    }
  },

  /**
   * Go to previous step
   */
  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.showStep(this.currentStep);
    }
  },

  /**
   * Show specific step
   */
  showStep(step) {
    document.querySelectorAll('.don-step-content').forEach((el, i) => {
      el.classList.toggle('active', i + 1 === step);
    });
    this.updateStepIndicator();

    // Initialize Stripe if on step 3 and Stripe selected
    if (step === 3 && this.donation.paymentMethod === 'stripe') {
      this.initStripe();
    }
  },

  /**
   * Update step indicator UI
   */
  updateStepIndicator() {
    document.querySelectorAll('.don-step').forEach((step, i) => {
      step.classList.remove('active', 'completed');
      if (i + 1 < this.currentStep) {
        step.classList.add('completed');
      } else if (i + 1 === this.currentStep) {
        step.classList.add('active');
      }
    });
  },

  /**
   * Validate current step
   */
  validateCurrentStep() {
    switch (this.currentStep) {
      case 1:
        if (!this.donation.cause) {
          alert('Tanpri chwazi yon kòz pou don ou an.');
          return false;
        }
        return true;
      case 2:
        if (!this.donation.amount) {
          alert('Tanpri chwazi yon montan.');
          return false;
        }
        return true;
      case 3:
        if (!this.donation.paymentMethod) {
          alert('Tanpri chwazi yon metòd peman.');
          return false;
        }
        return true;
      default:
        return true;
    }
  },

  /**
   * Setup amount selection
   */
  setupAmounts() {
    const amountBtns = document.querySelectorAll('.don-amount-btn');
    const customInput = document.querySelector('.don-custom-amount input');
    const currencySelect = document.querySelector('.don-currency-select');

    amountBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        amountBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.donation.amount = parseFloat(btn.getAttribute('data-amount'));
      });
    });

    if (customInput) {
      customInput.addEventListener('input', (e) => {
        amountBtns.forEach(b => b.classList.remove('selected'));
        this.donation.amount = parseFloat(e.target.value) || null;
      });
    }

    if (currencySelect) {
      currencySelect.addEventListener('change', (e) => {
        this.donation.currency = e.target.value;
        this.updateAmountDisplay();
      });
    }
  },

  /**
   * Update amount display based on currency
   */
  updateAmountDisplay() {
    // Update amounts shown based on selected currency
    const rates = { HTG: 1, USD: 130, EUR: 140 };
    // Implementation would update the preset amount buttons
  },

  /**
   * Setup payment method tabs
   */
  setupPaymentMethods() {
    const tabs = document.querySelectorAll('.don-payment-tab');
    const contents = document.querySelectorAll('.don-payment-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const method = tab.getAttribute('data-method');
        this.donation.paymentMethod = method;

        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        contents.forEach(c => {
          c.classList.toggle('active', c.getAttribute('data-method') === method);
        });
      });
    });

    // Load payment info from settings
    this.loadPaymentSettings();
  },

  /**
   * Load payment settings (MonCash, NatCash numbers)
   */
  async loadPaymentSettings() {
    try {
      const db = await waitForSupabase();
      if (!db) return;

      const { data, error } = await db
        .from('mp3_settings')
        .select('moncash_number, natcash_number, stripe_publishable_key, paypal_client_id, bank_name, bank_account, bank_owner')
        .single();

      if (error) throw error;

      // Update MonCash number display
      const moncashEl = document.querySelector('.don-moncash-number');
      if (moncashEl && data.moncash_number) {
        moncashEl.textContent = data.moncash_number;
      }

      // Update NatCash number display
      const natcashEl = document.querySelector('.don-natcash-number');
      if (natcashEl && data.natcash_number) {
        natcashEl.textContent = data.natcash_number;
      }

      // Update bank info
      const bankEl = document.querySelector('.don-bank-info');
      if (bankEl && data.bank_name) {
        bankEl.innerHTML = `
          <p><strong>Bank:</strong> ${data.bank_name}</p>
          <p><strong>Kont:</strong> ${data.bank_account}</p>
          <p><strong>Non:</strong> ${data.bank_owner || 'Mouvman Pèp pou Pwosperite ak Pwogrè'}</p>
        `;
      }

      // Store Stripe key for later use
      if (data.stripe_publishable_key) {
        this.stripeKey = data.stripe_publishable_key;
      }

      // Store PayPal client ID
      if (data.paypal_client_id) {
        this.paypalClientId = data.paypal_client_id;
      }
    } catch (error) {
      console.error('Error loading payment settings:', error);
    }
  },

  /**
   * Initialize Stripe Elements
   */
  async initStripe() {
    if (!this.stripeKey || typeof Stripe === 'undefined') return;

    this.stripe = Stripe(this.stripeKey);
    const elements = this.stripe.elements();
    
    this.cardElement = elements.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#0A0A0A',
          '::placeholder': { color: '#9A9A9A' }
        }
      }
    });

    this.cardElement.mount('#card-element');
  },

  /**
   * Setup donor info form
   */
  setupForm() {
    const form = document.querySelector('.donor-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.processDonation();
    });

    // Setup submit buttons for each payment method
    document.querySelectorAll('.don-submit-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        await this.processDonation();
      });
    });
  },

  /**
   * Process the donation
   */
  async processDonation() {
    try {
      // Get donor info
      const name = document.querySelector('[name="donor_name"]')?.value;
      const email = document.querySelector('[name="donor_email"]')?.value;
      const phone = document.querySelector('[name="donor_phone"]')?.value;
      const isAnonymous = document.querySelector('[name="is_anonymous"]')?.checked;
      const message = document.querySelector('[name="message"]')?.value;
      const reference = document.querySelector('[name="payment_reference"]')?.value;

      // Get user if logged in
      const user = await Auth.getCurrentUser();

      // Create donation record
      const donationData = {
        donor_name: isAnonymous ? null : name,
        donor_email: email,
        donor_phone: phone,
        amount: this.donation.amount,
        currency: this.donation.currency,
        payment_method: this.donation.paymentMethod,
        payment_reference: reference,
        cause: this.donation.cause,
        message: message,
        is_anonymous: isAnonymous,
        status: this.donation.paymentMethod === 'moncash' || this.donation.paymentMethod === 'natcash' ? 'pending' : 'confirmed',
        user_id: user?.id || null
      };

      const db = await waitForSupabase();
      if (!db) throw new Error('Database not available');

      const { data, error } = await db
        .from('mp3_donations')
        .insert(donationData)
        .select()
        .single();

      if (error) throw error;

      // Show confirmation
      this.showConfirmation(data);

    } catch (error) {
      console.error('Donation error:', error);
      alert('Erè pandan tranzaksyon an. Tanpri eseye ankò.');
    }
  },

  /**
   * Show confirmation step
   */
  showConfirmation(donationData) {
    this.currentStep = 5;
    this.showStep(5);

    // Update summary
    const summary = document.querySelector('.don-summary');
    if (summary) {
      summary.innerHTML = `
        <div class="don-summary-row">
          <span>Kòz:</span>
          <span>${donationData.cause}</span>
        </div>
        <div class="don-summary-row">
          <span>Montan:</span>
          <span>${I18n.formatCurrency(donationData.amount, donationData.currency)}</span>
        </div>
        <div class="don-summary-row">
          <span>Metòd:</span>
          <span>${donationData.payment_method}</span>
        </div>
        <div class="don-summary-row">
          <span>Dat:</span>
          <span>${new Date().toLocaleDateString('fr-FR')}</span>
        </div>
      `;
    }

    // Setup receipt download
    const downloadBtn = document.querySelector('.don-download-receipt');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => this.generateReceipt(donationData));
    }
  },

  /**
   * Generate PDF receipt
   */
  generateReceipt(donationData) {
    if (typeof jspdf === 'undefined') {
      alert('PDF library not loaded');
      return;
    }

    const { jsPDF } = jspdf;
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text('Mouvman Pèp pou Pwosperite ak Pwogrè', 20, 30);
    
    doc.setFontSize(12);
    doc.text('Resi Don', 20, 45);

    // Receipt details
    doc.setFontSize(10);
    doc.text(`Nimewo Resi: ${donationData.id}`, 20, 60);
    doc.text(`Dat: ${new Date().toLocaleDateString('fr-FR')}`, 20, 70);
    doc.text(`Kòz: ${donationData.cause}`, 20, 80);
    doc.text(`Montan: ${I18n.formatCurrency(donationData.amount, donationData.currency)}`, 20, 90);
    doc.text(`Metòd Peman: ${donationData.payment_method}`, 20, 100);

    if (donationData.donor_name) {
      doc.text(`Donatè: ${donationData.donor_name}`, 20, 115);
    }

    // Footer
    doc.setFontSize(8);
    doc.text('Mèsi pou sipò ou!', 20, 140);
    doc.text('Delmas, Haïti', 20, 150);

    doc.save(`MP3-Resi-${donationData.id.slice(0, 8)}.pdf`);
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  DonPage.init();
});

window.DonPage = DonPage;
