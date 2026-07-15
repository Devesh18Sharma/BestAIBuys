/**
 * The LLM occasionally emits non-emoji text into the icon slot:
 * a bullet ("•"), an arrow ("→"), prose ("ceremonial matcha"), or
 * even a URL. Rendering that in the option chip's emoji column makes
 * the chip look broken (or shows a glyph the user can't decode).
 *
 * This helper acts as a defensive filter — when it returns false, the
 * caller should drop the icon and show nothing (per Igor's suggestion
 * in the 2026-05-22 sync).
 *
 * Rule of thumb:
 *  - Non-empty after trim.
 *  - At most 12 codepoints — a real emoji is 1–8 codepoints (single
 *    glyph, flag pair, ZWJ family, keycap, etc.). Anything longer is
 *    descriptive prose.
 *  - Contains at least one Unicode codepoint flagged as either
 *    `Extended_Pictographic` (the canonical emoji set) or
 *    `Regional_Indicator` (the two-codepoint flag building blocks).
 *
 * Plain ASCII, bullets, arrows, and free-text labels fail the test.
 */
export function isLikelyEmoji(s: string | null | undefined): boolean {
  if (!s) return false;
  const trimmed = s.trim();
  if (trimmed.length === 0 || trimmed.length > 12) return false;
  return /[\p{Extended_Pictographic}\p{Regional_Indicator}]/u.test(trimmed);
}
