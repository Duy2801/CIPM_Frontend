# API màn Dự án & Công trình (M2)

Tài liệu đi theo **từng màn hình**: mỗi màn liệt kê các chức năng, ngay dưới là URL, request, response của các API màn đó gọi. Hết các màn là phần quy tắc nghiệp vụ, phân quyền và phụ lục.

- Frontend: `src/features/projects_works`
- Backend: `cipm-service` — chưa có module dự án. Endpoint, kiểm tra dữ liệu và bảng dữ liệu đều là **đề xuất**. Đã có sẵn: mã quyền `project:*`, `GET /user`, `GET|POST /catalogs`, `GET /audit-logs`.
- Hiện FE chạy bằng dữ liệu mẫu + localStorage (Phụ lục C).
- Số API đánh theo màn: **1.x** danh sách, **2.x** thêm mới, **3.x** chi tiết, **4.x** hộp xem nhanh (Bảng điều khiển).

Ký hiệu: ✅ backend đã có · ⚠ backend chưa có (đề xuất) · "FE tự xử lý" = chỉ chạy trên máy, không gọi backend.

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
| 400 | Dữ liệu không hợp lệ (thiếu tên, ngày kết thúc trước ngày bắt đầu, số tiền vượt hạn mức...) |
| 401 | Chưa đăng nhập / token hết hạn |
| 403 | Không đủ quyền (`"Role invalid."`) hoặc dự án đã khóa |
| 404 | Không tìm thấy dự án / bước / đợt giải ngân |
| 409 | Dữ liệu vừa được người khác lưu |

Ngày dạng `YYYY-MM-DD`, thời điểm dạng ISO (`2026-11-10T08:30:00.000Z`), số tiền là số nguyên VNĐ.

---

## Tổng quan

| Màn hình | API | Endpoint | Backend |
|---|---|---|---|
| **1. Danh sách dự án** | 1.1 Xem danh sách dự án | `GET /projects` | ⚠ |
| | 1.2 Khóa / mở khóa dự án | `PATCH /projects/:id/status` | ⚠ |
| **2. Thêm dự án mới** | 2.1 Tạo dự án | `POST /projects` | ⚠ |
| | 2.2 Quy trình chọn được | `GET /procedures?enabled=true` | ⚠ (xem API M3, mục 1.1) |
| | 2.3 Danh sách cán bộ (người phụ trách, giám sát) | `GET /user` | ✅ |
| | 2.4 Danh mục loại dự án / nguồn vốn (+ thêm nhanh) | `GET /catalogs?type=` · `POST /catalogs` | ✅ |
| | 2.5 Tải tệp đính kèm | `POST /projects/files` | ⚠ |
| **3. Chi tiết dự án** | 3.1 Xem chi tiết dự án | `GET /projects/:id` | ⚠ |
| *Tab Thông tin chung* | 3.2 Lưu thay đổi thông tin | `PATCH /projects/:id` | ⚠ |
| | 3.3 Đổi quy trình áp dụng / tên tab | `PUT /projects/:id/procedures` | ⚠ |
| *Tab quy trình* | 3.4 Xem quy trình của dự án (chỉ xem) | `GET /projects/:id/procedure` | ⚠ |
| *Tab Giải ngân* | 3.5 Xem các đợt giải ngân | `GET /projects/:id/disbursements` | ⚠ |
| | 3.6 Thêm đợt giải ngân / thu hồi | `POST /projects/:id/disbursements` | ⚠ |
| | 3.7 Danh mục chi phí (+ thêm nhanh) | `GET /catalogs?type=EXPENSE_TYPE` · `POST /catalogs` | ✅ |
| *Tab Lịch sử* | 3.8 Lịch sử dự án | `GET /audit-logs?module=projects&targetId=` | ✅ (cần thêm module) |
| **4. Hộp xem nhanh (Bảng điều khiển)** | 4.1 Cập nhật tiến độ tuần | `POST /projects/:id/progress` | ⚠ |
| | (Sửa thông tin dùng lại 3.2) | | |

Backend đã có 4 / 12 API (2.3, 2.4, 3.7 và route 3.8); 3.8 cần nhận thêm `module=projects`; còn 8 API mới.

Nộp kết quả bước, tổ trưởng duyệt / từ chối, BGĐ nghiệm thu giai đoạn **không làm ở màn này** mà ở màn Việc của tôi (`/my-tasks`); màn dự án chỉ đọc kết quả qua 3.4.

**Trạng thái và giai đoạn dự án** (dùng ở 1.1, 1.2, 3.1, 4.1)

