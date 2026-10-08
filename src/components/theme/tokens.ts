/**
 * tokens.ts — Design Tokens toàn dự án
 *
 * Định nghĩa spacing, typography, shadow, border-radius, v.v.
 * Tất cả lấy từ đây để đảm bảo nhất quán giữa Ant Design và Tailwind.
 */

import { colors } from "./colors";

export const tokens = {
  /* ── Colors (tham chiếu từ colors.ts) ────────────────── */
  colors,

  /* ── Border Radius ───────────────────────────────────── */
  radius: {
    none:   0,
    sm:     4,    // px
    md:     8,
    lg:     12,
    xl:     16,
    full:   9999,
  },

  /* ── Spacing scale (px) ──────────────────────────────── */
  spacing: {
    xs:   4,
    sm:   8,
    md:   16,
    lg:   24,
    xl:   32,
    "2xl": 48,
    "3xl": 64,
  },

  /* ── Typography ──────────────────────────────────────── */
  fontSize: {
    xs:   12,
    sm:   13,
    base: 14,
    md:   16,
    lg:   18,
    xl:   20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
  },

  fontWeight: {
    normal:   400,
    medium:   500,
    semibold: 600,
    bold:     700,
  },

  lineHeight: {
    tight:  1.25,
    normal: 1.5,
    relaxed:1.75,
  },

  /* ── Shadows ─────────────────────────────────────────── */
  shadow: {
    none: "none",
    sm:   "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md:   "0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)",
    lg:   "0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)",
    xl:   "0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.05)",
    card: "0 2px 8px 0 rgb(0 0 0 / 0.08)",
  },

  /* ── Animation ───────────────────────────────────────── */
  transition: {
    fast:   "150ms ease",
    normal: "250ms ease",
    slow:   "400ms ease",
  },

  /* ── Z-Index ─────────────────────────────────────────── */
  zIndex: {
    base:    0,
    above:   1,
    dropdown:1000,
    sticky:  1100,
    modal:   1300,
    tooltip: 1500,
    toast:   1700,
  },
} as const;

export type Tokens = typeof tokens;
