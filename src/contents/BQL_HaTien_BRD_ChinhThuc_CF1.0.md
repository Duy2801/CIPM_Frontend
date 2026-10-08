# ỦY BAN NHÂN DÂN PHƯỜNG HÀ TIÊN · TỈNH KIÊN GIANG
## BAN QUẢN LÝ DỰ ÁN ĐẦU TƯ XÂY DỰNG HÀ TIÊN

---
*Hợp tác phát triển phần mềm bởi **FIMI TECH Co., Ltd***

# TÀI LIỆU YÊU CẦU NGHIỆP VỤ
### Business Requirements Document (BRD)
## HỆ THỐNG QUẢN LÝ DỰ ÁN ĐẦU TƯ XÂY DỰNG
**Phiên bản Chính thức · 22/03/2026**

| Mã tài liệu | Phiên bản | Trạng thái |
| :--- | :--- | :--- |
| **BQL-BRD-2026-003** | **Chính thức 1.0** | **✓ CHÍNH THỨC** |

---

### Lịch sử thay đổi tài liệu

| Phiên bản | Ngày | Loại thay đổi | Nội dung | Người thực hiện |
| :---: | :---: | :--- | :--- | :--- |
| **1.0** | 13/03/2026 | Phát hành lần đầu | 5 module cơ bản: Dashboard, Dự án, Thủ tục, Tài chính, Nhân sự | FIMI TECH |
| **2.0** | 22/03/2026 | Cập nhật lớn | Thêm M6 GPMB, M7 Đấu thầu, M8 Bảo hành, M9 Pháp lý + AI; Cập nhật M3, M4 | BQL + FIMI |
| **CF 1.0** | 22/03/2026 | CHÍNH THỨC | Phiên bản chính thức sau khi hệ thống web được nghiệm thu prototype và phê duyệt BRD | BQL & FIMI TECH |

---

### Phê duyệt tài liệu

| Đại diện Chủ đầu tư – BQL ĐTXD Hà Tiên | Đại diện Đơn vị phát triển – FIMI TECH |
| :--- | :--- |
| **Chức vụ:** Giám đốc<br>**Họ tên:** Huỳnh Thái Hải<br>**Ngày:** ___/___/2026<br>**Chữ ký:** _________________________ | **Chức vụ:** Giám đốc<br>**Họ tên:** Nguyễn Minh Quang<br>**Ngày:** ___/___/2026<br>**Chữ ký:** _________________________ |

---

## 1. TỔNG QUAN TÀI LIỆU

### 1.1 Mục đích
Tài liệu này là Yêu cầu Nghiệp vụ Chính thức (BRD – Business Requirements Document) cho Hệ thống Quản lý Dự án Đầu tư Xây dựng Hà Tiên, được xây dựng bởi FIMI TECH Co., Ltd theo yêu cầu của Ban Quản lý Dự án Đầu tư Xây dựng Hà Tiên (BQL ĐTXD Hà Tiên). Tài liệu mô tả toàn bộ yêu cầu nghiệp vụ, phạm vi chức năng, quy tắc xử lý, phân quyền người dùng, và lộ trình triển khai của hệ thống, là cơ sở pháp lý và kỹ thuật để các bên thực hiện hợp đồng phát triển phần mềm.

### 1.2 Phạm vi áp dụng
Tài liệu này áp dụng cho toàn bộ quá trình thiết kế, phát triển, kiểm thử, nghiệm thu và vận hành Hệ thống Quản lý Dự án ĐTXD Hà Tiên, bao gồm:
- Hệ thống ứng dụng web chạy trên trình duyệt (không cần cài đặt)
- Cơ sở dữ liệu và hệ thống lưu trữ hồ sơ
- 9 Module chức năng nghiệp vụ (M1 – M9)
- Tính năng AI hỗ trợ kết xuất báo cáo (Module M9)

### 1.3 Tài liệu tham chiếu

| TT | Tên tài liệu | Số/ký hiệu | Ngày |
| :---: | :--- | :--- | :---: |
| 1 | Quyết định thành lập BQL ĐTXD Hà Tiên | QĐ số 77/QĐ-UBND | 01/07/2025 |
| 2 | Thông báo phân công nhiệm vụ 2026 | TB số 02/TB-BQL | 12/01/2026 |
| 3 | Quy trình thủ tục XDCB (dự thảo bổ sung) | Nội bộ BQL | 21/07/2025 |
| 4 | Phụ lục I – Quy trình GPMB 16 bước | Kèm CV Sở NN&MT Kiên Giang | 2025 |
| 5 | Bảng tổng hợp ý kiến góp ý phần mềm QLDA | Nội bộ BQL | 20/03/2026 |
| 6 | Luật Xây dựng 2014 (sửa đổi 2020) | Luật số 50/2014/QH13 | 2014–2020 |
| 7 | Luật Đấu thầu | Luật số 22/2023/QH15 | 2023 |
| 8 | Luật Đất đai | Luật số 31/2024/QH15 | 2024 |
| 9 | NĐ về quản lý dự án ĐTXD | NĐ số 24/2024/NĐ-CP | 2024 |

---

## 2. BỐI CẢNH VÀ SỰ CẦN THIẾT

### 2.1 Thực trạng quản lý hiện tại
Ban Quản lý Dự án Đầu tư Xây dựng Hà Tiên được thành lập theo Quyết định số 77/QĐ-UBND ngày 01/07/2025, với biên chế 25 người (22 viên chức và 3 hợp đồng theo NĐ 111/2022), gồm Ban Giám đốc 3 người và 4 tổ chuyên môn.

