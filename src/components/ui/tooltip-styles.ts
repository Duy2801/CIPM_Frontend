import type { CSSProperties } from "react";

export interface TooltipStyles {
  arrow?: CSSProperties;
  container?: CSSProperties;
  root?: CSSProperties;
}

export function getTooltipStyles(styles?: TooltipStyles): TooltipStyles {
  return {
    ...styles,
    container: {
      color: "#FFFFFF",
      ...styles?.container,
    },
  };
}