| Trường | Giá trị |
|---|---|
| `status` | `active` (Đang hoạt động) · `closed` (Đã khóa — chỉ xem, không sửa) |
| `currentStage` | `PREPARATION` Chuẩn bị ĐT · `DESIGN` Thiết kế · `BIDDING` Đấu thầu · `CONSTRUCTION` Thi công · `COMPENSATION` Bồi thường · `INSPECTION` Nghiệm thu · `SETTLEMENT` Quyết toán · `COMPLETED` Hoàn thành |
| `nature` | `new` Dự án mới (khởi công mới) · `transitional` Dự án cũ (chuyển tiếp) |
| `type` | Danh mục `PROJECT_TYPE`: Giao thông · Dân dụng · Thủy lợi · Hạ tầng kỹ thuật · Công nghiệp (+ loại tự thêm) |
| `fundingSource` | Danh mục `FUND_SOURCE`: Ngân sách thành phố · Ngân sách tỉnh · Ngân sách Trung ương · Nguồn thu tiền sử dụng đất · Vốn ODA · Vốn xã hội hóa · Vốn vay thương mại (+ nguồn tự thêm) |

---

## Màn 1. Danh sách dự án

Component: ProjectsWorksScreen, ProjectsFilterToolbar, ProjectsTable · Hook: useProjectsWorks

| Thao tác trên màn | API / hàm | Làm gì |
|---|---|---|
| Mở màn | **1.1** `GET /projects` | Bảng dự án: Dự án · Loại dự án · Vốn đầu tư · Tiến độ · Chủ nhiệm · Bắt đầu · Hoàn thành · Thao tác |
| Ô tìm kiếm | 1.1 `?q=` (hiện FE tự lọc) | Tìm theo tên, mã, người phụ trách, giám sát, loại, nguồn vốn |
| Lọc "Tất cả loại" / "Tất cả trạng thái" | 1.1 `?type=` `?status=` | — |
| Bấm tiêu đề cột Vốn đầu tư / Tiến độ / Hoàn thành | 1.1 `?sort=` | Đổi tăng / giảm dần |
| Phân trang (15 dự án / trang) | 1.1 `?page=&pageSize=15` | — |
| Công tắc ở cột Thao tác | **1.2** `PATCH /projects/:id/status` | Khóa (cảnh báo Quy tắc 5 nếu đã giải ngân) / mở khóa |
| Bấm dòng / nút ✏ | Sang màn 3 (gọi 3.1) | — |
| Nút "Thêm dự án" | Sang màn 2 | Chỉ hiện khi có quyền `m2.create_edit` |

### 1.1. Xem danh sách dự án ⚠

**Request**
```
GET /projects
Query:
  q?: string                                  // tìm không dấu: tên, mã, người phụ trách, giám sát, loại, nguồn vốn
  type?: string                               // loại dự án (PROJECT_TYPE)
  status?: "active" | "closed"                // bỏ trống = cả hai
  sort?: "latest" | "investment_asc" | "investment_desc" | "progress_asc" | "progress_desc"
       | "endDate_asc" | "endDate_desc"       // mặc định "latest" (mới tạo trước)
  page?: number                               // mặc định 1
  pageSize?: number                           // mặc định 15
```

**Response**
```json
{
  "status": true,
  "statusCode": 200,
  "data": {
    "items": [
      {
        "id": "8d1f0c2a-4b3e-4f5a-9c6d-7e8f9a0b1c2d",
        "code": "BQL-DA-2026-003",
        "name": "FIMI2",
        "type": "Giao thông",
        "fundingSource": "Ngân sách thành phố",
        "totalInvestment": 1000000,
        "disbursedAmount": 0,
        "actualProgress": 0,
        "plannedProgress": 0,
        "currentStage": "PREPARATION",
        "manager": { "id": "f8a20277-...", "fullName": "Huỳnh Thái Hải" },
        "supervisor": { "id": "f8a20277-...", "fullName": "Huỳnh Thái Hải" },
        "startDate": "2026-11-10",
        "endDatePlanned": "2026-11-12",
        "status": "active"
      }
    ],
    "total": 3,
    "page": 1,
    "pageSize": 15
  }
}
```

### 1.2. Khóa / mở khóa dự án ⚠

**Request**
```
PATCH /projects/:id/status
Body: { "status": "closed" | "active" }
```
- Hệ thống **không có chức năng xóa dự án** — khóa là cách duy nhất để ngưng một dự án. Dự án khóa vẫn giữ nguyên dữ liệu quy trình, giải ngân, tệp đính kèm và lịch sử.
- Khóa dự án **đã phát sinh giải ngân** (`disbursedAmount > 0`): FE hiện hộp cảnh báo Quy tắc 5 trước khi gọi; chưa giải ngân thì hiện hộp xác nhận thường.
- Dự án đã khóa: mọi API sửa (3.2, 3.3, 3.6, 4.1 và các thao tác bước ở `/my-tasks`) trả 403 `"Dự án đã khóa."`.

**Response:** `{ "status": true, "statusCode": 200, "data": { "id": "...", "status": "closed" } }` · Ghi `audit-logs` (`Khóa dự án` / `Mở khóa dự án`).

---

## Màn 2. Thêm dự án mới

Component: CreateProjectPage, ProjectProcedurePicker, WorkTypeSelect · Hook: useCreateProjectForm · Hàm: `utils/create-project-form.ts`

