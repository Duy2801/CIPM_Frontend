# API bổ sung: Nguồn vốn dự án & Giải ngân (M2)

Tài liệu bổ sung cho `docs/api-du-an-cong-trinh.md`, chỉ ghi **phần thay đổi** sau đợt sửa giao diện màn **Thêm dự án**, **Chi tiết dự án → Thông tin chung** và **Chi tiết dự án → Giải ngân**. Số API giữ nguyên số trong tài liệu gốc; phần nào không nhắc tới thì giữ như tài liệu gốc.

- Frontend: `src/features/projects_works`
- Backend: `cipm-service` — đã có module dự án và giải ngân; các mục dưới đây là **phần cần sửa / bổ sung**.
- Không gồm Dashboard.

Ký hiệu: ✅ backend đã có, giữ nguyên · 🔧 backend đã có, cần sửa · ⚠ backend chưa có (đề xuất) · "FE tự xử lý" = chỉ chạy trên máy, không gọi backend.

Quy ước chung (base URL, header, dạng lỗi, ngày giờ, số tiền) giống tài liệu gốc.

---

## Tổng quan

| Màn hình | API | Endpoint | Backend | Thay đổi |
|---|---|---|---|---|
| **2. Thêm dự án mới** | 2.1 Tạo dự án | `POST /projects` | 🔧 | Nhận `fundingSources[]` |
| | 2.4 Danh mục nguồn vốn / tính chất / loại dự án | `GET /catalogs?type=` · `POST /catalogs` | 🔧 | Thêm loại `PROJECT_NATURE`; FE bỏ localStorage |
| **3. Chi tiết dự án** | 3.1 Xem chi tiết dự án | `GET /projects/:id` | 🔧 | Trả `fundingSources[]` |
| *Tab Thông tin chung* | 3.2 Lưu thay đổi thông tin | `PATCH /projects/:id` | 🔧 | Nhận `fundingSources[]` |
| *Tab Giải ngân* | 3.5 Xem các đợt giải ngân | `GET /projects/:id/disbursements` | 🔧 | Mỗi đợt trả `fundingSource`; trả đủ mọi đợt; `category` khớp tên đầu mục |
| | 3.6 Thêm đợt giải ngân / thu hồi | `POST /projects/:id/disbursements` | 🔧 | Nhận `fundingSource`; hạn mức theo nguồn; cập nhật `disbursedAmount`; trả `{ entry, summary }` |
| **1. Danh sách dự án** | 1.1 Xem danh sách dự án | `GET /projects` | 🔧 | Trả `fundingSources[]` (không bắt buộc) |

Cần sửa 6 API, không có API mới.

**Nguồn vốn dự án** (dùng ở 1.1, 2.1, 3.1, 3.2, 3.5, 3.6)

| Trường | Kiểu | Ý nghĩa |
|---|---|---|
| `fundingSources` | `{ source: string; amount: number }[]` | **Mới.** Các nguồn vốn của dự án và số vốn từng nguồn, theo thứ tự hiện trên màn |
| `fundingSource` | `string` | Giữ lại để màn cũ hiển thị. Backend tự đặt = tên các nguồn nối bằng `", "` |
| `totalInvestment` | `number` | Backend tự tính = `Σ fundingSources[].amount` khi có `fundingSources` |

---

## Màn 2. Thêm dự án mới

Component: CreateProjectPage, **FundingSourceRows** (`components/shared/`, dùng chung với tab Thông tin chung), **CustomOptionSelect** (ô chọn có dòng "Thêm"), WorkTypeSelect · Hook: useCustomOptions · Hàm: `utils/create-project-form.ts` (`FundingLine`, `toFundingSources`, `toProjectFormData`), `utils/custom-options.ts`

