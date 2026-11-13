# Báo lỗi: màn "Việc cần xử lý" không hiện việc khi đăng nhập tài khoản thật

- Ngày: 11/11/2026
- Màn hình: Việc cần xử lý (`/my-tasks`)
- API liên quan: `GET /my-tasks` (tài liệu: `docs/api-viec-can-xu-ly.md`, mục 1.1)
- Kết luận: **lỗi gốc ở backend** (API trả thiếu trường so với tài liệu); frontend xử lý chưa chặt nên lỗi lộ ra thành bảng trống.

---

## 1. Hiện tượng

Đăng nhập tài khoản thật **Huỳnh Thái Hải** (Giám đốc). Màn "Việc cần xử lý" hiện **0 việc · 0 dự án**, mọi cột đều trống ("Không có việc mới được giao", "Chưa có việc nào").

## 2. Dữ liệu trên máy chủ vẫn có

Kiểm tra trực tiếp cơ sở dữ liệu (chỉ đọc):

| Nội dung | Số lượng |
|---|---|
| Dự án (`projects`) | 17 |
| Quy trình áp dụng cho dự án (`project_procedures`) | 8 |
| Bước quy trình (`project_procedure_steps`) | 107 |
| Bước đã giao người thực hiện | 99 |
| Tài khoản Huỳnh Thái Hải (`users.id = 1`) | vai trò `DIRECTOR` |
| Bước giao cho Huỳnh Thái Hải | 25 |
| Dự án Huỳnh Thái Hải là chủ dự án | 5 |

→ Máy chủ có việc để trả về; màn hình trống không phải do thiếu dữ liệu.

## 3. Quy tắc hiển thị (yêu cầu nghiệp vụ)

Xét **theo phạm vi từng dự án / quyền**, không xét theo vai trò:

| Người xem | Thấy gì trên màn |
|---|---|
| Thành viên (người được giao bước) | Chỉ việc của mình |
| Chủ dự án (người phụ trách dự án) | Toàn bộ quy trình của **dự án mình phụ trách** (việc của người khác hiện mờ, chỉ xem) |
| Người có quyền phê duyệt | Việc **chờ duyệt** / sự cố trong phạm vi mình được duyệt |

Frontend đã làm đúng quy tắc này (xem mục 5). Tài liệu API mục 1.1 cũng ghi đúng.

## 4. Nguyên nhân

### 4.1. Backend — lỗi gốc

**a) `GET /my-tasks` trả bước thiếu trường `isEnabled`**

- Tài liệu API mục 1.1 ghi: `steps` trả về *"cùng dạng steps ở API Dự án 3.4"* — dạng này có `isEnabled` (bước có áp dụng hay không).
- Hàm định dạng bước của `/my-tasks` không trả trường này:
  - `0.3.BQL-HaTien-Backend/src/modules/my-task/utils/my-task.helper.ts` → `formatProjectStep` (dòng ~142): có `status`, `submissionStatus`, `assignee`, `reached`… nhưng **không có `isEnabled`**.
- Trong khi API Dự án 3.4 (`GET /projects/:id/procedure`) **có** trả:
  - `src/modules/project/project-procedure.service.ts` dòng ~324: `isEnabled: s.isEnabled`.

**b) Trả mọi bước cho Giám đốc / Phó Giám đốc theo vai trò (trái quy tắc)**

- `src/modules/my-task/my-task.service.ts`, hàm `getMyTasks`, điều kiện `shouldReturnStep` (dòng ~239):

```ts
const shouldReturnStep =
  isAssignee ||
  caller.isDirector ||          // ← không có trong tài liệu, xét theo vai trò
  isProjectManager ||
  (canApprove && (...));
```

- `caller.isDirector` = có vai trò `DIRECTOR` hoặc `DEPUTY_DIRECTOR` → trả **mọi bước của mọi dự án**, kể cả dự án không phụ trách. Trái với quy tắc ở mục 3 và bảng điều kiện trong tài liệu API mục 1.1.
- Không làm màn bị trống, nhưng gửi xuống trình duyệt dữ liệu người dùng không được xem.

### 4.2. Frontend — làm lỗi nặng thêm

**a) Thiếu `isEnabled` bị hiểu là "không áp dụng"**

- `src/shared/projects_works/services/project.mapper.ts` → `toProjectStep`: trước đây gán thẳng `isEnabled: step.isEnabled` → thành `undefined`.
- `src/shared/my-tasks/utils/my-tasks.ts` dòng 99 chỉ giữ bước có `step.isEnabled` đúng → **toàn bộ 25 bước bị loại** trước khi chia cột → bảng trống.

**b) Lỗi API bị "nuốt"**

- `src/shared/my-tasks/hooks/useMyTaskQueries.ts` dòng 47: `return data ?? EMPTY_DATA;` — API lỗi thì cũng chỉ hiện bảng trống, không báo gì, nên khó phát hiện nguyên nhân.

## 5. Phân quyền ở frontend (đã đúng quy tắc)

`src/shared/my-tasks/utils/my-task-data.ts`, `src/shared/my-tasks/utils/my-tasks.ts`:

- Cột việc của mình: chỉ bước giao cho người đăng nhập (`isMine`).
- Cột Chờ duyệt: chỉ bước đang chờ duyệt mà người đó có quyền duyệt (`canReview`).
- Việc người khác (thẻ mờ, chỉ xem): chỉ ở dự án người đó là chủ dự án (`owned`).

→ Dù backend trả dư cho Giám đốc (mục 4.1.b), màn hình vẫn chỉ hiện đúng phạm vi. Tuy vậy backend vẫn cần sửa để không gửi dữ liệu thừa.

## 6. Đã xử lý (frontend)

- `project.mapper.ts` → `toProjectStep`:

```ts
isEnabled: step.isEnabled ?? step.status !== "DISABLED",
```

  Thiếu `isEnabled` thì suy ra từ trạng thái: chỉ bước `DISABLED` là không áp dụng. Kiểu `ApiProjectStep.isEnabled` đổi thành không bắt buộc.
- Trạng thái: đã kiểm tra kiểu (`tsc`) không lỗi; **chưa kiểm tra lại trên màn hình với tài khoản thật**.

## 7. Cần backend sửa

| # | Việc | Vị trí |
|---|---|---|
| 1 | Trả thêm `isEnabled` cho mỗi bước trong `GET /my-tasks` (đúng dạng API Dự án 3.4) | `src/modules/my-task/utils/my-task.helper.ts` → `formatProjectStep` |
| 2 | Bỏ điều kiện `caller.isDirector` trong `shouldReturnStep`; chỉ giữ: người được giao bước, chủ dự án, người có quyền duyệt (bước chờ duyệt / sự cố / đã duyệt / đã từ chối trong phạm vi) | `src/modules/my-task/my-task.service.ts` → `getMyTasks` |

Gợi ý sửa #1:

```ts
// formatProjectStep
isEnabled: step.isEnabled !== false,
```

## 8. Việc frontend nên làm thêm (đề xuất)

- Hiện thông báo khi `GET /my-tasks` lỗi thay vì bảng trống (`useMyTaskQueries.ts`).

## 9. Cách kiểm tra lại

1. Đăng nhập tài khoản Huỳnh Thái Hải → mở "Việc cần xử lý".
2. Kỳ vọng: thấy 25 việc được giao (theo cột trạng thái) + việc chờ duyệt trong phạm vi + toàn bộ bước của 5 dự án mình phụ trách (thẻ mờ).
3. Nếu vẫn trống: DevTools (F12) → Network → yêu cầu `my-tasks` → xem mã trạng thái và nội dung trả về.
