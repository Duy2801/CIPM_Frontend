/**
 * theme/index.ts — Entry point cho toàn bộ theme system BQL Hà Tiên v2.0
 *
 * Import từ một chỗ duy nhất:
 *   import { colors, semantic, pageColors, antdDarkTheme } from "@/theme"
 */

export { colors, semantic, darkSurface, lightSurface, pageColors } from "./colors";
export type { Colors }      from "./colors";

export { tokens }           from "./tokens";
export type { Tokens }      from "./tokens";

export {
  getProgressColor,
  themeClassNames,
  themeCssVariables,
} from "./ui-tokens";

export {
  antdTheme,          // default (dark)
  antdDarkTheme,      // giao diện tối Navy — hệ thống nội bộ
  antdLightTheme,     // giao diện sáng Trắng/Đen — in ấn / public
} from "./antd-theme";
