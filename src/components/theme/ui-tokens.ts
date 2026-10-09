import type { CSSProperties } from "react";
import { darkSurface, lightSurface, semantic } from "./colors";

type ThemeVariables = CSSProperties & Record<`--cipm-${string}`, string>;

export const themeCssVariables: ThemeVariables = {
  "--cipm-brand": semantic.teal,
  "--cipm-brand-strong": semantic.tealDark,
  "--cipm-brand-soft": semantic.tealBg,
  "--cipm-brand-border": semantic.tealBorder,
  "--cipm-info": semantic.blueDark,
  "--cipm-info-soft": semantic.blueBg,
  "--cipm-warning": semantic.amber,
  "--cipm-warning-soft": semantic.goldBg,
  "--cipm-danger": semantic.red,
  "--cipm-danger-soft": semantic.redBg,
  "--cipm-success": semantic.green,
  "--cipm-success-soft": semantic.greenBg,
  "--cipm-surface-page": lightSurface.bg,
  "--cipm-surface-shell": lightSurface.surface2,
  "--cipm-surface-panel": lightSurface.bg,
  "--cipm-surface-muted": lightSurface.surface,
  "--cipm-border-subtle": lightSurface.border,
  "--cipm-border-default": lightSurface.borderMid,
  "--cipm-text-title": "#075E78",
  "--cipm-text-body": "#0F6F8C",
  "--cipm-text-body-soft": "rgba(15, 111, 140, 0.7)",
  "--cipm-text-muted": lightSurface.textMuted,
  "--cipm-text-faint": lightSurface.textFaint,
  "--cipm-text-inverse": lightSurface.bg,
  "--cipm-sidebar-bg": darkSurface.surface,
  "--cipm-sidebar-border": darkSurface.border,
  "--cipm-sidebar-hover": "rgba(255, 255, 255, 0.06)",
  "--cipm-sidebar-active": "linear-gradient(90deg, rgba(0, 201, 167, 0.2) 0%, rgba(0, 201, 167, 0.04) 100%)",
  "--cipm-sidebar-text": darkSurface.textMuted,
  "--cipm-sidebar-text-muted": darkSurface.textFaint,
  "--cipm-sidebar-text-strong": lightSurface.bg,
  "--cipm-scrollbar-thumb": lightSurface.borderMid,
  "--cipm-scrollbar-thumb-hover": lightSurface.textFaint,
};