| Thao tác trên màn | API / hàm | Làm gì |
|---|---|---|
| Mở màn | **2.2**, **2.3**, **2.4** | Nạp quy trình đang bật, cán bộ, danh mục loại dự án / nguồn vốn |
| Mã dự án hiện ở đầu trang | Backend tự sinh khi 2.1 (hiện FE tự sinh) | `BQL-DA-<năm>-###` |
| Ô "Nguồn vốn" / "Loại dự án" → dòng "Thêm" cuối danh sách | **2.4** `POST /catalogs` | Thêm mục mới vào danh mục |
| Tích quy trình + đặt tên tab | FE tự xử lý (gửi kèm 2.1) | Phòng ban phụ trách lấy theo quy trình đã tích |
| Ô tải tệp | **2.5** `POST /projects/files` | Tải từng tệp, giữ `fileId` để gửi kèm 2.1 |
| Nút "Thêm dự án" | **2.1** `POST /projects` | — |

### 2.1. Tạo dự án ⚠

**Request**
```json
POST /projects
{
  "name": "Đường số 6",
  "type": "Giao thông",
  "location": "Phường Đông Hồ",
  "nature": "new",
  "fundingSource": "Ngân sách thành phố",
  "totalInvestment": 1000000000,
  "plan2026": 0,
  "managerId": "f8a20277-...",
  "supervisorId": "f8a20277-...",
  "startDate": "2026-11-10",
  "endDatePlanned": "2027-06-30",
  "procedures": [
    { "procedureId": "6f1c2d3e-...", "tabLabel": "Chuẩn bị ĐT đường số 6" },
    { "procedureId": "9a8b7c6d-...", "tabLabel": null }
  ],
  "fileIds": ["c1d2e3f4-..."]
}
```

**Kiểm tra** (FE đang dùng `validateCreateForm`, backend làm lại):

| Điều kiện | Lỗi 400 |
|---|---|
| `name` trống | `Vui lòng nhập tên công trình / dự án (*).` |
| `type` trống | `Vui lòng chọn loại công trình (*).` |
| `procedures` rỗng | `Vui lòng chọn ít nhất một quy trình dự án (*).` |
| trùng `procedureId` trong `procedures` | `Quy trình bị chọn trùng.` |
| thiếu `startDate` / `endDatePlanned` | `Vui lòng chọn ngày bắt đầu (*).` / `Vui lòng chọn ngày kết thúc kế hoạch (*).` |
| `endDatePlanned <= startDate` | `Ràng buộc: Ngày kết thúc kế hoạch phải sau ngày bắt đầu.` |
| quy trình không tồn tại / đang tắt | `Quy trình không còn áp dụng được.` |

**`procedures`** = các quy trình đã tích trong bảng "Quy trình dự án", theo thứ tự hiện trên màn:
- `procedureId`: quy trình được tích. Chỉ gửi id, **không có phòng ban**.
- `tabLabel`: ô "Tên đầu mục (hiện trên tab)", không bắt buộc; trống thì tab lấy tên quy trình bỏ chữ "Quy trình" ở đầu. Tên này cũng là đầu mục ở tab Giải ngân.
- Ô "Loại quy trình" (Thủ tục đầu tư XDCB · Bồi thường – GPMB · Đấu thầu) chỉ để lọc bảng ở FE, **không gửi**.
- FE hiện lưu dạng `{ "<khóa phòng ban>": procedureId }` (`procedureTarget` tự gán phòng ban) — khi nối API đổi sang mảng như trên.

**Backend làm khi tạo:** sinh `code`; mỗi quy trình đã chọn tạo một dòng `project_procedures` (có `id` riêng — là khóa của tab quy trình ở 3.1, 3.4); chép các bước của từng quy trình sang dự án (người thực hiện lấy theo quy trình gốc, trạng thái `NOT_STARTED`, tính `startDatePlanned / endDatePlanned` từ `startDate` dự án); ghi dòng lịch sử "Khởi tạo hồ sơ dự án mới trên hệ thống." và "Áp dụng quy trình … cho …" (FE hiện làm ở `createProjectItem` + `initProjectProcedure`).

**Response** `201`: dự án đầy đủ như 3.1.

### 2.4. Danh mục loại dự án / nguồn vốn ✅

```
GET  /catalogs?type=PROJECT_TYPE      // Loại dự án
GET  /catalogs?type=FUND_SOURCE       // Nguồn vốn
POST /catalogs  { "type": "FUND_SOURCE", "name": "Vốn ngân sách phường" }
```
FE hiện lưu mục tự thêm ở localStorage (`cipm_custom_funding_sources`, `cipm_custom_project_natures`, loại dự án trong `WorkTypeSelect`) — khi nối API đổi sang `useCatalog`.

### 2.5. Tải tệp đính kèm ⚠

```
POST /projects/files            (multipart/form-data, field "file"; tối đa 50MB / tệp)
Response 201: { "id": "c1d2e3f4-...", "fileName": "QD-phe-duyet.pdf", "fileSize": 245760, "mimeType": "application/pdf", "uploadedAt": "..." }
GET  /projects/:id/files/:fileId  // tải về / xem trước (PDF, ảnh)
```

---

## Màn 3. Chi tiết dự án

Component: ProjectDetailPage (thanh tab: Thông tin chung · các tab quy trình · Giải ngân · Lịch sử)

