// Email delivery for CRM campaigns.
//
// Default mode is "simulated": recipients and per-recipient status are recorded
// in the DB and shown in the admin UI, but no real email leaves the server.
// To send real email later, set SMTP_* env vars and install nodemailer — the
// `realSend` seam below is the only place that needs wiring.

const SMTP_CONFIGURED = !!(process.env.SMTP_HOST && process.env.SMTP_USER);

export function mailMode() {
  return SMTP_CONFIGURED ? 'smtp' : 'simulated';
}

// Seam for a real provider. Returns true on success. Kept dependency-free so
// the project runs without nodemailer installed; wire it when SMTP is ready.
async function realSend(/* { to, subject, html } */) {
  // Example (after `npm i nodemailer`):
  //   const nodemailer = await import('nodemailer');
  //   const tx = nodemailer.createTransport({ host: process.env.SMTP_HOST, ... });
  //   await tx.sendMail({ from: process.env.SMTP_FROM, to, subject, html });
  return false;
}

// Send a single transactional email (e.g. password reset). In simulated mode
// (no SMTP configured) it logs the content to the console so the link/code is
// still reachable during local development. Returns true on success.
export async function sendMail({ to, subject, html }) {
  if (mailMode() === 'smtp') return realSend({ to, subject, html });
  console.log(`[mailer:simulated] To: ${to}\nSubject: ${subject}\n${html}`);
  return true;
}

// Deliver one campaign to a list of recipients [{ id, email }]. In simulated
// mode it marks everyone "sent" and randomly flips a realistic share to
// "opened" so engagement metrics are demonstrable.
export async function deliverCampaign({ subject, body }, recipients) {
  const mode = mailMode();
  const results = [];
  for (const r of recipients) {
    let status = 'sent';
    if (mode === 'smtp') {
      const ok = await realSend({ to: r.email, subject, html: body });
      status = ok ? 'sent' : 'bounced';
    } else {
      // simulated engagement: ~55% open, ~3% bounce
      const roll = Math.random();
      status = roll < 0.03 ? 'bounced' : roll < 0.58 ? 'opened' : 'sent';
    }
    results.push({ user_id: r.id, email: r.email, status });
  }
  return { mode, results };
}