export const themeClassNames = {
  app: {
    body: "min-h-full",
    shell: "min-h-screen !bg-[var(--cipm-surface-shell)]",
    content: "min-h-screen transition-[margin] duration-200",
    main: "min-h-[calc(100vh-60px)] bg-[var(--cipm-surface-shell)]/70 p-3.5 sm:p-5 lg:p-6 2xl:p-8 text-[var(--cipm-text-muted)] w-full overflow-x-hidden",
  },
  topbar: {
    header:
      "!h-[60px] !px-5 !leading-normal border-b border-[color:var(--cipm-border-subtle)] bg-[var(--cipm-surface-panel)]",
    searchIcon: "text-[var(--cipm-text-faint)]",
    searchInput:
      "w-full !bg-[var(--cipm-surface-muted)] !border-[color:var(--cipm-border-subtle)] !rounded-md",
    fiscalFilter:
      "h-8 rounded-md border border-[color:var(--cipm-border-subtle)] bg-[var(--cipm-surface-muted)] px-2.5",
    fiscalIcon: "text-[var(--cipm-text-muted)] text-xs",
    fiscalLabel:
      "!text-[12px] !text-[var(--cipm-text-muted)] font-medium whitespace-nowrap",
    exportButton:
      "!h-8 !px-3 !rounded-md !border-[color:var(--cipm-border-subtle)] !bg-[var(--cipm-surface-muted)] !text-xs !font-medium !text-[var(--cipm-text-muted)] hover:!border-[color:var(--cipm-brand)] hover:!text-[var(--cipm-brand-strong)]",
    alertIcon: "text-[var(--cipm-danger)] text-base",
    alertButton:
      "!h-8 !w-8 !rounded-md hover:!bg-[var(--cipm-surface-shell)]",
    divider:
      "!h-5 !border-[color:var(--cipm-border-default)] !ml-1 !mr-0",
  },
  sidebar: {
    surface: "!bg-[var(--cipm-sidebar-bg)]",
    divider: "border-[color:var(--cipm-sidebar-border)]",
    dividerTop: "border-t border-[color:var(--cipm-sidebar-border)] flex-shrink-0",
    dividerBottom:
      "border-b border-[color:var(--cipm-sidebar-border)] flex-shrink-0",
    brand: "block !text-[15px] !leading-snug !text-[var(--cipm-brand)] tracking-tight",
    meta: "block !text-[10px] !uppercase !tracking-wider !text-[var(--cipm-sidebar-text-muted)] font-medium",
    menu:
      "cipm-sidebar-menu flex-1 overflow-hidden hover:overflow-y-auto !bg-[var(--cipm-sidebar-bg)] py-1",
    profileName:
      "block !text-[12px] !text-[var(--cipm-sidebar-text-strong)] !leading-tight",
    profileRole:
      "block !text-[10px] !text-[var(--cipm-sidebar-text-muted)] !leading-tight",
  },
  feature: {
    label: "!text-[var(--cipm-text-body-soft)]",
    title: "!mb-0 !mt-1 !text-[var(--cipm-text-title)]",
    body: "mt-3 max-w-3xl text-sm leading-6 text-[var(--cipm-text-body)]",
  },
  dashboard: {
    title: "!mb-0 !text-2xl !font-bold !text-[var(--cipm-text-title)]",
    sectionCard: "!p-0 border border-[color:var(--cipm-border-subtle)] shadow-2xs",
    kpiCard:
      "hover:shadow-md transition-shadow border border-[color:var(--cipm-border-subtle)]",
    tableCard: "border border-[color:var(--cipm-border-subtle)] shadow-2xs overflow-hidden",
    table:
      "[&_.ant-table]:!bg-[var(--cipm-surface-panel)] [&_.ant-table-thead_th]:!bg-[var(--cipm-surface-muted)] [&_.ant-table-thead_th]:!text-[var(--cipm-text-muted)] [&_.ant-table-thead_th]:!font-semibold [&_.ant-table-thead_th]:!text-xs [&_.ant-table-tbody_td]:!py-3.5",
    brandText: "!text-[var(--cipm-text-title)]",
    mutedText: "!text-[var(--cipm-text-muted)]",
    faintText: "!text-[var(--cipm-text-faint)]",
    brandAccent: "!text-[var(--cipm-brand-strong)]",
    infoAccent: "!text-[var(--cipm-info)]",
    warningAccent: "!text-[var(--cipm-warning)]",
    dangerAccent: "!text-[var(--cipm-danger)]",
    successIcon:
      "h-10 w-10 rounded-xl bg-[var(--cipm-success-soft)] text-[var(--cipm-brand-strong)]",
    infoIcon:
      "h-10 w-10 rounded-xl bg-[var(--cipm-info-soft)] text-[var(--cipm-info)]",
    warningIcon:
      "h-10 w-10 rounded-xl bg-[var(--cipm-warning-soft)] text-[var(--cipm-warning)]",
    dangerIcon:
      "h-10 w-10 rounded-xl bg-[var(--cipm-danger-soft)] text-[var(--cipm-danger)]",
    projectName: "!text-[var(--cipm-text-title)] transition-colors",
    budgetText: "!text-[var(--cipm-text-muted)]",
    progressPercent:
      "!text-xs !w-8 text-right !text-[var(--cipm-text-muted)]",
    ownerText: "!text-xs font-medium !text-[var(--cipm-text-muted)]",
    eyebrow:
      "!text-[var(--cipm-brand-strong)] font-semibold uppercase tracking-wider !text-[11px]",
    kpiLabel: "!text-xs font-medium !text-[var(--cipm-text-muted)]",
    kpiValueBrand:
      "!mb-0 !text-3xl !font-black !text-[var(--cipm-text-title)]",
    kpiValueInfo: "!mb-0 !text-3xl !font-black !text-[var(--cipm-info)]",
    kpiValueDanger:
      "!mb-0 !text-3xl !font-black !text-[var(--cipm-danger)]",
    kpiValueWarning:
      "!mb-0 !text-3xl !font-black !text-[var(--cipm-warning)]",
    kpiCaptionBrand: "!text-[11px] font-medium !text-[var(--cipm-brand-strong)]",
    kpiCaptionInfo: "!text-[11px] font-medium !text-[var(--cipm-info)]",
    kpiCaptionDanger: "!text-[11px] font-medium !text-[var(--cipm-danger)]",
    kpiCaptionWarning:
      "!text-[11px] font-medium !text-[var(--cipm-warning)]",
    percentSuffix: "!text-lg !font-bold !text-[var(--cipm-warning)]",
    tableTitle: "!mb-0 !text-base !font-bold !text-[var(--cipm-text-title)]",
    updatedAt: "!text-xs font-medium !text-[var(--cipm-text-faint)]",
  },
  primitive: {
    buttonGlass:
      "backdrop-blur-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[var(--cipm-text-inverse)] hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)]",
    buttonGradient:
      "bg-gradient-to-r from-[var(--cipm-brand)] to-[var(--cipm-brand-strong)] text-[var(--cipm-text-inverse)] shadow-lg shadow-[rgba(0,201,167,0.25)] hover:shadow-[rgba(0,201,167,0.4)]",
    buttonGhost: "bg-transparent hover:bg-[rgba(255,255,255,0.05)]",
    avatarBrand: "!bg-[var(--cipm-brand)] !text-[var(--cipm-text-inverse)]",
    avatarSubtle: "!bg-[var(--cipm-brand-soft)] !text-[var(--cipm-brand)]",
    avatarNeutral:
      "!bg-[var(--cipm-sidebar-text-muted)] !text-[var(--cipm-sidebar-text-strong)]",
    headerLight:
      "!bg-[var(--cipm-surface-panel)] border-b border-[color:var(--cipm-border-subtle)]",
    headerDark:
      "!bg-[var(--cipm-sidebar-bg)] border-b border-[color:var(--cipm-sidebar-border)]",
    contentWhite: "!bg-[var(--cipm-surface-panel)]",
    contentLight: "!bg-[var(--cipm-surface-shell)]",
    inputSearch:
      "!bg-[var(--cipm-surface-muted)] !border-[color:var(--cipm-border-subtle)] hover:!border-[color:var(--cipm-brand)] focus-within:!border-[color:var(--cipm-brand)] focus-within:!shadow-[0_0_0_3px_var(--cipm-brand-soft)]",
    titleBrand:
      "!text-[var(--cipm-text-inverse)] !font-bold !leading-tight !mb-0",
    titleGradient:
      "!bg-gradient-to-r !from-[var(--cipm-brand)] !to-[var(--cipm-info)] !bg-clip-text !text-transparent",
    titleMuted:
      "!text-[var(--cipm-text-muted)] !font-semibold !text-xs !uppercase !tracking-wider !mb-0",
    textMuted: "!text-[var(--cipm-text-muted)]",
    textFaint: "!text-[var(--cipm-text-faint)] text-xs",
    textBrand: "!text-[var(--cipm-brand)]",
    textLabel:
      "!text-[var(--cipm-text-muted)] text-xs font-medium uppercase tracking-wider",
    cardWorkspace:
      "!rounded-lg !border-[color:var(--cipm-border-subtle)] !bg-[var(--cipm-surface-panel)]",
    cardQuiet:
      "!rounded-lg !border-[color:var(--cipm-border-subtle)] !bg-[var(--cipm-surface-muted)]",
    badgeBrand: "[&_.ant-badge-count]:!bg-[var(--cipm-brand)]",
    badgeDanger: "[&_.ant-badge-count]:!bg-[var(--cipm-danger)]",
    badgeWarning: "[&_.ant-badge-count]:!bg-[var(--cipm-warning)]",
    tagBrand:
      "!rounded-full !border-[color:var(--cipm-brand-border)] !bg-[var(--cipm-brand-soft)] !text-[var(--cipm-brand)] font-semibold",
    tagNew:
      "!rounded !bg-[var(--cipm-danger)] !text-[var(--cipm-text-inverse)] !border-0 text-[10px] font-bold tracking-wide",
    tagSuccess:
      "!border-[color:var(--cipm-success)]/30 !bg-[var(--cipm-success-soft)] !text-[var(--cipm-success)]",
    tagWarning:
      "!border-[color:var(--cipm-warning)]/30 !bg-[var(--cipm-warning-soft)] !text-[var(--cipm-warning)]",
    tagDanger:
      "!border-[color:var(--cipm-danger)]/30 !bg-[var(--cipm-danger-soft)] !text-[var(--cipm-danger)]",
    tagInfo:
      "!border-[color:var(--cipm-info)]/30 !bg-[var(--cipm-info-soft)] !text-[var(--cipm-info)]",
  },
} as const;

export function getProgressColor(progress: number) {
  if (progress > 60) return "var(--cipm-brand)";
  if (progress > 35) return "var(--cipm-info)";
  return "var(--cipm-warning)";
}
