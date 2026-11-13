# API màn Bảng điều khiển (`/dashboard`)

Trang tổng quan cho Ban Giám đốc: tiến độ dự án và công việc, tiến độ tuần vừa qua, giải ngân theo kỳ, việc cần xử lý ngay, nhật ký điều hành gần nhất.

**Nguyên tắc: backend tính toán, frontend chỉ hiển thị.** Mọi con số, cách phân nhóm, sắp xếp, lọc và phân trang trên màn này do backend làm. Frontend chỉ gửi lựa chọn của người dùng (năm, kỳ, dự án, trang…) và vẽ đúng dữ liệu trả về, không tự cộng trừ, đếm hay xếp hạng.

- Frontend: `src/features/dashboard`.
- Backend: `cipm-service`. Module `dashboard` hiện có **một** API `GET /dashboard/summary`. Các API dưới đây đều đặt trong module `dashboard`.
- Mọi API của màn kiểm tra bằng **một quyền** `dashboard:view_kpi`, không phụ thuộc `project:view` / `procedure:view`.
- Hiện FE đang tự tính tạm từ API của màn khác và dữ liệu mẫu (xem Phụ lục C). Khi backend có các API này, FE bỏ phần tự tính.

Ký hiệu: ✅ backend đã có, giữ nguyên · 🔧 backend đã có, cần sửa · ⚠ backend chưa có (đề xuất).

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
| 400 | Tham số sai định dạng (năm, kỳ, ngày, trang) |
| 401 | Chưa đăng nhập / token hết hạn |
| 403 | Không có quyền `dashboard:view_kpi` |

Quy ước số liệu:
- **Tiền** trả bằng **VNĐ** (số nguyên). FE chỉ đổi đơn vị sang "tỷ" để hiện, không tính lại.
- **Phần trăm** trả dạng số, làm tròn 1 chữ số thập phân (`64.4`).
- **Ngày** dạng `YYYY-MM-DD`, **thời điểm** dạng ISO. "Hôm nay" tính theo giờ Việt Nam (UTC+7).
- Chỉ tính **dự án chưa đóng** (`isClosed = false`), trừ khi ghi khác.
- Bước **không tính** khi `isEnabled = false` hoặc `status` là `SKIPPED` / `DISABLED`.

---

## Tổng quan

| Khối trên màn | API | Endpoint | Backend |
|---|---|---|---|
| **1. Thẻ tiến độ** | 1.1 Số liệu 4 thẻ | `GET /dashboard/schedule-kpi` | ⚠ |
| | 1.2 Chi tiết theo cán bộ | `GET /dashboard/schedule-kpi/people` | ⚠ |
| | 1.3 Việc của một cán bộ | `GET /dashboard/schedule-kpi/tasks` | ⚠ |
| **2. Tiến độ tuần vừa qua** | 2.1 Số bước theo ngày | `GET /dashboard/weekly-progress` | ⚠ |
| **3. Giải ngân** | 3.1 Số liệu tổng quan | `GET /dashboard/summary` | 🔧 |
| | 3.2 Biểu đồ giải ngân theo kỳ | `GET /dashboard/disbursements` | ⚠ |
| **4. Việc cần xử lý ngay** | 4.1 Danh sách việc cần xử lý ngay | `GET /dashboard/urgent-tasks` | ⚠ |
| **5. Nhật ký điều hành** | 5.1 Nhật ký (lọc, phân trang) | `GET /dashboard/activities` | ⚠ |
| | 5.2 Chi tiết một dòng nhật ký | `GET /dashboard/activities/:id` | ⚠ |

Backend đã có 1 / 9 API (3.1, cần bổ sung); còn 8 API mới.

**Làm mới:** nút làm mới trên thanh trên cùng, và tự động mỗi 15 phút. FE gọi lại các API trên, không cần API riêng.

---

## Khối 1. Thẻ tiến độ

Component: DashboardScheduleKpis (4 thẻ), ScheduleStatsPage (trang chi tiết khi bấm thẻ)

Bốn thẻ: **Tổng dự án · Vượt tiến độ · Trễ tiến độ · Đúng tiến độ**. Mỗi thẻ có số dự án (số to) và số công việc (số nhỏ).

### Quy tắc phân nhóm (backend áp dụng)

