/**
 * MP3 - Email Templates
 * Beautiful HTML email templates for all transactional emails.
 * Each function returns { subject, html } ready to send.
 */

const EmailTemplates = {

  // ─── Shared wrapper ───────────────────────────────────────────────────────
  _wrap(preheader, body) {
    return `<!DOCTYPE html>
<html lang="ht">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>MP3</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<!-- preheader -->
<div style="display:none;max-height:0;overflow:hidden;color:#f4f4f4;">${preheader}</div>

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.10);">

      <!-- HEADER -->
      <tr>
        <td style="background:linear-gradient(135deg,#0a0a0a 0%,#1a1a2e 100%);padding:32px 40px;text-align:center;">
          <img src="https://mdsozxohqoydegqyimrl.supabase.co/storage/v1/object/public/mp3-settings/MP3LOGO.png"
               alt="MP3" width="80" style="display:inline-block;height:auto;" onerror="this.style.display='none'">
          <p style="margin:12px 0 0;font-family:Georgia,serif;font-size:13px;color:#c9a000;letter-spacing:3px;text-transform:uppercase;">Mouvman Pèp pou Pwosperite ak Pwogrè</p>
        </td>
      </tr>

      <!-- BODY -->
      <tr>
        <td style="padding:40px 40px 32px;">
          ${body}
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="background:#f9f9f9;border-top:1px solid #e8e8e8;padding:24px 40px;text-align:center;">
          <p style="margin:0 0 8px;font-size:12px;color:#999;">© ${new Date().getFullYear()} MP3 — Mouvman Pèp pou Pwosperite ak Pwogrè</p>
          <p style="margin:0;font-size:11px;color:#bbb;">Si ou resevwa imel sa pa erè, tanpri ignore li.</p>
          <div style="margin-top:16px;">
            <a href="https://mp3-haiti.netlify.app" style="display:inline-block;margin:0 6px;font-size:11px;color:#c9a000;text-decoration:none;">Site Web</a>
            <span style="color:#ddd;">|</span>
            <a href="mailto:contact@mp3.ht" style="display:inline-block;margin:0 6px;font-size:11px;color:#c9a000;text-decoration:none;">Kontakte Nou</a>
          </div>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
  },

  // ─── Helper: gold button ──────────────────────────────────────────────────
  _btn(text, url) {
    return `<div style="text-align:center;margin:32px 0;">
      <a href="${url}" style="display:inline-block;background:#c9a000;color:#0a0a0a;font-weight:700;font-size:14px;padding:14px 36px;border-radius:50px;text-decoration:none;letter-spacing:0.5px;">${text}</a>
    </div>`;
  },

  // ─── Helper: info row ─────────────────────────────────────────────────────
  _infoRow(label, value) {
    return `<tr>
      <td style="padding:10px 16px;font-size:13px;color:#666;width:40%;">${label}</td>
      <td style="padding:10px 16px;font-size:13px;color:#1a1a1a;font-weight:600;">${value || '—'}</td>
    </tr>`;
  },

  // ─── Helper: info table ───────────────────────────────────────────────────
  _infoTable(rows) {
    return `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8e8;border-radius:10px;overflow:hidden;margin:24px 0;">
      ${rows}
    </table>`;
  },

  // ─── 1. Member Welcome (auto on registration) ─────────────────────────────
  memberWelcome({ name, email, department, commune }) {
    const body = `
      <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:26px;color:#0a0a0a;">Byenveni nan MP3, ${name}! 🎉</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.7;">
        Nou resevwa demann adezyon ou avèk siksè. Ekip nou an ap revize dosye ou epi n ap kontakte ou trè vit.
      </p>

      <div style="background:linear-gradient(135deg,rgba(201,160,0,0.08),rgba(201,160,0,0.03));border-left:4px solid #c9a000;border-radius:0 8px 8px 0;padding:20px 24px;margin:0 0 28px;">
        <p style="margin:0;font-size:14px;color:#7a6000;font-weight:600;">📋 Enfòmasyon ou Soumèt</p>
      </div>

      ${this._infoTable(
        this._infoRow('Non Konplè', name) +
        this._infoRow('Imèl', email) +
        this._infoRow('Depatman', department) +
        this._infoRow('Komin', commune) +
        this._infoRow('Estati', '⏳ An Atant Validasyon')
      )}

      <p style="font-size:14px;color:#666;line-height:1.8;margin:24px 0 0;">
        Pandan w ap tann, ou ka vizite sit nou an pou jwenn plis enfòmasyon sou pwogram ak valè MP3.
      </p>
      ${this._btn('Vizite Sit MP3', 'https://mp3-haiti.netlify.app')}
      <p style="font-size:13px;color:#999;line-height:1.6;text-align:center;margin:0;">
        Pou nenpòt kesyon, ekri nou nan <a href="mailto:contact@mp3.ht" style="color:#c9a000;">contact@mp3.ht</a>
      </p>
    `;
    return {
      subject: `🎉 Byenveni nan MP3 — Demann ou Anrejistre, ${name}`,
      html: this._wrap(`Byenveni ${name}! Demann adezyon MP3 ou anrejistre avèk siksè.`, body)
    };
  },

  // ─── 2. Member Approved (manual by admin) ────────────────────────────────
  memberApproved({ name, email, member_code, department }) {
    const body = `
      <div style="text-align:center;margin-bottom:32px;">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:72px;height:72px;background:rgba(34,197,94,0.1);border-radius:50%;margin-bottom:16px;">
          <span style="font-size:36px;">✅</span>
        </div>
        <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:26px;color:#0a0a0a;">Kont ou Aktive!</h1>
        <p style="margin:0;font-size:15px;color:#555;">Felisitasyon ${name}, ou se kounye a yon manm ofisyèl MP3.</p>
      </div>

      ${this._infoTable(
        this._infoRow('Non Konplè', name) +
        this._infoRow('Imèl', email) +
        this._infoRow('Kòd Manm', member_code ? `<span style="font-family:monospace;background:#f0f0f0;padding:2px 8px;border-radius:4px;">${member_code}</span>` : '—') +
        this._infoRow('Depatman', department) +
        this._infoRow('Estati', '<span style="color:#22c55e;font-weight:700;">✓ Aktif</span>')
      )}

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px 24px;margin:24px 0;">
        <p style="margin:0;font-size:14px;color:#166534;line-height:1.7;">
          <strong>Kounye a ou ka:</strong><br>
          → Konekte nan kont ou sou sit MP3<br>
          → Patisipe nan aktivite ak evènman pati a<br>
          → Resevwa nouvèl ak mizajou dirèkteman nan bwat imèl ou
        </p>
      </div>

      ${this._btn('Konekte Kounye a', 'https://mp3-haiti.netlify.app/pages/login.html')}
    `;
    return {
      subject: `✅ Kont MP3 ou Aktive — Byenveni Ofisyèlman, ${name}!`,
      html: this._wrap(`${name}, kont manm MP3 ou aktive. Konekte kounye a!`, body)
    };
  },

  // ─── 3. Member Rejected ───────────────────────────────────────────────────
  memberRejected({ name, reason }) {
    const body = `
      <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:24px;color:#0a0a0a;">Bonjou ${name},</h1>
      <p style="font-size:15px;color:#555;line-height:1.8;margin:0 0 24px;">
        Aprè revizyon dosye ou, ekip MP3 pa ka aksepte demann adezyon ou pou kounye a.
      </p>
      ${reason ? `<div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:0 8px 8px 0;padding:16px 20px;margin:0 0 24px;">
        <p style="margin:0;font-size:14px;color:#7f1d1d;"><strong>Rezon:</strong> ${reason}</p>
      </div>` : ''}
      <p style="font-size:14px;color:#666;line-height:1.8;">
        Ou ka resoumèt demann ou pita oswa kontakte nou pou plis enfòmasyon.
      </p>
      ${this._btn('Kontakte Nou', 'mailto:contact@mp3.ht')}
    `;
    return {
      subject: `Demann Adezyon MP3 ou — Mizajou Enpòtan`,
      html: this._wrap(`Bonjou ${name}, enfòmasyon sou demann adezyon ou.`, body)
    };
  },

  // ─── 4. Donation Confirmation ─────────────────────────────────────────────
  donationConfirm({ name, amount, currency, cause, transaction_id }) {
    const formatted = new Intl.NumberFormat('fr-HT', { style: 'currency', currency: currency || 'USD' }).format(amount);
    const body = `
      <div style="text-align:center;margin-bottom:32px;">
        <span style="font-size:52px;">💛</span>
        <h1 style="margin:8px 0;font-family:Georgia,serif;font-size:26px;color:#0a0a0a;">Mèsi pou Jenerozite ou!</h1>
        <p style="margin:0;font-size:15px;color:#555;">Don ou enpòtan pou avni Ayiti.</p>
      </div>

      <div style="background:linear-gradient(135deg,#c9a000,#e6c200);border-radius:12px;padding:28px;text-align:center;margin:0 0 28px;">
        <p style="margin:0 0 4px;font-size:13px;color:rgba(10,10,10,0.6);text-transform:uppercase;letter-spacing:1px;">Montan Don</p>
        <p style="margin:0;font-family:Georgia,serif;font-size:42px;font-weight:700;color:#0a0a0a;">${formatted}</p>
      </div>

      ${this._infoTable(
        this._infoRow('Donateur', name) +
        this._infoRow('Kòz', cause) +
        this._infoRow('Nimewo Tranzaksyon', transaction_id ? `<code style="font-size:12px;">${transaction_id}</code>` : '—') +
        this._infoRow('Dat', new Date().toLocaleDateString('fr-HT')) +
        this._infoRow('Estati', '<span style="color:#22c55e;">✓ Konfime</span>')
      )}

      <p style="font-size:14px;color:#666;line-height:1.8;margin:24px 0;text-align:center;">
        Don ou ap ede nou bati yon Ayiti pi fò. Mèsi anpil.
      </p>
      ${this._btn('Wè Pwogram Nou yo', 'https://mp3-haiti.netlify.app')}
    `;
    return {
      subject: `💛 Mèsi pou Don ${formatted} ou — MP3`,
      html: this._wrap(`Mèsi ${name}! Nou resevwa don ${formatted} ou avèk siksè.`, body)
    };
  },

  // ─── 5. News / Actualité Alert ────────────────────────────────────────────
  newsAlert({ title, excerpt, cover_image_url, slug, category }) {
    const body = `
      <p style="margin:0 0 8px;font-size:12px;color:#c9a000;text-transform:uppercase;letter-spacing:2px;font-weight:700;">${category || 'Nouvèl MP3'}</p>
      <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:24px;color:#0a0a0a;line-height:1.4;">${title}</h1>

      ${cover_image_url ? `<img src="${cover_image_url}" alt="${title}" style="width:100%;height:240px;object-fit:cover;border-radius:10px;margin-bottom:24px;">` : ''}

      <p style="font-size:15px;color:#444;line-height:1.8;margin:0 0 28px;">${excerpt || ''}</p>

      ${this._btn('Li Atik Konplè a', `https://mp3-haiti.netlify.app/pages/actualites.html`)}

      <p style="font-size:12px;color:#999;text-align:center;">
        Ou resevwa imel sa paske ou se manm MP3.<br>
        <a href="mailto:contact@mp3.ht?subject=Dezabòne" style="color:#c9a000;">Dezabòne</a>
      </p>
    `;
    return {
      subject: `📰 Nouvèl MP3: ${title}`,
      html: this._wrap(`Nouvèl: ${title}`, body)
    };
  },

  // ─── 6. Custom / Manual Email ─────────────────────────────────────────────
  custom({ to_name, subject_line, message_html }) {
    const body = `
      <p style="font-size:15px;color:#555;margin:0 0 8px;">Bonjou${to_name ? ` ${to_name}` : ''},</p>
      <div style="font-size:15px;color:#333;line-height:1.9;">
        ${message_html}
      </div>
      <hr style="border:none;border-top:1px solid #e8e8e8;margin:32px 0;">
      <p style="font-size:13px;color:#999;margin:0;">
        Imel sa voye pa ekip MP3.<br>
        Pou nenpòt kesyon: <a href="mailto:contact@mp3.ht" style="color:#c9a000;">contact@mp3.ht</a>
      </p>
    `;
    return {
      subject: subject_line,
      html: this._wrap(subject_line, body)
    };
  },

  // ─── 7. Event Reminder ────────────────────────────────────────────────────
  eventReminder({ to_name, event_title, event_date, event_location, event_description }) {
    const body = `
      <div style="background:linear-gradient(135deg,#0a0a0a,#1a1a2e);border-radius:12px;padding:28px;text-align:center;margin:0 0 28px;">
        <p style="margin:0 0 4px;font-size:12px;color:#c9a000;text-transform:uppercase;letter-spacing:2px;">📅 Evènman k ap Vini</p>
        <h1 style="margin:8px 0 4px;font-family:Georgia,serif;font-size:22px;color:#fff;">${event_title}</h1>
        <p style="margin:0;font-size:14px;color:#c9a000;">${event_date} ${event_location ? '· ' + event_location : ''}</p>
      </div>

      ${event_description ? `<p style="font-size:15px;color:#444;line-height:1.8;margin:0 0 24px;">${event_description}</p>` : ''}

      ${this._btn('Wè Detay Evènman an', 'https://mp3-haiti.netlify.app/pages/agenda.html')}
    `;
    return {
      subject: `📅 Raple: ${event_title}`,
      html: this._wrap(`Raple evènman MP3: ${event_title}`, body)
    };
  }
};

window.EmailTemplates = EmailTemplates;
