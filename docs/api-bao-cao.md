# API màn Báo cáo (`/reports`)

Mỗi **loại báo cáo** (giám sát – kỹ thuật, giải ngân, tiến độ, bồi thường GPMB… và loại tự thêm) giữ **một tệp Excel** mới nhất. Người dùng nhập tệp, xem từng sheet dạng bảng ngay trên trang, xuất lại tệp gốc; mọi thao tác được ghi lịch sử.

- Frontend: `src/features/reports`
- Backend: `cipm-service` — chưa có module báo cáo. Endpoint, kiểm tra dữ liệu, bảng dữ liệu đều là **đề xuất**. Đã có sẵn: `GET /audit-logs`.
- Hiện FE chạy bằng dữ liệu mẫu: tệp lưu IndexedDB của trình duyệt, loại tự thêm lưu localStorage; đăng nhập bằng tài khoản thật thì gọi API (xem Phụ lục).
- FE tự đọc tệp Excel để hiện bảng (`utils/xlsx-reader`) — backend **không cần** phân tích nội dung tệp, chỉ lưu và trả tệp gốc.

Ký hiệu: ✅ backend đã có · ⚠ backend chưa có (đề xuất).

---

## Quy ước chung

```
Base URL: /api/v1
Header:   Authorization: Bearer <accessToken>

Thành công: { "status": true, "statusCode": 200 | 201, "data": ... }
Lỗi:        { "message": "...", "error": "Bad Request", "statusCode": 400 }
```

| Mã lỗi | Ý nghĩa |
|---|---|
| 400 | Thiếu tên loại / trùng tên loại / tệp không phải Excel / vượt dung lượng |
| 401 | Chưa đăng nhập / token hết hạn |
| 403 | Không đủ quyền (`"Role invalid."`) |
| 404 | Không tìm thấy loại báo cáo / tệp |
| 409 | Xóa loại đang có tệp, hoặc xóa loại mặc định |

Thời điểm dạng ISO (`2026-11-11T08:30:00.000Z`), dung lượng tính bằng byte.

---

## Tổng quan

| Màn hình | API | Endpoint | Backend |
|---|---|---|---|
| **1. Danh sách báo cáo** | 1.1 Danh sách loại báo cáo | `GET /reports/types` | ⚠ |
| | 1.2 Thêm loại báo cáo | `POST /reports/types` | ⚠ |
| | 1.3 Xóa loại báo cáo | `DELETE /reports/types/:typeId` | ⚠ |
| | 1.4 Danh sách tệp báo cáo | `GET /reports` | ⚠ |
| **2. Báo cáo của một loại** | 2.1 Nhập Excel | `POST /reports` | ⚠ |
| | 2.2 Xem nội dung tệp | `GET /reports/:id/file?inline=true` | ⚠ |
| | 2.3 Xuất Excel (tải tệp gốc) | `GET /reports/:id/file?inline=false` | ⚠ |
| **3. Lịch sử thao tác** | 3.1 Lịch sử cả màn / một loại | `GET /audit-logs?module=reports&targetId=` | ✅ (cần thêm module) |

Backend đã có 1 / 8 API (3.1, cần nhận thêm `module=reports`); còn 7 API mới.

---

## Màn 1. Danh sách báo cáo

Component: ReportsScreen, ReportScreenTabs, ReportTypeGrid, ReportTypeCard, ReportAddTypeModal

| Thao tác trên màn | API | Làm gì |
|---|---|---|
| Mở màn | **1.1** + **1.4** | Thẻ mỗi loại: tên loại, "Cập nhật dd/mm/yyyy" (ngày nhập tệp gần nhất) hoặc "Chưa có dữ liệu" |
| Thẻ "Thêm loại báo cáo" → nhập tên → "Thêm" | **1.2** | FE chặn tên trùng (không phân biệt hoa thường) |
| Nút 🗑 trên thẻ loại tự thêm, chưa có tệp | **1.3** | Hộp xác nhận trước khi gọi |
| Bấm thẻ | Sang màn 2 | — |
| Tab "Lịch sử thao tác" | **3.1** (không `targetId`) | — |

### 1.1. Danh sách loại báo cáo ⚠

