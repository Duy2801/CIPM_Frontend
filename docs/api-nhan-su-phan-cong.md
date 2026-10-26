# API màn Nhân sự & Phân công (M5)

Tài liệu mô tả các chức năng của màn **Nhân sự & Phân công**, request/response của từng API và component nào gọi.

- Frontend: `src/features/personnel-assignment`
- Backend: `cipm-service`
- Lớp gọi API phía FE: `services/personnel.api.ts` (nhân sự, phòng ban) và `services/role-matrix.storage.ts` (chức danh, quyền). Hiện các hàm này chạy trên dữ liệu mock / localStorage; khi nối backend chỉ cần thay thân hàm bằng `apiClient`, hook và component giữ nguyên.

Ký hiệu: ✅ backend đã có · ⚠ backend chưa có (đề xuất).

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
| 400 | Dữ liệu không hợp lệ |
| 401 | Chưa đăng nhập / token hết hạn |
| 403 | Không đủ quyền (`"Role invalid."`) |
| 404 | Không tìm thấy |
| 409 | Trùng (email, tên phòng ban, tên chức danh) |

---

## Các màn hình và chức năng

| Màn hình | Chức năng |
|---|---|
| Danh bạ cán bộ theo phòng ban | Xem cơ cấu tổ chức, tìm kiếm, lọc theo phòng ban / trạng thái tài khoản, thu gọn phòng ban, đổi tên phòng ban, mở hồ sơ cán bộ |
| Hồ sơ & phân quyền (drawer) | Khóa / mở lại tài khoản; tab **Thông tin cá nhân** (sửa trực tiếp + lịch sử thay đổi); tab **Quyền hạn** (xem quyền, chỉnh quyền riêng) |
| Thêm nhân sự mới (drawer) | Nhập hồ sơ, thêm nhanh phòng ban / chức danh, thêm trường dữ liệu tùy biến |
| Quản lý chức danh (modal) | Danh sách chức danh, tìm kiếm, bật / tắt chức danh, tạo / sửa chức danh và quyền |
| Lịch sử thay đổi quyền (tab trong modal) | Xem ai đổi quyền gì, lúc nào; lọc theo ngày |

---

## Tổng hợp API

| # | Chức năng | Endpoint | Backend | Component gọi |
|---|---|---|---|---|
| 1 | Danh sách phòng ban | `GET /departments?status=` | ✅ | PersonnelDirectoryTab, DirectoryToolbar, DirectoryTeamName, StaffModal, StaffInfoCard, StaffLockAccountModal |
| 2 | Danh sách cán bộ | `GET /user` | ✅ | PersonnelDirectoryTab, StaffModal, PersonnelAssignmentScreen |
| 3 | Hồ sơ cán bộ | `GET /user/:id` | ✅ | StaffDetailDrawer, StaffDetailHeader, StaffInfoCard, StaffPermissionPanel, StaffLockAccountModal |
| 4 | Sửa hồ sơ | `PUT /user/:id` | ✅ | StaffInfoCard |
| 5 | Quyền riêng của cán bộ (UserPermission) | `GET / PUT /user/:id/permissions` | ⚠ | StaffPermissionPanel |
| 6 | Khóa tài khoản | `PATCH /user/:id/lock` | ✅ | StaffLockAccountModal |
| 7 | Mở lại tài khoản | `PATCH /user/:id/unlock` | ✅ | StaffDetailHeader |
| 8 | Lịch sử hồ sơ | `GET /user/:id/activity` | ⚠ | StaffActivityHistory |
| 9 | Thêm cán bộ | `POST /auth/register` | ✅ | StaffModal |
| 10 | Thêm phòng ban | `POST /departments` | ✅ | StaffModal |
| 11 | Trường tùy biến hồ sơ | `GET / PUT /settings/staff-custom-fields` | ⚠ | StaffFormCustomFields, StaffModal, StaffInfoCard |
| 12 | Sửa phòng ban | `PATCH /departments/:id` | ✅ | DirectoryTeamName, StaffModal |
| 13 | Danh sách chức danh | `GET /role` | ✅ (cần bổ sung trường) | RoleMatrixRoleTable, RoleEditorView, DirectoryStaffColumns, StaffDetailHeader, StaffModal |
| 14 | Quyền của chức danh | `GET /role/:code/permission-matrix` | ✅ | RoleMatrixRoleTable, RoleEditorView |
| 15 | Tạo chức danh | `POST /role` + `PUT /role/:code/permissions` | ✅ | RoleEditorView |
| 16 | Lưu quyền chức danh | `PUT /role/:code/permissions` | ✅ | RoleEditorView |
| 17 | Đổi tên chức danh | `PATCH /role/:code` | ⚠ | RoleEditorView |
| 18 | Bật / tắt chức danh | `PATCH /role/:code` | ⚠ | RoleMatrixRoleTable |
| 19 | Lịch sử thay đổi quyền | `GET /audit-logs?module=permissions` | ⚠ | RoleMatrixHistoryTab |

