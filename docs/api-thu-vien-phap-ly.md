# API màn Thư viện Pháp lý (M9)

Tài liệu mô tả các chức năng của màn **Thư viện Pháp lý**, request/response của từng API và component nào gọi.

- Frontend: `src/features/legal-ai-library`
- Backend: `cipm-service`
- Lớp gọi API phía FE: `services/legal.api.ts`. Hiện các hàm này chạy trên kho mock trong bộ nhớ (`services/mock-legal.repository.ts`); khi nối backend chỉ cần thay thân hàm bằng `apiClient`, hook và component giữ nguyên.
- Nhật ký thao tác dùng chung với Nhân sự & Phân công (`personnel-assignment/utils/activity-log`, hiện lưu localStorage), các dòng của thư viện có `module = "Thư viện pháp lý"`.

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
| 404 | Không tìm thấy văn bản |
| 409 | Trùng số hiệu văn bản |

Ngày gửi / nhận dạng `YYYY-MM-DD`.

---

## Các màn hình và chức năng

| Màn hình | Chức năng |
|---|---|
| Tab **Văn bản pháp luật** | Biểu đồ số văn bản theo tình trạng hiệu lực; tìm kiếm (không dấu) theo số hiệu, tên, cơ quan ban hành, từ khóa; lọc theo loại văn bản / tình trạng; phân trang; mở chi tiết văn bản |
| Thêm văn bản pháp luật (drawer) | Nhập thông tin văn bản, công báo & người ký, ngày hiệu lực, từ khóa; thêm nhanh loại văn bản / lĩnh vực / cơ quan ban hành; đính kèm tệp PDF / Word |
| Cập nhật văn bản pháp luật (drawer) | Xem thông tin ban hành & hiệu lực; bấm vào ô để sửa trực tiếp (ô đã sửa được đánh dấu "Đã sửa"); sửa từ khóa; thêm tệp, xem trước, tải tệp; lưu / hủy thay đổi; lịch sử thay đổi của văn bản |
| Tab **Lịch sử thay đổi** | Ai đã thao tác trên thư viện, vào lúc nào, đổi gì; lọc theo ngày; phân trang |

---

## Tổng hợp API

| # | Chức năng | Endpoint | Backend | Component gọi |
|---|---|---|---|---|
| 1 | Danh sách văn bản | `GET /legal-documents` | ⚠ | LegalDocumentsTab (biểu đồ, thanh lọc, danh sách), CreateDocumentDrawer, DocumentInfoTable |
| 2 | Chi tiết văn bản | `GET /legal-documents/:id` | ⚠ | DocumentDetailDrawer |
| 3 | Thêm văn bản | `POST /legal-documents` | ⚠ | CreateDocumentDrawer |
| 4 | Sửa văn bản | `PATCH /legal-documents/:id` | ⚠ | DocumentDetailDrawer |
| 5 | Tải tệp lên | `POST /legal-documents/files` | ⚠ | CreateDocumentDrawer, DocumentFilesSection |
| 6 | Tải tệp về / xem trước | `GET /legal-documents/:id/files/:fileId` | ⚠ | DocumentFilesSection, FilePreviewModal |
| 7 | Lịch sử của một văn bản | `GET /audit-logs?module=legal_library&targetId=` | ⚠ | DocumentHistorySection |
| 8 | Lịch sử thay đổi của thư viện | `GET /audit-logs?module=legal_library&date=` | ⚠ (route đã có, chưa nhận module này) | LegalHistoryTab |

Backend chưa có module văn bản pháp lý; mới có 2 quyền `legal_library:view` và `legal_library:input` trong `permission-catalog.ts`. Cả 8 API đều là đề xuất.

---

## A. Danh sách & chi tiết văn bản

### 1. Danh sách văn bản ⚠

- **FE:** `getDocuments()` → `useLegalDocuments()`
- **Component:** LegalDocumentsTab (LegalStatsChart, LegalDocumentToolbar, LegalDocumentList), CreateDocumentDrawer (danh sách loại văn bản / lĩnh vực / cơ quan đã có), DocumentInfoTable (ô chọn loại văn bản)
- Hiện FE tải hết rồi lọc / sắp xếp / phân trang ở máy (`utils/legal-document-filters.ts`). Khi dữ liệu lớn nên chuyển sang query bên dưới.

