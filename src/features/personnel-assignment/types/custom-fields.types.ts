export type CustomFieldType = "text" | "number" | "date" | "select" | "textarea";

export interface CustomFieldDefinition {
  id: string;
  name: string; // key dùng làm thuộc tính lưu trữ
  label: string; // Nhãn hiển thị cho người dùng
  type: CustomFieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[]; // Danh sách các lựa chọn nếu type === 'select'
  description?: string;
  active?: boolean; // Áp dụng (true) hoặc Không áp dụng (false)
}

export type CustomFieldTarget = "staff" | "team";
