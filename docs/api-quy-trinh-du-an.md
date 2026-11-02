# API màn Quy trình dự án (M3)

Tài liệu đi theo **từng màn hình**: mỗi màn liệt kê các chức năng, ngay dưới là URL, request, response của các API màn đó gọi. Hết các màn là phần đề xuất bảng dữ liệu, phân quyền và phụ lục.

- Frontend: `src/features/construction-procedures`
- Backend: `cipm-service` — chưa có module quy trình. Endpoint, kiểm tra dữ liệu và bảng dữ liệu đều là **đề xuất**.
- Hiện FE chạy bằng dữ liệu mẫu + localStorage (Phụ lục D).
- Số API đánh theo màn: **1.x** danh sách, **2.x** chi tiết, **3.x** thêm mới, **4.x** lịch sử màn hình.

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
| 400 | Dữ liệu không hợp lệ (mã bước trùng, thiếu tên, số ngày sai...) |
| 401 | Chưa đăng nhập / token hết hạn |
| 403 | Không đủ quyền (`"Role invalid."`) |
| 404 | Không tìm thấy quy trình |
| 409 | Trùng tên quy trình / quy trình vừa được người khác lưu |

Ngày dạng `YYYY-MM-DD`, thời điểm dạng ISO (`2026-11-02T04:53:00.000Z`).

---

## Tổng quan

| Màn hình | API | Endpoint | Backend |
|---|---|---|---|
| **1. Danh sách quy trình** | 1.1 Xem danh sách quy trình | `GET /procedures` | ⚠ |
| | 1.2 Bật / tắt quy trình | `PATCH /procedures/:id` | ⚠ |
| **2. Chi tiết quy trình** | 2.1 Xem chi tiết quy trình | `GET /procedures/:id` | ⚠ |
| | 2.2 Nộp quy trình | `POST /procedures/:id/submit` | ⚠ |
| | 2.3 Duyệt quy trình | `POST /procedures/:id/approve` | ⚠ |
| | 2.4 Đổi thứ tự làm (tab Sơ đồ) | `PATCH /procedures/:id/steps/:stepId/stage` | ⚠ |
| | 2.5 Sửa các bước — tự lưu (tab Danh sách các bước) | `PUT /procedures/:id/steps` | ⚠ |
| | 2.6 Danh sách cán bộ (chọn người thực hiện) | `GET /user` | ✅ |
| | 2.7 Lịch sử một quy trình (tab Lịch sử) | `GET /audit-logs?module=procedures&targetId=` | ✅ (cần thêm module) |
| **3. Thêm quy trình mới** | 3.1 Tạo quy trình | `POST /procedures` | ⚠ |
| | (dùng lại 2.6 để chọn người thực hiện) | | |
| **4. Lịch sử thay đổi của màn hình** | 4.1 Lịch sử mọi quy trình | `GET /audit-logs?module=procedures` | ✅ (cần thêm module) |

Backend đã có 1 / 10 API (2.6); 2.7 và 4.1 dùng route `/audit-logs` sẵn có nhưng cần nhận thêm `module=procedures`; còn 7 API mới.

**Trạng thái quy trình và luồng duyệt** (dùng ở 1.1, 1.2, 2.2, 2.3)

```
Đang xử lý ──(2.2 Nộp quy trình)──▶ Chờ duyệt ──(2.3 Duyệt quy trình)──▶ Đang áp dụng
        (1.2 Tắt ở bất kỳ bước nào → Đã ngưng; bật lại thì quay về trạng thái trước)
```

| `status` | Nhãn | Khi nào |
|---|---|---|
| `PROCESSING` | Đang xử lý | Đang bật, chưa nộp (quy trình mới tạo) |
| `PENDING_APPROVAL` | Chờ duyệt | Đang bật, đã nộp, chưa duyệt |
| `APPLIED` | Đang áp dụng | Đang bật, đã duyệt |
| `STOPPED` | Đã ngưng | Đang tắt |

---

## Màn 1. Tab "Quy trình" — danh sách quy trình

Component: ProcedureLibraryTab, ProcedureListView

| Thao tác trên màn | API / hàm | Làm gì |
|---|---|---|
| Mở tab | **1.1** `GET /procedures` | Lấy danh sách quy trình: version, số ngày hoàn thành, trạng thái, người tạo, người duyệt, ngày tạo, ngày cập nhật |
| Cột "Số ngày hoàn thành" | `totalDays` của 1.1 (backend tính bằng `getProcedureDays`, Phụ lục A, C) | Lần lượt thì cộng, song song thì lấy bước lâu nhất |
| Cột "Trạng thái" | `status` của 1.1 | Đang xử lý / Chờ duyệt / Đang áp dụng / Đã ngưng |
| Ô tìm theo tên | 1.1 `?q=` (hiện FE tự lọc) | Tìm không dấu theo tên quy trình |
| Công tắc bật / tắt | **1.2** `PATCH /procedures/:id` | Tắt → "Đã ngưng"; bật lại → trạng thái trước đó |
| Bấm dòng / nút ✏ | Sang màn 2 (gọi 2.1) | Mở chi tiết quy trình |
| Nút "Thêm quy trình mới" | Sang màn 3 | — |
| Không có quyền cấu hình | FE kiểm tra quyền | Hiện "Bạn chưa có quyền cấu hình quy trình" |

### 1.1. Xem danh sách quy trình ⚠

**Màn hình:** bảng quy trình với các cột Tên quy trình · Version · Số ngày hoàn thành · Trạng thái · Người tạo · Người duyệt · Ngày tạo · Ngày cập nhật · Thao tác (sửa, bật / tắt); ô tìm kiếm theo tên.

- **Component:** ProcedureLibraryTab (nạp lại sau mỗi thao tác), ProcedureListView (bảng, ô tìm kiếm)
- **Dùng thêm ở M2:** CreateProjectPage (chọn quy trình cho dự án, chỉ lấy quy trình đang bật), ProjectsWorksScreen, ProjectProcedureConfigTab — các màn này cần cả các bước nên gọi tiếp mục 2.1 cho quy trình được chọn.

**Request**
```
GET /procedures
Query:
  q?: string            // tìm không dấu theo tên quy trình
  enabled?: boolean     // M2 chỉ lấy quy trình đang bật
```
Sắp xếp: quy trình mẫu trước (theo thứ tự seed), rồi quy trình tự tạo (mới nhất trước).

**Response**
```json
{
  "status": true,
  "statusCode": 200,
  "data": [
    {
      "id": "6f1c2d3e-4a5b-4c6d-8e9f-0a1b2c3d4e5f",
      "name": "Quy trình chuẩn bị đầu tư",
      "isTemplate": true,
      "version": "1.0",
      "enabled": true,
      "status": "APPLIED",
      "stepCount": 39,
      "totalDays": 381,
      "submittedBy": null,
      "submittedAt": null,
      "approvedBy": { "id": "7c6d5e4f-...", "fullName": "Trần Minh Ơn" },
      "approvedAt": null,
      "createdBy": { "id": "f8a20277-...", "fullName": "Huỳnh Thái Hải" },
      "createdAt": "2025-01-09T00:00:00.000Z",
      "updatedBy": { "id": "f8a20277-...", "fullName": "Huỳnh Thái Hải" },
      "updatedAt": "2026-11-02T04:53:00.000Z"
    },
    {
      "id": "8a9b0c1d-...",
      "name": "Quy trình giám sát",
      "isTemplate": true,
      "version": "1.0",
      "enabled": true,
      "status": "PENDING_APPROVAL",
      "stepCount": 52,
      "totalDays": 727,
      "submittedBy": { "id": "a1b2c3d4-...", "fullName": "Trần Trung Tín" },
      "submittedAt": "2026-10-02T07:15:00.000Z",
      "approvedBy": null,
      "approvedAt": null,
      "createdBy": { "id": "a1b2c3d4-...", "fullName": "Trần Trung Tín" },
      "createdAt": "2025-02-14T00:00:00.000Z",
      "updatedBy": null,
      "updatedAt": null
    }
  ]
}
```

| Trường | Ghi chú |
|---|---|
| `isTemplate` | `true` = quy trình mẫu theo dự thảo (seed sẵn), `false` = người dùng tự tạo |
| `version` | Nhập lúc tạo (VD `1.0`, `2.1`), tối đa 20 ký tự; không sửa ở trang chi tiết |
| `status` | Xem bảng trạng thái ở trên; badge: xanh lá / xanh dương / vàng / xám |
| `stepCount` | Số bước (cả bước con) |
| `totalDays` | Số ngày hoàn thành cả quy trình — cách tính ở Phụ lục A |
| `updatedAt` | Đổi mỗi lần lưu các bước; cột "Ngày cập nhật" chưa có thì hiện `createdAt` |

