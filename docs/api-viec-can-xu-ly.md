# API màn Việc cần xử lý (`/my-tasks`)

Bảng việc của người đang đăng nhập trên mọi dự án: tiếp nhận → làm (ghi chú, hồ sơ) → nộp → Tổ trưởng duyệt / từ chối; báo và xử lý sự cố; trả việc.

- Frontend: `src/features/my-tasks`
- Backend: `cipm-service` — chưa có. Endpoint, kiểm tra dữ liệu đều là **đề xuất**. Dùng chung dạng bước `ApiProjectStep` và quy trình dự án với [API Dự án & Công trình](api-du-an-cong-trinh.md) mục 3.4.
- Hiện FE chạy bằng dữ liệu mẫu + localStorage; đăng nhập bằng tài khoản thật thì gọi API (xem Phụ lục).

Ký hiệu: ⚠ backend chưa có (đề xuất).

---

## Quy ước chung

```
Base URL: /api/v1
Header:   Authorization: Bearer <accessToken>

Thành công: { "status": true, "statusCode": 200, "data": ... }
Lỗi:        { "message": "...", "error": "Bad Request", "statusCode": 400 }
```

| Mã lỗi | Ý nghĩa |
|---|---|
| 400 | Thiếu lý do, bước chưa có ghi chú / hồ sơ khi nộp, bước không ở đúng trạng thái cho thao tác |
| 403 | Không phải người được giao bước / không phải Tổ trưởng phòng ban của bước / dự án đã khóa |
| 404 | Không tìm thấy dự án / bước / hồ sơ |

Mọi thao tác ghi (2.x, 3.x) trả **bước sau khi cập nhật** — cùng dạng một phần tử `steps` ở 1.1 — và ghi một dòng nhật ký bước (xem bảng ở 1.2):

```json
{
  "status": true,
  "statusCode": 200,
  "data": {
    "id": "a7b8c9d0-...",
    "projectProcedureId": "pp-71a2...",
    "code": "I.1",
    "name": "Báo cáo đề xuất chủ trương đầu tư",
    "status": "IN_PROGRESS",
    "submissionStatus": "SUBMITTED",
    "submittedBy": "Huỳnh Thái Hải",
    "submittedAt": "2026-11-11",
    "acceptedBy": "Huỳnh Thái Hải",
    "acceptedAt": "2026-11-10",
    "documents": [ … ]
  }
}
```

---

## Tổng quan

| Nhóm | API | Endpoint | Backend |
|---|---|---|---|
| **1. Đọc** | 1.1 Việc của tôi | `GET /my-tasks` | ⚠ |
| | 1.2 Nhật ký bước | `GET /projects/:id/procedure/steps/:stepId/history` | ⚠ |
| **2. Người thực hiện** | 2.1 Tiếp nhận việc | `POST /projects/:id/procedure/steps/:stepId/accept` | ⚠ |
| | 2.2 Lưu ghi chú | `PATCH /projects/:id/procedure/steps/:stepId/note` | ⚠ |
| | 2.3 Thêm hồ sơ | `POST /projects/:id/procedure/steps/:stepId/documents` | ⚠ |
| | 2.4 Gỡ hồ sơ | `DELETE /projects/:id/procedure/steps/:stepId/documents/:documentId` | ⚠ |
| | 2.5 Nộp kết quả | `POST /projects/:id/procedure/steps/:stepId/submit` | ⚠ |
| | 2.6 Từ chối việc | `POST /projects/:id/procedure/steps/:stepId/decline` | ⚠ |
| | 2.7 Hoàn trả | `POST /projects/:id/procedure/steps/:stepId/give-back` | ⚠ |
| | 2.8 Báo cáo sự cố | `POST /projects/:id/procedure/steps/:stepId/incident` | ⚠ |
| **3. Tổ trưởng** | 3.1 Duyệt hoàn thành | `POST /projects/:id/procedure/steps/:stepId/approve` | ⚠ |
| | 3.2 Từ chối kết quả | `POST /projects/:id/procedure/steps/:stepId/return` | ⚠ |
| | 3.3 Đã xử lý sự cố | `POST /projects/:id/procedure/steps/:stepId/incident/resolve` | ⚠ |
| **Dùng chung** | Tải tệp | `POST /projects/files` | ⚠ (API Dự án 2.5) |