**Dự án**, so `actualProgress` với `plannedProgress`, làm tròn 1 chữ số:

| Nhóm | Điều kiện |
|---|---|
| `ahead` (Vượt) | `actualProgress > plannedProgress` |
| `late` (Trễ) | `actualProgress < plannedProgress` |
| `onTrack` (Đúng) | bằng nhau |

**Công việc (bước quy trình)**, chỉ tính bước có hạn dự kiến `endDatePlanned`:

| Nhóm | Bước đã xong (`COMPLETED`) | Bước chưa xong |
|---|---|---|
| `ahead` | `actualEndDate < endDatePlanned` | — |
| `late` | `actualEndDate > endDatePlanned` | hôm nay > `endDatePlanned` |
| `onTrack` | `actualEndDate = endDatePlanned` (hoặc thiếu `actualEndDate`) | hôm nay ≤ `endDatePlanned` |

**Số ngày lệch** (`lagDays`): bước đã xong = `actualEndDate − endDatePlanned` (âm là sớm); bước chưa xong = `max(0, hôm nay − endDatePlanned)`.

> **Điều kiện để số đúng:** backend phải cập nhật `projects.plannedProgress` / `actualProgress` (hiện mặc định `0`) và có `endDatePlanned` cho từng bước. Nếu bước chưa có hạn, backend tính từ ngày khởi công dự án cộng thời hạn các bước trước, theo thứ tự trong cùng phòng ban, giống hàm FE `withPlannedDates` (`src/shared/projects_works/utils/step-schedule.ts`).

### 1.1. Số liệu 4 thẻ ⚠

```
GET /dashboard/schedule-kpi
```
```json
{
  "status": true,
  "statusCode": 200,
  "data": {
    "projects": { "total": 48, "ahead": 15, "late": 9, "onTrack": 24 },
    "tasks":    { "total": 1210, "ahead": 310, "late": 182, "onTrack": 718 }
  }
}
```

### 1.2. Chi tiết theo cán bộ ⚠

Bấm một thẻ mở trang chi tiết: cột trái là danh sách cán bộ, cột phải là việc của cán bộ đang chọn.

```
GET /dashboard/schedule-kpi/people
Query: group=total|ahead|late|onTrack
```
```json
{
  "status": true,
  "statusCode": 200,
  "data": [
    { "name": "Trần Trung Tín", "total": 32, "ahead": 6, "late": 9, "onTrack": 17 },
    { "name": "Chưa giao", "total": 14, "ahead": 0, "late": 5, "onTrack": 9 }
  ]
}
```
- Bước chưa giao người gom vào một dòng `"Chưa giao"`.
- `group=total`: trả mọi cán bộ, xếp theo `late` giảm dần rồi `total` giảm dần.
- `group=ahead|late|onTrack`: chỉ trả cán bộ có số bước nhóm đó > 0, xếp theo số bước nhóm đó giảm dần.

### 1.3. Việc của một cán bộ ⚠

```
GET /dashboard/schedule-kpi/tasks
Query: group=total|ahead|late|onTrack, assignee=<tên cán bộ | "Chưa giao">
```
```json
{
  "status": true,
  "statusCode": 200,
  "data": [
    {
      "projectId": "8f1c…",
      "projectCode": "DA-2026-001",
      "projectName": "Kè chống sạt lở Mũi Nai",
      "stepId": "a7b8…",
      "stepName": "Khảo sát, lập báo cáo kinh tế – kỹ thuật",
      "group": "late",
      "dueDate": "2026-10-10",
      "doneDate": null,
      "completed": false,
      "lagDays": 34
    }
  ]
}
```
Xếp theo `lagDays` giảm dần, rồi `dueDate` tăng dần. FE hiện "Trễ N ngày" / "Sớm N ngày" / "Đúng hạn" theo dấu của `lagDays`.

---

## Khối 2. Biểu đồ tiến độ tuần vừa qua

Component: WeeklyProgressChart · Lọc: dự án (hoặc tất cả), tuần (8 tuần gần nhất)

Tuần tính từ **thứ Hai đến Chủ nhật**. "Tuần vừa qua" là tuần đã kết thúc gần nhất, không phải tuần đang chạy.