| Thao tác trên màn | API / hàm | Làm gì |
|---|---|---|
| Mục "Vốn đầu tư": mỗi hàng chọn *Nguồn vốn* + nhập *Số vốn đầu tư (VNĐ)* | FE tự xử lý (gửi kèm 2.1) | Một nguồn không chọn được hai lần |
| Nút "Thêm nguồn vốn" | FE tự xử lý | Thêm hàng, tự chọn sẵn nguồn chưa dùng; hết nguồn thì nút mờ |
| Nút 🗑 ở hàng (trừ hàng đầu) | FE tự xử lý | Xóa hàng |
| Dòng "Tổng mức đầu tư" cuối mục | FE tự xử lý | Tự cộng các hàng, **không nhập tay nữa** |
| Ô "Nguồn vốn" → dòng "Thêm" cuối danh sách | **2.4** `POST /catalogs` (hiện FE lưu localStorage) | Thêm nguồn mới vào danh mục |
| Ô "Tính chất dự án" → dòng "Thêm" | **2.4** `POST /catalogs` (hiện FE lưu localStorage) | Thêm tính chất mới |
| Ô "Loại dự án" → dòng "Thêm" | **2.4** `POST /catalogs` `PROJECT_TYPE` (backend đã có; FE vẫn lưu localStorage) | Thêm loại dự án mới |
| Nút "Thêm dự án" | **2.1** `POST /projects` | — |

### 2.1. Tạo dự án 🔧

**Request** (chỉ ghi các trường thay đổi so với tài liệu gốc)
```json
POST /projects
{
  "name": "Đường số 6",
  "fundingSources": [
    { "source": "Ngân sách thành phố", "amount": 600000000 },
    { "source": "Ngân sách tỉnh", "amount": 400000000 }
  ],
  "fundingSource": "Ngân sách thành phố, Ngân sách tỉnh",
  "totalInvestment": 1000000000,
  "...": "các trường khác giữ như tài liệu gốc"
}
```
- `fundingSources` **không bắt buộc**. Không gửi thì giữ cách cũ (`fundingSource` + `totalInvestment`).
- Có `fundingSources` thì backend **bỏ qua** `fundingSource`, `totalInvestment` client gửi và tự tính lại (bảng ở phần Tổng quan).
- Hàng chưa chọn nguồn bị FE bỏ trước khi gửi; số vốn để trống gửi `0`.

**Kiểm tra** (thêm vào bảng kiểm tra của 2.1 gốc):

| Điều kiện | Lỗi 400 |
|---|---|
| `fundingSources[].source` trống | `Vui lòng chọn nguồn vốn.` |
| trùng `source` trong cùng dự án (không phân biệt hoa thường, bỏ khoảng trắng hai đầu) | `Nguồn vốn {tên} bị chọn trùng.` |
| `fundingSources[].amount < 0` | `Số vốn đầu tư không được âm.` |

**Backend làm khi tạo:** ghi các dòng `project_funding_sources` (Phụ lục A) theo đúng thứ tự mảng.

**Response** `201`: dự án đầy đủ như 3.1 (có `fundingSources`).

**Hiện trạng:** backend chưa nhận `fundingSources` nên `toApiCreateBody` (FE) chưa gửi trường này → **số vốn của từng nguồn bị mất**, chỉ còn tổng.

### 2.4. Danh mục nguồn vốn / tính chất dự án 🔧

```
GET  /catalogs?type=FUND_SOURCE          // Nguồn vốn (đã có)
GET  /catalogs?type=PROJECT_TYPE         // Loại dự án (đã có)
GET  /catalogs?type=PROJECT_NATURE       // Tính chất dự án (mới)
POST /catalogs  { "type": "FUND_SOURCE", "name": "Vốn ngân sách phường" }
POST /catalogs  { "type": "PROJECT_NATURE", "name": "Dự án khẩn cấp" }
```
- Thêm loại danh mục `PROJECT_NATURE`, dữ liệu gốc: `new` Dự án mới (Khởi công mới) · `transitional` Dự án cũ (Chuyển tiếp).
- Trường `nature` của dự án hiện là enum `new | transitional`. Người dùng thêm được tính chất mới ở màn này, nên **cần đổi `nature` sang chuỗi** (giá trị trong danh mục `PROJECT_NATURE`), nếu không 2.1 / 3.2 sẽ trả 400 khi chọn tính chất tự thêm.
- FE hiện lưu mục tự thêm ở localStorage (`cipm_custom_funding_sources`, `cipm_custom_project_natures`, `cipm_custom_work_types`) → người khác, máy khác không thấy. Khi backend có `PROJECT_NATURE`, FE đổi cả ba ô sang `useCatalog` (chỉ cần sửa `useCustomOptions`).
---

