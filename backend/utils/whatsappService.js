/**
 * whatsappService.js
 * ─────────────────────────────────────────────────────────────────────
 * Utility for sending WhatsApp messages via HTTP gateway.
 *
 * Supports three providers (switch via WHATSAPP_PROVIDER env var):
 *   • "ultramsg"  — UltraMsg.com REST API (default, easy setup)
 *   • "twilio"    — Twilio WhatsApp Sandbox / Business API
 *   • "meta"      — Meta Cloud API (Official WhatsApp Business API)
 *
 * If no credentials are set the function logs to console only (dev mode).
 *
 * Environment variables needed (add to backend/.env):
 *   WHATSAPP_PROVIDER=ultramsg          # or twilio / meta
 *
 *   # UltraMsg
 *   ULTRAMSG_INSTANCE_ID=yourInstanceId
 *   ULTRAMSG_TOKEN=yourToken
 *
 *   # Twilio
 *   TWILIO_ACCOUNT_SID=ACxxxxxxxx
 *   TWILIO_AUTH_TOKEN=xxxxxxxx
 *   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
 *
 *   # Meta Cloud API
 *   META_WHATSAPP_PHONE_NUMBER_ID=xxxxxxxx
 *   META_WHATSAPP_TOKEN=EAAxxxxxxxx
 */

import https from 'https';
import http from 'http';

// ─── Normalise phone number ────────────────────────────────────────────────────
/**
 * Strips spaces/dashes, ensures leading +.
 * e.g. "0771234567" → "+94771234567" when countryCode = "94"
 */
export const normalisePhone = (raw, defaultCountryCode = '94') => {
  if (!raw) return null;
  let phone = String(raw).replace(/[\s\-().]/g, '');
  if (phone.startsWith('00')) phone = '+' + phone.slice(2);
  if (phone.startsWith('0')) phone = '+' + defaultCountryCode + phone.slice(1);
  if (!phone.startsWith('+')) phone = '+' + defaultCountryCode + phone;
  return phone;
};

// ─── Provider implementations ──────────────────────────────────────────────────

const sendViaUltraMsg = async (to, message) => {
  const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
  const token = process.env.ULTRAMSG_TOKEN;
  if (!instanceId || !token) throw new Error('UltraMsg credentials not configured.');

  const body = new URLSearchParams({ token, to, body: message }).toString();
  return httpPost(
    `https://api.ultramsg.com/${instanceId}/messages/chat`,
    body,
    { 'Content-Type': 'application/x-www-form-urlencoded' }
  );
};

const sendViaTwilio = async (to, message) => {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
  if (!sid || !token) throw new Error('Twilio credentials not configured.');

  const body = new URLSearchParams({
    From: from,
    To: `whatsapp:${to}`,
    Body: message,
  }).toString();

  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  return httpPost(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    body,
    { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${auth}` }
  );
};

const sendViaMeta = async (to, message) => {
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.META_WHATSAPP_TOKEN;
  if (!phoneNumberId || !accessToken) throw new Error('Meta WhatsApp credentials not configured.');

  const payload = JSON.stringify({
    messaging_product: 'whatsapp',
    to: to.replace('+', ''),
    type: 'text',
    text: { body: message },
  });

  return httpPost(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
    payload,
    { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }
  );
};

// ─── Generic HTTP POST helper ──────────────────────────────────────────────────

const httpPost = (url, body, headers = {}) =>
  new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: { ...headers, 'Content-Length': Buffer.byteLength(body) },
    };
    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ statusCode: res.statusCode, body: data });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });

// ─── Message Templates ─────────────────────────────────────────────────────────

export const TEMPLATES = {
  payment_received: (name, amount, receipt, balance) =>
    `✅ *Payment Received*\n\nDear *${name}*,\n\nYour payment of *$${Number(amount).toFixed(2)}* has been recorded.\n🧾 Receipt: *${receipt}*\n💰 Remaining Balance: *$${Number(balance).toFixed(2)}*\n\nThank you for your timely payment!\n\n— MicroFinance Team`,

  loan_approved: (name, amount, policy, nextDue) =>
    `🎉 *Loan Approved & Disbursed*\n\nDear *${name}*,\n\nYour loan of *$${Number(amount).toFixed(2)}* under policy *${policy}* has been approved and disbursed.\n📅 First repayment due: *${nextDue}*\n\nPlease ensure timely repayments to maintain a good credit score.\n\n— MicroFinance Team`,

  loan_completed: (name, amount) =>
    `🏆 *Loan Fully Repaid!*\n\nDear *${name}*,\n\nCongratulations! You have successfully repaid your entire loan of *$${Number(amount).toFixed(2)}*.\n\nThank you for being a valued customer.\n\n— MicroFinance Team`,

  bulk_payment: (name, amount, receipt) =>
    `✅ *Payment Collected*\n\nDear *${name}*,\n\nA payment of *$${Number(amount).toFixed(2)}* has been recorded during the center collection.\n🧾 Receipt: *${receipt}*\n\n— MicroFinance Team`,
};

// ─── Main exported function ────────────────────────────────────────────────────

/**
 * Send a WhatsApp message.
 *
 * @param {string} phone - Customer phone (raw format, will be normalised)
 * @param {string} message - The text body to send
 * @param {string} [countryCode='94'] - Default country code for local numbers
 * @returns {Promise<{success: boolean, provider: string, to: string}>}
 */
export const sendWhatsApp = async (phone, message, countryCode = '94') => {
  const to = normalisePhone(phone, countryCode);

  if (!to) {
    console.warn('[WhatsApp] Invalid phone number — skipped.');
    return { success: false, reason: 'invalid_phone' };
  }

  const provider = (process.env.WHATSAPP_PROVIDER || 'ultramsg').toLowerCase();
  const devMode = !process.env.ULTRAMSG_TOKEN && !process.env.TWILIO_AUTH_TOKEN && !process.env.META_WHATSAPP_TOKEN;

  // ── Development / Test mode ────────────────────────────────────────
  if (devMode) {
    console.log('\n📱 [WhatsApp DEV MODE] ─────────────────────────────────');
    console.log(`   To      : ${to}`);
    console.log(`   Provider: ${provider}`);
    console.log(`   Message :\n${message}`);
    console.log('────────────────────────────────────────────────────────\n');
    return { success: true, provider: 'dev_console', to };
  }

  // ── Live API call ──────────────────────────────────────────────────
  try {
    let result;
    if (provider === 'twilio') {
      result = await sendViaTwilio(to, message);
    } else if (provider === 'meta') {
      result = await sendViaMeta(to, message);
    } else {
      result = await sendViaUltraMsg(to, message);
    }
    console.log(`[WhatsApp] ✅ Sent to ${to} via ${provider}`);
    return { success: true, provider, to, result };
  } catch (err) {
    // Never throw — notification failure must not break the main transaction
    console.error(`[WhatsApp] ❌ Failed to send to ${to} via ${provider}:`, err.message);
    return { success: false, provider, to, error: err.message };
  }
};