Danh sách **không** kèm các bước. FE hiện đang tự tính `totalDays` từ `steps` → khi nối API đổi sang đọc `totalDays`.

### 1.2. Bật / tắt quy trình ⚠

**Màn hình:** công tắc ở cột "Thao tác" của danh sách.

- **Component:** ProcedureListView

**Request**
```
PATCH /procedures/:id
```
```json
{ "enabled": false }
```

**Response**
```json
{ "status": true, "statusCode": 200, "data": { "id": "6f1c2d3e-...", "enabled": false, "status": "STOPPED" } }
```

**Quy tắc**
- Tắt → "Đã ngưng"; không hiện ở M2 khi chọn quy trình cho dự án mới; dự án đang áp dụng giữ nguyên các bước đã sao chép.
- Bật lại → trạng thái quay về theo nộp / duyệt trước đó.
- Không nộp / duyệt được quy trình đang tắt.

**Lỗi:** `404 "Không tìm thấy quy trình"`

---

## Màn 2. Chi tiết quy trình

Component: ProcedureDetailPage, ProcedureReviewAction, ProcedureStepEditor

**Đầu trang**

| Thao tác | API / hàm | Làm gì |
|---|---|---|
| Mở trang | **2.1** `GET /procedures/:id` | Quy trình + toàn bộ bước, `spanDays` từng bước, `totalDays` |
| Nút "Nộp quy trình" (khi Đang xử lý) | **2.2** `POST /procedures/:id/submit` | Chuyển sang Chờ duyệt |
| Nút "Duyệt quy trình" (khi Chờ duyệt + có quyền duyệt) | **2.3** `POST /procedures/:id/approve` | Chuyển sang Đang áp dụng |
| Nút ← | FE tự xử lý | Về danh sách, nạp lại 1.1 |
| "Đã tự lưu lúc HH:mm" | `updatedAt` trả về từ 2.4 / 2.5 | Báo lần lưu gần nhất |

**Tab "Sơ đồ quy trình"** (ProcedureRoadmap, RoadmapStepFlow, RoadmapBranches)

| Thao tác | API / hàm | Làm gì |
|---|---|---|
| Vẽ sơ đồ (cột "Bước 1, 2, 3", số ngày trên thẻ) | Dữ liệu 2.1; `getStageColumns`, `spanDays` | Chia các bước cùng cấp thành lượt, hiện số ngày từng bước |
| Bước chính chọn "Song song với III" | **2.4** `{ parallelWith }` | Backend `moveStep`: gộp lượt, đánh lại mã, tính lại số ngày |
| Bước chính chọn "Làm lần lượt" | **2.4** `{ insertAt }` | Tách thành lượt riêng |
| Kéo thẻ bước con vào một cột | **2.4** `{ parallelWith }` | Gộp vào cột đó, làm song song |
| Kéo vào khe giữa hai cột / "Tạo khung mới" | **2.4** `{ insertAt }` | Tách thành lượt riêng |
| Thu / mở tuyến bước con, tự cuộn khi kéo sát mép | FE tự xử lý | — |

**Tab "Danh sách các bước"** (StepTable, StepTableRow, StepInlineAddRow)

| Thao tác | API / hàm | Làm gì |
|---|---|---|
| Sửa tên / số ngày / loại trên dòng | **2.5** `PUT /procedures/:id/steps` | Gửi toàn bộ bước; backend `validateSteps` → lưu → `diffSteps` ghi nhật ký |
| Chọn người thực hiện (email tự hiện) | **2.6** `GET /user` (danh sách), lưu qua 2.5 | — |
| Thêm bước chính / bước con | **2.5** | Mã gợi ý sẵn (I, II...; II.1, II.2...) |
| Xóa bước (xóa luôn bước con) | **2.5** | — |
| "Mở hết" / "Thu gọn", thu / mở từng bước | FE tự xử lý | — |

**Tab "Lịch sử thay đổi"** (ProcedureChangeHistory)

| Thao tác | API | Làm gì |
|---|---|---|
| Xem lịch sử, lọc theo ngày | **2.7** `GET /audit-logs?module=procedures&targetId=` | Ai làm gì, lúc nào; bấm dòng xem "cũ → mới" |

### 2.1. Xem chi tiết quy trình ⚠

**Màn hình:** tiêu đề "Chi tiết quy trình <tên>", phụ đề "N bước", nút Nộp / Duyệt; 3 tab **Sơ đồ quy trình**, **Danh sách các bước**, **Lịch sử thay đổi**.

- **Component:** ProcedureLibraryTab (mở trang chi tiết), ProcedureDetailPage, ProcedureStepEditor (dữ liệu ban đầu của sơ đồ / bảng)

**Request**
```
GET /procedures/:id
```

**Response** — các trường như mục 1.1, thêm `steps` (sắp theo `order`)
```json
{
  "status": true,
  "statusCode": 200,
  "data": {
    "id": "6f1c2d3e-4a5b-4c6d-8e9f-0a1b2c3d4e5f",
    "name": "Quy trình chuẩn bị đầu tư",
    "isTemplate": true,
    "version": "1.0",
    "enabled": true,
    "status": "APPLIED",
    "stepCount": 39,
    "totalDays": 381,
    "submittedBy": null,
    "submittedAt": null,
    "approvedBy": { "id": "7c6d5e4f-...", "fullName": "Trần Minh Ơn" },
    "approvedAt": null,
    "createdBy": { "id": "f8a20277-...", "fullName": "Huỳnh Thái Hải" },
    "createdAt": "2025-01-09T00:00:00.000Z",
    "updatedBy": { "id": "f8a20277-...", "fullName": "Huỳnh Thái Hải" },
    "updatedAt": "2026-11-02T04:53:00.000Z",
    "steps": [
      {
        "id": "0d4a5b6c-...",
        "code": "II",
        "name": "Tổ chức lập Báo cáo nghiên cứu khả thi / Báo cáo kinh tế – kỹ thuật",
        "type": "MANDATORY",
        "plannedDays": 30,
        "durationText": null,
        "flowStage": null,
        "isEnabled": true,
        "spanDays": 25,
        "assignee": { "id": "7c6d5e4f-...", "fullName": "Trần Minh Ơn", "email": "on.tm@hatien.gov.vn" },
        "responsibleUnit": "Chủ đầu tư",
        "notes": "",
        "order": 1
      },
      {
        "id": "1e5b6c7d-...",
        "code": "II.1",
        "name": "Hợp đồng ủy thác (đại diện chủ đầu tư, quản lý dự án, giám sát)",
        "type": "MANDATORY",
        "plannedDays": 15,
        "durationText": null,
        "flowStage": 1,
        "isEnabled": true,
        "assignee": null,
        "responsibleUnit": "Chủ đầu tư",
        "notes": "",
        "order": 2
      },
      {
        "id": "2f6c7d8e-...",
        "code": "II.2",
        "name": "Dự toán chuẩn bị đầu tư",
        "type": "MANDATORY",
        "plannedDays": 7,
        "durationText": null,
        "flowStage": 1,
        "isEnabled": true,
        "assignee": null,
        "responsibleUnit": "Chủ đầu tư",
        "notes": "",
        "order": 3
      },
      {
        "id": "3a7d8e9f-...",
        "code": "II.3",
        "name": "Quyết định phê duyệt dự toán chuẩn bị đầu tư",
        "type": "MANDATORY",
        "plannedDays": 10,
        "durationText": null,
        "flowStage": 2,
        "isEnabled": true,
        "assignee": null,
        "responsibleUnit": "Chủ đầu tư",
        "notes": "",
        "order": 4
      },
      {
        "id": "4b8e9f0a-...",
        "code": "III",
        "name": "Thẩm định giá (nếu có)",
        "type": "CONDITIONAL",
        "plannedDays": 10,
        "durationText": null,
        "flowStage": null,
        "isEnabled": true,
        "assignee": { "id": "5c9f0a1b-...", "fullName": "Hoàng Huy Hoàng", "email": "hoang.hh@hatien.gov.vn" },
        "responsibleUnit": "Chủ đầu tư",
        "notes": "",
        "order": 5
      }
    ]
  }
}
```

**Trường của một bước**