## Màn 3. Chi tiết dự án

### 3.1. Xem chi tiết dự án 🔧

Thêm `fundingSources` vào response, các trường khác giữ như tài liệu gốc:
```json
{
  "status": true,
  "statusCode": 200,
  "data": {
    "id": "8d1f0c2a-...",
    "fundingSource": "Ngân sách thành phố, Ngân sách tỉnh",
    "fundingSources": [
      { "source": "Ngân sách thành phố", "amount": 600000000 },
      { "source": "Ngân sách tỉnh", "amount": 400000000 }
    ],
    "totalInvestment": 1000000000,
    "disbursedAmount": 390000000,
    "...": "các trường khác giữ như tài liệu gốc"
  }
}
```
Dự án cũ chưa có `fundingSources` thì trả `[]`. FE khi đó tự suy ra từ `fundingSource`: một nguồn thì lấy `totalInvestment` làm số vốn của nguồn đó; nhiều nguồn thì không chia được (mỗi nguồn hiện 0 VNĐ).

### Tab "Thông tin chung"

Component: ProjectInfoTab, **FundingSourceRows** (`components/shared/`, dùng chung với màn 2), ProjectChangesSummary · Hook: useProjectInfoDraft, useProject(projectId) · Hàm: `utils/project-detail-fields.ts`

| Thao tác trên màn | API / hàm | Làm gì |
|---|---|---|
| Mục "Vốn đầu tư" | FE tự xử lý (bản nháp) | **Thay cho** hai ô sửa nhanh *Nguồn vốn* và *Tổng mức đầu tư* cũ. Giống màn 2: thêm / xóa hàng, chọn nguồn, nhập số vốn, tổng tự cộng. Người không có quyền sửa chỉ xem |
| Sửa nguồn vốn | FE tự xử lý (bản nháp) | Ô đổi nền vàng; sửa về như cũ thì bỏ khỏi nháp |
| "Lưu thay đổi" → hộp "cũ → mới" | **3.2** | Hộp có thêm dòng **"Cơ cấu nguồn vốn"**: `Ngân sách thành phố: 600.000.000 VNĐ; Ngân sách tỉnh: 400.000.000 VNĐ` |

### 3.2. Lưu thay đổi thông tin 🔧

```json
PATCH /projects/:id
{
  "fundingSources": [
    { "source": "Ngân sách thành phố", "amount": 600000000 },
    { "source": "Ngân sách tỉnh", "amount": 450000000 }
  ],
  "fundingSource": "Ngân sách thành phố, Ngân sách tỉnh",
  "totalInvestment": 1050000000
}
```
- Chỉ gửi khi mục Vốn đầu tư có đổi. FE luôn gửi **cả ba trường** cùng lúc.
- Có `fundingSources` thì **ghi đè toàn bộ** danh sách nguồn của dự án; `fundingSource`, `totalInvestment` tự tính lại như 2.1.

**Kiểm tra** (thêm vào kiểm tra 3.2 gốc; gồm các điều kiện của 2.1 ở trên):

| Điều kiện | Lỗi 400 |
|---|---|
| số vốn mới của một nguồn < số đã giải ngân ròng của nguồn đó (3.5) | `Số vốn của nguồn {tên} nhỏ hơn số đã giải ngân.` |
| xóa một nguồn đã có đợt giải ngân | `Không thể xóa nguồn {tên} vì đã có đợt giải ngân.` |
| tổng mới < tổng đã giải ngân ròng của dự án | `Tổng mức đầu tư nhỏ hơn số đã giải ngân.` |

FE **chưa chặn** ba điều kiện này — backend là chốt chặn duy nhất.

**Audit log**: thêm dòng `changes` cho nguồn vốn, VD `{ "label": "Cơ cấu nguồn vốn", "from": "Ngân sách tỉnh: 400.000.000 VNĐ", "to": "Ngân sách tỉnh: 450.000.000 VNĐ" }`.

**Hiện trạng:** `toApiUpdateBody` (FE) chưa gửi `fundingSources` → sau khi lưu và tải lại, số vốn từng nguồn mất.

### Tab "Giải ngân"