Backend đã có 13 / 19 API; còn thiếu 6 (đánh dấu ⚠).

---

## A. Danh bạ & hồ sơ cán bộ

### 1. Danh sách phòng ban (kèm cán bộ) ✅

- **FE:** `getTeams()` → `useTeams()`
- **Component:** PersonnelDirectoryTab (danh sách ban), DirectoryToolbar (ô lọc phòng ban), DirectoryTeamName (kiểm tra trùng tên), StaffModal (ô chọn phòng ban), StaffInfoCard (ô sửa phòng ban), StaffLockAccountModal (tên ban trong hộp khóa)

**Request**
```
GET /departments
Query:
  departmentId?: uuid                 // chỉ lấy một phòng ban (bộ lọc "Tất cả phòng ban")
  q?: string                          // tìm theo tên, chức danh, email cán bộ
  status?: "ACTIVE" | "LOCKED"        // bộ lọc "Tất cả tài khoản"; bỏ trống = cả hai
```
Trả cả cán bộ **đang hoạt động** và **đang khóa** (bỏ tài khoản ẩn `HIDDEN`). Khi có `q` hoặc `status`, chỉ trả các phòng ban có cán bộ khớp.

**Response**
```json
{
  "status": true,
  "statusCode": 200,
  "data": [
    {
      "id": "b3e1c2a4-5d6f-4a7b-8c9d-0e1f2a3b4c5d",
      "code": "BGD",
      "name": "Ban Giám đốc",
      "description": null,
      "sortOrder": 0,
      "isActive": true,
      "roles": [{ "title": "Giám đốc", "roleCode": "DIRECTOR" }],
      "customFields": null,
      "count": 1,
      "users": [
        {
          "id": "f8a20277-9bd0-4a58-89bf-2d1bfcc73cd0",
          "fullName": "Huỳnh Thái Hải",
          "email": "hai.ht@hatien.gov.vn",
          "gender": "MALE",
          "employmentType": "Viên chức",
          "positionTitle": "Giám đốc A",
          "dateOfBirth": "1975-03-12T00:00:00.000Z",
          "status": "ACTIVE",
          "lockReason": null,
          "roles": [
            { "code": "DIRECTOR", "name": "Giám đốc", "assignedAt": "2026-10-16T14:39:40.790Z", "isActive": true }
          ]
        }
      ]
    },
    {
      "id": "d5e6f7a8-...",
      "code": "GSKT",
      "name": "Tổ Giám sát – Kỹ thuật",
      "count": 10,
      "users": [
        {
          "id": "7c6d5e4f-...",
          "fullName": "Trần Minh Ơn",
          "email": "on.tm@hatien.gov.vn",
          "employmentType": "Viên chức",
          "positionTitle": "Tổ phó (KT)",
          "status": "LOCKED",
          "lockReason": "Chuyển công tác / Luân chuyển đơn vị",
          "roles": [
            { "code": "TECHNICAL_OFFICER", "name": "Cán bộ kỹ thuật", "assignedAt": "2026-10-16T14:39:40.790Z", "isActive": true }
          ]
        }
      ]
    }
  ]
}
```
- `status`: `ACTIVE` (chấm xanh) | `LOCKED` (chấm đỏ, rê chuột xem `lockReason`)

