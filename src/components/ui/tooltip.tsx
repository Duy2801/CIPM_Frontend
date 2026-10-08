"use client";

import React from "react";
import AntTooltip from "antd/es/tooltip";
import type { TooltipProps as AntTooltipProps } from "antd/es/tooltip";
import { getTooltipStyles, type TooltipStyles } from "./tooltip-styles";

export type TooltipProps = AntTooltipProps;

export const Tooltip = React.forwardRef<unknown, TooltipProps>((props, ref) => {
  const { styles, ...tooltipProps } = props;

  return (
    <AntTooltip
      ref={ref as never}
      {...tooltipProps}
      styles={
        typeof styles === "function"
          ? (info) => getTooltipStyles(styles(info) as TooltipStyles)
          : getTooltipStyles(styles)
      }
    />
  );
});

Tooltip.displayName = "Tooltip";

export default Tooltip;
