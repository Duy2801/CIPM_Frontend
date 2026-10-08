# M4 – Tài chính & Quyết toán: Thiết kế giao diện

## Mục tiêu

Thay màn hình placeholder tại `/finance-settlement` bằng một giao diện nghiệp vụ tương tác hoàn chỉnh cho M4. Màn hình sử dụng mock data nhưng giữ ranh giới dữ liệu rõ ràng để có thể chuyển sang API backend mà không phải viết lại các component trình bày.

## Phạm vi

Màn hình gồm ba khu vực nghiệp vụ trên cùng một route:

1. Kế hoạch vốn theo năm, dự án và nguồn vốn.
2. Theo dõi các đợt giải ngân và luồng duyệt ba vai trò.
3. Quy trình tất toán tài khoản KBNN theo checklist năm bước.

Phạm vi hiện tại không bao gồm xác thực backend, tải file thật, lưu trữ lâu dài hoặc tích hợp M2/M8 qua API. Các liên kết này được mô phỏng bằng khóa định danh trong mock data.

## Cấu trúc giao diện

### Thanh điều khiển và KPI

- Bộ lọc năm và dự án áp dụng cho toàn màn hình.
- Bốn KPI: kế hoạch vốn, đã giải ngân, tỷ lệ giải ngân và hồ sơ chờ duyệt.
- Cảnh báo nổi bật các khoản sắp đến hạn trong tối đa 5 ngày làm việc.

### Tab Kế hoạch vốn

- Bảng tổng hợp theo dự án, năm và nguồn vốn.
- Hiển thị kế hoạch đầu năm, giá trị điều chỉnh, kế hoạch hiện tại, đã giải ngân và phần còn lại.
- Cho phép thêm kế hoạch vốn bằng modal.
- Cho phép điều chỉnh giữa năm bằng modal riêng; văn bản phê duyệt là bắt buộc.

### Tab Giải ngân

- Bảng các đợt thanh toán có tìm kiếm và lọc trạng thái.
- Hiển thị dự án, bên nhận, nội dung, hợp đồng, số tiền, ngày ký duyệt, tài khoản KBNN, hạn thanh toán và trạng thái.
- Chi tiết luồng duyệt thể hiện ba bước: Kế toán viên nhập, Kế toán trưởng duyệt, Giám đốc phê duyệt.
- Modal tạo đợt giải ngân kiểm tra:
  - Dự án, bên nhận, nội dung, số tiền, ngày ký duyệt và tài khoản KBNN là bắt buộc.
  - Số tiền lớn hơn 0, có tối đa 3 chữ số thập phân và không vượt giá trị hợp đồng còn lại.
  - Tổng giải ngân dự án không vượt tổng mức đầu tư.
  - Có ít nhất một file chứng từ trước khi lưu.
- Cảnh báo khi tổng giải ngân hợp đồng vượt ngưỡng 95%.
- Các thao tác duyệt cập nhật mock state theo đúng thứ tự; không thể bỏ qua cấp duyệt.

### Tab Tất toán KBNN

- Danh sách hồ sơ tất toán theo dự án.
- Mỗi hồ sơ có checklist năm bước:
  1. Lập hồ sơ và đính kèm quyết định phê duyệt quyết toán.
  2. Đối chiếu tổng giải ngân với giá trị quyết toán, xác nhận thu hồi hết tạm ứng.
  3. Ghi nhận ngày gửi lệnh tất toán tại KBNN.
  4. Xác nhận hoàn trả bảo lãnh bảo hành, thể hiện liên kết M8.
  5. Đóng mã dự án và chuyển trạng thái thành `Đã tất toán`.
- Bước sau chỉ được hoàn tất khi bước trước đã hoàn tất và các điều kiện dữ liệu tương ứng hợp lệ.

## Kiến trúc feature

Feature `src/features/finance-settlement` được chia theo trách nhiệm:

- `types/`: kiểu dữ liệu và các trạng thái nghiệp vụ.
- `constants/`: mock data và nhãn hiển thị.
- `services/`: interface repository và mock repository bất đồng bộ. Backend sau này chỉ cần cung cấp implementation cùng interface.
- `hooks/`: điều phối dữ liệu, bộ lọc và mutation cho màn hình.
- `components/`: screen, KPI, toolbar, từng tab và các modal nghiệp vụ.
- `utils/`: định dạng tiền, tính tỷ lệ và kiểm tra quy tắc nghiệp vụ thuần.

Các component không import trực tiếp mock data. Hook/controller lấy dữ liệu qua repository, do đó có thể chuyển sang API repository mà không đổi API props của component.

## Luồng dữ liệu và trạng thái

- Route tiếp tục là Server Component mỏng và render feature screen.
- Feature screen là Client Component vì cần bộ lọc, modal và thao tác duyệt.
- Dữ liệu server/cache mô phỏng nằm sau repository; trạng thái UI cục bộ gồm tab, bộ lọc và modal đang mở.
- Mutation mock trả về dữ liệu cập nhật và đồng bộ lại state màn hình. Khi nối backend, các hàm tương ứng có thể chuyển sang TanStack Query mà không thay đổi mô hình domain.

## Trạng thái lỗi và phản hồi

- Lỗi nhập liệu hiển thị sát trường dữ liệu.
- Vi phạm quy tắc tổng tiền hoặc thứ tự duyệt hiển thị thông báo rõ nguyên nhân.
- Thao tác thành công hiển thị phản hồi ngắn và cập nhật bảng/KPI ngay.
- Trạng thái rỗng của từng bảng vẫn giữ bộ lọc và lời hướng dẫn hành động.

## Khả năng truy cập và responsive

- Mọi thao tác dùng primitive có focus state và nhãn truy cập.
- Trạng thái không chỉ phân biệt bằng màu mà còn có nhãn chữ hoặc biểu tượng.
- Bảng cho phép cuộn ngang ở màn hình hẹp; thanh công cụ và KPI tự chuyển cột.
- Modal có tiêu đề, nhãn trường và thứ tự bàn phím hợp lý.

## Kiểm thử và tiêu chí hoàn thành

- TypeScript không báo lỗi.
- ESLint và Next.js build thành công.
- Script kiểm tra kiến trúc frontend không phát hiện vi phạm mới liên quan đến feature.
- Có thể tạo kế hoạch, điều chỉnh kế hoạch, tạo đợt giải ngân hợp lệ, duyệt đúng thứ tự và tiến hành checklist tất toán trên mock state.
- Các trường hợp vượt hợp đồng, vượt tổng mức đầu tư, thiếu chứng từ và duyệt sai cấp bị chặn.
- Mock data không được import trực tiếp trong component trình bày.

