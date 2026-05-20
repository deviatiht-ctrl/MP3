/**
 * MP3 - Email Service
 * Uses Brevo (formerly Sendinblue) Transactional Email API.
 * No external library needed — pure fetch.
 */

const EmailService = {

  // ─── Configuration ────────────────────────────────────────────────────────
  config: {
    apiKey:   window.MP3_BREVO_KEY || '',
    endpoint: 'https://api.brevo.com/v3/smtp/email',
    sender: {
      name:  'MP3 — Mouvman Pèp pou Pwosperite ak Pwogrè',
      email: 'contact@mp3.ht'   // ← must be verified in your Brevo account
    },
    replyTo: { email: 'contact@mp3.ht' }
  },

  _ready: true,

  // ─── Init ──────────────────────────────────────────────────────────────────
  init() {
    console.log('[EmailService] Brevo ready.');
  },

  // ─── Core send ────────────────────────────────────────────────────────────
  async send(to_email, to_name, subject, html_content) {
    try {
      const body = {
        sender:      this.config.sender,
        to:          [{ email: to_email, name: to_name || '' }],
        replyTo:     this.config.replyTo,
        subject,
        htmlContent: html_content
      };

      const res = await fetch(this.config.endpoint, {
        method:  'POST',
        headers: {
          'accept':       'application/json',
          'api-key':      this.config.apiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
      }

      console.log(`[EmailService] Sent to ${to_email} ✓`);
      return { success: true };
    } catch (error) {
      console.error(`[EmailService] Failed to send to ${to_email}:`, error);
      return { success: false, error: error.message };
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