**Lỗi:** `400 "Trạng thái chỉ nhận ACTIVE hoặc LOCKED"`

### 2. Danh sách cán bộ ✅

- **FE:** `getStaffList()` → `useStaffList()`
- **Component:** PersonnelDirectoryTab (bảng cán bộ), StaffModal (chức danh cán bộ đang giữ), PersonnelAssignmentScreen (chờ tải lần đầu)

**Request**
```
GET /user
Query: page=1, limit=100, q?: string, departmentId?: uuid
```

**Response**
```json
{
  "status": true,
  "statusCode": 200,
  "data": {
    "items": [
      {
        "id": "f8a20277-9bd0-4a58-89bf-2d1bfcc73cd0",
        "fullName": "Huỳnh Thái Hải",
        "email": "hai.ht@hatien.gov.vn",
        "employmentType": "Viên chức",
        "positionTitle": "Giám đốc A",
        "status": "ACTIVE",
        "lockReason": null,
        "department": { "id": "b3e1c2a4-...", "code": "BGD", "name": "Ban Giám đốc" },
        "roles": [
          { "code": "DIRECTOR", "name": "Giám đốc", "assignedAt": "2026-10-16T14:39:40.790Z", "isActive": true }
        ]
      }
    ],
    "meta": { "page": 1, "limit": 100, "total": 23, "totalPages": 1 }
  }
}
```

### 3. Hồ sơ một cán bộ ✅

- **FE:** `getStaff(id)` → `useStaff(id)` / `useStaffDetail(id)`
- **Component:** StaffDetailDrawer, StaffDetailHeader, StaffInfoCard, StaffPermissionPanel, StaffLockAccountModal

**Request**
```
GET /user/:id
```

**Response**
```json
{
  "status": true,
  "statusCode": 200,
  "data": {
    "id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    "fullName": "Trần Trung Tín",
    "email": "tin.tt@hatien.gov.vn",
    "citizenId": null,
    "gender": "MALE",
    "dateOfBirth": "1989-12-03T00:00:00.000Z",
    "employmentType": "Viên chức",
    "positionTitle": "Phó Giám đốc",
    "status": "ACTIVE",
    "lockReason": null,
    "customFields": null,
    "department": { "id": "c4f2d3b5-...", "code": "BPGD", "name": "Ban Phó Giám đốc" },
    "roles": [
      { "code": "DEPUTY_DIRECTOR", "name": "Phó Giám đốc", "assignedAt": "2026-10-16T14:39:40.790Z", "isActive": true }
    ]
  }
}
```

**Lỗi:** `404 "User not found"`

### 4. Sửa hồ sơ ✅

- **FE:** `updateStaff(id, input)` → `useUpdateStaff()`
- **Component:** StaffInfoCard (nút "Lưu thay đổi")

**Request** — chỉ gửi trường thay đổi; gửi `null` để xóa giá trị
```
PUT /user/:id
```
```json
{
  "positionTitle": "Phó Giám đốc",
  "departmentId": "c4f2d3b5-...",
  "email": "tin.tt@hatien.gov.vn",
  "employmentType": "Viên chức",
  "gender": "MALE",
  "dateOfBirth": "1989-12-03",
  "customFields": { "so_may_nhanh": "102" }
}
```

**Response**
```json
{
  "status": true,
  "statusCode": 200,
  "data": {
    "id": "a1b2c3d4-...",
    "email": "tin.tt@hatien.gov.vn",
    "fullName": "Trần Trung Tín",
    "gender": "MALE",
    "customFields": { "so_may_nhanh": "102" },
    "citizenId": null,
    "employmentType": "Viên chức",
    "positionTitle": "Phó Giám đốc",
    "dateOfBirth": "1989-12-03T00:00:00.000Z",
    "status": "ACTIVE",
    "departmentId": "c4f2d3b5-..."
  }
}
```

**Lỗi:** `400 "Phòng ban không tồn tại hoặc đã ngừng hoạt động"`

### 5. Quyền riêng của cán bộ (UserPermission) ⚠

- **FE:** `updateStaff(id, { permissions, revokedPermissions })` → `useUpdateStaff()`
- **Component:** StaffPermissionPanel (tab "Quyền hạn" → "Chỉnh quyền" → "Lưu quyền")

