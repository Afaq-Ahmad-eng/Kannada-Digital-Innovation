import nodemailer from 'nodemailer';
import { env } from '../../config';
import { log } from '../../shared/logger';
import { monitoringRepository } from '../monitoring/monitoring.repository';

export interface DispatchResult {
  channel: 'EMAIL' | 'WHATSAPP';
  status: 'SENT' | 'SKIPPED' | 'FAILED';
  detail?: string;
}

const transporter = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    })
  : null;

async function sendEmail(to: string, subject: string, text: string): Promise<DispatchResult> {
  if (!transporter) {
    log.info({ to, subject }, '[dry-run] email (SMTP_HOST not configured)');
    return { channel: 'EMAIL', status: 'SKIPPED', detail: 'SMTP not configured' };
  }
  try {
    await transporter.sendMail({ from: env.EMAIL_FROM, to, subject, text });
    return { channel: 'EMAIL', status: 'SENT' };
  } catch (err) {
    log.error({ err }, 'email send failed');
    return { channel: 'EMAIL', status: 'FAILED', detail: (err as Error).message };
  }
}

/** WhatsApp Business Cloud API. Note: business-initiated messages outside a 24h window must use approved templates. */
async function sendWhatsApp(phone: string, text: string): Promise<DispatchResult> {
  if (!env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    log.info({ phone: phone.slice(0, 4) + '***' }, '[dry-run] whatsapp (credentials not configured)');
    return { channel: 'WHATSAPP', status: 'SKIPPED', detail: 'WhatsApp not configured' };
  }
  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${env.WHATSAPP_TOKEN}` },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: phone.replace(/\D/g, ''), type: 'text', text: { body: text } }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return { channel: 'WHATSAPP', status: 'FAILED', detail: `HTTP ${res.status}` };
    return { channel: 'WHATSAPP', status: 'SENT' };
  } catch (err) {
    return { channel: 'WHATSAPP', status: 'FAILED', detail: (err as Error).message };
  }
}

export const dispatchService = {
  async notifyUser(userId: string, subject: string, message: string, only?: ('EMAIL' | 'WHATSAPP')[]): Promise<DispatchResult[]> {
    const contact = await monitoringRepository.getContact(userId);
    if (!contact) return [{ channel: 'EMAIL', status: 'SKIPPED', detail: 'No contact details on file' }];
    const channels = (only ?? contact.channels) as ('EMAIL' | 'WHATSAPP')[];
    const results: DispatchResult[] = [];
    if (channels.includes('EMAIL') && contact.email) results.push(await sendEmail(contact.email, subject, message));
    if (channels.includes('WHATSAPP')) {
      results.push(contact.phone ? await sendWhatsApp(contact.phone, `${subject}\n${message}`) : { channel: 'WHATSAPP', status: 'SKIPPED', detail: 'No phone number' });
    }
    return results;
  },
};