**Request**
```
GET /legal-documents
Query:
  q?: string                                          // tìm theo số hiệu, tên, cơ quan ban hành, từ khóa (không phân biệt dấu)
  category?: "LAW" | "RESOLUTION" | "DECREE" | "CIRCULAR" | "DECISION" | "LOCAL" | "TEMPLATE" | string
  status?: "EFFECTIVE" | "EXPIRING" | "PARTIAL" | "EXPIRED"
  page?: number, limit?: number
```
Bỏ trống `category` / `status` = tất cả. Sắp xếp: theo thứ bậc loại văn bản (Luật → Nghị quyết → Nghị định → Thông tư → Quyết định → Văn bản địa phương → Biểu mẫu → loại tự thêm), cùng loại thì `updatedAt` mới nhất trước. Văn bản vừa thêm trong phiên do FE tự đưa lên đầu.

**Response**
```json
{
  "status": true,
  "statusCode": 200,
  "data": {
    "items": [
      {
        "id": "L-01",
        "code": "45/2019/QH14",
        "title": "Bộ luật Lao động",
        "category": "LAW",
        "issuer": "Quốc hội",
        "signer": "Nguyễn Thị Kim Ngân",
        "gazetteNumber": "993&994-12/2019",
        "gazetteDate": "2019-12-30",
        "field": "Lao động-Tiền lương",
        "issueDate": "2019-11-20",
        "effectiveDate": "2021-01-01",
        "expiredDate": null,
        "status": "EFFECTIVE",
        "tags": ["Lao động", "Tiền lương"],
        "fileType": "PDF",
        "fileSize": "2.4 MB",
        "updatedAt": "2026-10-20"
      }
    ],
    "meta": { "page": 1, "limit": 20, "total": 12, "totalPages": 1 },
    "statusCounts": { "EFFECTIVE": 8, "EXPIRING": 1, "PARTIAL": 1, "EXPIRED": 2 }
  }
}
```
- `category`: loại có sẵn (mã ở trên) hoặc loại người dùng tự thêm (lưu bằng chính tên loại, vd `"Công văn"`)
- `status`: `EFFECTIVE` Còn hiệu lực · `EXPIRING` Sắp hết hiệu lực · `PARTIAL` Hết hiệu lực một phần · `EXPIRED` Hết hiệu lực
- `statusCounts`: số liệu cho biểu đồ tình trạng (tính trên toàn thư viện, không theo bộ lọc)

### 2. Chi tiết văn bản ⚠

- **FE:** `getDocument(id)` → `useLegalDocument(id)`
- **Component:** DocumentDetailDrawer (truyền xuống DocumentTitleCard, DocumentInfoTable, DocumentTagsSection, DocumentFilesSection, DocumentHistorySection)

**Request**
```
GET /legal-documents/:id
```

**Response:** như một phần tử của mục 1, thêm:
```json
{
  "scope": "Lao động-Tiền lương",
  "summary": "",
  "files": [
    {
      "id": "f1a2...",
      "name": "45_2019_QH14.pdf",
      "size": "2.4 MB",
      "type": "PDF",
      "url": "/api/v1/legal-documents/L-01/files/f1a2...",
      "updatedAt": "2026-10-20T08:30:00.000Z"
    }
  ]
}
```
Văn bản chưa có tệp nào: FE hiện một "tệp gốc" ảo dựng từ thông tin văn bản (`getDisplayFiles`).

**Lỗi:** `404 "Không tìm thấy văn bản."`

---

## B. Thêm & sửa văn bản

### 3. Thêm văn bản ⚠

- **FE:** `createDocument(input)` → `useCreateLegalDocument()`
- **Component:** CreateDocumentDrawer (nút "Thêm văn bản")

**Kiểm tra phía FE** (`validateLegalForm`), backend cần kiểm tra lại:
- Bắt buộc: số hiệu (`code`), cơ quan ban hành (`issuer`)
- `effectiveDate` ≥ `issueDate`; `expiredDate` ≥ `effectiveDate`
- Bỏ trống tên → `"{Loại văn bản} số {số hiệu}"`; bỏ trống từ khóa → `["Pháp lý", "Quy chuẩn", "Ban QLDA"]`