Đơn vị hiện quản lý 12 dự án đầu tư xây dựng công cộng với tổng vốn lên đến hàng trăm tỷ đồng, gồm các công trình giao thông, hạ tầng kỹ thuật, dân dụng, thủy lợi và khu tái định cư. Hoạt động quản lý hiện nay có các hạn chế chính:
- **Hồ sơ và số liệu phân tán:** mỗi tổ lưu riêng bằng file Excel, email, hồ sơ giấy; không có nơi tổng hợp duy nhất.
- **Tiến độ cập nhật chậm:** Báo cáo tiến độ hàng tuần phải tổng hợp thủ công, thường chậm 2–3 ngày.
- **Thiếu cảnh báo sớm:** Không có cơ chế tự động cảnh báo khi dự án có nguy cơ chậm tiến độ hoặc gần đến hạn nộp hồ sơ.
- **Quản lý GPMB phân tán:** 89 hộ dân thuộc 2 dự án lớn được theo dõi bằng Excel, không có ma trận trạng thái tổng thể.
- **Lập báo cáo tốn nhiều thời gian:** Các báo cáo định kỳ gửi UBND phường cần 1–2 ngày để tổng hợp.
- **Phân quyền chưa rõ ràng:** Chưa có phân quyền kỹ thuật giữa người nhập liệu tài chính và người duyệt.

### 2.2 Mục tiêu xây dựng hệ thống

> **MỤC TIÊU TỔNG QUÁT**  
> Xây dựng hệ thống thông tin quản lý dự án đầu tư xây dựng tập trung, giúp Ban QLDA ĐTXD Hà Tiên quản lý đồng bộ, minh bạch và hiệu quả toàn bộ vòng đời dự án từ chủ trương đến quyết toán và bảo hành.

**Các mục tiêu cụ thể:**
- **Tập trung hóa:** Toàn bộ dữ liệu dự án, hồ sơ, tài chính, GPMB, đấu thầu, bảo hành trên một nền tảng duy nhất.
- **Theo dõi thời gian thực:** Tiến độ, giải ngân, thủ tục được cập nhật và hiển thị tức thì.
- **Cảnh báo chủ động:** Hệ thống tự động phát hiện và thông báo khi có nguy cơ chậm tiến độ, quá hạn.
- **Quy trình hóa:** Số hóa toàn bộ quy trình thủ tục XDCB và GPMB, đảm bảo tuân thủ pháp luật.
- **Phân quyền chặt chẽ:** Mỗi vai trò chỉ được truy cập đúng chức năng theo phân công.
- **Hỗ trợ AI:** Tự động kết xuất báo cáo lời, giảm tải công việc hành chính.

---

## 3. PHẠM VI HỆ THỐNG

### 3.1 Tổng quan 9 module
Hệ thống gồm 9 module chức năng, chia thành 2 nhóm:

| Mã | Module | Mô tả | Nhóm | Trạng thái |
| :---: | :--- | :--- | :---: | :---: |
| **M1** | Bảng điều khiển | Tổng hợp KPI, cảnh báo, hoạt động gần đây, biểu đồ giải ngân | Cốt lõi | Cốt lõi |
| **M2** | Dự án & Công trình | Quản lý danh mục, tiến độ, lịch sử cập nhật từng dự án | Cốt lõi | Cốt lõi |
| **M3** | Hồ sơ Thủ tục XDCB | Quy trình động 16+ bước, bước điều kiện, đính kèm hồ sơ | Cốt lõi | Cốt lõi |
| **M4** | Tài chính & Quyết toán | Kế hoạch vốn, giải ngân 2 cấp duyệt, hợp đồng, tất toán KBNN | Cốt lõi | Cốt lõi |
| **M5** | Nhân sự & Phân công | Cơ cấu tổ chức, phân công nhiệm vụ, quản lý quyền hệ thống | Cốt lõi | Cốt lõi |
| **M6** | GPMB – Bồi thường TĐC | 16 bước GPMB, ma trận hộ dân × bước, 9 biểu mẫu chuẩn | Mới v2.0 | MỚI |
| **M7** | Quản lý Đấu thầu | 9 bước KHLCNT, quản lý gói thầu theo Luật Đấu thầu 2023 | Mới v2.0 | MỚI |
| **M8** | Bảo hành & Bảo trì | Đếm ngược bảo hành, cảnh báo 3 mức, quản lý khắc phục sự cố | Mới v2.0 | MỚI |
| **M9** | Thư viện Pháp lý + AI | Văn bản QPPL, biểu mẫu chuẩn, AI kết xuất báo cáo lời tự động | Mới v2.0 | MỚI + AI |

### 3.2 Đối tượng người dùng

| Vai trò | Người dùng | Số lượng | Quyền truy cập chính |
| :--- | :--- | :---: | :--- |
| **Quản trị hệ thống** | Giám đốc Huỳnh Thái Hải | 1 | Toàn quyền xem, duyệt, cấu hình, xuất báo cáo |
| **Phó quản lý** | 2 Phó Giám đốc | 2 | Xem + nhập dữ liệu dự án phụ trách + duyệt M6 |
| **Kỹ thuật** | Tổ Giám sát – KT (10 người) | 10 | Nhập tiến độ, hồ sơ kỹ thuật, M3, M7, M8 |
| **Kế toán trưởng** | Đặng Thị Kim Ngân | 1 | Duyệt M4, xem toàn bộ tài chính |
| **Kế toán viên** | Nguyễn Thị Thúy Hà + 1 | 2 | Nhập liệu M4 (chờ KT trưởng duyệt) |
| **Bồi thường** | Tổ Bồi thường – GT – TĐC | 4 | Toàn quyền Module M6 – GPMB |
| **Hành chính** | Tổ HC-TH (không phải kế toán) | 3 | Chỉ xem M4, nhập M3, xem M2 |

---

## 4. MÔ TẢ CHI TIẾT CHỨC NĂNG TỪNG MODULE

### M1 – BẢNG ĐIỀU KHIỂN (DASHBOARD)