---

## Màn hình

| Thao tác | API |
|---|---|
| Mở màn, ô tìm theo dự án, lọc quy trình | **1.1** (FE tự chia cột, tự lọc) |
| Bấm thẻ → ngăn chi tiết | Thông tin bước từ 1.1; mục "Nhật ký bước" gọi **1.2** |
| Nút "Thực hiện" | **2.1** |
| Ô ghi chú (tự lưu khi rời ô) | **2.2** |
| Chọn / kéo tệp vào ô hồ sơ | `POST /projects/files` từng tệp → **2.3** |
| Gỡ tệp mình đã thêm | **2.4** |
| Nút "Nộp kết quả" | **2.5** |
| "Từ chối" (người thực hiện) | **2.6** |
| "Hoàn trả" | **2.7** |
| Nút "Báo cáo sự cố" | **2.8** |
| Nút "Duyệt hoàn thành" | **3.1** |
| Nút "Từ chối" (Tổ trưởng) | **3.2** |
| Nút "Đã xử lý sự cố" | **3.3** |

**Cột trên bảng** (FE tính từ 1.1): Chờ tiếp nhận · Đang xử lý · Chờ duyệt · Hoàn thành · Từ chối · Sự cố. Thẻ của người khác (chỉ chủ dự án thấy) hiện mờ, chỉ xem.

---

## 1.1. Việc của tôi ⚠

```
GET /my-tasks
```

Backend **tự lọc theo người gọi** — không trả bước người gọi không được xem (FE chỉ ẩn / hiện, không phải lớp bảo mật). Một bước được trả khi người gọi thuộc ít nhất một trường hợp:

| Người gọi | Bước được trả |
|---|---|
| Người được giao bước (`assignee.id` = người gọi) | Bước đó |
| Tổ trưởng phòng ban của quy trình (`procedures[].department`) | Bước **đang chờ duyệt** hoặc **đang có sự cố** của phòng ban mình; bước mình đã duyệt / đã từ chối |
| Có quyền `procedure:approve_step` | Như Tổ trưởng nhưng ở **mọi** phòng ban |
| Người phụ trách dự án (`project.manager.id` = người gọi) | **Mọi** bước của dự án đó (FE hiện mờ, chỉ xem) |

Quy tắc khác:
- So khớp người theo **mã cán bộ** (`id`), không theo họ tên.
- "Tổ trưởng" xác định theo vai trò `*_LEAD` của tài khoản (VD `TECH_LEAD`, `COMPENSATION_LEAD`) **và** phòng ban của tài khoản trùng `procedures[].department`. Giám đốc / Phó Giám đốc không tính là Tổ trưởng.
- Không trả bước tiêu đề (bước có bước con).
- Mỗi bước kèm `reached`: đã tới lượt làm theo thứ tự quy trình — backend tự tính trên **toàn bộ** bước của quy trình, nên FE không cần nhận các bước khác.
- Dự án không còn bước nào được trả thì bỏ khỏi danh sách.

```json
{
  "status": true,
  "statusCode": 200,
  "data": [
    {
      "project": {
        "id": "8d1f0c2a-...",
        "code": "BQL-DA-2026-003",
        "name": "Đường số 6",
        "type": "Giao thông",
        "manager": { "id": "f8a20277-...", "fullName": "Huỳnh Thái Hải" },
        "supervisor": { "id": "f8a20277-...", "fullName": "Huỳnh Thái Hải" },
        "startDate": "2026-11-10",
        "endDatePlanned": "2027-06-30"
      },
      "procedures": [
        { "id": "pp-71a2...", "procedureId": "6f1c2d3e-...", "procedureName": "Quy trình chuẩn bị đầu tư", "tabLabel": null, "department": "Tổ Kế hoạch – Kỹ thuật" }
      ],
      "steps": [ "… cùng dạng steps ở API Dự án 3.4, thêm \"reached\": true | false …" ],
      "stageApprovals": {}
    }
  ]
}
```