Component (mỗi component chỉ nhận `projectId` và tự gọi hook): ProjectDisbursementTab, **DisbursementOverview**, **DisbursementCategoryBar**, **DisbursementCategorySummary**, **DisbursementEntryTable**, DisbursementFormDrawer, DisbursementRecordDrawer · Hook: `useProjectDisbursements(projectId)` · Hàm: `utils/project-disbursement.ts`, `utils/procedure-target.ts`, `utils/disbursement-format.ts`

Bố cục mới (thay cho bảng DisbursementCategoryRow cũ — đã xóa):

| Khối trên màn | API / hàm | Làm gì |
|---|---|---|
| Khung **"Tổng các đầu mục"** (ngoài khung tab) | FE tự tính từ 3.5 `entries` | Biểu đồ bán nguyệt: 100% = tổng mức đầu tư, mỗi cung = phần đã giải ngân của một đầu mục; 3 ô Tổng mức đầu tư · Đã giải ngân (số đợt) · Còn lại; chip số tiền + % của từng đầu mục (chỉ xem). Bấm cung → mở tab đầu mục |
| Thanh tab đầu mục | Tên các tab quy trình của dự án (API quy trình) hoặc danh mục `EXPENSE_TYPE` (3.7) | Mỗi đầu mục một tab, xem mục **Đầu mục giải ngân** bên dưới |
| Khung **"Đầu mục: …"** trong tab | FE tự tính từ 3.5 `entries` | Đã cấp · Đã thu hồi · Thực giải ngân (số đợt) · Tỷ lệ so với tổng mức đầu tư |
| Dòng số vốn còn lại theo nguồn (dự án ≥ 2 nguồn) | FE tự tính (`sourceBalance`) | `Ngân sách tỉnh: còn 250.000.000 VNĐ` |
| Bảng các đợt của đầu mục | 3.5 `entries` | Cột ở bảng dưới; mới nhất lên trước; bấm dòng mở drawer chi tiết |
| Nút "Cấp giải ngân" | **3.6** `kind: "disburse"` | — |
| Nút "Thu hồi vốn" (mờ khi đầu mục chưa giải ngân) | **3.6** `kind: "withdraw"` | — |
| Nút "Thêm danh mục" (dự án chưa có tab quy trình) | 3.7 (giữ như gốc) | — |

**Đầu mục giải ngân**

FE tự lập danh sách đầu mục (hàm `procedureHeadings`, `procedureTabLabel` trong `utils/procedure-target.ts`):
- Dự án **có** quy trình: mỗi phòng ban đã áp quy trình là một đầu mục, tên = `departmentStatuses[phòng ban].tabLabel`; không có `tabLabel` thì lấy `procedureName` bỏ chữ "Quy trình" ở đầu (VD `Quy trình giải phóng mặt bằng` → `Giải phóng mặt bằng`). Tên trùng nhau chỉ tính một lần.
- Dự án **chưa có** quy trình: lấy danh mục chi phí `EXPENSE_TYPE` (3.7).

FE gom đợt vào đầu mục bằng cách **so khớp chuỗi `entries[].category` với tên đầu mục**. Đợt có `category` không khớp đầu mục nào sẽ hiện thành một tab riêng mang tên cũ (VD sau khi đổi `tabLabel`). Backend cần:
- Lưu `category` đúng chuỗi FE gửi ở 3.6, không chuẩn hóa hoa thường, không cắt khoảng trắng.
- **Đề xuất:** khi đổi `tabLabel` của một quy trình đã có đợt giải ngân, cập nhật `category` của các đợt cũ theo tên mới, hoặc báo lỗi không cho đổi.

**Số liệu biểu đồ và hai khung tổng hợp**

FE tính trong hook `useProjectDisbursements`, không gọi API riêng. Đầu vào chỉ là `entries` của 3.5, danh sách đầu mục ở trên và `totalInvestment` của dự án (3.1). Hiện FE **không đọc** `summary` của 3.5; `summary.byCategory` dưới đây là kết quả FE tự tính bằng `summarizeDisbursements(entries, đầu mục)`.

