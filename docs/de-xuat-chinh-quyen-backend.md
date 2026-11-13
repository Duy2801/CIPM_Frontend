# Đề xuất chỉnh lại bộ quyền cho khớp giao diện hiện tại

**Gửi:** Backend (`0.3.BQL-HaTien-Backend`)
**Từ:** Frontend (`cipm-system`)
**Ngày:** 12/11/2026

---

## 1. Vì sao cần chỉnh

Bộ 35 quyền đang seed (`prisma/seed.ts`) được thiết kế theo bản giao diện cũ, có 9 phân hệ. Giao diện hiện tại đã khác nhiều:

- **Menu chỉ còn 7 mục:** Bảng điều khiển, Việc cần xử lý, Dự án & Công trình, Quy trình dự án, Nhân sự & Phân công, Báo cáo, Thư viện Pháp lý.
- **4 phân hệ đã bỏ khỏi giao diện**, nhưng vẫn chiếm 14/35 quyền: Tài chính (M4), GPMB (M6), Đấu thầu (M7), Bảo hành (M8).
- **Có quyền không gắn với nút hay API nào.** Ví dụ: xuất báo cáo tổng hợp, cập nhật tiến độ (Quy tắc 4), giao việc theo giai đoạn, nghiệm thu & đôn đốc.
- **Có chức năng mới chưa có quyền trong bảng `permissions`:** Báo cáo, Làm hộ, Giải ngân trong dự án, Duyệt quy trình mẫu, Danh mục.
- **Có API đang dùng mã quyền không tồn tại trong bảng:** `report:*`, `construction_procedures:*`, `procedure:act_on_behalf`. Các quyền này không cấp được qua ma trận.
- **Nhiều API chưa kiểm tra quyền**, chỉ cần đăng nhập là gọi được: ma trận chức danh, tài khoản, phòng ban, danh mục, nhật ký.

Tài liệu gồm:
- **Mục 2:** bộ quyền đề xuất, bản tóm tắt.
- **Mục 3:** **từng thao tác** trên từng màn hình, kèm điều kiện được làm và API tương ứng.
- **Mục 4 trở đi:** quyền bỏ, dọn alias, chuyển dữ liệu.

---

## 2. Bộ quyền đề xuất (25 quyền)

Ký hiệu cột "Trạng thái":
- **Giữ:** giữ nguyên mã đang có.
- **Đổi mã:** đổi mã quyền.
- **MỚI:** thêm vào bảng `permissions`.

