/**
 * antd-theme.ts — Cấu hình theme Ant Design cho BQL ĐTXD Hà Tiên v2.0
 *
 * - antdDarkTheme  → Giao diện tối (Dark Navy) — dùng cho hệ thống nội bộ
 * - antdLightTheme → Giao diện sáng (Trắng/Đen) — dùng cho in ấn / báo cáo / public
 *
 * Dùng trong: <ConfigProvider theme={antdDarkTheme}>
 * Docs: https://ant.design/docs/react/customize-theme
 */

import type { ThemeConfig } from "antd";
import { semantic, darkSurface, lightSurface } from "./colors";
import { tokens } from "./tokens";

const { radius, fontSize, fontWeight } = tokens;

/* ═══════════════════════════════════════════════════════════
   SHARED TOKEN BASE — Dùng chung cho cả 2 theme
   ═══════════════════════════════════════════════════════════ */
const sharedToken: ThemeConfig["token"] = {
  /* ── Brand chính: Teal ────────────────────────────────── */
  colorPrimary:           semantic.teal,
  colorPrimaryHover:      semantic.tealLight,
  colorPrimaryActive:     semantic.tealDark,

  /* ── Semantic Status ──────────────────────────────────── */
  colorSuccess:           semantic.green,
  colorSuccessBg:         semantic.greenBg,
  colorSuccessBorder:     semantic.greenBorder,

  colorWarning:           semantic.gold,
  colorWarningBg:         semantic.goldBg,
  colorWarningBorder:     semantic.goldBorder,

  colorError:             semantic.red,
  colorErrorBg:           semantic.redBg,
  colorErrorBorder:       semantic.redBorder,

  colorInfo:              semantic.blue,
  colorInfoBg:            semantic.blueBg,
  colorInfoBorder:        semantic.blueBorder,

  /* ── Radius ───────────────────────────────────────────── */
  borderRadius:           radius.md,
  borderRadiusLG:         radius.lg,
  borderRadiusSM:         radius.sm,
  borderRadiusXS:         radius.sm,

  /* ── Typography ───────────────────────────────────────── */
  fontSize:               fontSize.base,
  fontSizeLG:             fontSize.md,
  fontSizeSM:             fontSize.sm,
  fontSizeXL:             fontSize.lg,
  fontWeightStrong:       fontWeight.semibold,

  /* ── Motion ───────────────────────────────────────────── */
  motionDurationFast:     "0.1s",
  motionDurationMid:      "0.2s",
  motionDurationSlow:     "0.3s",
};

/* ═══════════════════════════════════════════════════════════
   SHARED COMPONENT OVERRIDES
   ═══════════════════════════════════════════════════════════ */
const sharedComponents: ThemeConfig["components"] = {
  Button: {
    controlHeight:    36,
    controlHeightLG:  42,
    controlHeightSM:  28,
  },
  Input: {
    controlHeight:    36,
    controlHeightLG:  42,
  },
  Select: {
    controlHeight:    36,
  },
  Modal: {
    borderRadiusLG: radius.xl,
  },
};

/* ═══════════════════════════════════════════════════════════
   DARK THEME — Giao diện tối Navy (giao diện chính nội bộ)
   ═══════════════════════════════════════════════════════════ */