| Trường | Ghi chú |
|---|---|
| `code` | Mã theo cấp: bước chính số La Mã `I`, `II`...; bước con `II.1`, `II.1.2`... (không giới hạn cấp). Duy nhất trong quy trình. Bước cha suy ra từ mã (`II.1.2` → `II.1`) |
| `type` | `MANDATORY` (Bắt buộc) \| `CONDITIONAL` (Nếu có) |
| `plannedDays` | Số ngày cố định (≥ 1) của bước **không có bước con**; `null` = dùng `durationText`. Bước có bước con thì không dùng trường này để tính |
| `spanDays` | (tính ra, chỉ có ở response) Số ngày thực hiện của bước: không có bước con = `plannedDays`; có bước con = tính từ các bước con theo song song / lần lượt — xem Phụ lục A |
| `durationText` | Thời gian dạng chữ khi không có số ngày (VD "Theo quy định", "Theo HĐ") |
| `flowStage` | Lượt làm trong nhóm cùng cấp, cùng số = làm song song; `null` = làm ngay sau bước liền trước |
| `isEnabled` | Bước `MANDATORY` luôn `true` |
| `assignee` | Người thực hiện; `null` = chưa giao |
| `responsibleUnit` | Đơn vị chủ trì, mặc định "Chủ đầu tư" (bước con lấy theo bước cha) |
| `notes` | Ghi chú, hiện icon ⓘ cạnh tên bước |
| `order` | Thứ tự trong danh sách (bước cha đứng ngay trước các bước con) |

Ví dụ trên: II.1 và II.2 cùng `flowStage = 1` → khung "2 bước làm song song" ở cột "Bước 1" của sơ đồ; II.3 là "Bước 2". Số ngày của II = max(15, 7) + 10 = **25 ngày** (`spanDays` của II).

**Lỗi:** `404 "Không tìm thấy quy trình"`

### 2.2. Nộp quy trình ⚠

**Màn hình:** nút "Nộp quy trình" ở đầu trang chi tiết, chỉ hiện khi "Đang xử lý", mờ khi quy trình chưa có bước nào; hỏi xác nhận rồi chuyển sang "Chờ duyệt".

- **Component:** ProcedureReviewAction (trong ProcedureDetailPage)

**Request**
```
POST /procedures/:id/submit
Body: {}
```

**Response**
```json
{
  "status": true,
  "statusCode": 200,
  "data": {
    "id": "8a9b0c1d-...",
    "status": "PENDING_APPROVAL",
    "submittedBy": { "id": "f8a20277-...", "fullName": "Huỳnh Thái Hải" },
    "submittedAt": "2026-11-02T08:10:00.000Z"
  }
}
```

**Lỗi:** `400 "Chỉ nộp được quy trình đang xử lý"`, `400 "Quy trình chưa có bước nào"`, `400 "Quy trình đang ngưng, bật lại để nộp"`, `404 "Không tìm thấy quy trình"`

### 2.3. Duyệt quy trình ⚠

**Màn hình:** nút "Duyệt quy trình" ở đầu trang chi tiết, chỉ hiện khi "Chờ duyệt" **và** người dùng có quyền duyệt; hỏi xác nhận rồi chuyển sang "Đang áp dụng".

- **Component:** ProcedureReviewAction (trong ProcedureDetailPage)

**Request**
```
POST /procedures/:id/approve
Body: {}
```

**Response**
```json
{
  "status": true,
  "statusCode": 200,
  "data": {
    "id": "8a9b0c1d-...",
    "status": "APPLIED",
    "approvedBy": { "id": "f8a20277-...", "fullName": "Huỳnh Thái Hải" },
    "approvedAt": "2026-11-02T08:15:00.000Z"
  }
}
```

**Lỗi:** `400 "Chỉ duyệt được quy trình đang chờ duyệt"`, `400 "Quy trình đang ngưng, bật lại để duyệt"`, `403 "Role invalid."`, `404 "Không tìm thấy quy trình"`

### 2.4. Đổi thứ tự làm (song song / lần lượt) ⚠

**Màn hình:** tab "Sơ đồ quy trình", hỏi xác nhận trước khi đổi (VD "Gộp [II.3] vào Bước 1, làm song song với II.1."):
- **Bước chính:** ô cạnh tên bước chọn "Làm lần lượt" hoặc "Song song với II / III ...".
- **Bước con:** kéo thẻ thả vào một cột → gộp vào cột đó, làm song song; thả vào khe giữa hai cột (ô "Thêm vào đây") hoặc khung "Tạo khung mới" ở cuối → tách thành lượt riêng.

- **Component:** ProcedureRoadmap (bước chính), RoadmapStepFlow (kéo thả bước con) → ProcedureStepEditor

FE chỉ gửi **thao tác**; backend tính lượt mới, **đánh lại mã** các bước cho đúng thứ tự làm (bước làm trước mang số nhỏ hơn, bước con / cháu đổi mã theo cha), tính lại số ngày rồi lưu. `id` các bước giữ nguyên.

**Request**
```
PATCH /procedures/:id/steps/:stepId/stage
```
Body là **một trong hai** dạng:
```json
{ "parallelWith": "1e5b6c7d-...", "expectedUpdatedAt": "2026-11-02T04:53:00.000Z" }
```
```json
{ "insertAt": 2, "expectedUpdatedAt": "2026-11-02T04:53:00.000Z" }
```
- `parallelWith`: id một bước **cùng cấp** → gộp `stepId` vào lượt của bước đó (làm song song)
- `insertAt`: tách `stepId` thành lượt riêng tại vị trí này, tính từ 0 (0 = lên đầu, bằng số lượt hiện có = xuống cuối); các lượt sau lùi lại

| Thao tác trên màn hình | Body |
|---|---|
| Bước chính II chọn "Song song với III" | `{ "parallelWith": "<id III>" }` |
| Bước chính đang song song (ở lượt thứ k, tính từ 0) chọn "Làm lần lượt" | `{ "insertAt": k + 1 }` |
| Thả thẻ bước con vào cột "Bước n" | `{ "parallelWith": "<id một bước bất kỳ trong cột n>" }` |
| Thả vào khe giữa "Bước n" và "Bước n+1" | `{ "insertAt": n }` |
| Thả vào khung "Tạo khung mới" ở cuối | `{ "insertAt": <số lượt hiện có> }` |

**Backend xử lý** (hàm ở Phụ lục C)
1. `moveStep(steps, stepId, body)` → bộ bước mới (đã đổi `flowStage`, `code`, `order`)
2. `diffSteps(cũ, mới)` → `changes`; không có gì đổi thì trả về luôn, không lưu
3. Lưu bộ bước mới, ghi nhật ký `"Cập nhật tiến độ"` (mục 2.7)
4. Trả về các bước kèm `spanDays` (`withSpanDays`) và `totalDays` (`getProcedureDays`)

**Ví dụ:** bước II có II.1 → II.2 → II.3 (II.3 có con II.3.1), kéo II.3 thả vào cột "Bước 1":

| | Trước | Sau |
|---|---|---|
| Cột trên sơ đồ | II.1 → II.2 → II.3 | [II.1 + II.2] → II.3 |
| Bước được kéo (II.3 cũ) | `II.3`, lượt 3 | `II.2`, lượt 1 (con II.3.1 → `II.2.1`) |
| II.2 cũ | `II.2`, lượt 2 | `II.3`, lượt 2 |
| Số ngày của II | 15 + 7 + 10 = 32 | max(15, 10) + 7 = 22 → `totalDays` giảm 10 |

**Response**
```json
{
  "status": true,
  "statusCode": 200,
  "data": {
    "id": "6f1c2d3e-...",
    "stepCount": 39,
    "totalDays": 371,
    "updatedBy": { "id": "f8a20277-...", "fullName": "Huỳnh Thái Hải" },
    "updatedAt": "2026-11-02T05:10:12.000Z",
    "changes": [
      { "label": "Thứ tự [II.2]", "from": "Bước 3", "to": "Bước 1" }
    ],
    "steps": [ "...như mục 2.1 (mã mới, kèm spanDays)..." ]
  }
}
```

**Lỗi:** `400 "Chỉ gộp được với bước cùng cấp"`, `400 "Vị trí không hợp lệ"`, `404 "Không tìm thấy bước"`, `404 "Không tìm thấy quy trình"`, `409 "Quy trình vừa được người khác cập nhật, vui lòng tải lại"`