#### 4.1.1 Mô tả chức năng
Màn hình tổng hợp đầu tiên hiện ra khi người dùng đăng nhập. Cung cấp cái nhìn nhanh về toàn bộ hoạt động của Ban QLDA, tập trung vào các chỉ số quan trọng nhất và những vấn đề cần xử lý ngay.

#### 4.1.2 Thành phần chức năng
**a) Thẻ KPI**

| Thẻ KPI | Chỉ số hiển thị | Nguồn dữ liệu | Màu cảnh báo |
| :--- | :--- | :--- | :--- |
| **Tổng dự án** | Số dự án đang quản lý | Module M2 | Xanh teal |
| **Giải ngân 2026** | Tỷ đồng đã GN / % kế hoạch | Module M4 | Vàng gold |
| **Chậm tiến độ** | Số dự án chậm ≥ 25% so KH | Module M2 | Đỏ – cảnh báo cao |
| **Hoàn thành** | Số công trình đã nghiệm thu | Module M2 | Xanh lá |
| **Hộ dân GPMB** | Đã chi trả / Tổng hộ dân | Module M6 | Xanh dương |

**b) Bảng cảnh báo (Alert Panel)**  
Tự động tổng hợp tối đa 10 cảnh báo, phân 4 mức độ:
- **Đỏ – Khẩn cấp:** Dự án chậm ≥ 30 ngày, thanh toán quá hạn, hộ dân cần cưỡng chế.
- **Cam – Quan trọng:** GPMB quá hạn pháp lý, hạn nộp hồ sơ ≤ 7 ngày.
- **Vàng – Chú ý:** Bảo hành sắp hết hạn ≤ 90 ngày, hạn hồ sơ ≤ 14 ngày.
- **Xanh – Thông tin:** Có văn bản pháp luật mới, hoạt động thay đổi trạng thái.

**c) Biểu đồ giải ngân theo quý**  
So sánh giải ngân thực tế với kế hoạch năm theo từng quý. Hiển thị thanh kế hoạch và thanh thực tế song song cho mỗi quý.

**d) Nhật ký hoạt động**  
20 hoạt động gần nhất trong hệ thống: ai làm gì, lúc mấy giờ. Bấm vào để xem chi tiết.

#### 4.1.3 Quy tắc nghiệp vụ
- Ngưỡng cảnh báo chậm tiến độ: tiến độ thực tế thấp hơn kế hoạch ≥ 15% → Cần theo dõi; ≥ 25% → Chậm tiến độ; ≥ 40% → Khẩn cấp.
- Dashboard tự làm mới mỗi 15 phút và khi người dùng nhấn nút làm mới.
- Chỉ hiển thị dữ liệu thuộc phạm vi quyền truy cập của người dùng đăng nhập.

---

### M2 – DỰ ÁN & CÔNG TRÌNH

#### 4.2.1 Danh sách dự án
- Phân tab theo trạng thái: *Tất cả / Chuẩn bị ĐT / Thiết kế / Đấu thầu / Thi công / Bồi thường / Nghiệm thu / Quyết toán / Hoàn thành*.
- Tìm kiếm full-text, sắp xếp đa chiều.
- Xuất danh sách ra CSV / Excel.

#### 4.2.2 Thông tin dự án

| Nhóm trường | Danh sách trường | Ràng buộc / Ghi chú |
| :--- | :--- | :--- |
| **Thông tin cơ bản** | Tên công trình, Loại công trình, Mã dự án (tự sinh) | Bắt buộc; Mã = `BQL-DA-[YYYY]-[###]` |
| **Vốn đầu tư** | Nguồn vốn, Tổng mức ĐT, Kế hoạch vốn 2026 | Đơn vị tỷ đồng, 2 chữ số thập phân |
| **Nhân sự** | Người phụ trách chính, Người giám sát KT | Chọn từ danh sách M5 |
| **Thời gian** | Ngày bắt đầu, Ngày kết thúc kế hoạch | Ngày KT phải sau ngày BĐ |
| **Tiến độ** | Giai đoạn hiện tại, Tiến độ thực tế (%), Tiến độ kế hoạch (%) | 0–100; chênh lệch tính cờ trạng thái |

#### 4.2.3 Cập nhật tiến độ
Tổ Giám sát – KT cập nhật tiến độ hàng tuần (thứ 2) qua form chuyên dụng. Mỗi lần cập nhật lưu vào lịch sử: ngày cập nhật, người cập nhật, giá trị cũ, giá trị mới, ghi chú.

#### 4.2.4 Quy tắc nghiệp vụ
- Chỉ người phụ trách dự án, Tổ Giám sát – KT, và Ban Giám đốc được cập nhật tiến độ.
- Không được xóa dự án đã có phát sinh tài chính. Chỉ được chuyển trạng thái "Đóng".
- Khi tiến độ đạt 100%, bắt buộc nhập ngày hoàn thành thực tế.

---

### M3 – HỒ SƠ THỦ TỤC XDCB (QUY TRÌNH ĐỘNG)

#### 4.3.1 Nguyên tắc quy trình động
> **ĐỔI MỚI v2.0**  
> Thay thế quy trình 7 bước cố định bằng quy trình động với bước điều kiện (có thể bật/tắt) và biên độ thời gian linh hoạt. Phù hợp với thực tế đa dạng của từng dự án.

#### 4.3.2 Cấu trúc quy trình