| Số trên màn | Công thức | Dữ liệu dùng | Nơi tính |
|---|---|---|---|
| **Khung "Tổng các đầu mục"** | | | `DisbursementOverview.tsx` |
| Mốc 100% của biểu đồ (`base`) | `max(totalInvestment, Σ max(0, byCategory[].total))` | 3.1, 3.5 `summary.byCategory` | |
| Độ dài cung của đầu mục | `max(0, byCategory[i].total) / base` × nửa vòng | 3.5 `summary.byCategory` | |
| % ở giữa biểu đồ | `Σ max(0, byCategory[].total) / base × 100` | như trên | |
| Đã giải ngân · số đợt | `summary.total` · `summary.count` | 3.5 `summary` | |
| Còn lại | `max(0, totalInvestment − summary.total)` | 3.1, 3.5 | |
| Chip từng đầu mục | `byCategory[i].total` và `max(0, total) / base × 100` | 3.5 `summary.byCategory` | |
| Màu đầu mục | Theo thứ tự trong `byCategory`, cố định 8 màu, từ đầu mục thứ 9 dùng chung màu xám | — | |
| **Khung "Đầu mục: …"** | | | `DisbursementCategorySummary.tsx` |
| Đã cấp | `Σ amount` các đợt `kind = disburse` của đầu mục | 3.5 `entries` | |
| Đã thu hồi | `Σ amount` các đợt `kind = withdraw` của đầu mục | 3.5 `entries` | |
| Thực giải ngân · số đợt | `byCategory[i].total` · `byCategory[i].count` | 3.5 `summary.byCategory` | |
| Tỷ lệ so với tổng mức đầu tư | `byCategory[i].total / totalInvestment × 100` (hàm `percent`) | 3.1, 3.5 | `utils/disbursement-format.ts` |

Vì vậy backend cần đảm bảo:
- `entries[]` trả **đủ mọi đợt** của dự án (không phân trang), vì mọi số trên tab đều cộng từ danh sách này.
- Mỗi đợt có `kind`, `amount` (số dương, chiều cấp/thu hồi theo `kind`), `category`, `createdAt` chính xác.
- `summary` vẫn nên trả đúng (giải ngân ròng = tổng cấp − tổng thu hồi; đủ mọi đầu mục, kể cả đầu mục chưa có đợt), để đối chiếu và để FE chuyển sang đọc thẳng về sau.

**Đề xuất (không bắt buộc):** `byCategory[]` trả thêm `granted` (tổng cấp) và `withdrawn` (tổng thu hồi). Khi đó FE có thể đọc `summary` thay vì cộng từ `entries`, và `entries` có thể phân trang về sau.
```json
{ "category": "Giải phóng mặt bằng", "total": 190000000, "granted": 210000000, "withdrawn": 20000000, "count": 3, "lastDate": "2026-11-12" }
```

**Cột bảng các đợt**

| Cột | Lấy từ | Backend |
|---|---|---|
| Ngày thực hiện | `date` | ✅ |
| Loại thu chi | `kind` → "Cấp giải ngân" / "Thu hồi vốn" | ✅ |
| Nội dung giải ngân | `content` | ✅ |
| Người thực hiện | `createdBy.fullName` | ✅ |
| Nguồn vốn | `fundingSource` | ⚠ **chưa có** — đang hiện "—" |
| Số tiền giải ngân | `amount` (thu hồi hiện `−`, chữ đỏ) | ✅ |
| Số tiền còn lại | FE tự tính (`remainingAfterEach`, xem 3.5) | — |
| File đính kèm | `attachments.length` | ✅ |

### 3.5. Xem các đợt giải ngân 🔧

