// Runs automatically every time the booking form is submitted on the live site.
// Sends the booking to Telegram. Needs TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID set in Netlify.
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

exports.handler = async (event) => {
  const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_CHAT_ID: chat } = process.env;
  if (!token || !chat) return { statusCode: 200, body: 'Telegram not configured' };
  let d = {};
  try { d = JSON.parse(event.body).payload.data || {}; } catch (e) {}
  if (d.company) return { statusCode: 200, body: 'spam' }; // honeypot filled

  const digits = String(d.phone || '').replace(/\D/g, '');
  const intl = digits.length === 10 ? '1' + digits : digits;
  const vehicle = String(d.vehicle || '');
  const isLink = /^https?:\/\//i.test(vehicle.trim());
  const maps = d.location ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(d.location) : '';

  const lines = [
    '🚗 <b>New inspection booking</b>',
    '',
    `👤 <b>${esc(d.name)}</b>`,
    d.phone ? `📞 ${esc(d.phone)}` : '',
    intl ? `💬 <a href="https://wa.me/${intl}">WhatsApp ${esc(d.name || '')}</a>` : '',
    d.email ? `✉️ ${esc(d.email)}` : '',
    d.contact_pref ? `Prefers: ${esc(d.contact_pref)}` : '',
    '',
    isLink ? `🔗 <a href="${esc(vehicle.trim())}">Open the listing</a>` : `🚘 ${esc(vehicle)}`,
    d.asking ? `💲 Asking ${esc(d.asking)}` : '',
    d.seller ? `🏷 ${esc(d.seller)}` : '',
    d.location ? `📍 ${esc(d.location)}${maps ? ` · <a href="${esc(maps)}">Map</a>` : ''}` : '',
    d.date ? `📅 Preferred day: ${esc(d.date)}` : '',
    d.notes ? `\n📝 ${esc(d.notes)}` : '',
    '',
    '💳 They were sent to Stripe to pay. Check the Stripe app to confirm payment.'
  ].filter((l, i, a) => l !== '' || (a[i - 1] !== '' && i > 0));

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text: lines.join('\n'), parse_mode: 'HTML', disable_web_page_preview: true })
  });
  return { statusCode: 200, body: 'ok' };
};
