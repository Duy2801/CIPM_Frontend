export const DRAWER_CLOSE_BUTTON_LABEL = "Đóng ngăn chi tiết";
export const DRAWER_OVERLAY_Z_INDEX = 1200;
export const STANDARD_DRAWER_WIDTH = "min(680px, 100vw)";

type DrawerClosable = boolean | { placement?: "start" | "end" } | undefined;

export function getDrawerClosable(
  closable: DrawerClosable,
): false | "start" | "end" | undefined {
  if (closable === false) return false;
  if (typeof closable === "object" && closable.placement) {
    return closable.placement;
  }
  return undefined;
}

export function getDrawerZIndex(zIndex: number | undefined): number {
  return zIndex ?? DRAWER_OVERLAY_Z_INDEX;
}

export function getDrawerSize(
  size: string | number | undefined,
  legacyWidth: string | number | undefined,
): string | number | undefined {
  return size ?? legacyWidth ?? STANDARD_DRAWER_WIDTH;
}

