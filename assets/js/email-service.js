/**
 * MP3 - Email Service
 * Uses EmailJS for client-side email delivery.
 *
 * SETUP (required once):
 * 1. Go to https://emailjs.com and create a free account
 * 2. Add an Email Service (Gmail, Outlook, etc.)
 * 3. Create a template with variables: {{to_email}}, {{to_name}}, {{subject}}, {{html_content}}
 *    - Set "Reply To" = {{reply_to}}
 *    - In the template body, add: {{{html_content}}} (triple braces for raw HTML)
 * 4. Replace the three config values below with your IDs
 */

const EmailService = {

  // ─── Configuration ────────────────────────────────────────────────────────
  config: {
    serviceId:  'YOUR_EMAILJS_SERVICE_ID',   // e.g. 'service_abc123'
    templateId: 'YOUR_EMAILJS_TEMPLATE_ID',  // e.g. 'template_xyz789'
    publicKey:  'YOUR_EMAILJS_PUBLIC_KEY',   // e.g. 'user_AbCdEfGhIjKlMn'
    fromName:   'MP3 — Mouvman Pèp pou Pwosperite ak Pwogrè',
    replyTo:    'contact@mp3.ht'
  },

  _ready: false,

  // ─── Init ──────────────────────────────────────────────────────────────────
  init() {
    if (typeof emailjs === 'undefined') {
      console.warn('[EmailService] EmailJS library not loaded.');
      return;
    }
    if (this.config.publicKey === 'YOUR_EMAILJS_PUBLIC_KEY') {
      console.warn('[EmailService] EmailJS not configured. Set config values in email-service.js');
      return;
    }
    emailjs.init(this.config.publicKey);
    this._ready = true;
    console.log('[EmailService] Ready.');
  },

  // ─── Core send ────────────────────────────────────────────────────────────
  async send(to_email, to_name, subject, html_content) {
    if (!this._ready) {
      console.warn('[EmailService] Not ready — email not sent to', to_email);
      return { success: false, error: 'EmailJS not configured' };
    }

    try {
      const params = {
        to_email,
        to_name:      to_name || '',
        subject,
        html_content,
        from_name:    this.config.fromName,
        reply_to:     this.config.replyTo,
      };

      const result = await emailjs.send(
        this.config.serviceId,
        this.config.templateId,
        params
      );
      console.log(`[EmailService] Sent to ${to_email} ✓`);
      return { success: true, result };
    } catch (error) {
      console.error(`[EmailService] Failed to send to ${to_email}:`, error);
      return { success: false, error };
    }
  },

  // ─── Typed senders ────────────────────────────────────────────────────────

  async sendMemberWelcome(member) {
    const { subject, html } = EmailTemplates.memberWelcome(member);
    return this.send(member.email, member.full_name || member.name, subject, html);
  },

  async sendMemberApproved(member) {
    const { subject, html } = EmailTemplates.memberApproved(member);
    return this.send(member.email, member.full_name || member.name, subject, html);
  },

  async sendMemberRejected(member, reason = '') {
    const { subject, html } = EmailTemplates.memberRejected({ ...member, reason });
    return this.send(member.email, member.full_name || member.name, subject, html);
  },

  async sendDonationConfirm(donation) {
    if (!donation.email) return { success: false, error: 'No email' };
    const { subject, html } = EmailTemplates.donationConfirm(donation);
    return this.send(donation.email, donation.name || donation.donor_name, subject, html);
  },

  async sendNewsAlert(news, subscriberEmails = []) {
    const { subject, html } = EmailTemplates.newsAlert(news);
    const results = [];
    for (const email of subscriberEmails) {
      const r = await this.send(email, '', subject, html);
      results.push({ email, ...r });
    }
    return results;
  },

  async sendEventReminder(event, subscriberEmails = []) {
    const { subject, html } = EmailTemplates.eventReminder(event);
    const results = [];
    for (const email of subscriberEmails) {
      const r = await this.send(email, '', subject, html);
      results.push({ email, ...r });
    }
    return results;
  },

  async sendCustom(to_email, to_name, subject_line, message_html) {
    const { subject, html } = EmailTemplates.custom({ to_name, subject_line, message_html });
    return this.send(to_email, to_name, subject, html);
  },

  // ─── Bulk: send to all active members ─────────────────────────────────────
  async broadcastToMembers(subject_line, message_html) {
    const db = window.db;
    if (!db) return { success: false, error: 'Supabase unavailable' };

    const { data: members, error } = await db
      .from('mp3_members')
      .select('email, full_name')
      .eq('status', 'active');

    if (error || !members?.length) return { success: false, error: error?.message || 'No members' };

    const results = [];
    for (const m of members) {
      const r = await this.sendCustom(m.email, m.full_name, subject_line, message_html);
      results.push({ email: m.email, ...r });
    }
    return { success: true, sent: results.length, results };
  }
};

// Auto-init when DOM ready
document.addEventListener('DOMContentLoaded', () => EmailService.init());

window.EmailService = EmailService;
