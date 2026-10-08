export function getDestroyOnHidden(
  destroyOnHidden: boolean | undefined,
  legacyDestroyOnClose: boolean | undefined,
): boolean | undefined {
  return destroyOnHidden ?? legacyDestroyOnClose;
}