Quyền riêng chỉ áp dụng cho **một cán bộ**, nằm ngoài quyền nhận từ vai trò (`UserRole → RolePermission`). Quyền mặc định của chức danh không đổi, người khác cùng chức danh không bị ảnh hưởng.

```
Quyền thực tế = (quyền của các vai trò đang bật  ∪  GRANT)  −  REVOKE
```

| Loại | Ý nghĩa | Ví dụ |
|---|---|---|
| `GRANT` | Cấp thêm quyền mà chức danh không có | Phó GĐ được thêm `bidding:approve` |
| `REVOKE` | Bỏ riêng một quyền mà chức danh đang có | Phó GĐ này không được `dashboard:export` |

**Đề xuất bảng mới** (`prisma/schema.prisma`)
```prisma
enum UserPermissionEffect {
  GRANT
  REVOKE
}

/// Quyền riêng của từng cán bộ, cộng / trừ vào quyền nhận từ vai trò
model UserPermission {
  userId       String               @map("user_id") @db.Uuid
  permissionId String               @map("permission_id") @db.Uuid
  effect       UserPermissionEffect
  grantedById  String?              @map("granted_by_id") @db.Uuid
  createdAt    DateTime             @default(now()) @map("created_at")
  user         User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  permission   Permission           @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@id([userId, permissionId])
  @@map("user_permissions")
}
```
Thêm quan hệ ngược: `User.userPermissions UserPermission[]`, `Permission.userPermissions UserPermission[]`.

Mỗi cán bộ + mỗi quyền chỉ có **một dòng** (khóa chính `userId + permissionId`), nên một quyền không thể vừa GRANT vừa REVOKE.

**Tính quyền khi đăng nhập / mỗi request** (`auth/user-permissions.ts → getUserAccess`)
```ts
const rolePermissions = /* quyền từ các UserRole isActive = true (như hiện tại) */;
const overrides = await prisma.userPermission.findMany({
  where: { userId },
  select: { effect: true, permission: { select: { code: true } } },
});
const granted = overrides.filter((o) => o.effect === "GRANT").map((o) => o.permission.code);
const revoked = new Set(overrides.filter((o) => o.effect === "REVOKE").map((o) => o.permission.code));
const permissions = [...new Set([...rolePermissions, ...granted])].filter((code) => !revoked.has(code));
```
Kết quả này dùng cho `permissions` trả về lúc đăng nhập và cho `PermissonGuard`.

#### 5a. Xem quyền của cán bộ

**Request**
```
GET /user/:id/permissions
```

**Response**
```json
{
  "status": true,
  "statusCode": 200,
  "data": {
    "userId": "a1b2c3d4-...",
    "rolePermissions": ["dashboard:view", "dashboard:export", "projects:view", "projects:input"],
    "grant": ["bidding:approve"],
    "revoke": ["dashboard:export"],
    "effectivePermissions": ["dashboard:view", "projects:view", "projects:input", "bidding:approve"]
  }
}
```
- `rolePermissions`: quyền mặc định theo vai trò (FE hiện "Quyền hạn được cấp theo chức danh")
- `grant` / `revoke`: phần điều chỉnh riêng
- `effectivePermissions`: quyền thực tế (FE hiện "N quyền khả dụng")

#### 5b. Lưu quyền riêng của cán bộ

Gửi **toàn bộ** danh sách điều chỉnh; backend thay thế các dòng `UserPermission` cũ của cán bộ này.

**Request**
```
PUT /user/:id/permissions
```
```json
{
  "grant": ["bidding:approve"],
  "revoke": ["dashboard:export"]
}
```
- Gửi `{ "grant": [], "revoke": [] }` để xóa hết điều chỉnh riêng (quay về đúng quyền của chức danh)
- Quyền có trong `grant` mà vai trò đã có sẵn → bỏ qua (không cần lưu)
- Quyền có trong `revoke` mà vai trò không có → bỏ qua

**Response:** giống mục 5a (quyền sau khi lưu).

