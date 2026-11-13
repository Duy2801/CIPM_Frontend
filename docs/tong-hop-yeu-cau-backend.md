# Tổng hợp yêu cầu sửa backend từ các thay đổi frontend

Phạm vi: các màn **Dự án**, **Giải ngân**, **Việc cần xử lý**, **Quy trình**, **Nhân sự**, **Thư viện pháp lý**. **Không bao gồm Dashboard.**

Frontend đã làm xong giao diện. Những phần dưới đây hiện chỉ chạy đủ ở bản mock, vì backend chưa có trường hoặc API tương ứng. Thứ tự ưu tiên ở cuối file.

---

## 1. Dự án có nhiều nguồn vốn

**Màn:**
- Thêm dự án → mục *Vốn đầu tư*.
- Chi tiết dự án → tab *Thông tin chung* → mục *Vốn đầu tư* (sửa sau khi đã tạo).

**Frontend đã làm:**
- Mỗi hàng gồm *Nguồn vốn* và *Số vốn đầu tư*. Nút **Thêm nguồn vốn** để thêm hàng, nút xóa ở từng hàng (trừ hàng đầu).
- *Tổng mức đầu tư* tự cộng từ các hàng.
- Ở trang chi tiết, khối này thay cho hai ô sửa nhanh *Nguồn vốn* và *Tổng mức đầu tư* cũ. Thay đổi đi chung luồng "Xác nhận thay đổi thông tin dự án" và gửi qua `PATCH /projects/:id` với `fundingSources`, `fundingSource`, `totalInvestment`.

**Backend hiện tại:** `Project` chỉ có `fundingSource` (một chuỗi) và `totalInvestment`.

**Để tạm chạy được, frontend đang gửi:**
- `fundingSource`: tên các nguồn nối bằng dấu phẩy, ví dụ `"Ngân sách thành phố, Ngân sách tỉnh"`.
- `totalInvestment`: tổng tiền.

Vì vậy **số vốn của từng nguồn đang bị mất**, cả khi tạo mới lẫn khi sửa ở trang chi tiết. Sau khi tải lại trang, dự án có từ 2 nguồn trở lên sẽ hiện mỗi nguồn 0 VNĐ, chỉ tổng mức đầu tư còn đúng.

**Đề xuất:**

Prisma, thêm bảng con:
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

API:
- `POST /projects` và `PATCH /projects/:id`: nhận thêm `fundingSources: [{ source: string, amount: number }]` (không bắt buộc).
  - Nếu có `fundingSources`:
    - Ghi đè toàn bộ danh sách.
    - Tự tính `totalInvestment` bằng tổng `amount`.
    - Tự đặt `fundingSource` bằng tên các nguồn nối bằng `", "`, để các màn cũ vẫn hiển thị được.
  - Nếu không có `fundingSources`: giữ cách cũ.
- `GET /projects` và `GET /projects/:id`: trả thêm `fundingSources`.
- Kiểm tra dữ liệu:
  - `source` không rỗng và không trùng trong cùng một dự án.
  - `amount ≥ 0`.
- Ghi audit log khi thay đổi nguồn vốn.

---

## 2. Giải ngân theo nguồn vốn

**Màn:** Chi tiết dự án → tab *Giải ngân*.

**Frontend đã làm:**
- Các đầu mục chuyển thành tab. Mỗi tab có bảng gồm các cột:
  - Ngày thực hiện
  - Loại thu chi (Cấp giải ngân / Thu hồi vốn)
  - Nội dung giải ngân
  - Người thực hiện
  - Nguồn vốn
  - Số tiền giải ngân
  - Số tiền còn lại
  - File đính kèm
  - Cột *Người thực hiện* lấy từ `createdBy.fullName` mà API đang trả (không cần sửa).
- Form Cấp giải ngân / Thu hồi vốn có thêm ô **Nguồn vốn**, chọn nguồn xong mới nhập số tiền.
- Phía trên các tab có khung **Tổng các đầu mục**: biểu đồ bán nguyệt (100% = tổng mức đầu tư, mỗi cung là phần đã giải ngân của một đầu mục), 3 ô Tổng mức đầu tư / Đã giải ngân / Còn lại, và chip số tiền của từng đầu mục.
- Trong mỗi tab có khung **Đầu mục: …** gồm Đã cấp, Đã thu hồi, Thực giải ngân, Tỷ lệ so với tổng mức đầu tư.
- Hai khung này frontend tự tính từ `summary.byCategory` và danh sách `entries`, **backend không cần thêm API**. Chỉ cần mỗi đợt trả đúng `kind` (cấp / thu hồi), `category` và `amount`.