Trường cần thêm so với API Dự án 3.4 (để FE hiện đúng cột, đúng quyền và ngăn chi tiết):

| Trường | Ý nghĩa |
|---|---|
| `procedures[].department` | Phòng ban phụ trách quy trình — để xác định Tổ trưởng được duyệt |
| `steps[].reached` | Bước đã tới lượt làm (backend tính) |
| `acceptedBy`, `acceptedAt` | Người thực hiện đã tiếp nhận (2.1) — chưa có thì thẻ nằm ở Chờ tiếp nhận |
| `incidentReason`, `incidentReportedBy`, `incidentReportedAt` | Sự cố đang mở (2.8); xử lý xong (3.3) thì xóa |
| `handbackType` (`DECLINED` / `RETURNED`), `handbackReason`, `handbackBy`, `handbackAt` | Lần từ chối (2.6) / hoàn trả (2.7) gần nhất |
| `approvedBy`, `approvedAt`, `rejectedBy`, `rejectedAt` | Người / ngày duyệt, từ chối |

Không trả nhật ký ở đây — nhật ký của từng bước lấy riêng bằng 1.2 khi mở ngăn chi tiết.

## 1.2. Nhật ký bước ⚠

```
GET /projects/:id/procedure/steps/:stepId/history
```

Mọi người xem được bước (người thực hiện, Tổ trưởng, chủ dự án) đều gọi được. Trả các dòng nhật ký của **một bước**, mới nhất trước.

```json
{
  "status": true,
  "statusCode": 200,
  "data": [
    {
      "id": "log-2",
      "stepId": "a7b8c9d0-...",
      "stepCode": "I.1",
      "stepName": "Báo cáo đề xuất chủ trương đầu tư",
      "at": "2026-11-11T09:15:00.000Z",
      "actorName": "Phan Thanh Cường",
      "actorRole": "Tổ trưởng",
      "action": "START_STEP",
      "actionLabel": "Từ chối kết quả bước",
      "reason": "Thiếu chữ ký / đóng dấu trên hồ sơ",
      "details": "Phan Thanh Cường từ chối kết quả bước [I.1]."
    },
    {
      "id": "log-1",
      "stepId": "a7b8c9d0-...",
      "stepCode": "I.1",
      "stepName": "Báo cáo đề xuất chủ trương đầu tư",
      "at": "2026-11-10T08:30:00.000Z",
      "actorName": "Huỳnh Thái Hải",
      "actorRole": "Cán bộ Ban QLDA",
      "action": "START_STEP",
      "actionLabel": "Nộp kết quả chờ duyệt",
      "reason": null,
      "details": "Huỳnh Thái Hải nộp kết quả bước [I.1]."
    }
  ]
}
```

| Trường | Ý nghĩa |
|---|---|
| `at` | Thời điểm (ISO) |
| `actorName`, `actorRole` | Người làm, chức danh lúc làm |
| `action` | Cùng bộ giá trị với nhật ký quy trình: `START_STEP`, `COMPLETE_STEP`, `SKIP_STEP`, `TOGGLE_STEP`, `ADD_DOCUMENT`, `REMOVE_DOCUMENT`, `CONFIG_DURATION` |
| `actionLabel` | Tên thao tác FE hiện trên dòng thời gian (bảng dưới) |
| `reason` | Lý do (từ chối, sự cố, trả việc); `null` nếu không có |
| `details` | Câu mô tả đầy đủ |

