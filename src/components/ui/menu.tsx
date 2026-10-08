/**
 * component/ui/menu.tsx — AntD Menu re-export
 *
 * Menu giữ nguyên API gốc Antd vì nó đã rất complete
 * (items, mode, theme, selectedKeys, onClick, v.v.).
 * CVA không cần vì styling qua ConfigProvider theme tokens.
 */

export { default as Menu } from "antd/es/menu";
export type { MenuProps, MenuRef } from "antd/es/menu";