**Backend hiện tại:**
- `ProjectDisbursement` và `CreateDisbursementDto` không có trường nguồn vốn, nên cột *Nguồn vốn* đang hiện "—".
- Hạn mức chỉ được kiểm tra theo tổng mức đầu tư.

**Đề xuất:**
1. Prisma: `ProjectDisbursement` thêm `fundingSource String? @map("funding_source") @db.VarChar(255)`.
2. `CreateDisbursementDto` thêm `fundingSource?: string`.
   - Bắt buộc nếu dự án có `fundingSources`.
   - Giá trị phải nằm trong danh sách nguồn vốn của dự án.
3. Kiểm tra hạn mức trong `createDisbursement`:
   - **Cấp giải ngân:**
     - Dự án có số vốn theo từng nguồn: `amount ≤ amount của nguồn − tổng giải ngân ròng của nguồn đó`. Báo lỗi: "Số tiền vượt phần vốn còn lại của nguồn {tên}."
     - Ngược lại: giữ kiểm tra theo tổng mức đầu tư như hiện tại.
   - **Thu hồi:** `amount ≤ số giải ngân ròng của (đầu mục + nguồn vốn)`.
4. `GET /projects/:id/disbursements`:
   - Mỗi đợt trả thêm `fundingSource`.
   - `summary` nên trả thêm `bySource: [{ source, budget, disbursed, remaining }]`.
5. `POST /projects/:id/disbursements` hiện trả về `getDisbursements()` (dạng `{ summary, entries }`).
   - Frontend đã xử lý được cả hai dạng trả về.
   - Đề xuất trả về `{ entry, summary }` để lấy đúng đợt vừa tạo, khỏi phải đoán theo `createdAt`.

Cột **Số tiền còn lại** do frontend tự tính. Cách tính: lấy các đợt theo thứ tự `createdAt` tăng dần, rồi trừ dần vào số vốn của nguồn tương ứng; nếu dự án không có số vốn theo nguồn thì trừ vào tổng mức đầu tư. Backend không cần trả trường này, nhưng **cần trả `createdAt` chính xác** cho từng đợt.

---

## 3. Bàn giao công việc giữa cán bộ

**Màn:** Nhân sự → hồ sơ cán bộ → nút **Bàn giao công việc**.

**Frontend đã làm:** hộp thoại gồm:
- Chọn người nhận.
- Tick chọn các bước đang mở, nhóm theo dự án.
- Đính kèm *Hồ sơ bàn giao* (biên bản, quyết định điều động…).

**Backend hiện tại:** chưa có API. Khi đăng nhập backend, màn hình báo "Máy chủ chưa hỗ trợ bàn giao công việc giữa cán bộ."

**Cần 2 API.** Chi tiết xem `docs/de-xuat-api-ban-giao-cong-viec.md`.
- `GET /staff/:userId/open-tasks`: các bước có `assigneeId = userId`, đang bật, và chưa ở trạng thái `COMPLETED` / `SKIPPED` / `DISABLED`. Mỗi bước trả kèm thông tin dự án, phòng ban, `endDatePlanned`, `submissionStatus`.
- `POST /staff/:userId/handover`, body `{ toUserId, stepIds[], fileIds[] }`. Xử lý trong một transaction:
  - Đổi `assigneeId`, `assignedBy`, `assignedAt`.
  - Bước chưa nộp thì xóa `acceptedBy` / `acceptedAt` (về cột "Chờ tiếp nhận" của người nhận). Bước đang chờ duyệt thì giữ nguyên.
  - Giữ nguyên ghi chú và hồ sơ của bước.
  - Ghi lịch sử bước "Bàn giao công việc" và audit log, gắn `fileIds`.
  - Kết quả trả về: `{ moved: number }`.
- Quyền: `staff:manage_users`.

---

## 4. Đổi người thực hiện của một bước trong dự án

**Hiện tượng:** người dùng sửa người thực hiện bước I.3 trong **mẫu quy trình**, nhưng màn *Việc cần xử lý* vẫn hiện người cũ.

**Nguyên nhân:** khi áp quy trình vào dự án, `project-procedure.service.ts` sao chép một lần các bước của mẫu (`assigneeId: s.assigneeId`). Sửa mẫu sau đó không ảnh hưởng tới các dự án đã tạo. Đây là hành vi đúng, nhưng hiện **không có API nào để đổi người thực hiện của bước trong dự án**.