### 3.1. Xem chi tiết dự án ⚠

```
GET /projects/:id
```
```json
{
  "status": true,
  "statusCode": 200,
  "data": {
    "id": "8d1f0c2a-...",
    "code": "BQL-DA-2026-003",
    "name": "FIMI2",
    "type": "Giao thông",
    "location": "HCM",
    "nature": "new",
    "fundingSource": "Ngân sách thành phố",
    "totalInvestment": 1000000,
    "plan2026": 0,
    "disbursedAmount": 0,
    "manager": { "id": "f8a20277-...", "fullName": "Huỳnh Thái Hải" },
    "supervisor": { "id": "f8a20277-...", "fullName": "Huỳnh Thái Hải" },
    "startDate": "2026-11-10",
    "endDatePlanned": "2026-11-12",
    "actualEndDate": null,
    "currentStage": "PREPARATION",
    "actualProgress": 0,
    "plannedProgress": 0,
    "status": "active",
    "procedures": [
      { "id": "pp-71a2...", "procedureId": "6f1c2d3e-...", "procedureName": "Quy trình chuẩn bị đầu tư", "tabLabel": "Chuẩn bị ĐT đường số 6" },
      { "id": "pp-83c4...", "procedureId": "9a8b7c6d-...", "procedureName": "Quy trình giải phóng mặt bằng", "tabLabel": null }
    ],
    "documents": [
      { "id": "c1d2e3f4-...", "fileName": "QD-phe-duyet.pdf", "fileSize": 245760, "uploadedAt": "2026-11-10T08:30:00.000Z", "url": "/api/v1/projects/8d1f.../files/c1d2..." }
    ]
  }
}
```
Tab quy trình hiện theo `procedures`, đúng thứ tự mảng (tên tab = `tabLabel`, trống thì tên quy trình bỏ chữ "Quy trình" ở đầu); chỉ hiện khi có quyền `m3.view`. `procedures[].id` là id quy trình **trong dự án** (dùng gọi 3.4), khác `procedureId` là id quy trình gốc ở thư viện. Không trả phòng ban.

### Tab "Thông tin chung"

Component: ProjectInfoTab, ProjectChangesSummary, ProjectSaveBar · Hook: useProjectInfoDraft, useProcedureDraft

| Thao tác trên màn | API / hàm | Làm gì |
|---|---|---|
| Bấm ✏ ở từng ô | FE tự xử lý (bản nháp) | Ô đã sửa có nhãn "Đã sửa"; sửa về giá trị cũ thì bỏ khỏi nháp |
| Tích / bỏ tích quy trình, đổi tên tab | FE tự xử lý (bản nháp) | — |
| Nút "Lưu thay đổi" → hộp "cũ → mới" → "Đồng ý lưu" | **3.2** (nếu có trường đổi) rồi **3.3** (nếu có quy trình đổi) | — |
| Nút "Hủy thay đổi" | FE tự xử lý | Bỏ bản nháp |
| Ô "Nguồn vốn" → "Thêm" | 2.4 `POST /catalogs` | — |

### 3.2. Lưu thay đổi thông tin ⚠

```json
PATCH /projects/:id
{
  "name": "FIMI2",
  "type": "Giao thông",
  "location": "HCM",
  "nature": "new",
  "fundingSource": "Ngân sách thành phố",
  "totalInvestment": 1000000,
  "managerId": "f8a20277-...",
  "supervisorId": "f8a20277-...",
  "startDate": "2026-11-10",
  "endDatePlanned": "2026-11-12"
}
```
Chỉ gửi các trường đã đổi. Kiểm tra như 2.1 (tên, loại, ngày) + `totalInvestment >= 0`. Backend so cũ → mới và ghi `audit-logs` với `changes` (`[{ "label": "Tổng mức đầu tư", "from": "1.000.000 VNĐ", "to": "2.000.000 VNĐ" }]`) — FE hiện ghép thành `progressNote` và lưu vào `progressHistory`.

### 3.3. Đổi quy trình áp dụng / tên tab ⚠

```json
PUT /projects/:id/procedures
{
  "remove": ["9a8b7c6d-..."],
  "add": [{ "procedureId": "1b2c3d4e-...", "tabLabel": null }],
  "labels": { "6f1c2d3e-...": "Chuẩn bị ĐT đường số 6" }
}
```
- Mọi trường đều theo `procedureId` (giống 2.1): `remove` = quy trình bỏ tích, `add` = quy trình mới tích, `labels` = đổi tên tab của quy trình đang áp dụng. Không gửi phòng ban.
- Gỡ quy trình = **xóa các bước và tiến độ** của quy trình đó trong dự án (hộp xác nhận FE đã ghi rõ).
- Sau khi lưu, backend tính lại `actualProgress` của dự án theo các bước còn lại (FE hiện đồng bộ qua `onProcedureSync` → `applyProcedureSync`).

**Response:** `{ "actualProgress": 35, "procedures": [...] }` (`procedures` cùng dạng 3.1)

### Tab quy trình (mỗi quy trình áp dụng là một tab)

