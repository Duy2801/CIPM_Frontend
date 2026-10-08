/**
 * component/ui/index.ts — Barrel export cho tất cả UI primitives
 *
 * Pattern: AntD + Tailwind + CVA
 *
 * Feature code import từ đây:
 *   import { Layout, Sider, Header, Content, Menu, Button, Flex, ... } from "@/component/ui";
 *
 * KHÔNG import trực tiếp từ 'antd'.
 */

/* ── Utility ─────────────────────────────────────────────── */
export { cn } from "@/utils/cn";

/* ── Layout ──────────────────────────────────────────────── */
export {
  Layout,
  Sider,
  Header, headerVariants,
  Content, contentVariants,
  Footer,
} from "./layout";
export type { LayoutProps, SiderProps, HeaderProps, ContentProps } from "./layout";

/* ── Navigation ──────────────────────────────────────────── */
export { Menu } from "./menu";
export type { MenuProps, MenuRef } from "./menu";
export { Breadcrumb } from "./breadcrumb";
export { Tabs, tabsVariants } from "./tabs";
export type { TabsProps } from "./tabs";
export { Dropdown } from "./dropdown";
export type { DropdownProps } from "./dropdown";
export { Popover } from "./popover";
export type { PopoverProps } from "./popover";

/* ── General ─────────────────────────────────────────────── */
export { Button, buttonVariants } from "./button";
export type { ButtonProps } from "./button";

/* ── Typography ──────────────────────────────────────────── */
export {
  Typography, Title, titleVariants,
  Text, textVariants,
  Paragraph, Link,
} from "./typography";
export type { TitleProps, TextProps } from "./typography";

/* ── Layout Utilities ────────────────────────────────────── */
export { Flex, flexVariants } from "./flex";
export type { FlexProps } from "./flex";

/* ── Data Entry ──────────────────────────────────────────── */
export { Input, inputVariants } from "./input";
export type { InputProps } from "./input";
export { Select, selectVariants } from "./select";
export type { SelectProps } from "./select";
export { Checkbox, checkboxVariants } from "./checkbox";
export type { CheckboxProps } from "./checkbox";
export { Form, formVariants, useForm, useWatch } from "./form";
export type { FormProps } from "./form";
export { Switch, switchVariants } from "./switch";
export type { SwitchProps } from "./switch";

/* ── Data Display ────────────────────────────────────────── */
export { Card, cardVariants } from "./card";
export type { CardProps } from "./card";
export { Avatar, avatarVariants } from "./avatar";
export type { AvatarProps } from "./avatar";
export { Badge, badgeVariants } from "./badge";
export type { BadgeProps } from "./badge";
export { Tag, tagVariants } from "./tag";
export type { TagProps } from "./tag";
export { Progress } from "./progress";
export type { ProgressProps } from "./progress";
export { Statistic } from "./statistic";
export type { StatisticProps } from "./statistic";
export { Table } from "./table";
export type { ColumnsType, TableProps } from "./table";
export { DEFAULT_LIST_PAGE_SIZE } from "./table-pagination";
export { Tooltip } from "./tooltip";

export { Space } from "./space";
export type { SpaceProps } from "./space";
export { Divider } from "./divider";
export type { DividerProps } from "./divider";
export { Spin } from "./spin";
export type { SpinProps } from "./spin";

/* ── Feedback & Overlays ─────────────────────────────────── */
export { Modal, modalVariants } from "./modal";
export { Drawer, STANDARD_DRAWER_WIDTH } from "./drawer";
export type { DrawerProps } from "./drawer";
export type { ModalProps } from "./modal";
export { Pagination, paginationVariants } from "./pagination";
export type { PaginationProps } from "./pagination";
export { toast, ToastContainer, toastManager } from "./toast";
export type { ToastItem, ToastType } from "./toast";

/* ── Grid ────────────────────────────────────────────────── */
export { Row, Col } from "./grid";
export type { RowProps, ColProps } from "./grid";

/* ── Configuration ───────────────────────────────────────── */
export { ConfigProvider } from "./config-provider";

/* ── Branded Loading ─────────────────────────────────────── */
export { AppLoadingScreen } from "./app-loading-screen";