**Request**
```
POST /legal-documents
```
```json
{
  "code": "10/2021/NĐ-CP",
  "title": "Nghị định về quản lý chi phí đầu tư xây dựng",
  "category": "DECREE",
  "field": "Xây dựng",
  "issuer": "Chính phủ",
  "gazetteNumber": "289&290/2021",
  "gazetteDate": "2021-02-20",
  "signer": "Trịnh Đình Dũng",
  "issueDate": "2021-02-09",
  "effectiveDate": "2021-02-09",
  "expiredDate": null,
  "status": "EFFECTIVE",
  "tags": ["Chi phí", "Đầu tư xây dựng"],
  "fileIds": ["f1a2...", "f3b4..."]
}
```
- `category`, `field`, `issuer`: chọn trong danh sách hoặc gõ mới ở ô "+ Thêm" (giá trị mới gửi kèm luôn, không cần API riêng)
- `fileIds`: mã tệp đã tải lên ở mục 5

**Response**
```json
{ "status": true, "statusCode": 201, "data": { "id": "DOC-1761550000000", "...": "như mục 2", "updatedAt": "2026-10-27" } }
```

**Lỗi:** `400 "Vui lòng nhập số hiệu văn bản"`, `400 "Ngày áp dụng (có hiệu lực) không được trước ngày ban hành."`, `400 "Ngày hết hiệu lực không được trước ngày bắt đầu có hiệu lực."`, `409 "Số hiệu văn bản đã tồn tại"`

Thêm xong FE đóng drawer, đưa văn bản lên đầu danh sách và ghi nhật ký `"Thêm văn bản: {số hiệu}"`.

### 4. Sửa văn bản ⚠

- **FE:** `updateDocument(id, patch)` → `useUpdateLegalDocument()`
- **Component:** DocumentDetailDrawer (nút "Lưu thay đổi", có hộp xác nhận). Các ô sửa ghi vào bản nháp (`useDocumentDraft`): DocumentInfoTable, DocumentTagsSection, DocumentFilesSection. Đóng drawer khi còn thay đổi chưa lưu sẽ hỏi lại.

**Request** — chỉ gửi trường thay đổi; gửi `null` để xóa giá trị
```
PATCH /legal-documents/:id
```
```json
{
  "status": "PARTIAL",
  "expiredDate": "2026-12-31",
  "tags": ["Chi phí", "Đầu tư xây dựng", "Dự toán"],
  "fileIds": ["f1a2...", "f3b4...", "f5c6..."]
}
```
Trường sửa được: `issuer`, `gazetteNumber`, `code`, `gazetteDate`, `category`, `signer`, `issueDate`, `expiredDate`, `effectiveDate`, `status`, `field`, `tags`, `fileIds` (gửi toàn bộ danh sách tệp sau khi thêm).

**Response:** văn bản sau khi lưu (như mục 2), `updatedAt` là ngày lưu.

**Lỗi:** như mục 3, thêm `404 "Không tìm thấy văn bản."`

FE báo `"Đã lưu N thay đổi của văn bản {số hiệu}."` và ghi nhật ký `"Cập nhật văn bản: {số hiệu}"` kèm từng dòng "cũ → mới" (`describeLegalChanges`).

---

## C. Tệp đính kèm

### 5. Tải tệp lên ⚠

- **FE:** hiện giữ đối tượng `File` trong bộ nhớ (`rawFile`), chưa gửi đi
- **Component:** CreateDocumentDrawer (StandardFileUpload), DocumentFilesSection (nút "Thêm tệp đính kèm")
- Chỉ nhận `.pdf`, `.doc`, `.docx`

**Request**
```
POST /legal-documents/files
Content-Type: multipart/form-data
file: <tệp>
```

**Response**
```json
{
  "status": true,
  "statusCode": 201,
  "data": { "id": "f5c6...", "name": "Phu_luc_01.docx", "size": "184 KB", "type": "DOCX", "updatedAt": "2026-10-27T09:12:00.000Z" }
}
```

**Lỗi:** `400 "Chỉ hỗ trợ tệp PDF hoặc Word (.doc, .docx)."`, `413 "Tệp vượt quá dung lượng cho phép"`

Tệp chỉ gắn vào văn bản khi gửi `fileIds` ở mục 3 / mục 4.