**Lỗi:** `400 "Quyền không tồn tại: …"`, `400 "Một quyền không thể vừa cấp thêm vừa thu hồi: …"`, `404 "Không tìm thấy nhân sự"`

**Quyền gọi API:** `system:permissions` (cùng quyền với sửa vai trò cán bộ).

### 6. Khóa tài khoản ✅

- **FE:** `setAccountActive(id, false, reason)` → `useLockAccount()`
- **Component:** StaffLockAccountModal (mở từ nút "Khóa tài khoản" ở StaffDetailHeader)

**Request**
```
PATCH /user/:id/lock
```
```json
{ "reason": "Nhân viên nghỉ việc / Chấm dứt hợp đồng lao động" }
```

**Response**
```json
{ "status": true, "statusCode": 200, "data": { "id": "a1b2c3d4-...", "status": "LOCKED" } }
```

**Lỗi:** `400 "Không thể tự khóa tài khoản của mình"`, `400 "Chỉ có thể khóa tài khoản đang hoạt động"`, `404 "Không tìm thấy tài khoản"`

Khóa xong backend xóa refresh token của cán bộ → bị đăng xuất trong tối đa 15 phút.

### 7. Mở lại tài khoản ✅

- **FE:** `setAccountActive(id, true)` → `useUnlockAccount()`
- **Component:** StaffDetailHeader (nút "Mở lại tài khoản")

**Request**
```
PATCH /user/:id/unlock
Body: {}
```

**Response**
```json
{ "status": true, "statusCode": 200, "data": { "id": "a1b2c3d4-...", "status": "ACTIVE" } }
```

**Lỗi:** `400 "Chỉ có thể mở khóa tài khoản đã bị khóa"`

### 8. Lịch sử thay đổi hồ sơ ⚠

- **FE:** `getStaffProfileHistory(id)` (hiện đọc từ localStorage)
- **Component:** StaffActivityHistory (tab Thông tin cá nhân)
- **Đề xuất backend:**

**Request**
```
GET /user/:id/activity
Query: date?: "2026-10-23"
```

**Response**
```json
{
  "status": true,
  "statusCode": 200,
  "data": [
    {
      "id": "e7a1...",
      "at": "2026-10-23T08:15:00.000Z",
      "actorName": "Huỳnh Thái Hải",
      "actorRole": "Giám đốc",
      "action": "Khóa tài khoản",
      "changes": [{ "label": "Tài khoản", "from": "Đang hoạt động", "to": "Đang khóa" }],
      "note": "Lý do: Chuyển công tác"
    }
  ]
}
```

---

## B. Thêm tài khoản

### 9. Thêm cán bộ ✅

- **FE:** `createStaff(input)` → `useCreateStaff()`
- **Component:** StaffModal (nút "Thêm nhân sự")

**Request**
```
POST /auth/register
```
```json
{
  "fullName": "Nguyễn Văn An",
  "email": "an.nv@hatien.gov.vn",
  "dateOfBirth": "1990-01-31",
  "gender": "MALE",
  "departmentId": "d5e6f7a8-...",
  "positionTitle": "Thành viên",
  "employmentType": "Viên chức",
  "customFields": { "so_may_nhanh": "105" }
}
```
- `gender`: `MALE` | `FEMALE` | `OTHER`
- `positionTitle`: phải nằm trong `roles[].title` của phòng ban đã chọn
- Mật khẩu do hệ thống tạo (10 ký tự) và gửi qua email

**Response**
```json
{
  "status": true,
  "statusCode": 201,
  "data": {
    "id": "9c8b7a6d-...",
    "email": "an.nv@hatien.gov.vn",
    "fullName": "Nguyễn Văn An",
    "gender": "MALE",
    "dateOfBirth": "1990-01-31T00:00:00.000Z",
    "employmentType": "Viên chức",
    "positionTitle": "Thành viên",
    "department": { "id": "d5e6f7a8-...", "code": "GSKT", "name": "Tổ Giám sát – Kỹ thuật" },
    "roles": [
      { "code": "TECHNICAL_OFFICER", "name": "Cán bộ kỹ thuật", "assignedAt": "2026-10-23T08:00:00.000Z", "isActive": true }
    ],
    "mailSent": true
  }
}
```
Gửi mail lỗi → `"mailSent": false` kèm `"temporaryPassword": "Ab3k9PqR2x"` để quản trị báo tay.