### 2.1. Số bước theo ngày ⚠

```
GET /dashboard/weekly-progress
Query: weeksAgo=0..7         // 0 = tuần vừa qua, 1 = tuần trước nữa…
       projectId?=<id>        // bỏ trống = mọi dự án
```
```json
{
  "status": true,
  "statusCode": 200,
  "data": {
    "start": "2026-11-02",
    "end": "2026-11-08",
    "planned": 21,
    "completed": 17,
    "days": [
      { "date": "2026-11-02", "weekday": "T2", "planned": 4, "completed": 3 },
      { "date": "2026-11-03", "weekday": "T3", "planned": 5, "completed": 4 },
      { "date": "2026-11-08", "weekday": "CN", "planned": 1, "completed": 0 }
    ],
    "weeks": [
      { "weeksAgo": 0, "start": "2026-11-02", "end": "2026-11-08" },
      { "weeksAgo": 1, "start": "2026-10-26", "end": "2026-11-01" }
    ]
  }
}
```
- `days` luôn đủ 7 ngày.
- `planned` của một ngày = số bước có `endDatePlanned` rơi vào ngày đó.
- `completed` của một ngày = số bước `COMPLETED` có `actualEndDate` rơi vào ngày đó.
- `weeks` là 8 tuần cho ô chọn tuần (FE không tự tính ngày).
- Thiếu `projectId` thì tính trên mọi dự án chưa đóng.

---

## Khối 3. Biểu đồ giải ngân

Component: DisbursementQuarterlyChart, DisbursementPeriodFilter, DisbursementBars, DisbursementMetrics

Bộ lọc: **Tuần** (khối 5 tuần: 1–5, 6–10 … 51–52) · **Tháng** (khối 4 tháng: 1–4, 5–8, 9–12) · **Quý** ("Cả 4 quý" hoặc một quý → 3 tháng của quý). Năm lấy theo "Niên độ" chọn trên thanh trên cùng. Mỗi cột có 2 thanh **Kế hoạch** và **Thực tế**; dưới biểu đồ có 3 ô số liệu.

### 3.1. Số liệu tổng quan 🔧

```
GET /dashboard/summary
Query: year=2026          // cần thêm
```
Backend đã có `totalProjects`, `completedProjects`, `inProgressProjects`, `totalInvestment`, `totalDisbursed`, `projectsByType`. **Cần thêm** các trường đã tính sẵn cho năm được chọn:

```json
{
  "status": true,
  "statusCode": 200,
  "data": {
    "year": 2026,
    "totalProjects": 48,
    "completedProjects": 12,
    "inProgressProjects": 36,
    "totalInvestment": 650000000000,
    "totalDisbursed": 418500000000,
    "capitalPlan": 665000000000,
    "disbursedInYear": 418500000000,
    "remaining": 246500000000,
    "disbursementRate": 62.9,
    "requiredMonthlySpeed": 123250000000,
    "projectsByType": [
      { "type": "Giao thông", "count": 10, "investment": 120000000000 }
    ]
  }
}
```

| Trường | Cách tính |
|---|---|
| `capitalPlan` | Tổng `allocatedAmount + adjustedAmount` trong `capital_plans` có `fiscalYear = year` |
| `disbursedInYear` | Tổng đợt trong `project_disbursements` có `date` thuộc năm: `disburse` cộng, `withdraw` trừ |
| `remaining` | `max(0, capitalPlan − disbursedInYear)` |
| `disbursementRate` | `disbursedInYear / capitalPlan × 100` (0 nếu `capitalPlan = 0`) |
| `requiredMonthlySpeed` | `remaining / số tháng còn lại trong năm` (tính cả tháng hiện tại; năm đã qua trả `0`) |

`totalDisbursed` vẫn đọc từ `projects.disbursedAmount`, nên cột này phải được cập nhật mỗi lần thêm đợt giải ngân / thu hồi (xem [yeu-cau-backend-nguon-von-giai-ngan.md](yeu-cau-backend-nguon-von-giai-ngan.md) mục 3.6).

### 3.2. Biểu đồ giải ngân theo kỳ ⚠

```
GET /dashboard/disbursements
Query: year=2026
       period=week|month|quarter
       block=<khối đang chọn>
```