| # | Nhóm (thứ tự theo menu) | Mã quyền | Tên hiển thị | Trạng thái |
|---|---|---|---|---|
| 1 | Bảng điều khiển | `dashboard:view_kpi` | Xem bảng điều khiển & KPI | Giữ |
| 2 | Việc cần xử lý | `my_task:view_all` | Xem việc của mọi dự án | **MỚI** |
| 3 | Việc cần xử lý | `my_task:act_on_behalf` | Làm hộ việc của cán bộ khác | **MỚI** |
| 4 | Việc cần xử lý | `procedure:approve_step` | Duyệt / trả lại kết quả bước & xử lý sự cố | Giữ (đổi tên hiển thị) |
| 5 | Dự án & Công trình | `project:view` | Xem danh mục & chi tiết dự án | Giữ |
| 6 | Dự án & Công trình | `project:create_update` | Thêm mới & cập nhật dự án | Giữ |
| 7 | Dự án & Công trình | `project:archive_rule5` | Đóng / mở lại dự án | Giữ |
| 8 | Dự án & Công trình | `project:disburse` | Ghi nhận giải ngân dự án | **MỚI** (thay `finance:request_disbursement`) |
| 9 | Quy trình dự án | `procedure:view` | Xem quy trình | **Đổi mã** từ `procedure:view_46b` |
| 10 | Quy trình dự án | `procedure:config_template` | Tạo & cấu hình quy trình mẫu | Giữ |
| 11 | Quy trình dự án | `procedure:approve_template` | Duyệt quy trình mẫu | **MỚI** |
| 12 | Quy trình dự án | `procedure:assign_step` | Phân công & lập kế hoạch bước trong dự án | **Đổi mã** từ `procedure:update_step` |
| 13 | Nhân sự & Phân công | `staff:view_organization` | Xem cơ cấu tổ chức & nhân sự | Giữ |
| 14 | Nhân sự & Phân công | `staff:manage_users` | Quản lý tài khoản cán bộ | Giữ |
| 15 | Nhân sự & Phân công | `staff:manage_organization` | Quản lý phòng ban | **Đổi mã** từ `staff:assign_project_leader` |
| 16 | Nhân sự & Phân công | `staff:manage_cnda_permission` | Gán chức danh & quyền cá nhân | Giữ (đổi tên hiển thị) |
| 17 | Báo cáo | `report:view` | Xem báo cáo | **MỚI** (API đã dùng) |
| 18 | Báo cáo | `report:import` | Nhập báo cáo Excel | **MỚI** (API đã dùng) |
| 19 | Báo cáo | `report:export` | Xuất báo cáo Excel | **MỚI** |
| 20 | Báo cáo | `report:configure` | Quản lý loại báo cáo | **MỚI** (API đã dùng) |
| 21 | Thư viện Pháp lý | `legal_library:view` | Tra cứu thư viện pháp lý | Giữ (bỏ chữ "& AI" ở tên) |
| 22 | Thư viện Pháp lý | `legal_library:input` | Đăng tải & quản lý văn bản pháp lý | Giữ |
| 23 | Danh mục dùng chung | `catalog:manage` | Thêm / sửa / xóa mục danh mục | **MỚI** |
| 24 | Hệ thống | `system:configure_permissions` | Cấu hình chức danh & ma trận phân quyền | Giữ |
| 25 | Hệ thống | `system:view_audit_logs` | Xem nhật ký toàn hệ thống & nhật ký cán bộ | Giữ |

> **Nguyên tắc chung**
> - **Quyền vào màn hình:** quyền "Xem" của nhóm. Không có quyền thì ẩn menu và chặn route.
> - **Quyền theo dữ liệu**, ví dụ "việc được giao cho mình", "dự án mình phụ trách": backend tự kiểm tra theo dữ liệu, **không cần quyền**. Quyền trong ma trận chỉ dùng để **mở rộng** thêm.
> - **Lịch sử thay đổi trong từng phân hệ** (tab "Lịch sử thay đổi" của quy trình, dự án, báo cáo, văn bản): ai có quyền "Xem" của phân hệ đó thì xem được. `system:view_audit_logs` chỉ dùng cho nhật ký toàn hệ thống và nhật ký hoạt động của từng cán bộ.

---

## 3. Chi tiết thao tác từng màn hình

Cách đọc cột "Ai được làm":
- `quyền`: cần mã quyền đó.
- **[dữ liệu]**: điều kiện theo dữ liệu, backend tự kiểm tra.
- Dấu "**hoặc**" nghĩa là chỉ cần thỏa một điều kiện.

### 3.1. Bảng điều khiển (`/dashboard`)

| Thao tác | Ai được làm | API |
|---|---|---|
| Vào màn hình, xem KPI, biểu đồ dự án | `dashboard:view_kpi` | `GET /projects` (đang dùng `project:view`) |
| Bấm vào dự án trên bảng điều khiển để xem nhanh | `project:view` | `GET /projects/:id` |

> **Lưu ý:** bảng điều khiển đang lấy số liệu từ `GET /projects`. Người có `dashboard:view_kpi` nhưng không có `project:view` sẽ thấy trống. Đề nghị:
> - **Cách 1 (nên làm):** thêm `GET /dashboard/summary`, kiểm tra bằng `dashboard:view_kpi`.
> - **Cách 2:** cho `GET /projects` chấp nhận thêm `dashboard:view_kpi`.

### 3.2. Việc cần xử lý (`/my-tasks`)

**Vào màn hình:** mọi cán bộ đã đăng nhập (không cần quyền).

**Ai thấy việc nào:**