export const antdDarkTheme: ThemeConfig = {
  token: {
    ...sharedToken,

    /* ── Nền & Surface ────────────────────────────────────── */
    colorBgBase:          darkSurface.bg,
    colorBgLayout:        darkSurface.bg,
    colorBgContainer:     darkSurface.surface,
    colorBgElevated:      darkSurface.surface2,
    colorBgSpotlight:     darkSurface.surface3,

    /* ── Text ─────────────────────────────────────────────── */
    colorText:            darkSurface.text,
    colorTextSecondary:   darkSurface.textMuted,
    colorTextDisabled:    darkSurface.textFaint,
    colorTextHeading:     "#FFFFFF",
    colorTextLabel:       darkSurface.textMuted,
    colorTextDescription: darkSurface.textFaint,

    /* ── Border ───────────────────────────────────────────── */
    colorBorder:          darkSurface.border,
    colorBorderSecondary: darkSurface.borderMid,
    colorSplit:           darkSurface.border,
  },

  components: {
    ...sharedComponents,

    /* ── Layout ─────────────────────────────────────────── */
    Layout: {
      headerBg:         darkSurface.surface,
      siderBg:          darkSurface.surface,
      triggerBg:        darkSurface.surface2,
      triggerColor:     darkSurface.textMuted,
    },

    /* ── Menu (Sidebar) ──────────────────────────────────── */
    Menu: {
      darkItemBg:         darkSurface.surface,
      darkSubMenuItemBg:  darkSurface.surface2,
      darkItemSelectedBg: semantic.tealBg,
      darkItemColor:      darkSurface.textMuted,
      darkItemSelectedColor: semantic.teal,
      darkItemHoverColor: "#FFFFFF",
      itemBorderRadius:   radius.md,
      itemMarginInline:   4,
    },

    /* ── Table ───────────────────────────────────────────── */
    Table: {
      headerBg:           darkSurface.surface2,
      headerColor:        darkSurface.textMuted,
      rowHoverBg:         darkSurface.surface3,
      borderColor:        darkSurface.border,
      headerSortActiveBg: darkSurface.surface3,
    },

    /* ── Card ────────────────────────────────────────────── */
    Card: {
      colorBgContainer:   darkSurface.surface,
      colorBorderSecondary: darkSurface.border,
      paddingLG:          24,
    },

    /* ── Form ────────────────────────────────────────────── */
    Form: {
      labelColor:         darkSurface.textMuted,
    },

    /* ── Drawer / Modal ──────────────────────────────────── */
    Drawer: {
      colorBgElevated:    darkSurface.surface,
    },

    /* ── Statistic (KPI Cards) ───────────────────────────── */
    Statistic: {
      titleFontSize:      fontSize.sm,
      contentFontSize:    fontSize["2xl"],
    },

    /* ── Badge / Tag ─────────────────────────────────────── */
    Tag: {
      defaultBg:          darkSurface.surface2,
      defaultColor:       darkSurface.text,
    },
  },
};

/* ═══════════════════════════════════════════════════════════
   LIGHT THEME — Giao diện sáng (Trắng/Đen)
   Dùng cho: in ấn, báo cáo xuất PDF, trang public, chế độ xem ban ngày
   ═══════════════════════════════════════════════════════════ */
export const antdLightTheme: ThemeConfig = {
  token: {
    ...sharedToken,

    /* ── Nền & Surface ────────────────────────────────────── */
    colorBgBase:          lightSurface.bg,
    colorBgLayout:        lightSurface.surface2,
    colorBgContainer:     lightSurface.bg,
    colorBgElevated:      lightSurface.bg,
    colorBgSpotlight:     "#0F172A",

    /* ── Text ─────────────────────────────────────────────── */
    colorText:            lightSurface.text,
    colorTextSecondary:   lightSurface.textMuted,
    colorTextDisabled:    lightSurface.textFaint,
    colorTextHeading:     "#000000",
    colorTextLightSolid:  "#FFFFFF",
    colorTextLabel:       lightSurface.textMuted,
    colorTextDescription: lightSurface.textFaint,

    /* ── Border ───────────────────────────────────────────── */
    colorBorder:          lightSurface.border,
    colorBorderSecondary: lightSurface.borderMid,
    colorSplit:           lightSurface.surface3,
  },

  components: {
    ...sharedComponents,

    /* ── Layout ─────────────────────────────────────────── */
    Layout: {
      headerBg:         lightSurface.bg,
      siderBg:          lightSurface.bg,
    },

    /* ── Menu (Sidebar) ──────────────────────────────────── */
    Menu: {
      itemBorderRadius:   radius.md,
      itemMarginInline:   4,
      itemSelectedBg:     semantic.tealBg,
      itemSelectedColor:  semantic.tealDark,
    },

    /* ── Table ───────────────────────────────────────────── */
    Table: {
      headerBg:           lightSurface.surface2,
      headerColor:        lightSurface.textMuted,
      rowHoverBg:         lightSurface.surface,
      borderColor:        lightSurface.border,
    },

    /* ── Card ────────────────────────────────────────────── */
    Card: {
      colorBgContainer:   lightSurface.bg,
      colorBorderSecondary: lightSurface.border,
      paddingLG:          24,
    },

    /* ── Form ────────────────────────────────────────────── */
    Form: {
      labelColor:         lightSurface.textMuted,
    },

    /* ── Statistic (KPI Cards) ───────────────────────────── */
    Statistic: {
      titleFontSize:      fontSize.sm,
      contentFontSize:    fontSize["2xl"],
    },

    /* ── Tooltip ─────────────────────────────────────────── */
    Tooltip: {
      colorBgSpotlight:   "#0F172A",
      colorTextLightSolid: "#FFFFFF",
    },
  },
};

/**
 * DEFAULT EXPORT — theme mặc định của dự án
 * Đổi sang antdLightTheme nếu muốn giao diện sáng
 */
export const antdTheme = antdDarkTheme;