**Đề xuất:** thêm `PATCH /projects/:id/procedure/steps/:stepId`.
- Body: `{ assigneeId?, supervisorId?, startDatePlanned?, endDatePlanned?, plannedDays? }`
- Quyền: `procedure:assign_step` (xem mục 6).
- Khi đổi `assigneeId` thì áp dụng cùng quy tắc như mục 3: xóa trạng thái tiếp nhận nếu bước chưa nộp, ghi lịch sử bước và audit log.
- Không cho sửa bước đã `COMPLETED`.

---

## 5. Thứ tự lượt bước cha – con

Chi tiết xem `docs/bao-loi-tinh-luot-buoc-cha.md`.

Quy tắc frontend đang dùng:
- Bước cha vẫn là một công việc thật.
- Bước cha chỉ tới lượt khi **tất cả bước con đã xong**, nên bước cha luôn là bước cuối của nhóm.
- Bước `SKIPPED` được tính là đã xong.

**Còn lệch ở backend:**
- `GET /my-tasks` đã dùng `computeReachedStepIds` (đúng).
- Nhưng khi **tiếp nhận / thực hiện** một bước, `my-task.service.ts` (khoảng dòng 391) vẫn kiểm tra bằng `calculateStepReached`. Hàm này tính theo thứ tự phẳng, bước cha đứng trước con.

Hậu quả: thẻ trên màn hình hiện "tới lượt", nhưng bấm **Thực hiện** thì bị báo "Bước chưa tới lượt làm theo thứ tự quy trình."

**Đề xuất:** thay `calculateStepReached` bằng `computeReachedStepIds(allSteps).has(stepId)` ở mọi chỗ kiểm tra lượt (tiếp nhận, nộp, làm hộ…), rồi bỏ hàm cũ.

---

## 6. Phân quyền theo giao diện hiện tại

Chi tiết xem `docs/de-xuat-chinh-quyen-backend.md`. File đó liệt kê đầy đủ:
- 25 mã quyền đề xuất.
- Bảng thao tác của từng màn (thao tác → ai được làm → API).
- Các quyền cần xóa hoặc gộp.
- Các API chưa có guard.
- Hướng dẫn migration.

Những điểm liên quan tới các thay đổi trong file này:
- Bàn giao công việc → `staff:manage_users`.
- Đổi người thực hiện bước dự án → `procedure:assign_step`.
- Giải ngân / thu hồi theo nguồn vốn → `project:disburse`.
- Module M9 đổi tên thành **"Thư viện Pháp lý"** (bỏ chữ "AI"). Nên cập nhật tên module trong seed và ma trận quyền.

---

## 7. Ghi chú dữ liệu trả về (đã kiểm tra, chỉ cần giữ nguyên)

- `GET /projects/:id/procedure` đang trả đủ các trường của bước. Frontend hiện dùng thêm:
  - `flowStage`
  - `acceptedBy`, `acceptedAt`
  - `handbackType`, `handbackReason`, `handbackBy`, `handbackAt`
  - `incidentReason`, `incidentReportedBy`, `incidentReportedAt`

  Khi đổi `include`/`select`, cần giữ các trường này. Nếu thiếu `acceptedAt`, thẻ bấm "Thực hiện" sẽ không chuyển sang "Đang xử lý".
- Các trường ngày giờ trả về dạng ISO (`2026-11-12T07:46:04.043Z`) là được, frontend tự đổi sang giờ địa phương.

---

## Thứ tự ưu tiên đề xuất

| # | Hạng mục | Mức | Lý do |
|---|---|---|---|
| 5 | Kiểm tra lượt bằng `computeReachedStepIds` | **Cao** | Đang chặn thao tác "Thực hiện" hợp lệ |
| 4 | PATCH đổi người thực hiện bước dự án | **Cao** | Chưa có cách nào sửa người phụ trách sau khi tạo dự án |
| 2 | Nguồn vốn cho đợt giải ngân | Trung bình | Cột "Nguồn vốn" đang trống, hạn mức chưa đúng theo nguồn |
| 1 | Nhiều nguồn vốn cho dự án | Trung bình | Đang mất số vốn của từng nguồn khi tạo và khi sửa ở trang chi tiết; mục 2 cần mục này |
| 3 | Bàn giao công việc | Trung bình | Màn đã có nhưng chưa dùng được với backend |
| 6 | Phân quyền | Theo kế hoạch | Làm cùng đợt chỉnh quyền |