| Đối tượng | Thấy những việc | Điều kiện |
|---|---|---|
| Người được giao bước | Việc của chính mình ở mọi trạng thái | **[dữ liệu]** `step.assigneeId = tôi` |
| Người phụ trách dự án | Mọi bước của dự án mình phụ trách | **[dữ liệu]** `project.managerId = tôi` |
| Người duyệt theo chuỗi | Bước đang chờ duyệt mà mình là người duyệt | **[dữ liệu]** `canUserApproveStep` (giám sát chỉ định, hoặc người làm bước kế tiếp / bước cha) |
| Người có quyền duyệt | Mọi bước đang chờ duyệt, đang có sự cố | `procedure:approve_step` |
| Người giám sát chung | Mọi việc của mọi dự án | `my_task:view_all` |
| Người làm hộ | Việc của người khác, để làm hộ | `my_task:act_on_behalf` (đi kèm phạm vi xem như `my_task:view_all`) |

> **Bỏ** đoạn `caller.isDirector` trả toàn bộ việc theo chức danh trong `my-task.service.ts`. Thay bằng `my_task:view_all`.

**Thao tác trên một bước:**

| Thao tác (nút trên giao diện) | Khi nào hiện | Ai được làm | API |
|---|---|---|---|
| **Thực hiện** (tiếp nhận việc) | Bước đã tới lượt (`reached`), chưa tiếp nhận | **[dữ liệu]** người được giao **hoặc** `my_task:act_on_behalf` | `POST …/steps/:stepId/accept` |
| **Từ chối nhận việc** (kèm lý do) | Đang làm / bị trả lại, không có sự cố | **[dữ liệu]** chỉ người được giao | `POST …/decline` |
| Ghi chú kết quả | Đã tiếp nhận, đang làm | **[dữ liệu]** người được giao **hoặc** `my_task:act_on_behalf` | `PATCH …/note` |
| Tải lên hồ sơ / biên bản | Đã tiếp nhận, đang làm | **[dữ liệu]** người được giao **hoặc** `my_task:act_on_behalf` | `POST …/documents` |
| Xóa hồ sơ đã tải | Như trên, trước khi nộp | **[dữ liệu]** người được giao **hoặc** `my_task:act_on_behalf` | `DELETE …/documents/:documentId` |
| **Nộp kết quả** / **Nộp lại kết quả** | Đã tiếp nhận, có hồ sơ, không có sự cố | **[dữ liệu]** người được giao **hoặc** `my_task:act_on_behalf` | `POST …/submit` |
| **Hoàn trả việc** (rút lại sau khi nộp, lý do không bắt buộc) | Đang chờ duyệt | **[dữ liệu]** chỉ người được giao | `POST …/give-back` |
| **Báo sự cố** (kèm lý do) | Bước chưa xong, chưa có sự cố | **[dữ liệu]** người được giao **hoặc** người duyệt theo chuỗi; **hoặc** `my_task:act_on_behalf` **hoặc** `procedure:approve_step` | `POST …/incident` |
| **Xử lý xong sự cố** | Đang có sự cố | **[dữ liệu]** người duyệt theo chuỗi **hoặc** `procedure:approve_step` | `POST …/incident/resolve` |
| **Duyệt hoàn thành** | Đang chờ duyệt | **[dữ liệu]** người duyệt theo chuỗi **hoặc** `procedure:approve_step`. **Không** được tự duyệt bước của chính mình | `POST …/approve` |
| **Trả lại** (kèm lý do, để làm lại) | Đang chờ duyệt | Giống "Duyệt hoàn thành" | `POST …/return` |
| Xem chi tiết, lịch sử bước | Luôn có | Ai thấy được việc đó | `GET …/history` |

> `…` = `/projects/:id/procedure/steps/:stepId`
>
> Mọi thao tác làm hộ ghi nhật ký kèm **"(làm hộ <tên người được giao>)"**.
>
> Hiện API `approve`, `return`, `incident/resolve` đang cho DIRECTOR / DEPUTY_DIRECTOR / tổ trưởng theo chức danh. Đề nghị chuyển sang `procedure:approve_step` để bật/tắt được qua ma trận.

### 3.3. Dự án & Công trình (`/projects_works`)

**Danh sách dự án**