| `period` | `block` | Số cột trả về |
|---|---|---|
| `week` | `1-5`, `6-10` … `51-52` | 5 (khối cuối 2) |
| `month` | `1-4`, `5-8`, `9-12` | 4 |
| `quarter` | `all` | 4 quý |
| `quarter` | `1` … `4` | 3 tháng của quý |

```json
{
  "status": true,
  "statusCode": 200,
  "data": {
    "title": "BIỂU ĐỒ GIẢI NGÂN THEO QUÝ (NIÊN ĐỘ 2026)",
    "items": [
      { "label": "Quý 1", "from": "2026-01-01", "to": "2026-03-31", "plan": 145000000000, "actual": 158000000000, "isCurrent": false },
      { "label": "Quý 4", "from": "2026-10-01", "to": "2026-12-31", "plan": 150000000000, "actual": 8500000000, "isCurrent": true }
    ],
    "metrics": [
      { "label": "Đã giải ngân lũy kế", "value": 418500000000, "unit": "money" },
      { "label": "Còn lại cần giải ngân", "value": 246500000000, "unit": "money" },
      { "label": "Tốc độ yêu cầu", "value": 123250000000, "unit": "money_per_month" }
    ]
  }
}
```

**`actual` của mỗi cột** = tổng đợt trong `project_disbursements` có `date` nằm trong `[from, to]`: `disburse` cộng, `withdraw` trừ. Dùng cột `date` (ngày giải ngân người dùng chọn), không dùng `createdAt`.

**`isCurrent`** = cột chứa ngày hôm nay. FE dùng để tô nổi và gắn "(HT)".

**`metrics`**, 3 ô dưới biểu đồ, backend chọn theo kỳ:

| Kỳ | Ô 1 | Ô 2 | Ô 3 |
|---|---|---|---|
| `quarter` + `all` | Đã giải ngân lũy kế (`disbursedInYear`) | Còn lại cần giải ngân (`remaining`) | Tốc độ yêu cầu / tháng (`requiredMonthlySpeed`) |
| `week` | Đã giải ngân trong khối | Kế hoạch trong khối | Tốc độ trung bình / tuần = tổng thực tế ÷ số tuần có giải ngân |
| `month`, `quarter` + một quý | Đã giải ngân trong khối | Kế hoạch trong khối | Tỷ lệ hoàn thành (%) = thực tế ÷ kế hoạch × 100 |

`unit`: `money` (VNĐ) · `money_per_month` · `money_per_week` · `percent`. Với `percent`, backend trả thêm `"note": "Đạt KH 95.5/233.0 tỷ"`.

**`plan` của mỗi cột: cần chốt nghiệp vụ.** Bảng `capital_plans` hiện chỉ có kế hoạch vốn **theo năm**. Chọn một trong ba:
1. Thêm kế hoạch vốn theo quý (nhập tay); tháng và tuần chia đều trong quý.
2. Chia đều kế hoạch năm cho 4 quý / 12 tháng / 52 tuần.
3. Không có kế hoạch theo kỳ: trả `plan: null`, FE ẩn thanh Kế hoạch.

---

## Khối 4. Việc cần xử lý ngay

Component: DashboardAlertPanel, UrgentTaskFilter, UrgentTaskCard

### 4.1. Danh sách việc cần xử lý ngay ⚠

```
GET /dashboard/urgent-tasks
Query: level?=danger|warning|info|success     // bỏ trống = tất cả
```
```json
{
  "status": true,
  "statusCode": 200,
  "data": {
    "total": 12,
    "counts": { "danger": 3, "warning": 4, "info": 3, "success": 2 },
    "items": [
      {
        "id": "8f1c…:a7b8…",
        "projectId": "8f1c…",
        "projectName": "Kè chống sạt lở Mũi Nai",
        "stepId": "a7b8…",
        "stepName": "Khảo sát, lập báo cáo kinh tế – kỹ thuật",
        "procedureName": "Quy trình GSKT",
        "badge": "Quá hạn 34 ngày",
        "level": "danger",
        "note": null
      }
    ]
  }
}
```
Lấy từ chính danh sách việc của người gọi (cùng phạm vi với `GET /my-tasks`), mỗi bước một dòng. Backend gắn nhãn theo thứ tự ưu tiên dưới đây và **xếp sẵn** theo thứ tự, cùng thứ tự thì hạn sớm hơn trước:

| Thứ tự | `badge` | `level` | Điều kiện | `note` |
|---|---|---|---|---|
| 1 | `Sự cố` | `danger` | Bước đang báo sự cố | Lý do sự cố |
| 2 | `Quá hạn N ngày` | `danger` | Chưa xong và đã quá `endDatePlanned` | — |
| 3 | `Bị trả về` | `warning` | Kết quả bị từ chối, hoặc việc bị hoàn trả | Lý do từ chối / hoàn trả |
| 4 | `Hạn chót dd/mm` | `warning` | Còn ≤ 7 ngày tới hạn | — |
| 5 | `Chờ duyệt` | `info` | Kết quả chờ Tổ trưởng duyệt | Ghi chú khi nộp |
| 6 | `Việc mới` | `info` | Mới giao, chưa tiếp nhận | — |
| 7 | `Hạn dd/mm` / `Đang xử lý` | `success` | Còn lại | — |

- `total` và `counts` tính trên **toàn bộ** danh sách (không theo `level`), để FE hiện "3 / 12 vấn đề".
- Mô tả trên thẻ FE ghép từ `stepName`, `procedureName`, `note`.
- Nút "Xử lý ngay" mở `/my-tasks?projectId=<projectId>&stepId=<stepId>`.

---

## Khối 5. Nhật ký điều hành gần nhất

Component: ActivityLogSection, ActivityLogFilters, ActivityLogTable, ActivityLogRow, ActivityDetailPage

### 5.1. Nhật ký (lọc, phân trang) ⚠

Thay cho việc FE gọi `GET /audit-logs?module=projects` rồi tự lọc và cắt trang.

```
GET /dashboard/activities
Query: page=1, limit=10
       projectId?=<id>        // lọc theo dự án
       actor?=<tên người>     // lọc theo người thực hiện
```
```json
{
  "status": true,
  "statusCode": 200,
  "data": {
    "items": [
      {
        "id": "c1d2…",
        "at": "2026-11-13T07:15:00.000Z",
        "projectId": "8f1c…",
        "projectCode": "DA-2026-001",
        "projectName": "Kè chống sạt lở Mũi Nai",
        "actorName": "Lê Hồng Đức",
        "actorTitle": "Kỹ sư giám sát kỹ thuật",
        "content": "Cập nhật khối lượng thi công móng kè đoạn 2."
      }
    ],
    "total": 137,
    "page": 1,
    "limit": 10,
    "filters": {
      "projects": [{ "id": "8f1c…", "label": "Kè chống sạt lở Mũi Nai (DA-2026-001)" }],
      "actors":   [{ "name": "Lê Hồng Đức", "label": "Lê Hồng Đức (Kỹ sư giám sát kỹ thuật)" }]
    }
  }
}
```
- Mới nhất trước.
- `content`: lấy `note` của log; nếu trống thì ghép `changes[]` dạng `Nhãn: cũ → mới`; nếu vẫn trống thì `action`.
- `filters` là danh sách lựa chọn cho hai ô lọc, tính trên toàn bộ nhật ký (không theo trang).
- Phạm vi: thao tác trên dự án, quy trình dự án, giải ngân, việc cần xử lý. Nếu chỉ lấy được log `entityName = PROJECT` thì ghi rõ để FE đổi tiêu đề.

### 5.2. Chi tiết một dòng nhật ký ⚠

```
GET /dashboard/activities/:id
```
```json
{
  "status": true,
  "statusCode": 200,
  "data": {
    "id": "c1d2…",
    "at": "2026-11-13T07:15:00.000Z",
    "actor": { "name": "Lê Hồng Đức", "title": "Kỹ sư giám sát kỹ thuật", "department": "Tổ Giám sát – Kỹ thuật", "phone": "0909…", "email": "duc.le@…" },
    "project": { "id": "8f1c…", "code": "DA-2026-001", "name": "Kè chống sạt lở Mũi Nai", "stage": "Thi công", "location": "Mũi Nai, Hà Tiên" },
    "actionType": "Cập nhật tiến độ",
    "content": "Cập nhật khối lượng thi công móng kè đoạn 2.",
    "changes": [{ "label": "Tiến độ thực tế", "from": "45%", "to": "52%" }],
    "facts": [
      { "label": "Số văn bản / Căn cứ", "value": "BB-NT-12/BQL" },
      { "label": "Giá trị liên quan", "value": "8.2 tỷ VNĐ" }
    ]
  }
}
```
`facts` là các dòng phụ đã định dạng sẵn. FE hiện nguyên nhãn và giá trị, không tự ghép.

