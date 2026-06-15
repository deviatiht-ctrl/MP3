/**
 * MP3 - Donation Page
 * Multi-step donation wizard with automatic PLOP PLOP payment integration
 */

const PLOP_FUNCTION_URL = 'https://mdsozxohqoydegqyimrl.supabase.co/functions/v1/payment';
const PLOP_AUTO_METHODS = ['moncash', 'natcash', 'kashpaw'];

function plopFetch(payload) {
  const key = window.MP3_ANON_KEY || '';
  return fetch(PLOP_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'apikey': key,
    },
    body: JSON.stringify(payload),
  });
}

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
  currentDonationId: null,
  currentPlopRef: null,
  pollInterval: null,

  async init() {
    await this.loadCauses();
    await this.loadImpactData();
    this.setupSteps();
    this.setupAmounts();
    this.setupPaymentMethods();
    this.setupForm();
    this.checkPendingVerification();
  },

  /**
   * Load donation causes
   */
  async loadCauses() {
    try {
      const db = await waitForSupabase();
      if (!db) {
        this.renderCauses(this.getFallbackCauses());
        return;
      }

      const { data, error } = await db
        .from('mp3_causes')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        this.renderCauses(this.getFallbackCauses());
      } else {
        this.renderCauses(data);
      }
    } catch (error) {
      console.error('Error loading causes:', error);
      this.renderCauses(this.getFallbackCauses());
    }
  },

  /**
   * Get fallback causes when DB fails
   */
  getFallbackCauses() {
    return [
      { name: 'Sipò Jeneral', icon: 'heart', description: 'Finanse tout aktivite prensipal prensipal yo nan tout kominote yo.' },
      { name: 'Kanpay Eleksyon', icon: 'vote', description: 'Sipòte kandida nou yo pou pote vwa pèp la nan eleksyon yo.' },
      { name: 'Pwogram Kominotè', icon: 'users', description: 'Sipòte aktivite ak pwojè sosyal nou yo nan katye yo.' }
    ];
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
      if (!db) {
        this.useFallbackImpactData();
        return;
      }

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

      // Update total display (both legacy and new class)
      const totalEl = document.querySelector('.don-total-value');
      const totalElBig = document.querySelector('.don-total-value-big');
      if (totalEl) {
        totalEl.textContent = totalHTG.toLocaleString('fr-FR');
      }
      if (totalElBig) {
        totalElBig.textContent = 'HTG ' + totalHTG.toLocaleString('fr-FR');
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
      this.useFallbackImpactData();
    }
  },

  /**
   * Use fallback impact data when DB fails
   */
  useFallbackImpactData() {
    const totalEl = document.querySelector('.don-total-value');
    const totalElBig = document.querySelector('.don-total-value-big');
    if (totalEl) {
      totalEl.textContent = '450.000';
    }
    if (totalElBig) {
      totalElBig.textContent = 'HTG 450,000';
    }

    this.renderRecentDonations([
      { donor_name: 'M. Jean', amount: 5000, currency: 'HTG', is_anonymous: false },
      { donor_name: 'Anonim', amount: 1500, currency: 'HTG', is_anonymous: true },
      { donor_name: 'Mme. Pierre', amount: 10000, currency: 'HTG', is_anonymous: false }
    ]);
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
      const amount = typeof I18n !== 'undefined' ? I18n.formatCurrency(d.amount, d.currency) : (d.currency + ' ' + d.amount.toLocaleString());

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

    // Show/hide bank reference field on step 4
    if (step === 4) {
      const bankRefGroup = document.querySelector('.don-bank-ref-group');
      if (bankRefGroup) {
        bankRefGroup.style.display =
          this.donation.paymentMethod === 'bank_transfer' ? '' : 'none';
      }
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

        if (typeof lucide !== 'undefined') lucide.createIcons();
      });
    });

    // Load payment info from settings
    this.loadPaymentSettings();
  },

  /**
   * Load payment settings (bank info for manual transfer)
   */
  async loadPaymentSettings() {
    try {
      const db = await waitForSupabase();
      if (!db) return;

      const { data, error } = await db
        .from('mp3_settings')
        .select('bank_name, bank_account, bank_owner')
        .single();

      if (error) throw error;

      const bankEl = document.querySelector('.don-bank-info');
      if (bankEl && data.bank_name) {
        bankEl.innerHTML = `
          <p><i data-lucide="landmark" style="width:14px;height:14px;"></i> <strong>Bank:</strong> ${data.bank_name}</p>
          <p><i data-lucide="hash" style="width:14px;height:14px;"></i> <strong>Kont:</strong> ${data.bank_account || '—'}</p>
          <p><i data-lucide="user" style="width:14px;height:14px;"></i> <strong>Non:</strong> ${data.bank_owner || 'Mouvman Pèp pou Pwosperite ak Pwogrè'}</p>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    } catch (error) {
      console.error('Error loading payment settings:', error);
    }
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
   * Process the donation — routes to automatic or manual flow
   */
  async processDonation() {
    const method = this.donation.paymentMethod;
    if (PLOP_AUTO_METHODS.includes(method)) {
      await this.processAutoDonation();
    } else {
      await this.processManualDonation();
    }
  },

  /**
   * Automatic donation via PLOP PLOP (MonCash, NatCash, KashPaw)
   */
  async processAutoDonation() {
    try {
      const name = document.querySelector('[name="donor_name"]')?.value;
      const email = document.querySelector('[name="donor_email"]')?.value;
      const phone = document.querySelector('[name="donor_phone"]')?.value;
      const isAnonymous = document.querySelector('[name="is_anonymous"]')?.checked;
      const user = await Auth.getCurrentUser();

      const db = await waitForSupabase();
      if (!db) throw new Error('Baz done pa disponib');

      const { data: donData, error: donError } = await db
        .from('mp3_donations')
        .insert({
          donor_name: isAnonymous ? null : name,
          donor_email: email,
          donor_phone: phone,
          amount: this.donation.amount,
          currency: this.donation.currency,
          payment_method: this.donation.paymentMethod,
          cause: this.donation.cause,
          is_anonymous: isAnonymous,
          status: 'pending',
          user_id: user?.id || null
        })
        .select()
        .single();

      if (donError) throw donError;

      this.currentDonationId = donData.id;
      this.openPlopModal();

      const res = await plopFetch({
          action: 'create_payment',
          donation_id: donData.id,
          amount: this.donation.amount,
          method: this.donation.paymentMethod,
        });

      const result = await res.json();

      if (!result.success) {
        this.showPlopError(result.message || 'Erè PLOP PLOP. Tanpri eseye ankò.');
        return;
      }

      this.currentPlopRef = result.reference_id;
      sessionStorage.setItem('mp3_plop_pending', JSON.stringify({
        reference_id: result.reference_id,
        donation_id: donData.id,
        method: this.donation.paymentMethod,
        amount: this.donation.amount,
        currency: this.donation.currency,
        cause: this.donation.cause,
      }));

      this.openPlopTab(result.redirect_url, result.reference_id);

    } catch (error) {
      console.error('Auto donation error:', error);
      this.showPlopError('Erè pandan kreyasyon peman an: ' + error.message);
    }
  },

  /**
   * Manual donation (bank_transfer) — record + confirmation
   */
  async processManualDonation() {
    try {
      const name = document.querySelector('[name="donor_name"]')?.value;
      const email = document.querySelector('[name="donor_email"]')?.value;
      const phone = document.querySelector('[name="donor_phone"]')?.value;
      const isAnonymous = document.querySelector('[name="is_anonymous"]')?.checked;
      const message = document.querySelector('[name="message"]')?.value;
      const reference = document.querySelector('[name="payment_reference"]')?.value;
      const user = await Auth.getCurrentUser();

      const db = await waitForSupabase();
      if (!db) throw new Error('Baz done pa disponib');

      const { data, error } = await db
        .from('mp3_donations')
        .insert({
          donor_name: isAnonymous ? null : name,
          donor_email: email,
          donor_phone: phone,
          amount: this.donation.amount,
          currency: this.donation.currency,
          payment_method: this.donation.paymentMethod,
          payment_reference: reference || null,
          cause: this.donation.cause,
          message: message || null,
          is_anonymous: isAnonymous,
          status: 'pending',
          user_id: user?.id || null
        })
        .select()
        .single();

      if (error) throw error;

      this.showConfirmation(data);
    } catch (error) {
      console.error('Manual donation error:', error);
      alert('Erè pandan tranzaksyon an. Tanpri eseye ankò.');
    }
  },

  /**
   * Open PLOP PLOP payment modal (spinner state)
   */
  openPlopModal() {
    const modal = document.getElementById('donPlopModal');
    if (!modal) return;
    modal.style.display = 'flex';
    document.getElementById('donPlopSpinner').style.display = 'flex';
    document.getElementById('donPlopFrameWrap').style.display = 'none';
    document.getElementById('donPlopError').style.display = 'none';
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  /**
   * Close PLOP PLOP modal and stop polling
   */
  closePlopModal() {
    this.stopPlopPolling();
    const modal = document.getElementById('donPlopModal');
    if (modal) modal.style.display = 'none';
  },

  /**
   * Open payment URL in a new tab and show waiting/polling UI
   */
  openPlopTab(url, referenceId) {
    document.getElementById('donPlopSpinner').style.display = 'none';
    const wrap = document.getElementById('donPlopFrameWrap');
    wrap.style.display = 'flex';
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Open payment page in a new tab
    const payWindow = window.open(url, '_blank', 'noopener');

    // Wire up "Ouvri Ankò" button in case they closed the tab
    const reopenBtn = document.getElementById('donPlopReopenBtn');
    if (reopenBtn) {
      reopenBtn.onclick = () => window.open(url, '_blank', 'noopener');
    }

    // If popup was blocked, show fallback link
    if (!payWindow || payWindow.closed) {
      const desc = document.getElementById('donPlopWaitDesc');
      if (desc) desc.innerHTML =
        'Navigatè ou bloke popup. Klike sou bouton anba a pou ouvri paj peman an.';
      const title = document.getElementById('donPlopWaitTitle');
      if (title) title.textContent = 'Ouvri Paj Peman';
    }

    this.startPlopPolling(referenceId);
  },

  /**
   * Show error state in PLOP PLOP modal
   */
  showPlopError(message) {
    this.stopPlopPolling();
    document.getElementById('donPlopSpinner').style.display = 'none';
    const fw = document.getElementById('donPlopFrameWrap');
    if (fw) fw.style.display = 'none';
    const errEl = document.getElementById('donPlopError');
    errEl.style.display = 'flex';
    const msgEl = document.getElementById('donPlopErrorMsg');
    if (msgEl) msgEl.textContent = message;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  /**
   * Auto-poll PLOP PLOP every 5s until confirmed or timed out
   */
  startPlopPolling(referenceId) {
    this.stopPlopPolling();
    let attempts = 0;
    const maxAttempts = 72; // 6 minutes (72 × 5s)

    this.pollInterval = setInterval(async () => {
      attempts++;

      const pollMsg = document.getElementById('donPlopPollMsg');

      if (attempts >= maxAttempts) {
        this.stopPlopPolling();
        if (pollMsg) pollMsg.textContent = 'Tan pase. Klike "Anile" epi eseye ankò.';
        return;
      }

      try {
        const res = await plopFetch({ action: 'verify_payment', reference_id: referenceId });
        const result = await res.json();

        if (result.is_confirmed) {
          this.stopPlopPolling();
          sessionStorage.removeItem('mp3_plop_pending');
          this.closePlopModal();
          this.showConfirmation({
            cause: this.donation.cause,
            amount: this.donation.amount,
            currency: this.donation.currency || 'HTG',
            payment_method: this.donation.paymentMethod,
            id: this.currentDonationId,
          });
        } else if (result.trans_status === 'failed') {
          this.stopPlopPolling();
          this.showPlopError('Peman echwe. Tanpri eseye ankò.');
        } else if (pollMsg) {
          const remaining = Math.round((maxAttempts - attempts) * 5 / 60);
          pollMsg.textContent = `Verifikasyon otomatik ap fèt... (${remaining} min)`;
        }
      } catch {
        // ignore transient network errors, keep polling
      }
    }, 5000);
  },

  /**
   * Stop auto-polling
   */
  stopPlopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  },

  /**
   * Check sessionStorage for a pending PLOP PLOP payment on page load
   */
  checkPendingVerification() {
    const raw = sessionStorage.getItem('mp3_plop_pending');
    if (!raw) return;

    try {
      const pending = JSON.parse(raw);
      if (!pending?.reference_id) return;

      const banner = document.createElement('div');
      banner.className = 'don-pending-banner';
      banner.innerHTML = `
        <i data-lucide="clock" style="width:16px;height:16px;"></i>
        <span>Ou gen yon peman <strong>${pending.method?.toUpperCase()}</strong> ki pa konfime.</span>
        <button class="btn btn-primary" style="padding:4px 12px;font-size:var(--text-sm);"
          id="donVerifyPendingBtn">Vérifier</button>
        <button class="btn btn-ghost" style="padding:4px 8px;font-size:var(--text-sm);"
          id="donDismissPendingBtn">Rejte</button>
      `;
      document.querySelector('.don-container-full')?.prepend(banner);
      if (typeof lucide !== 'undefined') lucide.createIcons();

      document.getElementById('donVerifyPendingBtn')?.addEventListener('click', () => {
        this.currentPlopRef = pending.reference_id;
        this.openPlopModal();
        this.startPlopPolling(pending.reference_id);
        // Show frame wrap directly (payment already opened before)
        document.getElementById('donPlopSpinner').style.display = 'none';
        document.getElementById('donPlopFrameWrap').style.display = 'flex';
        if (typeof lucide !== 'undefined') lucide.createIcons();
      });

      document.getElementById('donDismissPendingBtn')?.addEventListener('click', () => {
        sessionStorage.removeItem('mp3_plop_pending');
        banner.remove();
      });
    } catch {
      sessionStorage.removeItem('mp3_plop_pending');
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