> Hiện FE tự tính bằng `utils/step-dependencies.ts` (`moveStepToStage` + `applyStageOrder`) rồi gửi cả bộ bước. Khi có API này: `ProcedureStepEditor → handleChangeStages` ở **trang chi tiết** gọi mục 2.4 rồi thay bộ bước bằng `steps` trả về; trang thêm mới vẫn tự tính (mục 3.1).

### 2.5. Sửa các bước (tự lưu) ⚠

**Màn hình:** mọi thay đổi các bước ở trang chi tiết **tự lưu** sau khi người dùng bấm "Đồng ý" ở hộp xác nhận; trang hiện "Đã tự lưu lúc HH:mm". Các thao tác:
- Tab "Danh sách các bước" (StepTable, StepTableRow, StepInlineAddRow): sửa tên / người thực hiện / số ngày / loại ngay trên dòng; thêm bước chính; thêm bước con dưới bất kỳ bước nào; xóa bước (xóa luôn bước con).
- Đổi làm song song / lần lượt ở tab "Sơ đồ quy trình" **không** đi qua API này mà dùng mục 2.4.
- Các thao tác liền nhau trong **0,5 giây** gom thành một lần gọi.

- **Component:** ProcedureStepEditor (`hooks/useAutoSavedSteps.ts`)

Gửi **toàn bộ** danh sách bước sau khi sửa; backend thay thế bộ bước cũ (bước không còn trong danh sách = xóa, `id` mới = thêm).

**Request**
```
PUT /procedures/:id/steps
```
```json
{
  "expectedUpdatedAt": "2026-11-02T04:53:00.000Z",
  "steps": [
    { "id": "0d4a5b6c-...", "code": "II", "name": "Tổ chức lập Báo cáo nghiên cứu khả thi / Báo cáo kinh tế – kỹ thuật", "type": "MANDATORY", "plannedDays": 30, "flowStage": null, "isEnabled": true, "assigneeId": "7c6d5e4f-...", "responsibleUnit": "Chủ đầu tư", "notes": "" },
    { "id": "1e5b6c7d-...", "code": "II.1", "name": "Hợp đồng ủy thác (đại diện chủ đầu tư, quản lý dự án, giám sát)", "type": "MANDATORY", "plannedDays": 15, "flowStage": 1, "isEnabled": true, "assigneeId": null, "responsibleUnit": "Chủ đầu tư", "notes": "" },
    { "id": "2f6c7d8e-...", "code": "II.2", "name": "Dự toán chuẩn bị đầu tư", "type": "MANDATORY", "plannedDays": 7, "flowStage": 1, "isEnabled": true, "assigneeId": null, "responsibleUnit": "Chủ đầu tư", "notes": "" }
  ]
}
```
- `expectedUpdatedAt` (tùy chọn): `updatedAt` FE đang giữ; khác bản trên server (người khác vừa lưu) → `409`
- `id`: FE sinh uuid khi thêm bước để tự lưu liên tục không phải đổi id
- `durationText`: gửi khi `plannedDays = null` và muốn giữ chữ cũ (VD "Theo HĐ"); bỏ trống = "Theo quy định"
- Thứ tự mảng = `order`
- `flowStage` gửi lại đúng như đã nhận (đổi thứ tự làm dùng mục 2.4)
- Backend tính lại `spanDays` của từng bước và `totalDays` của quy trình (Phụ lục A, C)

**Kiểm tra phía backend**
- `code` không trùng; bước con phải có bước cha trong danh sách (`II.1.2` cần có `II.1`)
- Bước chính: số La Mã; bước con: số nguyên dương
- `name` không rỗng; `plannedDays` nguyên ≥ 1 hoặc `null`; `flowStage` nguyên ≥ 1 hoặc `null`
- `type = MANDATORY` → `isEnabled` luôn `true`
- `assigneeId` phải là cán bộ đang hoạt động
- Dùng hàm `validateSteps` ở Phụ lục C

**Response**
```json
{
  "status": true,
  "statusCode": 200,
  "data": {
    "id": "6f1c2d3e-...",
    "stepCount": 39,
    "totalDays": 381,
    "updatedBy": { "id": "f8a20277-...", "fullName": "Huỳnh Thái Hải" },
    "updatedAt": "2026-11-02T04:53:41.000Z",
    "changes": [
      { "label": "Thứ tự [II.2]", "from": "Bước 2", "to": "Bước 1" }
    ],
    "steps": [ "...như mục 2.1..." ]
  }
}
```
- Không có gì thay đổi → `changes: []`, không ghi nhật ký, không đổi `updatedAt`.
- Có thay đổi → backend tự so bản cũ / mới và ghi **một** dòng nhật ký (mục 2.7) với `changes`:

| Thay đổi | `label` | `from` → `to` |
|---|---|---|
| Thêm bước | `Thêm bước [II.4]` | — → tên bước |
| Xóa bước | `Xóa bước [II.4]` | tên bước → — |
| Đổi tên | `Tên bước [II.1]` | tên cũ → tên mới |
| Đổi người thực hiện | `Người thực hiện [II]` | "Chưa giao" / tên → tên / "Chưa giao" |
| Đổi thời gian | `Thời gian [II.2]` | "7 ngày" → "10 ngày" |
| Đổi loại | `Loại [III]` | "Bắt buộc" → "Nếu có" |
| Bật / tắt bước | `Áp dụng [III.2]` | "Bật" → "Tắt" |
| Đổi lượt làm | `Thứ tự [II.2]` | "Bước 2" → "Bước 1" |

`action` của dòng nhật ký: `"Cập nhật quy trình"` (đổi thứ tự làm ở mục 2.4 ghi `"Cập nhật tiến độ"`); `note`: `"N thay đổi trên quy trình \"…\"."`

**Lưu lỗi:** FE giữ nguyên bản đang sửa trên màn hình, báo lỗi và đổi dòng "Đã tự lưu" thành "Chưa lưu được"; lần thay đổi kế tiếp gửi lại toàn bộ danh sách. Lỗi `409` → hỏi tải lại quy trình.

**Lỗi:** `400 "Mã bước bị trùng: II.1"`, `400 "Bước II.1.2 chưa có bước cha II.1"`, `400 "Vui lòng nhập tên bước [II.3]"`, `400 "Số ngày của bước [II.3] phải là số nguyên ≥ 1"`, `400 "Cán bộ thực hiện không tồn tại hoặc đã bị khóa"`, `404 "Không tìm thấy quy trình"`, `409 "Quy trình vừa được người khác cập nhật, vui lòng tải lại"`

> ⚠ FE hiện cho gõ tự do ô "Mã" ở dòng thêm bước và chưa chặn mã trùng / sai định dạng; khi nối API nên kiểm tra ngay trên dòng nhập để không bị lỗi lúc tự lưu.

### 2.6. Chọn người thực hiện ✅

**Màn hình:** ô "Người thực hiện" ở mỗi dòng bước và dòng thêm bước; danh sách hiện "Tên (chức danh)", gõ để tìm; chọn xong ô Email tự điền.

- **Component:** StepTableRow, StepInlineAddRow (`hooks/useStepStaff.ts`) — dùng lại `useStaffList()` của phân hệ Nhân sự

**Request**
```
GET /user
Query: page=1, limit=100
```

**Response:** như mục 2 của `api-nhan-su-phan-cong.md`. FE dùng `id`, `fullName`, `email`, `positionTitle`; bỏ cán bộ `status = "LOCKED"` khỏi danh sách chọn.

### 2.7. Lịch sử một quy trình ✅ (cần thêm module)

**Màn hình:** tab "Lịch sử thay đổi" trong trang chi tiết; mỗi dòng: thời gian, người thao tác, thao tác; bấm dòng xem "cũ → mới"; lọc theo ngày; 15 dòng / trang.

- **Component:** ProcedureChangeHistory

**Request**
```
GET /audit-logs
Query: module=procedures, targetId=<id quy trình>, date?: "2026-11-02"
```