```
GET /reports/types
```
```json
{
  "status": true,
  "statusCode": 200,
  "data": [
    { "id": "giam-sat", "name": "Báo cáo giám sát – kỹ thuật", "isCustom": false },
    { "id": "giai-ngan", "name": "Báo cáo giải ngân", "isCustom": false },
    { "id": "tien-do", "name": "Báo cáo tiến độ dự án", "isCustom": false },
    { "id": "gpmb", "name": "Báo cáo bồi thường, GPMB", "isCustom": false },
    { "id": "3b6f0c1a-...", "name": "Báo cáo quyết toán", "isCustom": true }
  ]
}
```
4 loại mặc định (`isCustom: false`) do backend tạo sẵn, giữ đúng `id` như trên. Loại tự thêm xếp sau, theo thời gian tạo.

### 1.2. Thêm loại báo cáo ⚠

```json
POST /reports/types
{ "name": "Báo cáo quyết toán" }
```

| Điều kiện | Lỗi 400 |
|---|---|
| `name` trống | `Vui lòng nhập tên loại báo cáo.` |
| trùng tên loại đã có (không phân biệt hoa thường, bỏ khoảng trắng đầu cuối) | `Loại báo cáo này đã có.` |

**Response** `201`: `{ "id": "3b6f0c1a-...", "name": "Báo cáo quyết toán", "isCustom": true }` · Ghi `audit-logs`: `action` = `Thêm loại báo cáo: <tên>`, `targetId` = id loại.

### 1.3. Xóa loại báo cáo ⚠

```
DELETE /reports/types/:typeId
```
Chỉ xóa được loại **tự thêm** và **chưa có tệp**; ngược lại trả 409 `Chỉ xóa được loại báo cáo tự thêm, chưa có tệp.` Ghi `audit-logs`: `Xóa loại báo cáo: <tên>`.

### 1.4. Danh sách tệp báo cáo ⚠

```
GET /reports
```
Chỉ trả **thông tin tệp**, không kèm nội dung. Mỗi loại tối đa một tệp.

```json
{
  "status": true,
  "statusCode": 200,
  "data": [
    {
      "id": "c1d2e3f4-...",
      "typeId": "giai-ngan",
      "fileName": "BC-giai-ngan-T11-2026.xlsx",
      "fileSize": 245760,
      "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "uploadedAt": "2026-11-10T08:30:00.000Z",
      "uploadedBy": { "id": "f8a20277-...", "fullName": "Huỳnh Thái Hải" }
    }
  ]
}
```

---

## Màn 2. Báo cáo của một loại

Component: ReportDetail, ReportDetailHeader, ReportEmptyImport, WorkbookView, WorkbookSheetTabs, SheetTable · Hook: useReportActions, useReportQueries, useWorkbook

| Thao tác trên màn | API | Làm gì |
|---|---|---|
| Mở báo cáo | Thông tin tệp từ 1.4 → **2.2** | FE đọc tệp, hiện tab sheet + bảng (đầu mục nhiều tầng, ô gộp, bỏ cột STT / dòng đánh số cột) |
| Bấm tab sheet | FE tự xử lý | — |
| "Nhập Excel" / kéo thả tệp vào trang / ô "Chưa có báo cáo" | **2.1** | Tệp mới **thay** tệp cũ của loại này |
| "Xuất Excel" | **2.3** | Tải tệp gốc |
| "Lịch sử" | **3.1** `targetId=<typeId>` | — |

### 2.1. Nhập Excel ⚠

```
POST /reports        (multipart/form-data)
  typeId: string     // id loại báo cáo
  file:   File       // .xlsx · .xlsm · .xls · .xlsb · .csv
```

| Điều kiện | Lỗi |
|---|---|
| `typeId` không tồn tại | 404 `Không tìm thấy loại báo cáo.` |
| đuôi tệp ngoài danh sách trên | 400 `Chỉ nhận tệp Excel (.xlsx, .xlsm, .xls, .xlsb) hoặc .csv.` |
| tệp > 50MB | 400 `Tệp vượt quá 50MB.` |

Backend lưu tệp mới rồi **xóa tệp cũ** của cùng loại (mỗi loại một tệp). **Response** `201`: thông tin tệp như một phần tử của 1.4. Ghi `audit-logs`: `Nhập Excel: <tên loại>`, `targetId` = `typeId`, `targetName` = tên tệp, `changes: [{ "label": "Tệp", "to": "<tên tệp>" }]`.

### 2.2. Xem nội dung tệp ⚠

```
GET /reports/:id/file?inline=true
Response: nội dung tệp gốc (Content-Type theo mimeType) · Content-Disposition: inline
```
Dùng để FE đọc và hiện bảng — **không** ghi lịch sử.