| B. | Tên bước / Bước con | Biên độ thời gian | Loại | Đơn vị thực hiện |
| :---: | :--- | :---: | :---: | :--- |
| **I** | Phê duyệt chủ trương đầu tư | 5–10 ngày | Bắt buộc | Chủ đầu tư + HĐ TĐ Phường |
| **II** | Lập nhiệm vụ KS, BCNCKT/BCKTKT | 5–7 ngày | Bắt buộc | Chủ đầu tư + TV |
| **II.1** | Chỉ định thầu TV BCNCKT/BCKTKT | 5–10 ngày | Điều kiện | Chủ đầu tư |
| **III** | Đấu thầu TV (chi phí >500 triệu) | 40–45 ngày | Điều kiện | Chủ đầu tư + TV đấu thầu |
| **IV** | TV lập hồ sơ BCNCKT/BCKTKT | 15–60 ngày | Bắt buộc | Tư vấn lập |
| **IV.1** | Thẩm tra BCNCKT/BCKTKT | 10–20 ngày | Bắt buộc | Tư vấn thẩm tra |
| **IV.2** | Thẩm định giá | 7–15 ngày | Điều kiện | Cơ quan thẩm định giá |
| **IV.3** | Lấy ý kiến các sở/ban/ngành (PCCC, ĐTM...) | Theo yêu cầu | Điều kiện | Cơ quan chuyên ngành |
| **V** | Thẩm định & phê duyệt BCNCKT/BCKTKT | ~20 ngày | Bắt buộc | Cơ quan chuyên môn |
| **V.1** | Thẩm định TKBVTC | ~20 ngày | Điều kiện | Cơ quan chuyên môn |
| **V.2** | Chỉ định thầu xây lắp | 5–7 ngày | Điều kiện | Chủ đầu tư |
| **VI** | Đấu thầu xây lắp | 30–45 ngày | Bắt buộc | Chủ đầu tư + TV đấu thầu |
| **VI.1** | Thi công – Giám sát kỹ thuật | Theo HĐ | Bắt buộc | NT + TVGS + Chủ đầu tư |
| **VI.2** | Nghiệm thu hoàn thành | Theo HĐ | Bắt buộc | NT + Chủ đầu tư |
| **VI.3** | Kiểm toán độc lập | Theo HĐ | Điều kiện | Tổ chức kiểm toán |
| **VII** | Quyết toán – Bảo hành | Theo HĐ | Bắt buộc | Chủ đầu tư + NT |

#### 4.3.3 Quy tắc nghiệp vụ
- Không thể chuyển sang bước kế tiếp khi bước hiện tại chưa hoàn thành, trừ khi đánh dấu "Bỏ qua" kèm lý do bằng văn bản.
- Khi còn ≤ 7 ngày đến hạn kế hoạch của một bước mà chưa hoàn thành: cảnh báo vàng.
- Khi quá hạn kế hoạch: cảnh báo đỏ, hiển thị nổi bật Dashboard.
- Mỗi bước bắt buộc phải đính kèm ít nhất 1 văn bản trước khi đánh dấu hoàn thành.
- Lịch sử thay đổi trạng thái các bước được lưu trữ vĩnh viễn, không thể xóa.

---

### M4 – TÀI CHÍNH & QUYẾT TOÁN

#### 4.4.1 Sơ đồ phân quyền tài chính 2 cấp
> **CẬP NHẬT v2.0**  
> Kế toán viên nhập liệu các đợt giải ngân và đề nghị thanh toán → Kế toán trưởng xem xét và duyệt → Giám đốc phê duyệt cuối cùng. Phù hợp phân công thực tế tại Tổ HC-TH.

#### 4.4.2 Các chức năng chính
**a) Quản lý kế hoạch vốn**
- Nhập kế hoạch vốn từng năm cho từng dự án, phân theo nguồn.
- Điều chỉnh kế hoạch giữa năm kèm văn bản phê duyệt.

**b) Theo dõi giải ngân**

| Trường dữ liệu | Mô tả | Ràng buộc |
| :--- | :--- | :--- |
| **Dự án** | Liên kết đến dự án trong M2 | Bắt buộc |
| **Bên nhận thanh toán** | Nhà thầu / TV / Chi trả BT | Bắt buộc |
| **Nội dung thanh toán** | Mô tả theo đề nghị TT và HĐ | Bắt buộc |
| **Số tiền** | Đơn vị tỷ đồng, 3 chữ số thập phân | > 0; không vượt HĐ còn lại |
| **Số HĐ liên kết** | Hợp đồng đã ký trong hệ thống | Khuyến nghị |
| **Ngày ký duyệt** | Ngày Giám đốc ký tờ trình | Bắt buộc |
| **Tài khoản KBNN** | Chọn từ danh mục TK đã khai báo | Bắt buộc |
| **File chứng từ** | Tờ trình, ủy nhiệm chi, biên bản NT | ≥ 1 file trước khi lưu |

**c) Quy trình tất toán tài khoản KBNN (mới v2.0)**
1. Lập hồ sơ đề nghị tất toán (đính kèm QĐ phê duyệt quyết toán).
2. Đối chiếu số liệu lần cuối: tổng giải ngân = quyết toán được duyệt, tạm ứng đã thu hồi hết.
3. Gửi lệnh tất toán tài khoản tại KBNN – hệ thống ghi nhận ngày tất toán.
4. Hoàn trả tiền bảo lãnh bảo hành sau khi hết thời hạn (liên kết M8).
5. Đóng mã dự án trong hệ thống → trạng thái "Đã tất toán".

#### 4.4.3 Quy tắc nghiệp vụ
- Tổng giải ngân theo HĐ không vượt giá trị HĐ (cảnh báo khi vượt 95%).
- Tổng giải ngân toàn dự án không vượt tổng mức đầu tư được phê duyệt.
- Mỗi đợt giải ngân phải có ít nhất 1 file chứng từ trước khi lưu.
- Luồng duyệt bắt buộc: KTV nhập → KT trưởng duyệt → GĐ phê duyệt.
- Hệ thống tự nhắc khi có đợt TT sắp đến hạn (≤ 5 ngày làm việc).

---