**Response**
```json
{
  "status": true,
  "statusCode": 200,
  "data": [
    {
      "id": "c3d4e5f6-...",
      "at": "2026-11-02T04:53:41.000Z",
      "actorName": "Huỳnh Thái Hải",
      "actorRole": "Giám đốc",
      "module": "procedures",
      "action": "Cập nhật tiến độ",
      "targetType": "procedure",
      "targetId": "6f1c2d3e-...",
      "targetName": "Quy trình chuẩn bị đầu tư",
      "changes": [{ "label": "Thứ tự [II.2]", "from": "Bước 2", "to": "Bước 1" }],
      "note": "1 thay đổi trên quy trình \"Quy trình chuẩn bị đầu tư\"."
    },
    {
      "id": "b2c3d4e5-...",
      "at": "2026-11-02T04:19:05.000Z",
      "actorName": "Huỳnh Thái Hải",
      "actorRole": "Giám đốc",
      "module": "procedures",
      "action": "Cập nhật quy trình",
      "targetType": "procedure",
      "targetId": "6f1c2d3e-...",
      "targetName": "Quy trình chuẩn bị đầu tư",
      "changes": [
        { "label": "Người thực hiện [III]", "from": "Chưa giao", "to": "Hoàng Huy Hoàng" },
        { "label": "Thời gian [III]", "from": "5 ngày", "to": "10 ngày" }
      ],
      "note": "2 thay đổi trên quy trình \"Quy trình chuẩn bị đầu tư\"."
    }
  ]
}
```
Mới nhất lên đầu, tối đa 200 dòng (giới hạn hiện có của `AuditService.list`).

---

## Màn 3. Thêm quy trình mới

Component: CreateProcedurePage, ProcedureStepEditor

| Thao tác | API / hàm | Làm gì |
|---|---|---|
| Nhập tên, version | FE tự xử lý | Chưa nhập tên → khóa nút thêm bước, "Cấu hình quy trình", tab Sơ đồ |
| Thêm / sửa / xóa bước | FE tự xử lý (giữ trên máy) | Chưa gọi 2.5 vì quy trình chưa có `id` |
| Chọn người thực hiện | **2.6** `GET /user` | — |
| Sơ đồ: gộp song song / tách lượt, số ngày | FE tự xử lý (`utils/step-dependencies.ts`, `utils/procedure-progress.ts`) | Chưa gọi 2.4 vì chưa có `id` |
| Nút "Tạo quy trình" | **3.1** `POST /procedures` | Gửi tên, version, toàn bộ bước; backend `validateSteps`, trùng tên → `409` |

### 3.1. Tạo quy trình ⚠

**Màn hình:** trang "Thêm quy trình mới"
- Nhập **Tên quy trình** (bắt buộc) và **Version** (mặc định `1.0`).
- Chưa nhập tên thì chưa thêm được bước: nút "Thêm bước chính", "Cấu hình quy trình" và tab Sơ đồ bị khóa.
- Bước 1 "Danh sách các bước": thêm bước chính / bước con; bước 2 "Sơ đồ quy trình": sắp lần lượt / song song.
- Bấm "Tạo quy trình" mới lưu; dòng bước đang gõ dở cũng được đưa vào.
- Quy trình chưa có `id` nên trang này **không gọi** mục 2.5, 2.4: FE tự gộp / tách lượt, đánh lại mã và tính số ngày ngay trên máy (`utils/step-dependencies.ts`, `utils/procedure-progress.ts` — cùng thuật toán Phụ lục C), rồi gửi `code`, `flowStage` trong `steps` lúc tạo. Chỉ gọi API ở mục 2.6 (chọn người thực hiện).

- **Component:** CreateProcedurePage (tên, version), ProcedureStepEditor (các bước, nút "Tạo quy trình")

**Request**
```
POST /procedures
```
```json
{
  "name": "Quy trình Giám sát công trình đặc thù",
  "version": "1.0",
  "steps": [
    {
      "id": "9d1e2f3a-...",
      "code": "I",
      "name": "Chuẩn bị giám sát",
      "type": "MANDATORY",
      "plannedDays": 5,
      "flowStage": null,
      "isEnabled": true,
      "assigneeId": "7c6d5e4f-...",
      "responsibleUnit": "Chủ đầu tư",
      "notes": ""
    },
    {
      "id": "ae2f3a4b-...",
      "code": "I.1",
      "name": "Lập kế hoạch giám sát",
      "type": "CONDITIONAL",
      "plannedDays": null,
      "flowStage": null,
      "isEnabled": true,
      "assigneeId": null,
      "responsibleUnit": "Chủ đầu tư",
      "notes": ""
    }
  ]
}
```
- `name`: bắt buộc, bỏ khoảng trắng đầu / cuối
- `version`: trống = `1.0`
- `steps`: `id` do FE sinh (uuid); thứ tự mảng = `order`; kiểm tra như mục 2.5
- Backend tự gán: `createdBy` = người gọi API, `isTemplate = false`, `enabled = true`, trạng thái `PROCESSING`

**Response:** `201`, `data` như mục 2.1 (`status: "PROCESSING"`).

**Lỗi:** `400 "Vui lòng nhập tên quy trình"`, `409 "Tên quy trình đã tồn tại"`, lỗi các bước như mục 2.5.

> ⚠ FE hiện chưa kiểm tra trùng tên; khi nối API hiện lỗi `409` ngay dưới ô "Tên quy trình".

---

## Màn 4. Tab "Lịch sử thay đổi" của màn hình

Component: ProcedureHistoryPanel

| Thao tác | API | Làm gì |
|---|---|---|
| Xem nhật ký mọi quy trình, lọc theo ngày | **4.1** `GET /audit-logs?module=procedures` | Gộp thao tác trên danh mục quy trình + thủ tục các dự án |

### 4.1. Lịch sử của cả màn hình ✅ (cần thêm module)

**Màn hình:** tab "Lịch sử thay đổi" trên cùng; nhật ký gộp của mọi quy trình + thao tác trên thủ tục các dự án; lọc theo ngày; 20 dòng / trang.

- **Component:** ProcedureHistoryPanel (`hooks/useProcedureHistory.ts`)

**Request**
```
GET /audit-logs
Query: module=procedures, date?: "2026-11-02"
```

**Response:** như mục 2.7, gồm mọi quy trình.

- Thao tác trên thủ tục **của dự án** (bắt đầu / hoàn thành / bỏ qua bước, duyệt giai đoạn...) thuộc M2; khi M2 có backend nên ghi cùng `module = "procedures"` với `targetType = "project_procedure"`, `targetId` = id dự án, `targetName` = `"[DA-001] Tên dự án · Tên bước"` để tab này hiện chung.

---

## Màn khác dùng chung

| Màn | API | Làm gì |
|---|---|---|
| M2: Tạo dự án (CreateProjectPage), cấu hình quy trình dự án (ProjectProcedureConfigTab, ProjectsWorksScreen) | 1.1 (`enabled=true`), 2.1 | Chọn quy trình áp dụng cho dự án — vì vậy 1.1, 2.1 chỉ cần quyền `view` |

---

## Đề xuất bảng dữ liệu

Chỉ là gợi ý để tham khảo khi làm backend (`prisma/schema.prisma`); đặt tên / tách bảng theo cách của backend.

```prisma
enum ProcedureReviewStatus {
  PROCESSING
  PENDING_APPROVAL
}

enum ProcedureStepType {
  MANDATORY
  CONDITIONAL
}

/// Danh mục quy trình thủ tục (mẫu theo dự thảo + tự tạo)
model Procedure {
  id            String                @id @default(uuid()) @db.Uuid
  name          String                @unique
  isTemplate    Boolean               @default(false) @map("is_template")
  version       String                @default("1.0")
  enabled       Boolean               @default(true)
  reviewStatus  ProcedureReviewStatus @default(PROCESSING) @map("review_status")
  submittedById String?               @map("submitted_by_id") @db.Uuid
  submittedAt   DateTime?             @map("submitted_at")
  approvedById  String?               @map("approved_by_id") @db.Uuid
  approvedAt    DateTime?             @map("approved_at")
  createdById   String?               @map("created_by_id") @db.Uuid
  updatedById   String?               @map("updated_by_id") @db.Uuid
  createdAt     DateTime              @default(now()) @map("created_at")
  updatedAt     DateTime              @updatedAt @map("updated_at")
  steps         ProcedureStep[]
  submittedBy   User?                 @relation("ProcedureSubmittedBy", fields: [submittedById], references: [id], onDelete: SetNull)
  approvedBy    User?                 @relation("ProcedureApprovedBy", fields: [approvedById], references: [id], onDelete: SetNull)
  createdBy     User?                 @relation("ProcedureCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  updatedBy     User?                 @relation("ProcedureUpdatedBy", fields: [updatedById], references: [id], onDelete: SetNull)

  @@map("procedures")
}

/// Các bước của một quy trình (cây theo mã: I, I.1, I.1.1...)
model ProcedureStep {
  id              String            @id @db.Uuid
  procedureId     String            @map("procedure_id") @db.Uuid
  code            String
  name            String
  type            ProcedureStepType @default(MANDATORY)
  plannedDays     Int?              @map("planned_days")
  durationText    String?           @map("duration_text")
  flowStage       Int?              @map("flow_stage")
  isEnabled       Boolean           @default(true) @map("is_enabled")
  assigneeId      String?           @map("assignee_id") @db.Uuid
  responsibleUnit String            @default("Chủ đầu tư") @map("responsible_unit")
  notes           String            @default("")
  order           Int
  procedure       Procedure         @relation(fields: [procedureId], references: [id], onDelete: Cascade)
  assignee        User?             @relation("ProcedureStepAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)

  @@unique([procedureId, code])
  @@index([procedureId, order])
  @@map("procedure_steps")
}
```
- `status` (Đang áp dụng / Chờ duyệt / ...), `stepCount`, `totalDays` tính khi trả về, không cần lưu.
- Thêm quan hệ ngược trong `User`. Seed 4 quy trình mẫu từ `constants/procedure-department-templates.ts` (`isTemplate = true`).
- Nhật ký dùng bảng `AuditLog` sẵn có, không cần bảng mới.

