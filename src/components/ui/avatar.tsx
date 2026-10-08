/**
 * component/ui/avatar.tsx — AntD Avatar + Tailwind + CVA
 *
 * Wrap Ant Design Avatar với CVA variants cho project roles & sizing.
 */

import React from "react";
import AntAvatar from "antd/es/avatar";
import type { AvatarProps as AntAvatarProps } from "antd/es/avatar";
import { cva, type VariantProps } from "class-variance-authority";
import { themeClassNames } from "@/components/theme";
import { cn } from "@/utils/cn";

export const avatarVariants = cva("inline-flex items-center justify-center font-semibold", {
  variants: {
    /** Visual style */
    variant: {
      default: "",
      /** Brand teal — primary actions, director role */
      brand: themeClassNames.primitive.avatarBrand,
      /** Subtle — collapsed sidebar icon */
      subtle: themeClassNames.primitive.avatarSubtle,
      /** Neutral — secondary roles */
      neutral: themeClassNames.primitive.avatarNeutral,
    },
    /** Shape */
    shape: {
      default: "",
      rounded: "!rounded-xl",
      circle: "!rounded-full",
    },
  },
  defaultVariants: {
    variant: "default",
    shape: "default",
  },
});

export interface AvatarProps
  extends Omit<AntAvatarProps, "shape">,
  VariantProps<typeof avatarVariants> { }

export const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  ({ variant, shape: shapeVariant, className, ...props }, ref) => {
    const antdShape =
      shapeVariant === "circle" || shapeVariant === "default" ? "circle" : "square";

    return (
      <AntAvatar
        ref={ref}
        shape={antdShape}
        className={cn(avatarVariants({ variant, shape: shapeVariant }), className)}
        {...props}
      />
    );
  },
);

Avatar.displayName = "Avatar";