**Dòng nhật ký mỗi thao tác ghi** (backend ghi đúng `actionLabel` này để FE hiện giống bản hiện tại):

| API | `actionLabel` | `action` | Có `reason` |
|---|---|---|---|
| 2.1 Tiếp nhận việc | `Tiếp nhận việc` | `START_STEP` | — |
| 2.2 Lưu ghi chú | *(không ghi)* | — | — |
| 2.3 Thêm hồ sơ | `Thêm hồ sơ` | `ADD_DOCUMENT` | — |
| 2.4 Gỡ hồ sơ | `Gỡ hồ sơ` | `REMOVE_DOCUMENT` | — |
| 2.5 Nộp kết quả | `Nộp kết quả chờ duyệt` / `Nộp lại sau khi bị từ chối` | `START_STEP` | — |
| 2.6 Từ chối việc | `Từ chối nhận việc` | `START_STEP` | bắt buộc |
| 2.7 Hoàn trả | `Hoàn trả việc` | `START_STEP` | nếu có |
| 2.8 Báo cáo sự cố | `Báo sự cố` | `START_STEP` | bắt buộc |
| 3.1 Duyệt hoàn thành | `Tổ trưởng duyệt bước` | `COMPLETE_STEP` | — |
| 3.2 Từ chối kết quả | `Từ chối kết quả bước` | `START_STEP` | bắt buộc |
| 3.3 Đã xử lý sự cố | `Đã xử lý sự cố` | `START_STEP` | — |

Hai dòng `Từ chối nhận việc` và `Hoàn trả việc` FE hiện kèm đổi trạng thái (Chờ tiếp nhận → Trả về Tổ trưởng; Chờ duyệt → Đang xử lý) và lý do.

---

## 2. Người thực hiện

Chỉ người được giao bước (`assignee`) mới gọi được, trừ khi ghi chú khác.

### 2.1. Tiếp nhận việc ⚠

```
POST /projects/:id/procedure/steps/:stepId/accept
```
Bước phải **đã tới lượt** (các bước trước theo thứ tự quy trình đã xong). Ghi `acceptedBy/At`, `status = IN_PROGRESS`, `actualStartDate` = hôm nay nếu trống. Nhật ký: "Tiếp nhận việc".

### 2.2. Lưu ghi chú ⚠

```json
PATCH /projects/:id/procedure/steps/:stepId/note
{ "note": "Đã làm việc với Sở KH-ĐT" }
```
Tối đa 1000 ký tự. Không ghi nhật ký (tự lưu liên tục).

### 2.3. Thêm hồ sơ ⚠

```json
POST /projects/:id/procedure/steps/:stepId/documents
{ "documents": [{ "fileId": "c1d2e3f4-...", "title": "BC-de-xuat.pdf" }] }
```
Tệp tải trước bằng `POST /projects/files`. Nhật ký: "Thêm hồ sơ".

### 2.4. Gỡ hồ sơ ⚠

```
DELETE /projects/:id/procedure/steps/:stepId/documents/:documentId
```
Chỉ gỡ được hồ sơ do chính mình thêm. Nhật ký: "Gỡ hồ sơ".

### 2.5. Nộp kết quả ⚠

```
POST /projects/:id/procedure/steps/:stepId/submit
```
Nộp ghi chú + hồ sơ **đang lưu trên bước** (không gửi body). Bước phải đã tiếp nhận, đang `IN_PROGRESS`, không có sự cố mở.

| Điều kiện | Lỗi 400 |
|---|---|
| chưa có ghi chú và chưa có hồ sơ | `Thêm ghi chú hoặc hồ sơ kết quả trước khi nộp.` |
| đang có sự cố | `Bước đang có sự cố, chờ Tổ trưởng xử lý.` |

→ `submissionStatus = SUBMITTED`, `submittedBy/At`. Nhật ký: "Nộp kết quả chờ duyệt" / "Nộp lại sau khi bị từ chối".

### 2.6. Từ chối việc ⚠