---

## Phân quyền

Quyền người đăng nhập lấy từ `permissions` trả về lúc đăng nhập (không gọi API riêng). FE dùng `useProcedureAccess()` để ẩn / hiện; backend kiểm tra lại bằng `PermissonGuard`. Mã quyền backend trong `common/permission-catalog.ts` (module M3).

| Thao tác | Quyền backend | FE kiểm tra | API |
|---|---|---|---|
| Vào màn hình, xem lịch sử | `construction_procedures:view` | `m3_construction_procedures:view` (route) | 2.7, 4.1 |
| Đọc danh sách / chi tiết quy trình | `construction_procedures:view` | — | 1.1, 2.1 |
| Mở tab "Quy trình", thêm, sửa các bước, đổi thứ tự làm, bật / tắt, nộp | `construction_procedures:configure` | `configure` hoặc `input` (`canConfigureProcedure`) | 1.2, 2.2, 2.4, 2.5, 3.1 |
| Duyệt quy trình | `construction_procedures:approve` | `approve` hoặc `m3.approve_step` (`canApproveProcedure`) | 2.3 |
| Giám đốc (`DIRECTOR`) | Toàn quyền | | — |

Không có quyền cấu hình thì tab "Quy trình" hiện "Bạn chưa có quyền cấu hình quy trình".

> ⚠ Cần thống nhất:
> - FE đang cho người chỉ có quyền `input` cấu hình / nộp quy trình, backend đề xuất chỉ `configure`.
> - 1.1, 2.1 chỉ nên cần `view` vì M2 (tạo dự án, cấu hình quy trình dự án) cũng gọi; nếu đòi `configure` thì người tạo dự án không chọn được quy trình.

---

## Phụ lục (tham khảo)

### A. Cách tính số ngày hoàn thành

Dùng cho cột "Số ngày hoàn thành" ở danh sách (`totalDays`, VD 381 / 30 / 727 / 555 ngày) và số ngày trên thẻ sơ đồ (`spanDays`). Hàm ở Phụ lục C (`getSpanDays`, `getProcedureDays`), giống `utils/procedure-progress.ts` của FE.

**Quy tắc**
1. **Bước không có bước con:** số ngày = `plannedDays` (trống = 0).
2. **Bước có bước con:** chia các bước con thành các lượt theo `flowStage`:
   - Các bước **cùng lượt** làm **song song** → lượt đó mất số ngày của bước **lâu nhất**.
   - Các lượt làm **lần lượt** → **cộng** số ngày các lượt.
   - Bước con lại có con thì tính tiếp cùng cách (không giới hạn cấp).
3. **Cả quy trình** (`totalDays`): tính như bước 2 trên các **bước chính** (I, II, III...).
4. Bỏ qua bước đang tắt (`isEnabled = false`).

**Ví dụ**

```
II  ─┬─ Bước 1: II.1 (15 ngày) ∥ II.2 (7 ngày)   → max(15, 7) = 15
     └─ Bước 2: II.3 (10 ngày)                    → 10
     II = 15 + 10 = 25 ngày

III (10 ngày, không có bước con) ∥ IV (5 ngày)    → song song: max(10, 5) = 10
V   (5 ngày)                                      → lần lượt sau III, IV

totalDays = II (25) + max(III, IV) (10) + V (5) = 40 ngày
```

> ⚠ FE hiện vẫn cho nhập số ngày ở dòng bước chính (bảng "Danh sách các bước" hiện số ngày tự nhập, sơ đồ hiện số ngày tính từ bước con). Khi nối API nên hiện `spanDays` và khóa ô số ngày của bước có bước con.

### B. Nhật ký thao tác

Dùng route `GET /audit-logs` sẵn có. ⚠ Backend cần thêm `procedures` vào `MODULE_PERMISSION` (`audit.controller.ts`) với quyền xem `construction_procedures:view`.

**Các thao tác backend ghi nhật ký** (`module = "procedures"`, `targetType = "procedure"`, `targetId` = id quy trình, `targetName` = tên quy trình)

| Thao tác | `action` | `changes` |
|---|---|---|
| Thêm quy trình (mục 3.1) | `Tạo quy trình` | `[{ "label": "Số bước", "to": "39 bước (8 bước chính)" }]` |
| Tắt (mục 1.2) | `Ngưng áp dụng quy trình` | `[{ "label": "Trạng thái", "from": "Đang áp dụng", "to": "Đã ngưng" }]` |
| Bật lại (mục 1.2) | `Bật lại quy trình` | `[{ "label": "Trạng thái", "from": "Đã ngưng", "to": "Đang áp dụng" }]` |
| Nộp (mục 2.2) | `Nộp quy trình` | `[{ "label": "Trạng thái", "from": "Đang xử lý", "to": "Chờ duyệt" }]` |
| Duyệt (mục 2.3) | `Duyệt quy trình` | `[{ "label": "Trạng thái", "from": "Chờ duyệt", "to": "Đang áp dụng" }]` |
| Sửa các bước (mục 2.5) | `Cập nhật quy trình` | xem bảng ở mục 2.5 |
| Đổi thứ tự làm (mục 2.4) | `Cập nhật tiến độ` | `[{ "label": "Thứ tự [II.2]", "from": "Bước 3", "to": "Bước 1" }]` |

> Hiện tab lịch sử trong chi tiết quy trình đang **sinh dòng mẫu** (tạo, đổi thời gian, đổi người, sắp xếp thứ tự...) trong `ProcedureChangeHistory.tsx → buildEntries`. Khi có backend thì bỏ phần sinh mẫu, chỉ hiện dữ liệu thật.

### C. Hàm xử lý phía backend

Hàm thuần (không phụ thuộc Prisma / Nest), đặt ở `src/modules/procedure/procedure-steps.ts`. Đã chạy thử với các ví dụ trong tài liệu (gộp song song, tách lượt, đánh lại mã kèm bước con, tính `spanDays` / `totalDays`, kiểm tra dữ liệu).

| Hàm | Dùng ở | Làm gì |
|---|---|---|
| `getParentCode`, `getSiblingSteps` | mọi hàm | Bước cha / các bước cùng cấp, suy từ mã |
| `fromRoman`, `compareStepCodes` | `applyStageOrder` | So mã theo cấp (bước chính số La Mã) |
| `getStageColumns` | sơ đồ, số ngày, nhật ký | Chia nhóm bước cùng cấp thành các lượt |
| `moveStepToStage` | `moveStep` | Lượt mới sau khi gộp / tách một bước |
| `applyStageOrder` | `moveStep` | Áp lượt mới + đánh lại mã, `order` |
| `moveStep` | mục 2.4 | Gộp song song (`parallelWith`) / tách lượt (`insertAt`) |
| `getSpanDays`, `withSpanDays` | mục 2.1, 2.5, 2.4 | Số ngày của từng bước (`spanDays`) |
| `getProcedureDays` | mục 1.1, 2.1, 2.5, 2.4 | Số ngày hoàn thành cả quy trình (`totalDays`) |
| `validateSteps`, `normalizeSteps` | mục 3.1, 2.5 | Kiểm tra / chuẩn hóa trước khi lưu |
| `diffSteps` | mục 2.5, 2.4 | Các dòng "cũ → mới" ghi nhật ký |

