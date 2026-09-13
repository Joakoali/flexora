const DEFAULT_NUMBER = "5491100000000";

export function whatsappHref(text: string, number?: string): string {
  const raw = number || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || DEFAULT_NUMBER;
  const digits = raw.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