Component: ProjectProcedureTab, ProcedureStepFlowDrawer · Hook: useProjectProcedure · Hàm: `utils/project-procedure-flow.ts`, `utils/project-procedure-data.ts`

Tab **chỉ để xem**: sơ đồ các bước, trạng thái, người thực hiện, hạn; không có nút nộp, duyệt hay sửa phân công.

| Thao tác trên màn | API | Làm gì |
|---|---|---|
| Mở tab | **3.4** | Có quyền `m3.view`; dải tóm tắt (bước đang thực hiện, người thực hiện, hạn, kế hoạch) + sơ đồ bước |
| Đổi chế độ xem (Quy trình / các bảng phụ) | FE tự xử lý | — |
| Bấm một bước | FE mở ProcedureStepFlowDrawer (dữ liệu từ 3.4) | Xem chi tiết bước: ngày, người nộp, người duyệt, lý do từ chối, hồ sơ |

### 3.4. Xem quy trình của dự án ⚠

```
GET /projects/:id/procedure
Query: projectProcedureId?: string     // procedures[].id của tab (3.1); bỏ trống = mọi quy trình của dự án
```
```json
{
  "status": true,
  "statusCode": 200,
  "data": {
    "procedures": [
      { "id": "pp-71a2...", "procedureId": "6f1c2d3e-...", "procedureName": "Quy trình chuẩn bị đầu tư", "tabLabel": "Chuẩn bị ĐT đường số 6" }
    ],
    "steps": [
      {
        "id": "a7b8c9d0-...",
        "projectProcedureId": "pp-71a2...",
        "code": "I.1",
        "groupCode": "I",
        "groupTitle": "Lập, thẩm định và phê duyệt chủ trương đầu tư",
        "name": "Báo cáo đề xuất chủ trương đầu tư",
        "type": "MANDATORY",
        "isEnabled": true,
        "plannedDays": 30,
        "startDatePlanned": "2026-11-10",
        "endDatePlanned": "2026-12-10",
        "actualStartDate": "2026-11-10",
        "actualEndDate": null,
        "assignee": { "id": "f8a20277-...", "fullName": "Huỳnh Thái Hải" },
        "supervisor": null,
        "status": "IN_PROGRESS",
        "submissionStatus": "SUBMITTED",
        "submittedBy": "Huỳnh Thái Hải",
        "submittedAt": "2026-11-10",
        "submissionNote": "Đã hoàn thành báo cáo",
        "rejectionReason": null,
        "documents": [
          { "id": "d1e2...", "documentCode": "123/BC-BQL", "title": "Báo cáo đề xuất", "fileName": "BC-de-xuat.pdf", "fileSize": 102400, "uploadedBy": "Huỳnh Thái Hải", "uploadedAt": "2026-11-10T09:00:00.000Z" }
        ]
      }
    ],
    "stageApprovals": {
      "pp-71a2...::I": { "status": "APPROVED", "decidedBy": "Huỳnh Thái Hải", "decidedAt": "2026-11-10", "note": "Đã nghiệm thu giai đoạn" }
    }
  }
}
```

**Trạng thái bước**

| `status` | `submissionStatus` | Hiện trên màn |
|---|---|---|
| `NOT_STARTED` | — | Chưa bắt đầu (chưa tới lượt nếu bước trước chưa xong) |
| `IN_PROGRESS` | — / `PENDING_SUBMISSION` | Đang xử lý |
| `IN_PROGRESS` | `SUBMITTED` | Chờ Tổ trưởng duyệt |
| `IN_PROGRESS` | `REJECTED` | Bị từ chối, làm lại |
| `COMPLETED` | `APPROVED` | Hoàn thành |
| `DISABLED` | — | Không áp dụng |

Giai đoạn (`groupCode`, VD "I") có khóa nghiệm thu `"<projectProcedureId>::<groupCode>"`; giai đoạn có mọi bước hoàn thành thì BGĐ nghiệm thu (ở `/my-tasks`).

### Tab "Giải ngân"

Component: ProjectDisbursementTab, DisbursementCategoryRow, DisbursementFormDrawer, DisbursementRecordDrawer · Hook: useProjectDisbursements · Hàm: `utils/project-disbursement.ts`

| Thao tác trên màn | API | Làm gì |
|---|---|---|
| Mở tab | **3.5** | Dải tổng quan (Tổng mức đầu tư · Đã giải ngân · Còn lại · Tỷ lệ) + bảng theo đầu mục |
| Nút "Giải ngân" ở một đầu mục | **3.6** `kind: "disburse"` | — |
| Nút "Thu hồi" ở một đầu mục | **3.6** `kind: "withdraw"` | Bắt buộc lý do |
| Bấm một đợt | FE mở ngăn chi tiết (dữ liệu từ 3.5) | Chỉ xem: số tiền, nội dung, người tạo, chứng từ |
| Ngăn "Giải ngân" → ô "Danh mục" (nạp từ **3.7** `GET /catalogs?type=EXPENSE_TYPE`) → gõ tên mới → "Thêm" | **3.7** `POST /catalogs` | Chỉ khi dự án chưa có tab quy trình; có tab quy trình thì ô này là "Đầu mục" = tên các tab, không dùng danh mục |