```ts
/** Một bước khi xử lý (lấy từ bảng ProcedureStep) */
export interface StepNode {
  id: string;
  code: string;
  name: string;
  type: 'MANDATORY' | 'CONDITIONAL';
  plannedDays: number | null;
  durationText: string | null;
  flowStage: number | null;
  isEnabled: boolean;
  assigneeId: string | null;
  order: number;
}

/* ---------- Cây mã bước ---------- */

/** Bước cha trực tiếp: "III.1.1" → "III.1"; bước chính → null */
export const getParentCode = (code: string): string | null =>
  code.includes('.') ? code.slice(0, code.lastIndexOf('.')) : null;

/** Các bước con trực tiếp của một bước (null = các bước chính), giữ thứ tự trong quy trình */
export const getSiblingSteps = <T extends StepNode>(steps: T[], parentCode: string | null): T[] =>
  steps.filter((s) => getParentCode(s.code) === parentCode);

/** Số La Mã → số ("IV" → 4); không phải số La Mã → 0 */
export function fromRoman(str: string): number {
  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let sum = 0;
  let prev = 0;
  const upper = str.toUpperCase().trim();
  for (let i = upper.length - 1; i >= 0; i--) {
    const val = map[upper[i]] || 0;
    sum += val < prev ? -val : val;
    prev = val;
  }
  return sum;
}

/** So mã bước theo thứ tự trong quy trình: "II" < "II.1" < "II.2" < "II.10" < "III" */
export function compareStepCodes(a: string, b: string): number {
  const rank = (code: string) => code.split('.').map((p) => (/^\d+$/.test(p) ? Number(p) : fromRoman(p)));
  const ra = rank(a);
  const rb = rank(b);
  for (let i = 0; i < Math.min(ra.length, rb.length); i++) {
    if (ra[i] !== rb[i]) return ra[i] - rb[i];
  }
  return ra.length - rb.length;
}

/* ---------- Lượt làm: song song / lần lượt ---------- */

/**
 * Chia một nhóm bước cùng cấp thành các lượt (cột "Bước 1, 2, 3" trên sơ đồ).
 * Cùng flowStage = cùng lượt (song song); flowStage null = lượt riêng ngay sau bước liền trước.
 */
export function getStageColumns<T extends StepNode>(siblings: T[]): T[][] {
  let last = 0;
  const raw = siblings.map((s) => {
    last = s.flowStage ?? last + 1;
    return { step: s, stage: last };
  });
  const stages = [...new Set(raw.map((r) => r.stage))].sort((a, b) => a - b);
  return stages.map((stage) => raw.filter((r) => r.stage === stage).map((r) => r.step));
}

type ColumnDrop = { target: number } | { insertAt: number };

/**
 * Lượt mới (1..n, không có lượt trống) của từng bước trong nhóm sau khi chuyển một bước:
 * target = gộp vào cột thứ target (tính từ 0); insertAt = tách thành lượt riêng tại vị trí đó.
 */
export function moveStepToStage<T extends StepNode>(siblings: T[], stepId: string, drop: ColumnDrop): Map<string, number> {
  const columns = getStageColumns(siblings).map((col) => col.filter((s) => s.id !== stepId));
  const moved = siblings.find((s) => s.id === stepId);
  if (moved) {
    if ('target' in drop) (columns[drop.target] ??= []).push(moved);
    else columns.splice(drop.insertAt, 0, [moved]);
  }
  const result = new Map<string, number>();
  columns.filter((col) => col.length > 0).forEach((col, i) => col.forEach((s) => result.set(s.id, i + 1)));
  return result;
}

/**
 * Áp lượt mới cho nhóm bước rồi đánh lại mã theo thứ tự làm: bước làm trước mang số nhỏ hơn,
 * các bước cùng lượt giữ thứ tự cũ; bước con / cháu đổi mã theo cha; sắp lại danh sách và order.
 */
export function applyStageOrder<T extends StepNode>(steps: T[], stages: Map<string, number>): T[] {
  const staged = steps.map((s) => (stages.has(s.id) ? { ...s, flowStage: stages.get(s.id)! } : s));
  const first = staged.find((s) => stages.has(s.id));
  if (!first) return staged;

  const siblings = getSiblingSteps(staged, getParentCode(first.code));
  const codes = siblings.map((s) => s.code).sort(compareStepCodes);
  const ordered = siblings
    .map((step, index) => ({ step, index }))
    .sort((a, b) => (a.step.flowStage ?? Infinity) - (b.step.flowStage ?? Infinity) || a.index - b.index)
    .map(({ step }) => step);
  const rename = new Map(ordered.map((s, i) => [s.code, codes[i]]));

  const renameCode = (code: string) => {
    for (const [from, to] of rename) {
      if (code === from || code.startsWith(`${from}.`)) return to + code.slice(from.length);
    }
    return code;
  };

  return staged
    .map((s) => ({ ...s, code: renameCode(s.code) }))
    .sort((a, b) => compareStepCodes(a.code, b.code))
    .map((s, index) => ({ ...s, order: index + 1 }));
}

export type StageMove = { parallelWith: string } | { insertAt: number };

export class StepMoveError extends Error {}

/** API mục 2.4: gộp làm song song với một bước cùng cấp, hoặc tách thành lượt riêng tại vị trí insertAt */
export function moveStep<T extends StepNode>(steps: T[], stepId: string, move: StageMove): T[] {
  const step = steps.find((s) => s.id === stepId);
  if (!step) throw new StepMoveError('Không tìm thấy bước');
  const siblings = getSiblingSteps(steps, getParentCode(step.code));
  const columns = getStageColumns(siblings);

  let drop: ColumnDrop;
  if ('parallelWith' in move) {
    const target = columns.findIndex((col) => col.some((s) => s.id === move.parallelWith));
    if (target < 0 || move.parallelWith === stepId) throw new StepMoveError('Chỉ gộp được với bước cùng cấp');
    drop = { target };
  } else {
    if (!Number.isInteger(move.insertAt) || move.insertAt < 0 || move.insertAt > columns.length) {
      throw new StepMoveError('Vị trí không hợp lệ');
    }
    drop = { insertAt: move.insertAt };
  }
  return applyStageOrder(steps, moveStepToStage(siblings, stepId, drop));
}

/* ---------- Số ngày ---------- */

/** Tổng số ngày của các lượt: lượt song song lấy bước lâu nhất, các lượt lần lượt cộng lại */
const sumStages = <T extends StepNode>(steps: T[], group: T[]): number =>
  getStageColumns(group.filter((s) => s.isEnabled)).reduce(
    (sum, col) => sum + Math.max(0, ...col.map((s) => getSpanDays(steps, s))),
    0,
  );

/** Số ngày thực hiện của một bước: không có bước con = plannedDays; có bước con = tính từ các bước con */
export function getSpanDays<T extends StepNode>(steps: T[], step: T): number {
  const children = getSiblingSteps(steps, step.code).filter((s) => s.isEnabled);
  return children.length === 0 ? (step.plannedDays ?? 0) : sumStages(steps, children);
}

/** Số ngày hoàn thành cả quy trình (cột "Số ngày hoàn thành") */
export const getProcedureDays = <T extends StepNode>(steps: T[]): number => sumStages(steps, getSiblingSteps(steps, null));

/** Gắn spanDays cho từng bước để trả về */
export const withSpanDays = <T extends StepNode>(steps: T[]): (T & { spanDays: number })[] =>
  steps.map((s) => ({ ...s, spanDays: getSpanDays(steps, s) }));

/* ---------- Kiểm tra khi lưu (mục 3.1, 2.5) ---------- */

const ROMAN = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;

/** Lỗi đầu tiên tìm thấy (trả về để ném 400), không có lỗi = null */
export function validateSteps(steps: StepNode[]): string | null {
  const codes = new Set<string>();
  for (const s of steps) {
    const tag = `[${s.code}]`;
    if (codes.has(s.code)) return `Mã bước bị trùng: ${s.code}`;
    codes.add(s.code);
    const [main, ...subs] = s.code.split('.');
    if (!main || !ROMAN.test(main)) return `Mã bước ${tag} không hợp lệ: bước chính dùng số La Mã (I, II...)`;
    if (subs.some((p) => !/^[1-9]\d*$/.test(p))) return `Mã bước ${tag} không hợp lệ: bước con dùng số nguyên dương`;
    if (!s.name.trim()) return `Vui lòng nhập tên bước ${tag}`;
    if (s.plannedDays !== null && !(Number.isInteger(s.plannedDays) && s.plannedDays >= 1)) {
      return `Số ngày của bước ${tag} phải là số nguyên ≥ 1`;
    }
    if (s.flowStage !== null && !(Number.isInteger(s.flowStage) && s.flowStage >= 1)) {
      return `Lượt làm của bước ${tag} phải là số nguyên ≥ 1`;
    }
  }
  for (const s of steps) {
    const parent = getParentCode(s.code);
    if (parent && !codes.has(parent)) return `Bước ${s.code} chưa có bước cha ${parent}`;
  }
  return null;
}

/** Chuẩn hóa trước khi lưu: bước bắt buộc luôn áp dụng, order theo thứ tự mảng */
export const normalizeSteps = <T extends StepNode>(steps: T[]): T[] =>
  steps.map((s, index) => ({ ...s, isEnabled: s.type === 'MANDATORY' ? true : s.isEnabled, order: index + 1 }));

/* ---------- Thay đổi "cũ → mới" để ghi nhật ký ---------- */

export interface StepChange {
  label: string;
  from?: string;
  to?: string;
}

/** nameOf: id cán bộ → họ tên (để ghi "Người thực hiện") */
export function diffSteps(before: StepNode[], after: StepNode[], nameOf: (userId: string) => string | undefined): StepChange[] {
  const daysText = (s: StepNode) => (s.plannedDays ? `${s.plannedDays} ngày` : s.durationText || 'Theo quy định');
  const typeText = (s: StepNode) => (s.type === 'MANDATORY' ? 'Bắt buộc' : 'Nếu có');
  const assignee = (s: StepNode) => (s.assigneeId ? nameOf(s.assigneeId) ?? 'Cán bộ khác' : 'Chưa giao');
  const stageOf = (steps: StepNode[], s: StepNode) =>
    getStageColumns(getSiblingSteps(steps, getParentCode(s.code))).findIndex((col) => col.some((x) => x.id === s.id)) + 1;

  const prevById = new Map(before.map((s) => [s.id, s]));
  const nextIds = new Set(after.map((s) => s.id));
  const changes: StepChange[] = [];
  for (const s of after) {
    const p = prevById.get(s.id);
    const tag = `[${s.code}]`;
    if (!p) {
      changes.push({ label: `Thêm bước ${tag}`, to: s.name });
      continue;
    }
    if (p.name !== s.name) changes.push({ label: `Tên bước ${tag}`, from: p.name, to: s.name });
    if (p.assigneeId !== s.assigneeId) changes.push({ label: `Người thực hiện ${tag}`, from: assignee(p), to: assignee(s) });
    if (daysText(p) !== daysText(s)) changes.push({ label: `Thời gian ${tag}`, from: daysText(p), to: daysText(s) });
    if (p.type !== s.type) changes.push({ label: `Loại ${tag}`, from: typeText(p), to: typeText(s) });
    if (p.isEnabled !== s.isEnabled) changes.push({ label: `Áp dụng ${tag}`, from: p.isEnabled ? 'Bật' : 'Tắt', to: s.isEnabled ? 'Bật' : 'Tắt' });
    const fromStage = stageOf(before, p);
    const toStage = stageOf(after, s);
    if (fromStage !== toStage) changes.push({ label: `Thứ tự ${tag}`, from: `Bước ${fromStage}`, to: `Bước ${toStage}` });
  }
  for (const s of before) {
    if (!nextIds.has(s.id)) changes.push({ label: `Xóa bước [${s.code}]`, from: s.name });
  }
  return changes;
}
```

