import React from "react";
import AntSpace from "antd/es/space";
import type { SpaceProps } from "antd/es/space";

export const Space = React.forwardRef<HTMLDivElement, SpaceProps>(
  ({ direction, orientation, ...props }, ref) => (
    <AntSpace
      ref={ref}
      orientation={orientation ?? direction}
      {...props}
    />
  ),
) as React.ForwardRefExoticComponent<
  SpaceProps & React.RefAttributes<HTMLDivElement>
> & {
  Compact: typeof AntSpace.Compact;
  Addon: typeof AntSpace.Addon;
};

Space.Compact = AntSpace.Compact;
Space.Addon = AntSpace.Addon;
Space.displayName = "Space";
export type { SpaceProps };