**Lỗi:** `409 "Email đã được sử dụng"`, `400 "Vị trí không thuộc bộ phận đã chọn"`, `400 "Có vai trò không tồn tại"`

### 10. Thêm phòng ban ✅

- **FE:** `createTeam(input)` → `useCreateTeam()`
- **Component:** StaffModal (ô "Nhập tên phòng ban mới… + Thêm" trong danh sách phòng ban)

**Request**
```
POST /departments
```
```json
{
  "name": "Tổ Quản lý Chất lượng",
  "roles": [
    { "title": "Tổ trưởng", "roleCode": "TECHNICAL_OFFICER" },
    { "title": "Tổ phó", "roleCode": "TECHNICAL_OFFICER" },
    { "title": "Thành viên", "roleCode": "TECHNICAL_OFFICER" }
  ]
}
```

**Response**
```json
{
  "status": true,
  "statusCode": 201,
  "data": {
    "id": "e1f2a3b4-...",
    "code": "TQLCL",
    "name": "Tổ Quản lý Chất lượng",
    "description": null,
    "sortOrder": 50,
    "isActive": true,
    "roles": [
      { "title": "Tổ trưởng", "roleCode": "TECHNICAL_OFFICER" },
      { "title": "Tổ phó", "roleCode": "TECHNICAL_OFFICER" },
      { "title": "Thành viên", "roleCode": "TECHNICAL_OFFICER" }
    ],
    "customFields": null
  }
}
```

**Lỗi:** `409 "Tên phòng ban đã tồn tại"`, `409 "Mã phòng ban đã tồn tại"`

### 11. Danh mục trường tùy biến của hồ sơ cán bộ ⚠

- **FE:** `useCustomFieldDefs("staff")` (hiện lưu localStorage)
- **Component:** StaffFormCustomFields (hiện + "Thêm trường dữ liệu"), StaffModal (lọc trường khi gửi), StaffInfoCard (hiện / sửa thông tin bổ sung)
- Backend hiện chỉ có trường tùy biến **theo phòng ban**, chưa có danh mục dùng chung cho mọi cán bộ.
- **Đề xuất backend:**

**Request**
```
GET /settings/staff-custom-fields
PUT /settings/staff-custom-fields
```
```json
[
  { "key": "so_may_nhanh", "label": "Số máy nhánh", "type": "text", "required": false, "active": true },
  { "key": "tru_so", "label": "Trụ sở", "type": "select", "options": ["Trụ sở 1", "Trụ sở 2"], "required": false, "active": true }
]
```
- `type`: `text` | `number` | `date` | `select` | `textarea`

**Response**
```json
{ "status": true, "statusCode": 200, "data": [ "...danh sách như trên..." ] }
```

---

## C. Phòng ban

### 12. Sửa phòng ban ✅

- **FE:** `updateTeam(id, input)` → `useUpdateTeam()`
- **Component:** DirectoryTeamName (đổi tên ban), StaffModal (ô "Nhập tên chức danh mới… + Thêm")

**Request — đổi tên**
```
PATCH /departments/:id
```
```json
{ "name": "Ban Giám đốc" }
```

**Request — thêm chức danh vào phòng ban** (gửi toàn bộ danh sách vị trí)
```json
{
  "roles": [
    { "title": "Giám đốc", "roleCode": "DIRECTOR" },
    { "title": "Thư ký Ban Giám đốc", "roleCode": "ADMINISTRATIVE_OFFICER" }
  ]
}
```

**Response**
```json
{
  "status": true,
  "statusCode": 200,
  "data": {
    "id": "b3e1c2a4-...",
    "code": "BGD",
    "name": "Ban Giám đốc",
    "isActive": true,
    "roles": [
      { "title": "Giám đốc", "roleCode": "DIRECTOR" },
      { "title": "Thư ký Ban Giám đốc", "roleCode": "ADMINISTRATIVE_OFFICER" }
    ]
  }
}
```