Người thực hiện không nhận / không làm tiếp việc này, trả về Tổ trưởng để giao người khác.

```json
POST /projects/:id/procedure/steps/:stepId/decline
{ "reason": "Không thuộc chuyên môn / phạm vi phụ trách" }
```

- Khi nào: bước ở Chờ tiếp nhận hoặc Đang xử lý, chưa có sự cố mở.
- `reason` **bắt buộc** → 400 `Vui lòng nhập lý do từ chối.`
- Kết quả: `status = NOT_STARTED`, bỏ người thực hiện (`assignee`, `acceptedBy/At`), giữ ghi chú và hồ sơ; `handbackType = DECLINED`, `handbackReason/By/At`.
- Nhật ký: "Từ chối nhận việc".

### 2.7. Hoàn trả ⚠

Người thực hiện rút kết quả đã nộp để làm tiếp, trước khi Tổ trưởng duyệt.

```json
POST /projects/:id/procedure/steps/:stepId/give-back
{ "reason": "Cần chỉnh sửa lại nội dung kết quả" }
```

- Khi nào: bước đã nộp, đang chờ duyệt (`submissionStatus = SUBMITTED`).
- `reason` **không bắt buộc** (gửi `null` khi để trống).
- Kết quả: `status = IN_PROGRESS`, bỏ `submissionStatus/submittedBy/submittedAt`, giữ người thực hiện, ghi chú, hồ sơ; `handbackType = RETURNED`, `handbackReason/By/At`.
- Nhật ký: "Hoàn trả việc".

### 2.8. Báo cáo sự cố ⚠

```json
POST /projects/:id/procedure/steps/:stepId/incident
{ "reason": "Chờ ý kiến của cơ quan, đơn vị liên quan" }
```
Người thực hiện **hoặc** Tổ trưởng phòng ban của bước. Bước chưa xong, chưa có sự cố mở. `reason` bắt buộc. Nhật ký: "Báo sự cố".

---

## 3. Tổ trưởng

Tổ trưởng phòng ban của bước hoặc người có quyền `m3.approve_step` (duyệt mọi phòng ban).

### 3.1. Duyệt hoàn thành ⚠

```
POST /projects/:id/procedure/steps/:stepId/approve
```
Bước đang `SUBMITTED`. → `status = COMPLETED`, `submissionStatus = APPROVED`, `approvedBy/At`, `actualEndDate` = hôm nay; tính lại `actualProgress` của dự án. Nhật ký: "Tổ trưởng duyệt bước".

### 3.2. Từ chối kết quả ⚠

```json
POST /projects/:id/procedure/steps/:stepId/return
{ "reason": "Thiếu chữ ký / đóng dấu trên hồ sơ" }
```
`reason` bắt buộc. → `status = IN_PROGRESS`, `submissionStatus = REJECTED`, `rejectionReason`, `rejectedBy/At`. Nhật ký: "Từ chối kết quả bước".

### 3.3. Đã xử lý sự cố ⚠

```
POST /projects/:id/procedure/steps/:stepId/incident/resolve
```
Xóa `incidentReason/ReportedBy/ReportedAt`, bước về Đang xử lý. Nhật ký: "Đã xử lý sự cố".

---

## Phân quyền thao tác

Quyền người đăng nhập lấy từ `permissions` trả về lúc đăng nhập (không gọi API riêng). FE dùng `useMyTaskIdentity()` / `useMyTaskAccess(ref)` để ẩn / hiện nút; backend kiểm tra lại theo bước.

**Mã quyền trên Ma trận phân quyền**

