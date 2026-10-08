import AntTable from "antd/es/table";
import type { TableProps as AntTableProps } from "antd/es/table";
import { getTablePagination } from "./table-pagination";

export type { ColumnsType } from "antd/es/table";
export type TableProps<RecordType extends object = object> = AntTableProps<RecordType>;

export function Table<RecordType extends object = object>({
  pagination,
  ...props
}: TableProps<RecordType>) {
  return <AntTable<RecordType> {...props} pagination={getTablePagination(pagination)} />;
}