| Thao tác | Ai được làm | API |
|---|---|---|
| Vào màn hình, tìm kiếm, lọc, sắp xếp, phân trang | `project:view` | `GET /projects` |
| Xem chi tiết dự án | `project:view` | `GET /projects/:id` |
| **+ Thêm mới dự án** (trang tạo; kèm tải tài liệu, chọn quy trình) | `project:create_update` | `GET /projects/next-code`, `POST /projects/files`, `POST /projects` |
| Công tắc **Đóng / Mở lại** dự án | `project:archive_rule5` | `PATCH /projects/:id/status` |

**Chi tiết dự án, tab Thông tin**

| Thao tác | Ai được làm | API |
|---|---|---|
| Xem thông tin | `project:view` | `GET /projects/:id` |
| Sửa thông tin (tên, loại, vốn, ngày, người phụ trách, giám sát…) | `project:create_update` | `PATCH /projects/:id` |
| Thêm **loại dự án** mới ngay trong ô chọn | `catalog:manage` | `POST /catalogs` |

**Chi tiết dự án, tab Tài liệu**

| Thao tác | Ai được làm | API |
|---|---|---|
| Xem, xem trước, tải về | `project:view` | `GET /projects/:id/files/:fileId` |
| Tải lên tài liệu dự án | `project:create_update` | `POST /projects/files`, rồi `PATCH /projects/:id` |

**Chi tiết dự án, tab Quy trình (mỗi đầu mục quy trình là một tab)**

| Thao tác | Ai được làm | API |
|---|---|---|
| Xem sơ đồ bước, tiến độ %, bước đang làm, người thực hiện, hạn | `procedure:view` | `GET /projects/:id/procedure` |
| Chọn / bỏ chọn **loại quy trình & quy trình** áp dụng cho dự án | `project:create_update` | `PUT /projects/:id/procedures` |
| Phân công **người thực hiện / người giám sát** cho bước | `procedure:assign_step` **hoặc** **[dữ liệu]** người phụ trách dự án | `PUT /projects/:id/procedures` (phần `steps`) |
| Đặt **ngày bắt đầu / kết thúc kế hoạch**, số ngày của bước | `procedure:assign_step` **hoặc** người phụ trách dự án | như trên |
| **Bật / tắt** (áp dụng / không áp dụng) một bước trong dự án | `procedure:assign_step` **hoặc** người phụ trách dự án | như trên |
| Thêm bước / bước con riêng cho dự án | `procedure:assign_step` **hoặc** người phụ trách dự án | như trên |
| Mở một bước để xem chi tiết, hồ sơ, lịch sử | `procedure:view` | `GET …/steps/:stepId/history` |

> Nên tách phần gán người / hạn / bật tắt bước ra API riêng, ví dụ `PATCH /projects/:id/procedure/steps/:stepId`, kiểm tra bằng `procedure:assign_step`. Không nên gộp chung với `PUT /projects/:id/procedures` (vốn kiểm tra bằng `project:create_update`).

**Chi tiết dự án, tab Tình hình giải ngân**

| Thao tác | Ai được làm | API |
|---|---|---|
| Xem số tiền theo đầu mục, số đợt, lịch sử từng đầu mục | `project:view` | `GET /projects/:id/disbursements` |
| Xem chi tiết một đợt giải ngân, xem chứng từ | `project:view` | `GET /projects/:id/files/:fileId` |
| **+ Thêm dòng giải ngân** (đầu mục, số tiền, nội dung, chứng từ bắt buộc) | `project:disburse` | `POST /projects/files`, `POST /projects/:id/disbursements` |
| Ghi nhận **thu hồi** (số âm) | `project:disburse` | `POST /projects/:id/disbursements` (`kind = withdraw`) |

**Chi tiết dự án, tab Lịch sử thay đổi**

| Thao tác | Ai được làm | API |
|---|---|---|
| Xem lịch sử thay đổi của dự án | `project:view` | `GET /audit-logs?targetType=project&targetId=…` |

### 3.4. Quy trình dự án (`/construction-procedures`)