**Cách gọi trong service (mẫu)**

```ts
// Mục 2.4 — PATCH /procedures/:id/steps/:stepId/stage
async moveStage(procedureId: string, stepId: string, move: StageMove, actorId: string) {
  const before = await this.loadSteps(procedureId); // ProcedureStep[] sắp theo order
  let after: StepNode[];
  try {
    after = moveStep(before, stepId, move);
  } catch (e) {
    if (e instanceof StepMoveError) {
      throw e.message === 'Không tìm thấy bước' ? new NotFoundException(e.message) : new BadRequestException(e.message);
    }
    throw e;
  }
  const changes = diffSteps(before, after, (id) => this.userNames.get(id));
  if (changes.length > 0) {
    await this.prisma.$transaction(async (tx) => {
      await this.replaceSteps(tx, procedureId, after); // cập nhật code, flowStage, order theo id
      await this.audit.record(tx, {
        module: 'procedures', action: 'Cập nhật tiến độ', targetType: 'procedure', targetId: procedureId,
        actorId, changes, note: `${changes.length} thay đổi trên quy trình "${name}".`,
      });
    });
  }
  return { steps: withSpanDays(after), totalDays: getProcedureDays(after), changes };
}

// Mục 3.1, 2.5 — trước khi lưu bộ bước FE gửi lên
const steps = normalizeSteps(dto.steps);
const error = validateSteps(steps);
if (error) throw new BadRequestException(error);
```

### D. Hàm FE hiện tại → API thay thế

FE hiện lưu localStorage. Khi nối API nên tách giống phân hệ Nhân sự: `api/procedure.backend.ts` (gọi API thô) → `services/procedure.mapper.ts` (đổi kiểu) → `services/procedure.api.ts` (hook / component gọi; tài khoản thử nghiệm `mock_...` hoặc server không phản hồi thì vẫn chạy localStorage).

| Hàm FE hiện tại | File | Khóa localStorage | Mục |
|---|---|---|---|
| `loadProcedureLibrary()` | `utils/procedure-library.ts` | (đọc tất cả khóa bên dưới) | 1.1, 2.1 |
| `createProcedure()` | `utils/procedure-library.ts` | `cipm_custom_procedure_profiles`, `cipm_procedure_versions` | 3.1 |
| `setProcedureEnabled()` | `utils/procedure-library.ts` | `cipm_procedure_disabled_ids` | 1.2 |
| `submitProcedure()` | `utils/procedure-library.ts` | `cipm_procedure_submissions` | 2.2 |
| `approveProcedure()` | `utils/procedure-library.ts` | `cipm_procedure_approvals` | 2.3 |
| `saveProcedureSteps()` (`useAutoSavedSteps`) + `markProcedureUpdated()` (`ProcedureLibraryTab`) | `utils/procedure-library.ts` | `cipm_custom_procedure_profiles` / `cipm_procedure_template_overrides`, `cipm_procedure_update_meta` | 2.5 (một lần gọi) |
| `moveStepToStage()` + `applyStageOrder()` (`ProcedureStepEditor → handleChangeStages`) | `utils/step-dependencies.ts` | (lưu qua mục 2.5) | 2.4 (backend tính) |
| `getSpanDays()` / `getProcedureDays()` | `utils/procedure-progress.ts` | — | `spanDays` / `totalDays` ở mục 1.1, 2.1, 2.5, 2.4 |
| `getDepartmentStaff()` | `constants/procedure-department-templates.ts` | `cipm_personnel_test_flow_v9` | 2.6 |
| `loadLibraryHistory()` / `saveLibraryHistory()` | `utils/procedure-library-history.ts` | `cipm_procedure_library_history` | 2.7, 4.1 (backend tự ghi, FE không ghi) |

**FE đổi dữ liệu bước sang `ProcedureStep`** (`services/procedure.mapper.ts`): `durationMargin = plannedDays ? "N ngày" : durationText`, `durationDaysMin = durationDaysMax = plannedDays`, `groupCode` = mã bước chính, `groupTitle` = tên bước chính, `assignedTo / assignedToId` từ `assignee`, `status = "NOT_STARTED"`, `attachments = []` (trạng thái thực hiện và hồ sơ đính kèm thuộc quy trình của **dự án** – M2).

**Việc FE cần đổi khi nối API**
- `utils/step-tree.ts → buildNewStep`: id bước đang là `dept-step-<thời gian>-<mã>` → đổi sang `crypto.randomUUID()`.
- `ProcedureListView`: đọc `totalDays` từ API thay vì tự tính từ `steps`.
- `ProcedureStepEditor → handleChangeStages`: ở trang chi tiết gọi mục 2.4 thay vì tự `applyStageOrder`, sơ đồ đọc `spanDays` thay vì `getSpanDays`; trang thêm mới giữ nguyên cách tự tính (chưa có `id`).
- `utils/step-diff.ts`: không cần nữa (backend tự so thay đổi).
- `ProcedureChangeHistory.tsx → buildEntries`: bỏ phần sinh dòng mẫu.