| Ô trên Ma trận phân quyền | Mã quyền (FE) | Mã backend | Được làm |
|---|---|---|---|
| `m3.view` — Xem thủ tục 7 GĐ & 46 bước | `m3_construction_procedures:view` | `procedure:view_46b` | 1.1, 1.2 |
| `m3.update_step` — Cập nhật bước thủ tục & biên bản | `m3_construction_procedures:input` | `procedure:update_step` | 2.1–2.8 trên bước được giao |
| `m3.approve_step` — Phê duyệt hoàn thành bước | `m3_construction_procedures:approve` | `procedure:approve_step` | 3.1–3.3 trên **mọi** phòng ban |
| Tổ trưởng phòng ban (vai trò `*_LEAD` + đúng phòng ban, không phải ô ma trận) | — | — | 3.1–3.3, 2.8 trên bước của phòng ban mình |

Ngoài mã quyền, backend còn kiểm tra **người gọi có đúng là người được giao bước** (2.1–2.7). Hiện FE màn này chỉ kiểm tra `m3.approve_step` và vai trò Tổ trưởng; `m3.view` / `m3.update_step` chưa chặn ở FE.

**Ai được làm thao tác nào**

| Thao tác | Ai được làm | Component kiểm tra |
|---|---|---|
| Vào màn hình, xem việc của mình | Mọi cán bộ đăng nhập | MyTasksScreen |
| Xem nhật ký bước (1.2) | Ai xem được bước đó | MyTaskStepHistory |
| Xem việc của người khác (thẻ mờ, chỉ xem) | Người phụ trách dự án | MyTaskBoardColumn, MyTaskCard |
| Tiếp nhận, ghi chú, hồ sơ, nộp (2.1–2.5) | Người được giao bước | MyTaskDrawerFooter, MyTaskWorkSection, MyTaskAttachmentList |
| Từ chối việc (2.6) | Người được giao bước, khi Chờ tiếp nhận / Đang xử lý | MyTaskDrawerHeaderActions (nút "Từ chối") |
| Hoàn trả (2.7) | Người được giao bước, khi đã nộp và đang chờ duyệt | MyTaskDrawerFooter (nút "Hoàn trả") |
| Báo cáo sự cố (2.8) | Người được giao bước hoặc Tổ trưởng phòng ban của bước | MyTaskDrawerHeaderActions |
| Duyệt, từ chối kết quả, xử lý sự cố (3.1–3.3) | Tổ trưởng phòng ban của bước, hoặc quyền `m3_construction_procedures:approve` / `m3.approve_step` | MyTaskDrawerFooter, MyTaskDrawerHeaderActions |
| Mọi thao tác ghi khi dự án đã khóa | Không ai — trả 403 `"Dự án đã khóa."` | — |

Mọi thao tác ghi đều được lưu nhật ký bước (ai, lúc nào, lý do) để hiển thị ở mục "Nhật ký bước" trên ngăn chi tiết (đọc bằng 1.2).

---

## Phụ lục — lớp gọi API phía FE

Tách giống phân hệ Nhân sự:

| File | Vai trò |
|---|---|
| `api/my-tasks.backend.ts` | Gọi API thô (1.1, 1.2, 2.1–2.8, 3.1–3.3) |
| `services/my-tasks.mapper.ts` | `ApiMyTaskProject` → `ProjectProcedureData` (dùng lại `toProcedureParts` của Dự án); tệp tải lên → `documents[]` |
| `services/my-tasks.api.ts` | Hàm hook gọi, bọc `withBackend`: tài khoản thật gọi API, tài khoản thử nghiệm `mock_...` / server không phản hồi chạy `services/mock-my-tasks.repository.ts` (localStorage hiện tại) |
| `hooks/useMyTaskQueries.ts` | `useMyTaskData` (react-query, khóa `["my-tasks", ...]`), `useMyTask(ref)`, `useMyTaskAccess(ref)`, `useMyTaskHistory(ref)` (react-query riêng theo bước, gọi 1.2) |
| `hooks/useMyTaskActions.tsx` | Thao tác theo `{ projectId, stepId }`; xong thì làm mới `["my-tasks"]` |

Quyền nút trên ngăn chi tiết FE tự tính (`useMyTaskAccess`); backend vẫn phải kiểm tra lại như các mục trên.