**Đầu mục giải ngân:** dự án có quy trình thì đầu mục = **tên các tab quy trình**; chưa có thì dùng danh mục chi phí `EXPENSE_TYPE`.

### 3.5. Xem các đợt giải ngân ⚠

```
GET /projects/:id/disbursements
```
```json
{
  "status": true,
  "statusCode": 200,
  "data": {
    "summary": {
      "totalInvestment": 1000000000,
      "total": 350000000,
      "remaining": 650000000,
      "count": 3,
      "byCategory": [
        { "category": "FIMI", "total": 300000000, "count": 2, "lastDate": "2026-11-10" },
        { "category": "Giải phóng mặt bằng", "total": 50000000, "count": 1, "lastDate": "2026-11-05" }
      ]
    },
    "entries": [
      {
        "id": "e1f2a3b4-...",
        "kind": "disburse",
        "category": "FIMI",
        "amount": 200000000,
        "date": "2026-11-10",
        "content": "Tạm ứng hợp đồng tư vấn",
        "attachments": [{ "id": "f1...", "fileName": "UNC-01.pdf", "fileSize": 51200, "url": "/api/v1/projects/.../files/f1..." }],
        "createdBy": { "id": "f8a20277-...", "fullName": "Huỳnh Thái Hải" },
        "createdAt": "2026-11-10T08:30:00.000Z"
      }
    ]
  }
}
```
`total` = tổng giải ngân trừ tổng thu hồi; `disbursedAmount` của dự án luôn bằng `total` (dùng cho Quy tắc 5).

### 3.6. Thêm đợt giải ngân / thu hồi ⚠

```json
POST /projects/:id/disbursements
{
  "kind": "disburse",
  "category": "FIMI",
  "amount": 200000000,
  "content": "Tạm ứng hợp đồng tư vấn",
  "fileIds": ["f1..."]
}
```

**Kiểm tra** (FE đang dùng `validateDisbursement`):

| Điều kiện | Lỗi 400 |
|---|---|
| thiếu `category` | `Vui lòng chọn danh mục.` |
| `amount <= 0` | `Số tiền giải ngân phải lớn hơn 0.` / `Số tiền thu hồi phải lớn hơn 0.` |
| giải ngân vượt `totalInvestment − total` | `Số tiền vượt phần còn lại của tổng mức đầu tư.` |
| thu hồi vượt số đã giải ngân của đầu mục | `Số tiền thu hồi vượt số đã giải ngân của danh mục.` |
| thu hồi thiếu `content` | `Vui lòng nhập lý do thu hồi.` |
| `fileIds` rỗng | `Vui lòng đính kèm ít nhất 1 file chứng từ.` |

Quyền: nhập liệu M4 (`m4_finance_settlement:input`) và dự án chưa khóa. `date` = hôm nay, `createdBy` = người gọi. Trả đợt vừa tạo + `summary` mới; ghi `audit-logs`.

Đợt giải ngân đã ghi **không xóa, không sửa được**; muốn điều chỉnh thì tạo đợt thu hồi (`kind: "withdraw"`).

### Tab "Lịch sử"

Component: ProjectHistoryTab

### 3.8. Lịch sử dự án ✅ (cần thêm module)

```
GET /audit-logs
Query: module=projects, targetId=<id dự án>, date?: "2026-11-10", page?, pageSize?
```
Response cùng dạng `audit-logs` hiện có (`at`, `actorName`, `actorRole`, `action`, `targetName`, `changes[]`, `note`). Gộp cả lịch sử **thông tin dự án** (2.1, 3.2, 1.2, 4.1) và **quy trình** (3.3 và các thao tác bước ở `/my-tasks`) — FE hiện ghép từ `progressHistory` của dự án và `history` của dữ liệu quy trình (`buildEntries`).

| `action` | Từ API |
|---|---|
| Khởi tạo hồ sơ dự án · Cập nhật thông tin dự án · Khóa / Mở khóa dự án | 2.1 · 3.2 · 1.2 |
| Cập nhật tiến độ tuần | 4.1 |
| Cập nhật quy trình dự án | 3.3 |
| Lưu phân công & thời gian | `/my-tasks` |
| Nộp kết quả chờ duyệt · Nộp lại sau khi bị từ chối · Tổ trưởng duyệt bước · Từ chối kết quả bước | `/my-tasks` |
| BGĐ nghiệm thu giai đoạn · BGĐ yêu cầu rà soát giai đoạn | `/my-tasks` |
| Giải ngân · Thu hồi | 3.6 |

---

## Màn 4. Hộp xem nhanh dự án (Bảng điều khiển)

Component: `components/detail/quick-view/` — ProjectDetailModal (tab Tổng quan · Cập nhật tiến độ · Sửa thông tin), mở từ DashboardProjectsSection. Xem dùng 3.1, sửa thông tin dùng 3.2 (hàm `utils/edit-project-form.ts`).

### 4.1. Cập nhật tiến độ tuần ⚠

