# Báo lỗi: Tính "tới lượt" sai khi quy trình có bước cha – bước con

**Phân hệ:** Việc cần xử lý (`/my-tasks`)
**Phía cần sửa:** Backend (`0.3.BQL-HaTien-Backend`)
**Ngày báo:** 12/11/2026
**Mức độ:** Cao — các bước con bị khóa vĩnh viễn, không ai nhận việc được

---

## 1. Hiện tượng

Dự án **H1**, quy trình **F1**:

| Bước | Loại | Trạng thái hiển thị |
|---|---|---|
| I | Bước cha | Tới lượt |
| I.1 h2.1 | Bước con | **Chưa tới lượt** (khóa) |
| I.2 h2.2 | Bước con | **Chưa tới lượt** (khóa) |

- Người được giao I.1 và I.2 thấy thẻ bị khóa và không bấm "Thực hiện" được.
- Gọi trực tiếp API tiếp nhận việc cũng bị từ chối, vì cờ `reached = false`.

## 2. Quy tắc nghiệp vụ đúng

1. **Bước cha là một bước việc thật.** Nó có người thực hiện, có hạn và phải được làm.
2. **Bước cha là bước cuối của nhóm.** Các bước con được làm trước. Bước cha chỉ tới lượt khi mọi bước con đang áp dụng đã hoàn thành (`COMPLETED` hoặc `SKIPPED`).
3. Bước cha **không có bước con** thì tính như bước thường.
4. Bước đứng sau bước cha, ở cùng cấp, chỉ tới lượt khi **chính bước cha** đã hoàn thành.
5. Các bước cùng cấp và cùng `flowStage` được làm **song song**. Lượt sau chỉ tới khi mọi bước của lượt trước đã xong.
6. Bước con đầu tiên tới lượt khi bước cha "tới vị trí" trong luồng, tức là các bước đứng trước bước cha đã xong.

Ví dụ với quy trình `I(I.1, I.2) → II`:

```
I.1, I.2 (làm trước)  →  I (khi I.1, I.2 xong)  →  II (khi I xong)
```

## 3. Nguyên nhân

### 3.1. `calculateStepReached` không phân biệt cha – con

File: `src/modules/my-task/utils/my-task.helper.ts`

```ts
const activeSteps = allStepsInProc
  .filter((s) => s.isEnabled && s.status !== "DISABLED")
  .sort((a, b) => a.order - b.order);

if (activeSteps.length === 0 || activeSteps[0].id === step.id) return true;
...
const prevSteps = activeSteps.filter((s) => s.order < step.order);
return prevSteps.every((s) => s.status === "COMPLETED");
```

- Hàm coi tất cả các bước là **một danh sách phẳng** và sắp theo `order`.
- Bước cha `I` có `order` nhỏ hơn `I.1`, nên nó thành "bước đầu tiên" và được `reached = true`.
- `I.1` và `I.2` đòi `I` phải `COMPLETED` trước. Như vậy là **ngược** với quy tắc ở mục 2.
- Kết quả là bước con bị khóa cho tới khi bước cha xong, trong khi bước cha lại chỉ nên làm sau bước con.

### 3.2. Không truyền `flowStage`

File: `src/modules/my-task/my-task.service.ts` (khoảng dòng 194–211)

```ts
const allStepsInProc: StepHierarchyItem[] = proc.steps.map((s) => ({
  id: s.id, order: s.order, code: s.code, isEnabled: s.isEnabled,
  status: s.status, assigneeId: s.assigneeId, supervisorId: s.supervisorId,
  // thiếu flowStage
}));
```

- Lời gọi `calculateStepReached(...)` ngay bên dưới cũng thiếu `flowStage`.
- Vì vậy nhánh xử lý bước song song trong helper không bao giờ chạy, và các bước song song bị tính như làm tuần tự.

### 3.3. `SKIPPED` không được coi là đã xong

Điều kiện chỉ kiểm tra `s.status === "COMPLETED"`. Một bước bị bỏ qua (`SKIPPED`) vẫn chặn các bước sau nó.

## 4. Đề xuất sửa

Viết lại `calculateStepReached` để tính **theo cây** thay vì theo danh sách phẳng. Đoạn dưới là mã giả, cùng logic mà frontend đang dùng trong `src/shared/my-tasks/utils/my-tasks.ts` → `reachedStepIds`:

```ts
const isDone = (s) => s.status === "COMPLETED" || s.status === "SKIPPED";

const childrenOf = (parentCode: string | null) =>
  active.filter((s) => parentCodeOf(s.code) === parentCode); // "I.1" -> "I", "I" -> null

const columnsOf = (siblings) => /* nhóm theo flowStage, sắp theo flowStage rồi order */;

function reachedIds(active): Set<string> {
  const reached = new Set<string>();
  const walk = (parentCode: string | null) => {
    for (const column of columnsOf(childrenOf(parentCode))) {
      for (const step of column) {
        const children = childrenOf(step.code);
        if (children.length > 0) walk(step.code);          // bước con được xét trước
        if (children.every(isDone)) reached.add(step.id);  // bước cha tới lượt khi mọi con đã xong
      }
      if (!column.every(isDone)) break;                    // lượt sau chờ lượt này (kể cả chính bước cha)
    }
  };
  walk(null);
  return reached;
}
```

Các việc cần làm:

1. Thay `calculateStepReached` bằng hàm tính tập `reached` cho cả quy trình như trên. Nên tính **một lần cho mỗi quy trình** rồi tra theo `step.id`, thay vì gọi lại cho từng bước.
2. Truyền thêm `flowStage` khi dựng `allStepsInProc` trong `my-task.service.ts`, cả ở chỗ lấy danh sách (khoảng dòng 194) và chỗ kiểm tra khi tiếp nhận (khoảng dòng 328–334).
3. Coi `SKIPPED` là đã xong.
4. Nên rà lại `getStepApproverCandidateIds`, vì hàm này cũng tìm "bước kế tiếp" theo `order` phẳng:
   - Người duyệt của bước con cuối cùng đúng ra là người thực hiện **bước cha**.
   - Người duyệt của bước cha là người thực hiện bước cùng cấp kế tiếp.

## 5. Kiểm thử sau khi sửa

| Tình huống | Kỳ vọng |
|---|---|
| Quy trình mới, `I(I.1, I.2) → II` | I.1 tới lượt; I, I.2, II chưa tới lượt |
| I.1 và I.2 cùng `flowStage` | I.1 và I.2 cùng tới lượt |
| I.1, I.2 đã `COMPLETED` | I tới lượt; II chưa |
| I đã `COMPLETED` | II tới lượt |
| I.1 `SKIPPED`, I.2 `COMPLETED` | I tới lượt |
| Bước cha không có bước con | Tính như bước thường |
| `POST` tiếp nhận I.1 khi quy trình vừa bắt đầu | Thành công |
| `POST` tiếp nhận I khi I.1 chưa xong | Bị từ chối |

## 6. Phía frontend (đã sửa)

- Trước đây frontend ẩn bước cha cấp 1 (`isHeadingStep`): không có thẻ ở "Việc cần xử lý", không mở được trên sơ đồ, không tính vào tiến độ.
- Đã sửa để bước cha là bước việc bình thường, và tính lượt theo quy tắc ở mục 2. Bước cha đang chờ hiện **"Chờ bước con xong"**.
- Màn "Việc cần xử lý" lấy cờ `reached` từ API. Vì vậy trước khi backend sửa, màn này vẫn hiện bước cha tới lượt và bước con bị khóa.
- Sau khi backend sửa, frontend không cần thay đổi thêm.
