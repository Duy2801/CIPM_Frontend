# Đề xuất API: Bàn giao công việc giữa cán bộ

Màn **Nhân sự → hồ sơ cán bộ** có nút **Bàn giao công việc**. Nút này chuyển các bước quy trình đang mở của một cán bộ sang cán bộ khác (khi nghỉ phép, chuyển công tác hoặc nghỉ việc). Hiện backend chưa có API nên frontend chỉ chạy được ở bản mock. Khi đăng nhập backend, màn hình báo "Máy chủ chưa hỗ trợ bàn giao công việc giữa cán bộ."

## 1. Lấy danh sách việc đang mở của một cán bộ

`GET /staff/:userId/open-tasks`. Quyền: `staff:manage_users`.

Bước "đang mở" là bước thỏa cả hai điều kiện:
- `assigneeId = :userId`
- `isEnabled = true`, và trạng thái không thuộc `COMPLETED`, `SKIPPED`, `DISABLED`

```json
[
  {
    "projectId": "...",
    "projectName": "...",
    "stepId": "...",
    "stepCode": "I.3",
    "stepName": "...",
    "department": "Phòng Kỹ thuật",
    "endDatePlanned": "2026-12-01",
    "submissionStatus": "SUBMITTED"
  }
]
```

## 2. Bàn giao

`POST /staff/:userId/handover`. Quyền: `staff:manage_users`.

```json
{ "toUserId": "...", "stepIds": ["..."], "fileIds": ["..."] }
```

Xử lý trong **một transaction**. Với mỗi `stepId`:
1. Kiểm tra bước vẫn thuộc `:userId` và vẫn đang mở. Nếu không, bỏ qua bước đó (hoặc trả 409).
2. Cập nhật các trường:
   - `assigneeId = toUserId`
   - `assignedBy = người thao tác`
   - `assignedAt = now()`
3. Nếu bước **chưa nộp** (`submissionStatus != SUBMITTED`): xóa `acceptedBy` và `acceptedAt`. Bước sẽ về cột "Chờ tiếp nhận" của người nhận.
4. Nếu bước **đang chờ duyệt**: giữ nguyên trạng thái duyệt.
5. Giữ nguyên ghi chú, hồ sơ đính kèm và lịch sử cũ.
6. Ghi lịch sử bước với `actionLabel` là "Bàn giao công việc" và nội dung "Bàn giao bước [mã] tên từ A sang B", kèm tên các tệp hồ sơ bàn giao nếu có.
7. Ghi audit log của cán bộ nguồn.

Kết quả trả về: `{ "moved": 3 }`

`fileIds` là các tệp đã tải lên qua API upload hiện có (biên bản bàn giao, quyết định điều động...), không bắt buộc. Lưu tệp vào bản ghi bàn giao để xem lại được trong lịch sử của từng bước và trong nhật ký của cán bộ.

Kiểm tra đầu vào:
- `toUserId` phải là tài khoản đang hoạt động.
- `toUserId` phải khác `:userId`.
- `stepIds` không được rỗng.

## 3. Phía frontend sẽ nối

Trong `src/shared/personnel-assignment/services/handover.api.ts`, nhánh backend của `getOpenTasksOf` và `handoverOpenTasks` hiện đang báo chưa hỗ trợ. Khi có API, thay hai nhánh này bằng lời gọi thật. Giao diện giữ nguyên.