### M6 – GPMB: GIẢI PHÓNG MẶT BẰNG – BỒI THƯỜNG – TĐC (MODULE MỚI)

#### 4.6.1 Mô tả
Số hóa toàn bộ quy trình thu hồi đất, bồi thường, hỗ trợ và tái định cư theo Phụ lục I kèm Công văn Sở NN&MT tỉnh Kiên Giang. Đặc điểm cốt lõi: theo dõi đồng thời 89+ hộ dân trong nhiều dự án, mỗi hộ ở bước khác nhau.

#### 4.6.2 Quy trình 16 bước GPMB

| B. | Tên bước | Thời hạn pháp lý | Sản phẩm / Biểu mẫu bắt buộc |
| :---: | :--- | :--- | :--- |
| **1** | Xây dựng kế hoạch thu hồi đất | Không quy định | Kế hoạch thu hồi đất |
| **2** | Họp phổ biến với người có đất | Không quy định | Biên bản họp dân (Mẫu 01) |
| **3** | Thông báo thu hồi đất | Không quy định | Thông báo (Mẫu 02, 02.1, 02.2) |
| **4** | Điều tra, đo đạc, kiểm đếm | ≤ 30 ngày | Biên bản kiểm kê (Mẫu 03, 03.1, 03.2, 03.3) |
| **5** | Lập phương án BT-HT-TĐC | Không quy định | Dự thảo phương án |
| **6** | Niêm yết công khai phương án | 10 ngày (BẮT BUỘC) | Biên bản niêm yết (Mẫu 04, 04.1) |
| **7** | Lấy ý kiến về phương án | 30 ngày | BB lấy ý kiến + BB đối thoại |
| **8** | Thẩm định phương án | 30 ngày (BẮT BUỘC) | Biên bản thẩm định |
| **9** | Phê duyệt phương án BT-HT-TĐC | Không quy định | Quyết định phê duyệt (Mẫu 05) |
| **10** | Phổ biến, niêm yết QĐ phê duyệt | Không quy định | Biên bản niêm yết (Mẫu 06) |
| **11** | Gửi phương án đến từng hộ dân | Không quy định | Biên bản giao QĐ (Mẫu 07) |
| **12** | Thực hiện chi trả BT-HT-TĐC | Không quy định | Hồ sơ, biên bản chi trả |
| **13** | Ban hành QĐ thu hồi đất | 10 ngày kể từ đủ ĐK | Quyết định thu hồi đất (Mẫu 08) |
| **14** | Xử lý hộ không đồng ý phương án | ≤ 20 ngày | BB vận động + QĐ thu hồi (Mẫu 08) |
| **15** | Xử lý hộ không bàn giao đất | ≤ 20 ngày | BB vận động + QĐ cưỡng chế (Mẫu 09) |
| **16** | Quản lý đất đã thu hồi | — | Bàn giao đơn vị quản lý |

> **CẢNH BÁO PHÁP LÝ**  
> Các bước có thời hạn pháp lý BẮT BUỘC: Bước 6 (10 ngày), Bước 8 (30 ngày), Bước 13 (10 ngày), Bước 14 và 15 (≤ 20 ngày mỗi bước). Hệ thống phát cảnh báo đỏ ngay khi vượt thời hạn.

#### 4.6.3 Quản lý hộ dân

| Trường dữ liệu | Mô tả | Ràng buộc |
| :--- | :--- | :--- |
| **Mã hộ** | Tự sinh: DA-001-HD-001 | Tự động |
| **Tên chủ hộ + CCCD** | Theo căn cước công dân | Bắt buộc |
| **Diện tích thu hồi (m²)** | Theo biên bản đo đạc, 2 chữ số thập phân | Bắt buộc, > 0 |
| **Loại đất** | ONT / CLN / RSX / HNK / Hỗn hợp | Chọn từ danh mục |
| **Tiền BT theo phương án (tỷ đồng)** | Theo QĐ phê duyệt phương án | Đồng bộ với M4 |
| **Bước hiện tại (1–16)** | Tự cập nhật hoặc nhập thủ công | 1 ≤ giá trị ≤ 16 |
| **Trạng thái đặc biệt** | Bình thường / Không hợp tác / Khiếu kiện / Cưỡng chế | Chọn từ danh mục |
| **Ma trận ô trạng thái** | 16 ô, mỗi ô: trạng thái, ngày, số văn bản, ghi chú | Nhấp vào ô để cập nhật |

#### 4.6.4 Quy tắc nghiệp vụ
- Mỗi hộ dân tiến độ qua 16 bước độc lập. Một dự án có thể có hộ ở bước 12 và hộ khác ở bước 5 cùng lúc.
- Bước 12 (Chi trả) chỉ thực hiện được khi Bước 9 (Phê duyệt phương án) đã hoàn thành.
- Bước 14 và 15 tự động kích hoạt khi đánh dấu "Không hợp tác" ở bước tương ứng.
- Mọi biểu mẫu (Mẫu 01–09) phải có file đính kèm trước khi đánh dấu hoàn thành bước tương ứng.
- Chỉ Tổ Bồi thường nhập/sửa M6; Giám đốc và PGĐ xem toàn bộ.

---

### M7 – QUẢN LÝ ĐẤU THẦU (KHLCNT) – MODULE MỚI

#### 4.7.1 Mô tả
Một dự án gồm nhiều gói thầu độc lập (tư vấn, xây lắp, giám sát, thiết bị...). Module M7 theo dõi tiến độ lựa chọn nhà thầu cho từng gói, theo 9 bước KHLCNT quy định trong Luật Đấu thầu 2023.

#### 4.7.2 Quy trình 9 bước KHLCNT

