// Social share-intent URL builders. Each opens the platform's prefilled share
// dialog with the given link (and text, where the platform supports it —
// Facebook/LinkedIn ignore custom text and build their card from the page's
// Open Graph tags instead).

export type ShareTargetKey =
  | "x"
  | "facebook"
  | "linkedin"
  | "whatsapp"
  | "telegram"
  | "reddit"
  | "email";

export interface ShareTarget {
  key: ShareTargetKey;
  label: string;
  /** Brand accent colour for the menu dot. */
  color: string;
  /** The share-intent URL (or mailto:) to open. */
  href: string;
}

/** Short prefilled message for targets that accept custom text. */
export function shareText(query: string, productName?: string | null): string {
  const subject = (productName || query || "my picks").trim();
  return `Check out these BestAIBuys picks for "${subject}"`;
}

/** Build the ordered list of web share targets for a link + message. */
export function buildShareTargets(url: string, text: string): ShareTarget[] {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  const textAndUrl = encodeURIComponent(`${text} ${url}`);
  return [
    { key: "x", label: "X", color: "#000000", href: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
    { key: "facebook", label: "Facebook", color: "#1877F2", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { key: "linkedin", label: "LinkedIn", color: "#0A66C2", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { key: "whatsapp", label: "WhatsApp", color: "#25D366", href: `https://wa.me/?text=${textAndUrl}` },
    { key: "telegram", label: "Telegram", color: "#26A5E4", href: `https://t.me/share/url?url=${u}&text=${t}` },
    { key: "reddit", label: "Reddit", color: "#FF4500", href: `https://www.reddit.com/submit?url=${u}&title=${t}` },
    { key: "email", label: "Email", color: "#6B7280", href: `mailto:?subject=${t}&body=${encodeURIComponent(`${text}\n\n${url}`)}` },
  ];
}