```json
{
  "status": true,
  "statusCode": 200,
  "data": {
    "summary": {
      "totalInvestment": 1000000000,
      "total": 390000000,
      "remaining": 610000000,
      "count": 4,
      "byCategory": [
        { "category": "Giải phóng mặt bằng", "total": 190000000, "count": 3, "lastDate": "2026-11-12" },
        { "category": "FIMI", "total": 200000000, "count": 1, "lastDate": "2026-11-12" }
      ],
      "bySource": [
        { "source": "Ngân sách thành phố", "budget": 600000000, "disbursed": 240000000, "remaining": 360000000 },
        { "source": "Ngân sách tỉnh", "budget": 400000000, "disbursed": 150000000, "remaining": 250000000 }
      ]
    },
    "entries": [
      {
        "id": "e1f2a3b4-...",
        "kind": "withdraw",
        "category": "Giải phóng mặt bằng",
        "fundingSource": "Ngân sách thành phố",
        "amount": 20000000,
        "date": "2026-11-12",
        "content": "Thu hồi tạm ứng thừa",
        "attachments": [{ "id": "f1...", "fileName": "QD-thu-hoi.pdf", "fileSize": 51200, "url": "/api/v1/projects/.../files/f1..." }],
        "createdBy": { "id": "f8a20277-...", "fullName": "Huỳnh Thái Hải" },
        "createdAt": "2026-11-12T08:30:00.000Z"
      }
    ]
  }
}
```
- **Mới:** `entries[].fundingSource` (`null` với đợt cũ), `summary.bySource` (không bắt buộc — FE tự tính được, có sẵn thì dùng để khớp với kiểm tra hạn mức của 3.6).
- `summary.bySource`: `disbursed` = giải ngân ròng của nguồn (tổng cấp − tổng thu hồi); `remaining = budget − disbursed`. Dự án không có `fundingSources` thì trả `[]`.
- **Số tiền còn lại** (cột bảng) FE tự tính: sắp các đợt theo `createdAt` tăng dần, trừ dần vào số vốn của nguồn tương ứng; dự án không có số vốn theo nguồn thì trừ vào `totalInvestment`. Vì vậy `createdAt` **phải chính xác tới mili giây**, không làm tròn theo ngày.

### 3.6. Thêm đợt giải ngân / thu hồi 🔧

```json
POST /projects/:id/disbursements
{
  "kind": "disburse",
  "category": "FIMI",
  "fundingSource": "Ngân sách tỉnh",
  "amount": 200000000,
  "content": "Tạm ứng hợp đồng tư vấn",
  "fileIds": ["f1..."]
}
```
Ngăn "Cấp giải ngân / Thu hồi vốn" có thêm ô **Nguồn vốn** cạnh ô số tiền; danh sách = `fundingSources` của dự án; bắt buộc nếu dự án có nguồn vốn; dự án chỉ có 1 nguồn thì FE tự chọn sẵn. Dòng gợi ý dưới ô số tiền hiện hạn mức theo nguồn đã chọn.

**Kiểm tra** (thay bảng kiểm tra 3.6 gốc; FE đang dùng `validateDisbursement` + `limitFor`):

| Điều kiện | Lỗi 400 |
|---|---|
| thiếu `category` | `Vui lòng chọn danh mục.` |
| dự án có `fundingSources` mà thiếu `fundingSource` | `Vui lòng chọn nguồn vốn.` |
| `fundingSource` không thuộc `fundingSources` của dự án | `Nguồn vốn không thuộc dự án.` |
| `amount <= 0` | `Số tiền giải ngân phải lớn hơn 0.` / `Số tiền thu hồi phải lớn hơn 0.` |
| **cấp**, dự án có số vốn theo nguồn: `amount > budget nguồn − giải ngân ròng nguồn` | `Số tiền vượt phần vốn còn lại.` |
| **cấp**, dự án không có số vốn theo nguồn: `amount > totalInvestment − total` | `Số tiền vượt phần vốn còn lại.` |
| **thu hồi**: `amount >` giải ngân ròng của (đầu mục + nguồn vốn) | `Số tiền thu hồi vượt số đã giải ngân của danh mục từ nguồn vốn này.` |
| thu hồi thiếu `content` | `Vui lòng nhập lý do thu hồi.` |
| `fileIds` rỗng | `Vui lòng đính kèm ít nhất 1 file chứng từ.` |

**Response** `201` — **đổi** từ `{ summary, entries }` sang:
```json
{ "status": true, "statusCode": 201, "data": { "entry": { "...": "một đợt như 3.5" }, "summary": { "...": "như 3.5" } } }
```
FE đã đọc `data.entry` nếu có; không có thì lấy đợt `createdAt` mới nhất trong `entries` (có thể lấy nhầm khi hai người tạo cùng lúc).

**Sau khi thêm thành công** FE tải lại 3.5 và 1.1. `disbursedAmount` của 1.1 / 3.1 được dùng để cảnh báo khi đóng dự án đã giải ngân và trên Dashboard, nên backend cần **cập nhật `projects.disbursedAmount`** (giải ngân ròng của dự án) ngay trong 3.6, cùng một transaction với việc ghi đợt.