**Lỗi:** `409 "Tên phòng ban đã tồn tại"`, `400 "Vị trí \"…\" bị trùng"`, `400 "Vai trò không tồn tại: …"`

---

## D. Quản lý chức danh

### 13. Danh sách chức danh ✅ (cần bổ sung trường)

- **FE:** `loadActiveRoles()` → `useRoleMatrix()` / `useSortedMatrixRoles()`
- **Component:** RoleMatrixRoleTable (bảng chức danh), RoleEditorView (kiểm tra trùng tên), DirectoryStaffColumns + StaffDetailHeader (đổi mã → tên chức danh), StaffModal (bỏ chức danh đang tắt)

**Request**
```
GET /role
```

**Response hiện tại**
```json
{
  "status": true,
  "statusCode": 200,
  "data": [
    { "id": "...", "code": "DIRECTOR", "name": "Giám đốc", "description": null, "isCustom": false },
    { "id": "...", "code": "CAN_BO_PHAP_CHE", "name": "Cán bộ Pháp chế", "description": null, "isCustom": true }
  ]
}
```

> ⚠ Màn hình cần thêm cho mỗi chức danh: `createdAt` (cột "Ngày tạo"), `isActive` (công tắc bật / tắt), `permissionCodes` (cột "Quyền").

**Response đề xuất**
```json
{
  "status": true,
  "statusCode": 200,
  "data": [
    {
      "id": "...",
      "code": "DEPUTY_DIRECTOR",
      "name": "Phó Giám đốc",
      "isCustom": false,
      "isActive": true,
      "createdAt": "2025-01-09T00:00:00.000Z",
      "permissionCodes": ["dashboard:view", "dashboard:export", "projects:view"]
    }
  ]
}
```

### 14. Quyền của một chức danh ✅

- **FE:** `useRoleMatrix().hasPermission` / `getRolePermIds(code)`
- **Component:** RoleMatrixRoleTable (cột "Quyền"), RoleEditorView (quyền ban đầu khi sửa)

**Request**
```
GET /role/:roleCode/permission-matrix
```

**Response**
```json
{
  "status": true,
  "statusCode": 200,
  "data": {
    "role": { "code": "DEPUTY_DIRECTOR", "name": "Phó Giám đốc" },
    "granted": 23,
    "total": 35,
    "modules": [
      {
        "code": "M1",
        "name": "Bàn làm việc & Báo cáo điều hành",
        "granted": 2,
        "total": 2,
        "permissions": [
          { "code": "dashboard:view", "name": "Xem Bàn làm việc & KPI", "description": "...", "module": "M1", "granted": true },
          { "code": "dashboard:export", "name": "Xuất báo cáo tổng hợp", "description": "...", "module": "M1", "granted": true }
        ]
      }
    ]
  }
}
```

**Lỗi:** `404 "Vai trò không tồn tại"`

### 15. Tạo chức danh ✅

- **FE:** `useRoleMatrixActions().createRole(name, permIds)`
- **Component:** RoleEditorView (nút "Tạo chức danh")

Gọi 2 bước:

**Bước 1 — tạo chức danh**
```
POST /role
```
```json
{ "name": "Cán bộ Pháp chế" }
```
→ `201`, `data` là ma trận của chức danh mới (như mục 14, `granted: 0`), mã tự sinh `CAN_BO_PHAP_CHE`.

**Bước 2 — cấp quyền**
```
PUT /role/CAN_BO_PHAP_CHE/permissions
```
```json
{ "permissionCodes": ["dashboard:view", "legal_library:view", "legal_library:input"] }
```
→ `200`, `data` là ma trận sau khi lưu.

**Lỗi:** `409 "Tên vai trò đã tồn tại"`

### 16. Lưu quyền của chức danh ✅

- **FE:** `useRoleMatrixActions().updateRolePermissions(code, permIds)`
- **Component:** RoleEditorView (nút "Lưu thay đổi")

**Request**
```
PUT /role/:roleCode/permissions
```
```json
{ "permissionCodes": ["dashboard:view", "projects:view", "projects:input"] }
```