### 2.3. Xuất Excel ⚠

```
GET /reports/:id/file?inline=false
Response: nội dung tệp gốc · Content-Disposition: attachment; filename="<tên tệp>"
```
Giống 2.2 nhưng là tải về: ghi `audit-logs` `Xuất Excel: <tên loại>`, `targetId` = `typeId`, `targetName` = tên tệp.

---

## Màn 3. Lịch sử thao tác

Component: ReportHistoryTab (tab "Lịch sử thao tác" của màn 1, và nút "Lịch sử" trong màn 2)

### 3.1. Lịch sử ✅ (cần thêm module)

```
GET /audit-logs
Query: module=reports, targetId?=<typeId>     // bỏ targetId = lịch sử cả màn
```
Response cùng dạng `audit-logs` hiện có (`at`, `actorName`, `actorRole`, `action`, `targetId`, `targetName`, `changes[]`, `note`). FE lọc theo ngày và phân trang tại chỗ.

| `action` | Từ API |
|---|---|
| `Nhập Excel: <tên loại>` | 2.1 |
| `Xuất Excel: <tên loại>` | 2.3 |
| `Thêm loại báo cáo: <tên loại>` | 1.2 |
| `Xóa loại báo cáo: <tên loại>` | 1.3 |

⚠ Backend cần thêm `reports` vào `MODULE_PERMISSION` (`audit.controller.ts`) với quyền xem `report:view`.

---

## Phân quyền thao tác

Quyền người đăng nhập lấy từ `permissions` trả về lúc đăng nhập. Màn hình hiện **chưa ẩn nút theo quyền** (mọi tài khoản vào được màn đều thao tác được); backend cần kiểm tra theo bảng dưới, FE sẽ ẩn nút theo cùng mã khi có ô trên Ma trận phân quyền.

| Thao tác | Quyền đề xuất | Component |
|---|---|---|
| Xem danh sách, xem báo cáo, xem lịch sử (1.1, 1.4, 2.2, 3.1) | `report:view` | ReportsScreen, ReportTypeCard, WorkbookView, ReportHistoryTab |
| Nhập Excel (2.1) | `report:import` | ReportDetailHeader, ReportEmptyImport, ReportDetail (kéo thả) |
| Xuất Excel (2.3) | `report:export` | ReportDetailHeader |
| Thêm / xóa loại báo cáo (1.2, 1.3) | `report:configure` | ReportTypeGrid, ReportAddTypeModal, ReportTypeCard |
| Giám đốc (`DIRECTOR`) | Toàn quyền | — |

---

## Phụ lục

### A. Bảng dữ liệu đề xuất

| Bảng | Cột chính |
|---|---|
| `report_types` | `id`, `name` (unique, không phân biệt hoa thường), `isCustom`, `sortOrder`, `createdBy`, `createdAt` |
| `report_files` | `id`, `typeId` (unique — mỗi loại một tệp), `fileName`, `fileSize`, `mimeType`, `storageKey`, `uploadedBy`, `uploadedAt` |

### B. Lớp gọi API phía FE

Tách giống phân hệ Nhân sự:

| File | Vai trò |
|---|---|
| `api/report.backend.ts` | Gọi API thô (1.1–1.4, 2.1–2.3, 3.1) |
| `services/report.mapper.ts` | `ApiReportType` → `ReportType`, `ApiReportFile` → `ReportFile`, `audit-logs` → dòng lịch sử |
| `services/report.api.ts` | Hàm hook gọi, bọc `withBackend`: tài khoản thật gọi API, tài khoản thử nghiệm `mock_...` / server không phản hồi chạy `services/mock-report.repository.ts` |
| `services/mock-report.repository.ts` | Bản mock: tệp trong IndexedDB (`report-storage.ts`), loại tự thêm trong localStorage (`report-types.ts`), lịch sử trong sổ nhật ký chung (`report-history.ts`) |
| `hooks/useReportQueries.ts` | `useReportTypes`, `useReportType(typeId)`, `useReportOf(typeId)`, `useReportContent(reportId)`, `useReportHistory(typeId)` (react-query, khóa `["reports", ...]`) |
| `hooks/useReportActions.tsx` | `importReport`, `exportReport`, `addType`, `removeType` theo `typeId`; xong thì làm mới `["reports"]` |

Bản mock tự ghi lịch sử ở FE; khi nối backend, lịch sử do backend ghi (FE không gọi ghi log).