---

## Màn 1. Danh sách dự án

### 1.1. Xem danh sách dự án 🔧

Mỗi `items[]` trả thêm `fundingSources` như 3.1 (không bắt buộc — màn danh sách hiện chỉ hiện `fundingSource` và `totalInvestment`). Tìm kiếm `?q=` theo nguồn vốn nên tìm trong cả `fundingSources[].source`.

---

## Phân quyền

Không đổi so với tài liệu gốc:

| Ô trên Ma trận phân quyền | Mã backend | Được làm |
|---|---|---|
| `m2.create_edit` | `project:create_update` | 2.1, 3.2 (gồm sửa nguồn vốn), 2.4 `POST` |
| `m2.view` | `project:view` | 3.1, 3.5 |
| `m4.create_disbursement` | `finance:request_disbursement` | 3.6 |

---

## Phụ lục

### A. Bảng dữ liệu

| Bảng | Thay đổi |
|---|---|
| `project_funding_sources` | **Mới:** `id`, `projectId` (FK, xóa theo dự án), `source` (varchar 255), `amount` (bigint), `sortOrder`; unique (`projectId`, `source`) |
| `project_disbursements` | **Thêm cột** `fundingSource` (varchar 255, null được) |
| `projects` | `nature`: enum → varchar (giá trị trong danh mục `PROJECT_NATURE`) |
| `catalogs` | Thêm `type = PROJECT_NATURE` + 2 dòng gốc |

```prisma
model ProjectFundingSource {
  id        String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  projectId String  @map("project_id") @db.Uuid
  source    String  @db.VarChar(255)
  amount    BigInt
  sortOrder Int     @default(0) @map("sort_order")
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@unique([projectId, source])
  @@map("project_funding_sources")
}
```

**Chuyển dữ liệu cũ:** dự án có `fundingSource` là **một** nguồn → tạo 1 dòng `project_funding_sources` với `amount = totalInvestment`. Dự án nhiều nguồn (chuỗi có dấu phẩy) → không chia được, để trống cho người dùng nhập lại ở tab Thông tin chung.

### B. Hàm thuần dùng lại được ở backend

| Hàm | File | Dùng cho |
|---|---|---|
| `toFundingSources`, `toProjectFormData` | `utils/create-project-form.ts` | 2.1 |
| `projectFundingBudgets` | `utils/project-disbursement.ts` | Suy nguồn vốn từ dự án cũ (3.1) |
| `validateDisbursement` | `utils/project-disbursement.ts` | 3.6 |
| `sourceBalance` | `utils/project-disbursement.ts` | 3.5 `bySource`, hạn mức 3.6 |
| `remainingAfterEach` | `utils/project-disbursement.ts` | Cột "Số tiền còn lại" (3.5) |
| `signedAmount`, `summarizeDisbursements` | `utils/project-disbursement.ts` | 3.5 |
| `procedureHeadings`, `procedureTabLabel` | `utils/procedure-target.ts` | Tên đầu mục giải ngân (3.5, 3.6) |

### C. FE sẽ sửa khi backend xong

| Việc | File | Mục |
|---|---|---|
| Gửi `fundingSources` | `services/project.mapper.ts` → `toApiCreateBody`, `toApiUpdateBody` | 2.1, 3.2 |
| Đọc `fundingSources` | `services/project.mapper.ts` → `toProjectItem` | 1.1, 3.1 |
| Gửi `fundingSource` của đợt | `services/project.mapper.ts` → `toApiDisbursementBody` | 3.6 |
| Đọc `fundingSource` của đợt | `services/project.mapper.ts` → `toDisbursementEntry` | 3.5 |
| Bỏ localStorage nguồn vốn / tính chất / loại dự án tự thêm, đổi sang `useCatalog` | `hooks/useCustomOptions.ts`, `utils/custom-options.ts` | 2.4 |
| Đọc `summary.byCategory[].granted / withdrawn` (nếu backend làm đề xuất) | `hooks/useProjectDisbursements.ts`, `DisbursementCategorySummary` | 3.5 |