| Thao tác | Ai được làm | API |
|---|---|---|
| Vào màn hình, tìm kiếm, lọc trạng thái, sắp xếp ngày tạo / ngày cập nhật | `procedure:view` | `GET /procedures` |
| Xem chi tiết quy trình, sơ đồ bước | `procedure:view` | `GET /procedures/:id` |
| Xem loại quy trình (danh mục) | `procedure:view` | `GET /procedures/categories` |
| **Thêm quy trình mới** | `procedure:config_template` | `POST /procedures` |
| Thêm **loại quy trình** mới | `procedure:config_template` | `POST /procedures/categories` |
| Sửa tên, thêm / sửa / xóa / sắp xếp bước, bước con, số ngày | `procedure:config_template` | `PUT /procedures/:id/steps` |
| Kéo bước sang lượt khác (song song / tuần tự) | `procedure:config_template` | `PATCH /procedures/:id/steps/:stepId/stage` |
| Công tắc **Bật / Tắt** quy trình | `procedure:config_template` | `PATCH /procedures/:id` |
| **Gửi duyệt** quy trình | `procedure:config_template` | `POST /procedures/:id/submit` |
| **Duyệt** quy trình (Chờ duyệt → Đang áp dụng) | `procedure:approve_template`. **Không** được tự duyệt quy trình mình gửi | `POST /procedures/:id/approve` |
| **Từ chối duyệt** quy trình (kèm lý do) | `procedure:approve_template` | *chưa có API*. Đề nghị thêm `POST /procedures/:id/reject` |
| Xem tab **Lịch sử thay đổi** | `procedure:view` | `GET /audit-logs?targetType=procedure&targetId=…` |

### 3.5. Nhân sự & Phân công (`/personnel-assignment`)

**Tab Nhân sự**

| Thao tác | Ai được làm | API |
|---|---|---|
| Vào màn hình, xem danh sách cán bộ, tìm kiếm, lọc phòng ban / chức danh | `staff:view_organization` | `GET /user`, `GET /departments` |
| Xem hồ sơ một cán bộ | `staff:view_organization` | `GET /user/:id` |
| **Thêm cán bộ** (tạo tài khoản, gửi mật khẩu tạm) | `staff:manage_users` | `POST /auth/register` |
| Sửa hồ sơ (họ tên, email, điện thoại, phòng ban) | `staff:manage_users` | `PUT /user/:id` |
| **Khóa / Mở khóa** tài khoản | `staff:manage_users` | `POST /user/:id/lock`, `POST /user/:id/unlock` |
| Đổi **chức danh** của cán bộ | `staff:manage_cnda_permission` | `PUT /user/:id/roles`, `PATCH /user/:id/roles` |
| Xem quyền hiệu lực của cán bộ | `staff:manage_cnda_permission` | `GET /user/:id/permissions` |
| **Cấp / thu hồi quyền riêng** của cán bộ | `staff:manage_cnda_permission` | `PUT /user/:id/permissions` |
| **Đặt lại quyền theo chức danh** | `staff:manage_cnda_permission` | `POST /staff/:id/permissions/reset` |
| Xem **nhật ký hoạt động** của cán bộ | `system:view_audit_logs` | `GET /user/:id/activity` |

**Tab Cơ cấu tổ chức**

| Thao tác | Ai được làm | API |
|---|---|---|
| Xem phòng ban | `staff:view_organization` | `GET /departments` |
| Thêm phòng ban | `staff:manage_organization` | `POST /departments` |
| Đổi tên / sửa phòng ban | `staff:manage_organization` | `PATCH /departments/:id` |

**Tab Ma trận phân quyền**

| Thao tác | Ai được làm | API |
|---|---|---|
| Xem danh sách chức danh và ma trận | `system:configure_permissions` | `GET /role`, `GET /role/:roleCode/permission-matrix` |
| **Thêm chức danh** | `system:configure_permissions` | `POST /role` |
| Sửa tên chức danh, **tick / bỏ tick quyền** | `system:configure_permissions` | `PATCH /role/:roleCode`, `PUT /role/:roleCode/permissions` |
| **Khóa / mở** chức danh | `system:configure_permissions` | `PATCH /role/:roleCode` |
| **Xóa** chức danh | `system:configure_permissions` | *chưa có API*. Đề nghị thêm `DELETE /role/:roleCode` (chặn khi còn cán bộ đang giữ) |

### 3.6. Báo cáo (`/reports`)