---

## Phân quyền

| Thao tác | Quyền |
|---|---|
| Vào màn, gọi mọi API ở trên | `dashboard:view_kpi` |
| Khối 4 | `dashboard:view_kpi`; danh sách việc vẫn theo phạm vi của người gọi (như `/my-tasks`) |
| Nút "Xử lý ngay" | Quyền vào `/my-tasks`; FE khóa nút nếu không có |

---

## Phụ lục

### A. Thứ tự ưu tiên cho backend

1. **Cập nhật cột tiến độ và giải ngân:** `projects.plannedProgress`, `actualProgress`, `disbursedAmount`, và `endDatePlanned` của bước. Không có các cột này thì mọi phép tính ở trên đều ra 0.
2. **3.1** thêm `year` và các trường tính sẵn; **3.2** biểu đồ giải ngân, kèm chốt cách lấy `plan`.
3. **1.1 – 1.3** thẻ tiến độ và trang chi tiết.
4. **4.1** việc cần xử lý ngay.
5. **5.1 – 5.2** nhật ký điều hành.
6. **2.1** tiến độ tuần.

### B. Lớp gọi API phía FE (sau khi nối)

| File | Vai trò |
|---|---|
| `features/dashboard/api/dashboard.backend.ts` | Gọi API thô 1.1 – 5.2 |
| `features/dashboard/services/dashboard.mapper.ts` | Chỉ đổi tên trường / định dạng hiển thị (VNĐ → "tỷ", ngày → dd/mm/yyyy), không tính toán |
| `features/dashboard/services/dashboard.api.ts` | Bọc `withBackend` (`src/config/backend.ts`): tài khoản thật gọi API, tài khoản thử nghiệm dùng dữ liệu mẫu |
| `features/dashboard/hooks/useDashboardQueries.ts` | Một hook / một API, khóa react-query `["dashboard", <tên>, <tham số>]` |
| `features/dashboard/hooks/useDashboardRefresh.ts` | Làm mới khóa `["dashboard"]` khi bấm nút làm mới và mỗi 15 phút |

### C. Phần FE đang tự tính tạm, sẽ bỏ khi có API

| Đang tự tính | File | Thay bằng |
|---|---|---|
| Phân nhóm vượt / trễ / đúng, đếm theo dự án và cán bộ (`buildScheduleKpi`, `buildTaskKpi`, `buildScheduleTaskRows`, `buildSchedulePeople`), gọi N lần `GET /projects/:id/procedure` | `utils/schedule-kpi.ts`, `hooks/useDashboardSchedule.ts` | 1.1 – 1.3 |
| Đếm bước theo ngày (`buildLastWeekReport`, `closedWeekRange`) | `utils/schedule-kpi.ts` | 2.1 |
| Còn lại, tốc độ yêu cầu (`toDisbursementTotals`) | `services/dashboard.mapper.ts` | 3.1 |
| Cột kế hoạch / thực tế và 3 ô số liệu theo kỳ (`buildDisbursementChart`, hiện là **số giả**) | `utils/disbursement-chart.ts` | 3.2 |
| Gắn nhãn, xếp hạng việc cần xử lý ngay từ `GET /my-tasks` (`buildUrgentTasks`) | `utils/urgent-tasks.ts` | 4.1 |
| Lọc theo dự án / người, phân trang, danh sách lựa chọn từ `GET /audit-logs` | `hooks/useActivityLog.ts` | 5.1 |
| Các dòng phụ trong chi tiết nhật ký (`buildActivityDetailFacts`) | `utils/activity-detail.ts` | 5.2 |
| Cờ dữ liệu mẫu `MOCK_SCHEDULE`, `MOCK_WEEKLY_PROGRESS` | `constants/dashboard-mock-data.ts` | 1.x, 2.1 |