| B. | Tên bước | Thời gian | Sản phẩm đầu ra |
| :---: | :--- | :---: | :--- |
| **1** | Lập kế hoạch lựa chọn nhà thầu | 5–10 ngày | Dự thảo KHLCNT trình duyệt |
| **2** | Thẩm định, phê duyệt KHLCNT | 7–10 ngày | QĐ phê duyệt KHLCNT |
| **3** | Lập hồ sơ mời thầu (HSMT) | 5–15 ngày | HSMT được phê duyệt |
| **4** | Đăng thông báo mời thầu (qua mạng đấu thầu QG) | Theo quy định | Thông báo mời thầu (muasamcong.mpi.gov.vn) |
| **5** | Phát hành HSMT, tiếp nhận HSDT | Theo HSMT | Danh sách NT đã nộp HS |
| **6** | Mở thầu | 1 ngày | Biên bản mở thầu |
| **7** | Đánh giá hồ sơ dự thầu | 20–30 ngày | Báo cáo đánh giá HSDT |
| **8** | Thẩm định, phê duyệt kết quả LCNT | 7–10 ngày | QĐ phê duyệt kết quả |
| **9** | Thông báo và ký kết hợp đồng | Trong 30 ngày sau QĐ | Hợp đồng xây dựng được ký kết |

#### 4.7.3 Thông tin gói thầu
- Mã gói thầu (tự sinh: `DA-001-GT-001`), Tên gói thầu, Dự án liên kết.
- Hình thức lựa chọn NT: Đấu thầu rộng rãi / Hạn chế / Chỉ định thầu / Mua sắm trực tiếp.
- Loại gói thầu: Xây lắp / Tư vấn thiết kế / TV thẩm tra / TV giám sát / Mua sắm thiết bị.
- Giá gói thầu (theo KHLCNT), Nhà thầu trúng thầu, Giá trúng thầu, Hạn nộp HSDT.
- **Cảnh báo:** khi hạn nộp HSDT còn ≤ 7 ngày → cảnh báo cam; ≤ 3 ngày → cảnh báo đỏ.

---

### M8 – BẢO HÀNH & BẢO TRÌ CÔNG TRÌNH – MODULE MỚI

#### 4.8.1 Thông tin bảo hành

| Trường dữ liệu | Mô tả | Ghi chú |
| :--- | :--- | :--- |
| **Hợp đồng liên kết** | Liên kết từ M4 | |
| **Ngày nghiệm thu hoàn thành** | Ngày bắt đầu tính thời hạn BH | Bắt buộc |
| **Thời hạn bảo hành (tháng)** | Theo điều khoản HĐ (thường 12–24 tháng) | Bắt buộc |
| **Ngày hết hạn bảo hành** | Tự động tính = Ngày NT + Thời hạn BH | Tự động |
| **Đếm ngược (ngày còn lại)** | Hiển thị màu: Xanh > 90 ngày / Vàng ≤ 90 / Đỏ ≤ 30 | Tự động |
| **Giá trị bảo lãnh bảo hành** | Tỷ đồng, theo HĐ (thường 5% giá trị HĐ) | |
| **Ngân hàng phát hành bảo lãnh** | Tên ngân hàng và chi nhánh | |
| **Trạng thái bảo lãnh** | Đang giữ / Đã hoàn trả / Đã thu hồi (vi phạm) | |

#### 4.8.2 Quản lý sự cố bảo hành
Tổ Giám sát – KT ghi nhận và theo dõi từng sự cố trong thời gian bảo hành:
- Ngày phát hiện, mô tả sự cố, vị trí tại công trình.
- Nhà thầu chịu trách nhiệm khắc phục và thời hạn yêu cầu.
- Ngày hoàn thành sửa chữa, biên bản nghiệm thu khắc phục.
- File đính kèm: biên bản ghi nhận, ảnh hiện trường, biên bản NT lại.

---

### M9 – THƯ VIỆN VĂN BẢN PHÁP LÝ + AI – MODULE MỚI

#### 4.9.1 Danh mục văn bản

| Nhóm | Ví dụ văn bản quan trọng | Nguồn cập nhật |
| :--- | :--- | :--- |
| **Luật** | Luật XD 50/2014, Luật ĐT 22/2023, Luật Đất đai 31/2024 | Cổng VBQPPL QG |
| **Nghị định** | NĐ 10/2021 quyết toán ĐTXD, NĐ 24/2024 QLDA | Cổng VBQPPL QG |
| **Thông tư** | TT hướng dẫn lập dự toán, TT thanh toán vốn NSNN | Bộ Xây dựng |
| **Văn bản địa phương** | QĐ UBND tỉnh KG, CV Sở NN&MT | Cập nhật thủ công |
| **Biểu mẫu chuẩn** | Mẫu 01–09 GPMB, mẫu biên bản NT, mẫu HĐ mẫu | BQL nội bộ |

#### 4.9.2 Tính năng AI kết xuất báo cáo
AI hỗ trợ tổng hợp và kết xuất "báo cáo lời" từ dữ liệu thực tế trong hệ thống:
1. Người dùng chọn loại báo cáo và kỳ báo cáo.
2. AI đọc dữ liệu từ M2 (tiến độ), M4 (giải ngân), M6 (GPMB) và điền vào khung mẫu định sẵn.
3. Người dùng xem xét, chỉnh sửa nội dung trước khi ban hành.
4. Xuất file DOCX hoặc PDF sẵn sàng ký duyệt.

> **LƯU Ý TRIỂN KHAI**  
> Giai đoạn đầu, AI kết xuất báo cáo từ dữ liệu nội bộ. Tính năng AI thu thập văn bản pháp lý tự động từ internet là định hướng dài hạn (Phase 2).

---

## 5. MA TRẬN PHÂN QUYỀN NGƯỜI DÙNG

Bảng dưới mô tả đầy đủ quyền truy cập của từng vai trò đối với từng chức năng trong hệ thống:

| Module / Chức năng | GĐ | PGĐ | Tổ KT | KT trưởng | KT viên | Tổ BT |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **M1 – Xem Dashboard** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **M2 – Thêm/xóa dự án** | ✓ | ✓ | — | — | — | — |
| **M2 – Cập nhật tiến độ** | ✓ | ✓ | ✓ | — | — | — |
| **M3 – Cập nhật thủ tục** | ✓ | ✓ | ✓ | — | — | — |
| **M3 – Đính kèm hồ sơ** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **M4 – Nhập giải ngân** | — | — | — | Duyệt | Nhập | — |
| **M4 – Xem tài chính** | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| **M4 – Phê duyệt thanh toán** | ✓ | — | — | ✓ | — | — |
| **M5 – Phân công NV** | ✓ | ✓ | — | — | — | — |
| **M6 – Nhập/sửa GPMB** | — | Xem | — | — | — | ✓ |
| **M6 – Duyệt bước quan trọng** | ✓ | ✓ | — | — | — | Đề xuất |
| **M7 – Quản lý đấu thầu** | ✓ | ✓ | ✓ | — | — | — |
| **M8 – Bảo hành** | Xem | Xem | ✓ | ✓ | — | — |
| **M9 – Thư viện + AI** | ✓ | ✓ | Xem | Xem | Xem | Xem |
| **Xuất báo cáo PDF/Excel** | ✓ | ✓ | DA mình | TC mình | TC mình | BT mình |

*Ghi chú:*
- `✓` : Toàn quyền thao tác
- `Xem` : Chỉ xem, không chỉnh sửa
- `DA/TC/BT mình` : Chỉ xuất dữ liệu thuộc phạm vi phân công
- `—` : Không có quyền truy cập

---

## 6. YÊU CẦU PHI CHỨC NĂNG

### 6.1 Hiệu năng

| Tiêu chí | Yêu cầu |
| :--- | :--- |
| **Tốc độ tải trang** | < 3 giây với kết nối internet thông thường (≥ 5 Mbps) |
| **Người dùng đồng thời** | Tối thiểu 25 người dùng đồng thời không ảnh hưởng hiệu năng |
| **Tải file** | Tối đa 100–500 MB/file (bản vẽ CAD, hồ sơ hoàn công scan) |
| **Dung lượng lưu trữ** | Không giới hạn cứng – tùy cấu hình máy chủ (khuyến nghị ≥ 2TB) |
| **Sẵn sàng (Uptime)** | ≥ 99.5% trong giờ hành chính (7:00–18:00, trừ lịch bảo trì) |

### 6.2 Bảo mật

| Tiêu chí | Yêu cầu |
| :--- | :--- |
| **Xác thực** | Đăng nhập bằng tài khoản + mật khẩu, hỗ trợ 2FA (xác thực 2 yếu tố) |
| **Phiên đăng nhập** | Tự động hết hạn sau 8 giờ không hoạt động |
| **Mã hóa truyền tải** | Toàn bộ dữ liệu qua HTTPS / TLS 1.2+ |
| **Nhật ký truy cập (Audit Log)** | Lưu trữ tối thiểu 2 năm; không thể sửa hoặc xóa |
| **Sao lưu dữ liệu** | Tự động hàng ngày; lưu 30 ngày gần nhất; thêm sao lưu hàng tuần 1 năm |
| **Phân quyền dữ liệu** | Người dùng chỉ thấy/thao tác dữ liệu đúng phạm vi quyền |

### 6.3 Tương thích & Khả dụng

| Tiêu chí | Yêu cầu |
| :--- | :--- |
| **Trình duyệt hỗ trợ** | Chrome 100+, Edge 100+, Firefox 100+ (phiên bản phát hành trong 2 năm gần nhất) |
| **Responsive** | Tương thích màn hình tối thiểu 1280 × 720 px (laptop); hỗ trợ máy tính bảng ≥ 768 px |
| **Cài đặt** | Không yêu cầu cài phần mềm; chạy hoàn toàn trên trình duyệt |
| **Định dạng file hỗ trợ** | PDF, ảnh (JPG/PNG), CAD (.dwg), Office (DOCX/XLSX), ZIP/RAR |
| **Hỗ trợ tiếng Việt** | Toàn bộ giao diện và dữ liệu hỗ trợ Unicode UTF-8 đầy đủ |

### 6.4 Xuất báo cáo
- Danh sách dự án và tình trạng theo mẫu: Excel (.xlsx) và CSV
- Báo cáo giải ngân theo tháng / quý / năm: Excel
- Báo cáo tiến độ tổng hợp trình UBND phường: PDF có định dạng chính thức
- Danh mục hồ sơ pháp lý từng dự án: Excel / PDF
- Báo cáo GPMB (ma trận hộ dân × bước): Excel
- Báo cáo lời tổng hợp (AI kết xuất): DOCX + PDF

---

## 7. LỘ TRÌNH TRIỂN KHAI

### 7.1 Phân giai đoạn

| GĐ | Thời gian | Nội dung chính | Kết quả bàn giao |
| :---: | :---: | :--- | :--- |
| **1** | T4–T5/2026 | Phân tích & Thiết kế | Tài liệu thiết kế kỹ thuật, wireframe đã duyệt M1–M9, ERD và API spec |
| **2** | T6–T7/2026 | Phát triển M1–M4 + Đăng nhập | Hệ thống chạy được 4 module cốt lõi, phân quyền, M3 quy trình động |
| **3** | T7–T8/2026 | Phát triển M5–M8 | Hệ thống đầy đủ 8 module + xuất Excel/PDF + cảnh báo tự động |
| **4** | T9/2026 | UAT, Đào tạo, Go-live, M9 | Hệ thống vận hành chính thức + Thư viện pháp lý + AI báo cáo + Dữ liệu đã nhập thực tế |