| Thao tác | Ai được làm | API |
|---|---|---|
| Vào màn hình, xem danh sách loại báo cáo và tệp | `report:view` | `GET /reports/types`, `GET /reports` |
| **Xem trực tiếp** tệp .xlsx / .csv trên trình duyệt | `report:view` | `GET /reports/:id/file` |
| **Nhập Excel** (tải tệp báo cáo lên) | `report:import` | `POST /reports` |
| **Xuất Excel** (tải tệp về máy) | `report:export` | `GET /reports/:id/file?download=1`. Nên tách quyền khỏi lượt xem trực tiếp |
| **Thêm loại báo cáo** | `report:configure` | `POST /reports/types` |
| **Xóa loại báo cáo** | `report:configure` | `DELETE /reports/types/:typeId` |
| Xem lịch sử thay đổi của báo cáo | `report:view` | `GET /audit-logs?targetType=report…` |

### 3.7. Thư viện Pháp lý (`/legal-ai-library`)

| Thao tác | Ai được làm | API |
|---|---|---|
| Vào màn hình, tìm kiếm, lọc, sắp xếp ngày ban hành / hiệu lực | `legal_library:view` | `GET /legal-documents` |
| Xem chi tiết văn bản, xem trước / tải tệp đính kèm | `legal_library:view` | `GET /legal-documents/:id`, `GET /legal-documents/:id/files/:fileId` |
| **Thêm văn bản** (trang tạo, kèm tệp) | `legal_library:input` | `POST /legal-documents/files`, `POST /legal-documents` |
| **Sửa văn bản**, đổi trạng thái hiệu lực | `legal_library:input` | `PATCH /legal-documents/:id` |
| Thêm **loại văn bản / cơ quan ban hành** mới trong ô chọn | `catalog:manage` | `POST /catalogs` |
| Xem lịch sử thay đổi của văn bản | `legal_library:view` | `GET /audit-logs?targetType=legal_document…` |

### 3.8. Danh mục dùng chung (dùng trong ô chọn ở nhiều màn hình)

| Thao tác | Ai được làm | API |
|---|---|---|
| Đọc danh mục (loại dự án, đầu mục giải ngân, loại văn bản, cơ quan ban hành…) | Mọi cán bộ đã đăng nhập | `GET /catalogs`, `GET /catalogs/types` |
| Thêm mục mới | `catalog:manage` | `POST /catalogs` |
| Sửa / xóa mục | `catalog:manage` | `PATCH /catalogs/:id`, `DELETE /catalogs/:id` |

### 3.9. Tài khoản cá nhân (`/profile`)

| Thao tác | Ai được làm | API |
|---|---|---|
| Xem hồ sơ của mình | Mọi cán bộ | `GET /auth/profile`, `GET /auth/me` |
| Đổi mật khẩu | Mọi cán bộ | `POST /auth/change-password` |

---

## 4. Quyền đề nghị xóa (18 quyền) và quyền chuyển mã (1 quyền)

**Chuyển mã:** `finance:request_disbursement` → `project:disburse`. Giữ nguyên người đang được cấp.

**Xóa:**

| Mã quyền | Lý do |
|---|---|
| `dashboard:export_summary` | Bảng điều khiển không có chức năng xuất |
| `project:progress_rule4` | Tiến độ dự án tự tính theo bước quy trình, không nhập tay. `POST /projects/:id/progress` có thể bỏ |
| `project:export_report` | Danh sách dự án không có nút xuất |
| `staff:assign_staff_by_stage` | Phân công bước đã chuyển sang `procedure:assign_step` |
| `staff:review_and_supervise` | Trùng với `procedure:approve_step` |
| `finance:view`, `finance:approve_disbursement`, `finance:export_kbnn_report` | Bỏ phân hệ Tài chính. Giải ngân trong dự án không có bước duyệt |
| `gpmb:view_16b`, `gpmb:create_update_household`, `gpmb:approve_compensation_plan`, `gpmb:export_report` | Bỏ phân hệ GPMB |
| `bidding:view`, `bidding:create_evaluate`, `bidding:approve_result` | Bỏ phân hệ Đấu thầu |
| `warranty:view`, `warranty:log_issue_repair`, `warranty:release_bond` | Bỏ phân hệ Bảo hành |