```json
POST /projects/:id/progress
{
  "actualProgress": 100,
  "currentStage": "COMPLETED",
  "note": "Hoàn thành nghiệm thu đưa vào sử dụng",
  "actualEndDate": "2026-11-10"
}
```

**Kiểm tra** (FE đang dùng `validateProgressUpdate`):

| Điều kiện | Lỗi |
|---|---|
| không có quyền (Quy tắc 4) | 403 — chỉ người phụ trách / giám sát dự án hoặc chức danh có `project:progress_rule4` |
| `actualProgress` ngoài 0–100 | 400 `Tiến độ thực tế phải nằm trong khoảng từ 0% đến 100%.` |
| `actualProgress = 100` mà thiếu `actualEndDate` (Quy tắc 6) | 400 `Khi tiến độ đạt 100%, bắt buộc nhập ngày hoàn thành thực tế theo Quy tắc 6.` |
| `note` trống | 400 `Vui lòng nhập ghi chú hoặc nội dung công việc hiện trường trong tuần.` |

Ghi một dòng lịch sử tiến độ: `{ updatedBy, oldProgress, newProgress, note, stageRecorded, actualEndDateRecorded }`.

---

## Quy tắc nghiệp vụ

| Quy tắc | Nội dung | API |
|---|---|---|
| BRD 4.2.2 | Ngày kết thúc kế hoạch phải sau ngày bắt đầu | 2.1, 3.2 |
| Quy tắc 4 | Chỉ người phụ trách / giám sát dự án hoặc chức danh được cấp quyền mới cập nhật tiến độ | 4.1 |
| Quy tắc 5 | Dự án không bị xóa, chỉ được khóa; dự án đã phát sinh giải ngân phải qua cảnh báo trước khi khóa | 1.2 |
| Quy tắc 6 | Tiến độ đạt 100% bắt buộc có ngày hoàn thành thực tế | 4.1 |
| Dự án đã khóa | Chỉ xem; mọi API ghi trả 403 cho tới khi mở khóa | 1.2 |
| Tiến độ theo quy trình | `actualProgress` = tỷ lệ bước hoàn thành trên các quy trình áp dụng; backend tính lại sau 3.3 và khi bước được duyệt (`/my-tasks`) | 3.3 |

## Phân quyền

| Ô trên Ma trận phân quyền | Mã backend | Được làm |
|---|---|---|
| `m2.view` | `project:view` | 1.1, 3.1, 3.5, 3.8 |
| `m2.create_edit` | `project:create_update` | 2.1, 3.2, 3.3, 2.5 |
| `m2.update_progress` | `project:progress_rule4` | 4.1 (ngoài người phụ trách / giám sát) |
| `m2.close_open` | `project:archive_rule5` | 1.2 |
| `m3.view` | `procedure:view` | Tab quy trình (3.4, chỉ xem) |
| `m4.create_disbursement` | `finance:request_disbursement` | 3.6 |

---

## Phụ lục

### A. Bảng dữ liệu đề xuất

| Bảng | Cột chính |
|---|---|
| `projects` | `id`, `code` (unique), `name`, `type`, `location`, `nature`, `fundingSource`, `totalInvestment`, `plan2026`, `disbursedAmount`, `managerId`, `supervisorId`, `startDate`, `endDatePlanned`, `actualEndDate`, `currentStage`, `actualProgress`, `plannedProgress`, `status`, `createdBy`, `createdAt`, `updatedAt` |
| `project_procedures` | `id`, `projectId`, `procedureId`, `procedureName`, `tabLabel`, `sortOrder` |
| `project_procedure_steps` | `id`, `projectProcedureId`, `sourceStepId`, `code`, `groupCode`, `groupTitle`, `name`, `type`, `isEnabled`, `plannedDays`, `startDatePlanned`, `endDatePlanned`, `actualStartDate`, `actualEndDate`, `assigneeId`, `supervisorId`, `status`, `submissionStatus`, `submittedBy`, `submittedAt`, `submissionNote`, `rejectionReason`, `rejectedBy` |
| `project_step_documents` | `id`, `stepId`, `fileId`, `documentCode`, `title`, `issuer`, `issueDate`, `uploadedBy`, `uploadedAt` |
| `project_stage_approvals` | `projectId`, `stageKey`, `status`, `decidedBy`, `decidedAt`, `rejectionReason`, `note` |
| `project_progress_history` | `id`, `projectId`, `updatedBy`, `oldProgress`, `newProgress`, `note`, `stageRecorded`, `actualEndDateRecorded`, `createdAt` |
| `project_disbursements` | `id`, `projectId`, `kind`, `category`, `amount`, `date`, `content`, `createdBy`, `createdAt` |
| `project_files` | `id`, `projectId`, `ownerType` (`project` / `step` / `disbursement`), `ownerId`, `fileName`, `fileSize`, `mimeType`, `storageKey`, `uploadedBy`, `uploadedAt` |

### B. Hàm thuần dùng lại được ở backend

Các hàm dưới đây không phụ thuộc giao diện, có test (`tests/project-list.test.mjs`, `tests/project-forms.test.mjs`) — backend có thể chép sang để kiểm tra giống FE:

| Hàm | File | Dùng cho |
|---|---|---|
| `filterAndSortProjects`, `nextProjectCode` | `utils/project-list.ts` | 1.1, 2.1 |
| `createProjectItem`, `applyProjectUpdate`, `applyProcedureSync` | `utils/project-list.ts` | 2.1, 3.2, 3.3 |
| `validateCreateForm`, `toProjectFormData` | `utils/create-project-form.ts` | 2.1 |
| `validateEditForm`, `toEditProjectFormData` | `utils/edit-project-form.ts` | 3.2 (hộp xem nhanh) |
| `validateProgressUpdate` | `utils/project-progress.ts` | 4.1 |
| `validateDisbursement`, `summarizeDisbursements`, `signedAmount` | `utils/project-disbursement.ts` | 3.5, 3.6 |
| `shortProcedureLabel` | `utils/procedure-target.ts` | tên tab ở 3.1 |
| `toDepartmentSteps`, `sameDepartmentKey` | `utils/project-procedure-data.ts` | 2.1, 3.3, 3.4 |
| `getProcedureProgress`, `getAppliedDepartments`, `stageApprovalKey` | `utils/project-procedure-flow.ts` | 3.3, 3.4 |
| `withPlannedDates` | `utils/step-schedule.ts` | 2.1, 3.3 |

### C. Hàm FE hiện tại → API thay thế

Lớp gọi API đã tách giống phân hệ Nhân sự (màn hình **chưa nối**, vẫn gọi hàm cũ bên dưới):
- `api/project.backend.ts` — gọi API thô (1.1, 1.2, 2.1, 2.5, 3.1–3.6, 3.8, 4.1).
- `services/project.mapper.ts` — kiểu dữ liệu backend ↔ `ProjectItem`, `ProjectProcedureData`, `DisbursementEntry` (VD `manager.fullName` → `managerName`; `projectProcedureId` đặt vào khóa `department` cũ để tab quy trình chạy như hiện tại).
- `services/project.api.ts` — hàm màn hình gọi; tài khoản thử nghiệm `mock_...` hoặc server không phản hồi thì chạy `services/mock-project.repository.ts` (store + localStorage hiện tại). 3.3, 3.8, tải tệp trả `null` ở bản mock → màn hình tự xử lý như cũ.

| Hàm FE hiện tại | File | Khóa localStorage | Mục |
|---|---|---|---|
| `useProjectStore` (`projects`, `setProjects`) | `src/stores/project.store.ts` | `cipm_shared_projects_store_v4` | 1.1, 3.1 |
| `useProjectsWorks().createProject` | `hooks/useProjectsWorks.ts` | (store trên) | 2.1 |
| `useProjectsWorks().updateProject` / `ProjectDetailPage → confirmSaveChanges` | `hooks/useProjectsWorks.ts` | (store trên) | 3.2 |
| `useProjectsWorks().requestToggleProject` / `confirmProjectAction` | `hooks/useProjectsWorks.ts` | (store trên) | 1.2 |
| `initProjectProcedure` | `utils/project-procedure-data.ts` | `cipm_procedure_projects_data_v6` | 2.1 |
| `useProjectProcedure` (`data`, `saveProcedureChanges`) | `hooks/useProjectProcedure.ts` | `cipm_procedure_projects_data_v6` | 3.3, 3.4 |
| `useProjectDisbursements` (`entries`, `summary`, `add`, `addCategory`) | `hooks/useProjectDisbursements.ts` | `cipm_project_disbursements_v1`, `cipm_disbursement_categories_v1` | 3.5–3.7 |
| `loadCustomOptions` / `saveCustomOptions` | `utils/custom-options.ts` | `cipm_custom_funding_sources`, `cipm_custom_project_natures` | 2.4 |
| `ProjectHistoryTab → buildEntries` | `components/detail/ProjectHistoryTab.tsx` | (ghép từ 2 nguồn trên) | 3.8 |

**Việc FE cần đổi khi nối API**
- Người phụ trách / giám sát / người thực hiện đang lưu theo **họ tên** (`managerName`, `assignedTo`) → đổi sang `id` cán bộ; quyền "người phụ trách" (Quy tắc 4) so theo `id` thay vì so tên.
- Mã dự án (`nextProjectCode`) và `id` (`PRJ-<thời gian>`) do backend sinh.
- `disbursedAmount` không tự cộng ở FE (`setDisbursedAmount`) nữa — đọc từ 3.1 / 3.5.
- Tệp đính kèm đang lưu dạng data URL trong localStorage → đổi sang `fileId` (2.5).
- `procedures` gửi dạng mảng `{ procedureId, tabLabel }` (2.1, 3.3) thay cho map theo khóa phòng ban; bỏ `procedureTarget` ở FE.
- Tab quy trình, bước, khóa nghiệm thu giai đoạn đang theo **khóa phòng ban** (`department`, `sameDepartmentKey`, `stageApprovalKey`) → đổi sang `projectProcedureId` (3.1, 3.4). Dự án không còn trường `departments`.
- `actualProgress` theo quy trình do backend tính; bỏ `onProcedureSync` / `applyProcedureSync` ở FE.