> **CAM KẾT**  
> Tiến độ có thể triển khai nhanh hơn theo thỏa thuận. Mốc bắt buộc: nghiệm thu toàn bộ hệ thống trước 30/09/2026.

### 7.2 Ưu tiên MoSCoW

| Mức độ | Danh sách chức năng |
| :--- | :--- |
| **MUST HAVE** | M1 Dashboard + cảnh báo; M2 Dự án + tiến độ; M3 Thủ tục XDCB động; M4 Tài chính 2 cấp duyệt; M6 GPMB 16 bước + ma trận hộ dân; Đăng nhập + phân quyền 7 vai trò |
| **SHOULD HAVE** | M7 Đấu thầu 9 bước; M8 Bảo hành + đếm ngược; File đính kèm 100–500MB; Xuất Excel/CSV; Tất toán KBNN; Nhật ký audit log; Cảnh báo pháp lý GPMB |
| **COULD HAVE** | M9 Thư viện pháp lý; AI kết xuất báo cáo lời; Xuất PDF chính thức; Cảnh báo email/Zalo tự động; Dashboard mobile-responsive |
| **WON'T (v1)** | Tích hợp KBNN tự động online; App di động native iOS/Android; Kết nối CSDL đất đai tỉnh; AI thu thập văn bản pháp lý tự động từ internet |

---

## 8. CÁC ĐIỀU KHOẢN CHUNG

### 8.1 Quản lý thay đổi yêu cầu
Mọi thay đổi so với nội dung tài liệu này phải được:
- Ghi vào Phiếu Yêu cầu Thay đổi (Change Request), mô tả rõ lý do và tác động.
- Phê duyệt bởi đại diện có thẩm quyền của cả hai bên trước khi thực hiện.
- Cập nhật vào BRD phiên bản mới và ghi rõ lịch sử thay đổi.
- Nếu thay đổi ảnh hưởng đến chi phí hoặc tiến độ, hai bên ký phụ lục hợp đồng.

### 8.2 Điều kiện nghiệm thu
Hệ thống được nghiệm thu khi:
- Toàn bộ chức năng "Must Have" hoạt động đúng yêu cầu trong BRD này.
- Kiểm thử chấp nhận người dùng (UAT) được thực hiện bởi ≥ 5 người dùng thuộc ít nhất 3 vai trò khác nhau.
- Không còn lỗi nghiêm trọng (Critical/High) nào chưa được khắc phục.
- Tài liệu hướng dẫn sử dụng và hướng dẫn quản trị đã được bàn giao.
- Đào tạo cho toàn bộ 25 người dùng đã hoàn thành.

### 8.3 Bảo hành phần mềm
- FIMI TECH bảo hành hệ thống 12 tháng sau ngày nghiệm thu chính thức.
- Trong thời gian bảo hành: sửa lỗi miễn phí, hỗ trợ kỹ thuật trong 24h làm việc.
- Sau bảo hành: hai bên thỏa thuận hợp đồng bảo trì và nâng cấp định kỳ.

### 8.4 Quyền sở hữu và bảo mật dữ liệu
- Toàn bộ dữ liệu thuộc sở hữu của BQL ĐTXD Hà Tiên.
- FIMI TECH không được sử dụng dữ liệu khách hàng cho bất kỳ mục đích nào khác.
- Mã nguồn hệ thống thuộc sở hữu theo thỏa thuận trong hợp đồng phát triển.

---

## PHỤ LỤC A – DANH MỤC THUẬT NGỮ VÀ TỪ VIẾT TẮT

| Thuật ngữ / Viết tắt | Giải nghĩa đầy đủ |
| :--- | :--- |
| **BCKTKT** | Báo cáo kinh tế kỹ thuật |
| **BCNCKT** | Báo cáo nghiên cứu khả thi |
| **BRD** | Business Requirements Document – Tài liệu yêu cầu nghiệp vụ |
| **BT-HT-TĐC** | Bồi thường – Hỗ trợ – Tái định cư |
| **BQL ĐTXD** | Ban Quản lý Dự án Đầu tư Xây dựng Hà Tiên |
| **CBĐT** | Chuẩn bị đầu tư |
| **CCCD** | Căn cước công dân |
| **ĐTM** | Đánh giá tác động môi trường |
| **GĐ** | Giai đoạn |
| **GPMB** | Giải phóng mặt bằng |
| **HĐ** | Hợp đồng |
| **HSDT** | Hồ sơ dự thầu |
| **HSMT** | Hồ sơ mời thầu |
| **KBNN** | Kho bạc Nhà nước |
| **KHLCNT** | Kế hoạch lựa chọn nhà thầu |
| **KPI** | Key Performance Indicators – Chỉ số hiệu suất chính |
| **KT** | Kỹ thuật / Kế toán (tùy ngữ cảnh) |
| **LCNT** | Lựa chọn nhà thầu |
| **NT** | Nhà thầu |
| **NS** | Ngân sách |
| **NĐ** | Nghị định |
| **QPPL** | Quy phạm pháp luật |
| **QĐ** | Quyết định |
| **TĐC** | Tái định cư |
| **TĐ** | Tiến độ |
| **TKBVTC** | Thiết kế bản vẽ thi công |
| **TV** | Tư vấn |
| **TVGS** | Tư vấn giám sát |
| **TT** | Thông tư / Thanh toán (tùy ngữ cảnh) |
| **UAT** | User Acceptance Testing – Kiểm thử chấp nhận người dùng |
| **UBND** | Ủy ban Nhân dân |
| **VC** | Viên chức |
| **VĐT** | Vốn đầu tư |
| **XDCB** | Xây dựng cơ bản |
| **2FA** | Two-Factor Authentication – Xác thực hai yếu tố |

---
*— Hết tài liệu BRD Chính thức · Phiên bản CF 1.0 · Ngày 22/03/2026 —*