> Nếu sau này các phân hệ M4, M6, M7, M8 quay lại thì thêm quyền lại khi đó. Trước mắt có thể giữ trong DB nhưng đánh dấu `isActive = false` / ẩn khỏi API ma trận, thay vì xóa hẳn.

---

## 5. Tóm tắt API cần sửa

### 5.1. API đang thiếu kiểm tra quyền (chỉ có `JwtAuthGuard`)

| API | Thêm quyền |
|---|---|
| `GET /audit-logs` (không lọc theo đối tượng) | `system:view_audit_logs` |
| `GET /audit-logs?targetType=…&targetId=…` | Quyền "Xem" của phân hệ tương ứng |
| `GET /user/:id/activity` | `system:view_audit_logs` |
| `POST/PATCH/DELETE /catalogs…` | `catalog:manage` |
| `POST/PATCH /departments…` | `staff:manage_organization` |
| `GET /user`, `GET /user/:id` | `staff:view_organization` |
| `PUT /user/:id`, `…/lock`, `…/unlock` | `staff:manage_users` |
| `PUT/PATCH /user/:id/roles`, `GET/PUT /user/:id/permissions` | `staff:manage_cnda_permission` |
| `GET /role…`, `POST /role`, `PATCH /role/:roleCode`, `PUT /role/:roleCode/permissions` | `system:configure_permissions` |
| `POST /auth/register` | `staff:manage_users` (đăng ký do quản trị tạo, không phải tự đăng ký) |

### 5.2. API cần đổi mã quyền

| API | Hiện tại | Đổi thành |
|---|---|---|
| `POST /projects/:id/disbursements` | `finance:request_disbursement` | `project:disburse` |
| `GET /projects/:id/procedure` | `procedure:view` (alias) | `procedure:view` |
| `GET /procedures…` | `construction_procedures:view` | `procedure:view` |
| `POST/PATCH/PUT /procedures…` (trừ approve) | `construction_procedures:configure` | `procedure:config_template` |
| `POST /procedures/:id/approve` | `construction_procedures:approve` | `procedure:approve_template` |
| `POST /staff/:id/permissions/reset`, `PUT /staff/:id/permissions` | `system:configure_permissions` | `staff:manage_cnda_permission` |
| `GET /my-tasks` | chức danh DIRECTOR thấy tất cả | dữ liệu + `my_task:view_all` |
| Thao tác làm hộ ở `/my-tasks` | `canActOnBehalf` (cứng theo chức danh) | `my_task:act_on_behalf` |
| `approve`, `return`, `incident/resolve` ở `/my-tasks` | chức danh lãnh đạo / tổ trưởng | người duyệt theo chuỗi **hoặc** `procedure:approve_step` |

### 5.3. API đề nghị thêm

| API | Mục đích | Quyền |
|---|---|---|
| `GET /dashboard/summary` | Số liệu bảng điều khiển, không phụ thuộc `project:view` | `dashboard:view_kpi` |
| `PATCH /projects/:id/procedure/steps/:stepId` | Gán người / hạn / bật tắt một bước trong dự án | `procedure:assign_step` hoặc người phụ trách dự án |
| `POST /procedures/:id/reject` | Từ chối duyệt quy trình mẫu | `procedure:approve_template` |
| `DELETE /role/:roleCode` | Xóa chức danh | `system:configure_permissions` |

---

## 6. Dọn bảng alias trong `permissions.guard.ts`

Hàm `normalizePermission` (dòng 50 trở đi) đang ánh xạ chéo nhiều mã cũ / mã frontend. Ví dụ:
- `m2_projects:input`
- `procedure:execute_on_behalf`
- `m3.act_on_behalf`
- `m8_reports:view`

Hệ quả:
- **Khó biết một API thực sự cần quyền gì.**
- **`construction_procedures:configure` được coi như có luôn `procedure:update_step`**, nghĩa là người có quyền cấu hình mẫu được cả phân công bước mà ma trận không cấp.

Đề nghị:
- Sau khi chốt bộ quyền ở mục 2, mỗi API dùng **đúng một mã** trong bảng `permissions`.
- Bỏ bảng alias.
- Bỏ phần sinh alias cho frontend ở `auth.service.ts` (khoảng dòng 376–390). Frontend tự ánh xạ trong `BACKEND_PERMISSION_TO_MATRIX_ID`.

