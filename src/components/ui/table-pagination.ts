import type { TablePaginationConfig } from "antd/es/table";
import type {
  TablePaginationPlacement,
  TablePaginationPosition,
} from "antd/es/table/interface";

export const DEFAULT_LIST_PAGE_SIZE = 10;

const paginationPlacementByLegacyPosition: Record<
  TablePaginationPosition,
  TablePaginationPlacement
> = {
  topLeft: "topStart",
  topCenter: "topCenter",
  topRight: "topEnd",
  bottomLeft: "bottomStart",
  bottomCenter: "bottomCenter",
  bottomRight: "bottomEnd",
  none: "none",
};

function getPaginationPlacement(
  position: TablePaginationPosition[] | undefined,
): TablePaginationPlacement[] | undefined {
  return position?.map((item) => paginationPlacementByLegacyPosition[item]);
}

export function getTablePagination(
  pagination: TablePaginationConfig | false | undefined,
): TablePaginationConfig | false {
  if (pagination === false) return false;

  const { placement, position, ...paginationOptions } = pagination ?? {};

  return {
    pageSize: DEFAULT_LIST_PAGE_SIZE,
    placement: placement ?? getPaginationPlacement(position) ?? ["topEnd"],
    showSizeChanger: false,
    hideOnSinglePage: true,
    ...paginationOptions,
  };
}
