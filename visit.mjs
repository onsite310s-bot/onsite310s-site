// Called by the website when someone views it or taps WhatsApp / payment.
// Sends a short Telegram alert with the visitor's approximate city (no personal data).
const BOTS = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|headless|lighthouse|pingdom|uptime|monitor/i;
const LABEL = { view: '👀 Someone is on your website', wa: '💬 Someone tapped WhatsApp', pay: '💳 Someone went to payment', book: '📋 Someone opened the booking form' };

export default async (req, context) => {
  if (req.method !== 'POST') return new Response('ok');
  const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_CHAT_ID: chat, VISIT_ALERTS } = process.env;
  if (!token || !chat || VISIT_ALERTS === 'off') return new Response('off');
  const ua = req.headers.get('user-agent') || '';
  if (BOTS.test(ua)) return new Response('bot');
  let b = {};
  try { b = await req.json(); } catch (e) {}
  const kind = LABEL[b.e] ? b.e : 'view';
  const g = context.geo || {};
  const where = [g.city, g.subdivision && g.subdivision.code, g.country && g.country.code].filter(Boolean).join(', ');
  const device = /iPhone|iPad/.test(ua) ? 'iPhone/iPad' : /Android/.test(ua) ? 'Android' : /Mac/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows PC' : 'Other';
  let from = 'direct';
  try { if (b.ref) { const h = new URL(b.ref).hostname.replace(/^www\./, ''); from = /google/.test(h) ? 'Google' : /facebook|fb\./.test(h) ? 'Facebook' : /instagram/.test(h) ? 'Instagram' : /tiktok/.test(h) ? 'TikTok' : h; } } catch (e) {}
  const text = `${LABEL[kind]}\n📍 ${where || 'Unknown location'} · ${device}\n↪️ From: ${from}${b.path && b.path !== '/' ? `\n📄 ${b.path}` : ''}`;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text, disable_notification: kind === 'view' })
  });
  return new Response('ok');
};