---

## 7. Dữ liệu cần chuyển (migration)

1. **Thêm** 9 quyền MỚI vào `permissions`, kèm nhóm và tên hiển thị như mục 2:
   - `my_task:view_all`, `my_task:act_on_behalf`
   - `project:disburse`
   - `procedure:approve_template`
   - `report:view`, `report:import`, `report:export`, `report:configure`
   - `catalog:manage`
2. **Đổi mã** trong `permissions`, `role_permissions`, `user_permissions`:
   - `procedure:view_46b` → `procedure:view`
   - `procedure:update_step` → `procedure:assign_step`
   - `staff:assign_project_leader` → `staff:manage_organization`
   - `finance:request_disbursement` → `project:disburse`
3. **Cấp quyền mới** cho chức danh đang có:
   - Có `procedure:approve_step` → thêm `procedure:approve_template`.
   - DIRECTOR, DEPUTY_DIRECTOR → thêm `my_task:view_all`, `my_task:act_on_behalf`.
   - Có `project:view` → thêm `report:view`.
   - Có `project:create_update` → thêm `report:import`, `report:export`, `catalog:manage`.
   - Có `system:configure_permissions` → thêm `report:configure`.
4. **Xóa / ẩn** 18 quyền ở mục 4.
5. **Lỗi `user_permissions` (đã báo trước).** Seed / đăng ký / reset đang **chép toàn bộ quyền của chức danh thành quyền riêng** của từng người. Vì vậy sửa ma trận chức danh không có tác dụng với người đã có tài khoản.
   - Đề nghị `user_permissions` chỉ lưu phần **khác** so với chức danh (cấp thêm / thu hồi riêng).
   - Xóa 242 dòng chép sẵn hiện có.
   - Nếu không xóa thì bước 2–4 phải áp dụng cho cả `user_permissions`.

---

## 8. API trả về cho ma trận

`GET /role/:roleCode/permission-matrix` và `GET /staff/permissions` nên trả về **đúng bộ quyền ở mục 2**, kèm nhóm và thứ tự, để frontend dựng ma trận theo dữ liệu backend:

```json
{
  "modules": [
    { "code": "my_task", "name": "Việc cần xử lý", "order": 2 }
  ],
  "permissions": [
    { "code": "my_task:act_on_behalf", "module": "my_task", "name": "Làm hộ việc của cán bộ khác", "description": "...", "category": "write" }
  ]
}
```

Thứ tự nhóm: Bảng điều khiển → Việc cần xử lý → Dự án & Công trình → Quy trình dự án → Nhân sự & Phân công → Báo cáo → Thư viện Pháp lý → Danh mục dùng chung → Hệ thống.

---

## 9. Phía frontend sẽ làm sau khi backend chốt

- Cập nhật `MATRIX_MODULES` / `MATRIX_PERMISSIONS` (`shared/personnel-assignment/constants/role-matrix-data.ts`) theo mục 2. Ẩn các nhóm M4, M6, M7, M8.
- Cập nhật `BACKEND_PERMISSION_TO_MATRIX_ID` (`src/access-control.ts`) và `ROUTE_PERMISSIONS`. Thêm route `/reports` với quyền `report:view`.
- Gắn quyền cho từng nút theo mục 3, đặc biệt các chỗ đang mở tự do:
  - Màn Báo cáo (xem, nhập, xuất, loại báo cáo)
  - Thêm mục danh mục ngay trong ô chọn
  - Ma trận phân quyền (đang chặn bằng `staff:manage_users`, đổi sang `system:configure_permissions`)
  - Phân công bước trong dự án (đổi sang `procedure:assign_step`)
  - Nhật ký hoạt động cán bộ (`system:view_audit_logs`)
- Đổi mã "Làm hộ" tạm thời `procedure:proxy_step` sang `my_task:act_on_behalf`. Thêm `my_task:view_all` vào bộ lọc việc.
- Giải ngân trong dự án đổi sang `project:disburse`.

Vui lòng phản hồi lại danh sách mã cuối cùng (nếu backend muốn đặt tên khác) để frontend đồng bộ.