**Response**
```json
{
  "status": true,
  "statusCode": 200,
  "data": { "role": { "code": "TECHNICAL_OFFICER", "name": "Cán bộ kỹ thuật" }, "granted": 3, "total": 35, "modules": ["..."] }
}
```
Mọi cán bộ giữ chức danh này cập nhật quyền theo.

### 17. Đổi tên chức danh ⚠

- **FE:** `useRoleMatrixActions().renameRole(code, name)`
- **Component:** RoleEditorView (nút "Lưu thay đổi", gọi trước mục 16 nếu tên thay đổi)
- **Đề xuất backend:**

**Request**
```
PATCH /role/:roleCode
```
```json
{ "name": "Phó Giám đốc phụ trách kỹ thuật" }
```

**Response**
```json
{ "status": true, "statusCode": 200, "data": { "code": "DEPUTY_DIRECTOR", "name": "Phó Giám đốc phụ trách kỹ thuật", "isActive": true } }
```

**Lỗi:** `409 "Tên vai trò đã tồn tại"`

### 18. Bật / tắt chức danh ⚠

- **FE:** `useRoleMatrixActions().setRoleLocked(code, locked)`
- **Component:** RoleMatrixRoleTable (công tắc ở cột "Hành động")
- **Đề xuất backend:** dùng chung route với mục 17

**Request**
```
PATCH /role/:roleCode
```
```json
{ "isActive": false }
```

**Response**
```json
{ "status": true, "statusCode": 200, "data": { "code": "TECHNICAL_OFFICER", "name": "Cán bộ kỹ thuật", "isActive": false } }
```

**Quy tắc:** chức danh tắt → cán bộ đang giữ tạm mất quyền (vẫn giữ chức danh) và không chọn được khi thêm nhân sự. `JwtStrategy` cần bỏ qua role có `isActive = false` khi tính quyền.

### 19. Lịch sử thay đổi quyền ⚠

- **FE:** `getPermissionChangeHistory()` (hiện đọc từ localStorage)
- **Component:** RoleMatrixHistoryTab (tab "Lịch sử thay đổi quyền")
- **Đề xuất backend:**

**Request**
```
GET /audit-logs
Query: module=permissions, date?: "2026-10-23"
```

**Response**
```json
{
  "status": true,
  "statusCode": 200,
  "data": [
    {
      "id": "f9b2...",
      "at": "2026-10-23T09:00:00.000Z",
      "actorName": "Huỳnh Thái Hải",
      "actorRole": "Giám đốc",
      "action": "Cập nhật chức danh: Phó Giám đốc",
      "targetType": "role",
      "targetId": "DEPUTY_DIRECTOR",
      "changes": [
        { "label": "Số quyền", "from": "23 quyền", "to": "24 quyền" },
        { "label": "Thêm quyền", "to": "Phê duyệt kết quả đấu thầu" }
      ]
    }
  ]
}
```

---

## Phân quyền thao tác

Quyền người đăng nhập lấy từ `permissions` trả về lúc đăng nhập (không gọi API riêng). FE dùng `usePersonnelPermissions()` / `useStaffAccess()` để ẩn / hiện nút; backend kiểm tra lại bằng `PermissonGuard`.

| Thao tác | Quyền cần | Component kiểm tra |
|---|---|---|
| Vào màn hình | `m5_personnel_assignment:view` | PersonnelAssignmentScreen |
| Thêm tài khoản, sửa hồ sơ, khóa / mở tài khoản, sửa ma trận chức danh | `m5_personnel_assignment:accounts` | PersonnelDirectoryTab, DirectoryTeamSection, DirectoryStaffColumns, StaffDetailHeader, StaffInfoCard, RolePermissionMatrixModal, RoleMatrixRoleTable, RoleEditorView |
| Đổi tên phòng ban | `accounts` hoặc `m5_personnel_assignment:configure` | DirectoryTeamName |
| Đổi chức danh, chỉnh quyền riêng | `accounts` + `m5_personnel_assignment:grant_cnda` | StaffInfoCard, StaffPermissionPanel |
| Giám đốc (`DIRECTOR`) | Toàn quyền | — |

Mọi thao tác ghi đều được lưu nhật ký (ai, lúc nào, thay đổi gì) để hiển thị ở mục 8 và mục 19.