### 6. Tải tệp về / xem trước ⚠

- **FE:** `downloadLegalFile(document, file)`; xem trước bằng FilePreviewModal (PDF hiện từng trang qua PdfPagesViewer)
- **Component:** DocumentFileItem (nút xem / tải), DocumentFilesSection, FilePreviewModal

**Request**
```
GET /legal-documents/:id/files/:fileId
Query: inline?: boolean     // true = mở xem trước, false = tải về
```
Trả về nội dung tệp (`application/pdf` hoặc Word). Hiện FE tải tệp vừa chọn từ máy, hoặc một tệp chữ tóm tắt thông tin văn bản cho tệp mẫu chưa có tệp thật.

**Lỗi:** `404 "Không tìm thấy tệp"`

---

## D. Lịch sử thay đổi

Mỗi dòng nhật ký có dạng chung với Nhân sự & Phân công:

```json
{
  "id": "e7a1...",
  "at": "2026-10-27T08:15:00.000Z",
  "actorName": "Huỳnh Thái Hải",
  "actorRole": "Giám đốc",
  "module": "legal_library",
  "action": "Cập nhật văn bản: 10/2021/NĐ-CP",
  "targetId": "L-04",
  "targetName": "Nghị định về quản lý chi phí đầu tư xây dựng",
  "changes": [
    { "label": "Tình trạng hiệu lực", "from": "Còn hiệu lực", "to": "Hết hiệu lực một phần" },
    { "label": "Ngày hết hiệu lực", "from": "Chưa có", "to": "31/12/2026" }
  ]
}
```
Backend nên ghi nhật ký ngay trong API thêm / sửa (mục 3, 4) thay vì để FE ghi.

### 7. Lịch sử của một văn bản ⚠

- **FE:** `getDocumentHistory(getPersonnelActivities(), document)` (hiện đọc từ localStorage)
- **Component:** DocumentHistorySection (cuối drawer cập nhật văn bản)

**Request**
```
GET /audit-logs
Query: module=legal_library, targetId=L-04
```

**Response:** `data` là mảng dòng nhật ký như trên, mới nhất lên đầu. Văn bản chưa có dòng "Thêm văn bản" (văn bản nhập sẵn) thì FE tự thêm dòng "Tiếp nhận & đưa vào thư viện" theo ngày ban hành.

### 8. Lịch sử thay đổi của thư viện ⚠

- **FE:** `getPersonnelActivities()` lọc `module = "Thư viện pháp lý"` (hiện đọc từ localStorage)
- **Component:** LegalHistoryTab (tab "Lịch sử thay đổi", dùng ActivityDateFilter + ActivityTimeline của Nhân sự)
- Route `GET /audit-logs` đã có nhưng `AuditQueryDto` chỉ nhận `module=permissions` và yêu cầu quyền `ROLE_MANAGE`. Cần thêm `legal_library` vào `@IsIn(...)` và cho quyền `legal_library:view` xem nhật ký của module này.

**Request**
```
GET /audit-logs
Query: module=legal_library, date?: "2026-10-27"
```

**Response:** `data` là mảng dòng nhật ký như trên, mới nhất lên đầu. FE phân trang ở máy.

---

## Phân quyền thao tác

Quyền người đăng nhập lấy từ `permissions` trả về lúc đăng nhập (không gọi API riêng). FE dùng `useLegalPermissions()` / `useCanManageLegalDocuments()` để ẩn / hiện nút; backend kiểm tra lại bằng `PermissonGuard`.

| Thao tác | Quyền cần | Component kiểm tra |
|---|---|---|
| Vào màn hình, xem danh sách / chi tiết, xem trước & tải tệp, xem lịch sử | `legal_library:view` | LegalAiLibraryScreen (route `/legal-ai-library` trong `access-control.ts`) |
| Thêm văn bản, sửa văn bản, thêm tệp đính kèm | `legal_library:input` | LegalDocumentsTab (nút "Thêm văn bản"), DocumentDetailDrawer (ô sửa, nút "Lưu thay đổi") |

Không có quyền `input` thì drawer chi tiết chỉ xem, không bấm sửa được. Mọi thao tác ghi đều được lưu nhật ký (ai, lúc nào, thay đổi gì) để hiển thị ở mục 7 và mục 8.
