/** Normalise a phone number to WhatsApp's international digits (Ghana-aware). */
export function toWhatsAppDigits(raw: string): string {
  let d = String(raw ?? '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 10 && d.startsWith('0')) d = '233' + d.slice(1); // 024xxxxxxx → 23324xxxxxxx
  if (d.length === 9) d = '233' + d;
  return d;
}

/** wa.me link that opens a chat with `text` pre-typed. */
export function whatsappLink(phone: string, text?: string): string {
  const base = `https://wa.me/${toWhatsAppDigits(phone)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** "233241234567" → "+233 24 123 4567" for display. */
export function formatPhone(digits: string): string {
  const d = toWhatsAppDigits(digits);
  return d.startsWith('233') && d.length === 12
    ? `+233 ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8)}`
    : `+${d}`;
}
