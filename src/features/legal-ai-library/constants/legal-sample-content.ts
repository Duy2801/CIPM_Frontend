import type { LegalDocumentSection } from "../types/legal-ai.types.ts";

/**
 * Nội dung toàn văn MẪU dùng để thử bản xem trước văn bản dài (cuộn nhiều trang).
 * Đây là nội dung minh họa được viết tóm lược theo cấu trúc văn bản, KHÔNG phải nguyên văn
 * Nghị định 10/2021/NĐ-CP — khi có tệp gốc thì thay bằng tệp PDF chính thức.
 */
export const SAMPLE_DECREE_10_2021_CONTENT: LegalDocumentSection[] = [
  {
    heading: "Chương I. NHỮNG QUY ĐỊNH CHUNG",
    articles: [
      {
        title: "Điều 1. Phạm vi điều chỉnh",
        paragraphs: [
          "1. Nghị định này quy định về quản lý chi phí đầu tư xây dựng, gồm: sơ bộ tổng mức đầu tư, tổng mức đầu tư xây dựng, dự toán xây dựng, giá gói thầu xây dựng, giá hợp đồng xây dựng, định mức xây dựng, giá xây dựng, chỉ số giá xây dựng, chi phí quản lý dự án và tư vấn đầu tư xây dựng.",
          "2. Việc thanh toán, quyết toán vốn đầu tư xây dựng công trình thực hiện theo quy định của pháp luật về quản lý, thanh toán, quyết toán vốn đầu tư.",
        ],
      },
      {
        title: "Điều 2. Đối tượng áp dụng",
        paragraphs: [
          "1. Nghị định này áp dụng đối với cơ quan, tổ chức, cá nhân có liên quan đến quản lý chi phí đầu tư xây dựng của các dự án sử dụng vốn đầu tư công, vốn nhà nước ngoài đầu tư công và dự án đầu tư theo phương thức đối tác công tư.",
          "2. Khuyến khích tổ chức, cá nhân có liên quan đến quản lý chi phí đầu tư xây dựng của dự án sử dụng vốn khác áp dụng các quy định tại Nghị định này.",
        ],
      },
      {
        title: "Điều 3. Nguyên tắc quản lý chi phí đầu tư xây dựng",
        paragraphs: [
          "1. Quản lý chi phí đầu tư xây dựng phải bảo đảm mục tiêu đầu tư, hiệu quả dự án đã được phê duyệt, phù hợp với trình tự đầu tư xây dựng và nguồn vốn sử dụng.",
          "2. Chủ đầu tư chịu trách nhiệm quản lý chi phí đầu tư xây dựng từ giai đoạn chuẩn bị dự án đến khi kết thúc xây dựng đưa công trình của dự án vào khai thác sử dụng trong phạm vi tổng mức đầu tư được phê duyệt.",
          "3. Nhà nước thực hiện quản lý chi phí đầu tư xây dựng thông qua việc ban hành, hướng dẫn và kiểm tra việc thực hiện các quy định của pháp luật; hướng dẫn phương pháp lập và quản lý chi phí.",
          "4. Các dự án sử dụng vốn ODA, vốn vay ưu đãi của nhà tài trợ nước ngoài thực hiện theo quy định của điều ước quốc tế; trường hợp điều ước quốc tế không có quy định thì thực hiện theo Nghị định này.",
        ],
      },
    ],
  },
  {
    heading: "Chương II. SƠ BỘ TỔNG MỨC ĐẦU TƯ VÀ TỔNG MỨC ĐẦU TƯ XÂY DỰNG",
    articles: [
      {
        title: "Điều 4. Nội dung sơ bộ tổng mức đầu tư xây dựng",
        paragraphs: [
          "1. Sơ bộ tổng mức đầu tư xây dựng là ước tính chi phí đầu tư xây dựng của dự án được xác định phù hợp với phương án thiết kế sơ bộ và các nội dung khác của Báo cáo nghiên cứu tiền khả thi đầu tư xây dựng.",
          "2. Sơ bộ tổng mức đầu tư gồm các khoản mục chi phí: bồi thường, hỗ trợ và tái định cư; xây dựng; thiết bị; quản lý dự án; tư vấn đầu tư xây dựng; chi phí khác và chi phí dự phòng.",
        ],
      },
      {
        title: "Điều 5. Nội dung tổng mức đầu tư xây dựng",
        paragraphs: [
          "1. Tổng mức đầu tư xây dựng là toàn bộ chi phí đầu tư xây dựng của dự án được xác định phù hợp với thiết kế cơ sở và các nội dung khác của Báo cáo nghiên cứu khả thi đầu tư xây dựng.",
          "2. Chi phí bồi thường, hỗ trợ và tái định cư gồm chi phí bồi thường về đất, nhà, công trình trên đất, các tài sản gắn liền với đất; chi phí hỗ trợ khi Nhà nước thu hồi đất; chi phí tái định cư; chi phí tổ chức bồi thường, hỗ trợ và tái định cư.",
          "3. Chi phí xây dựng gồm chi phí xây dựng các công trình, hạng mục công trình của dự án; công trình xây dựng tạm, công trình phụ trợ phục vụ thi công; chi phí phá dỡ các công trình xây dựng không thuộc phạm vi bồi thường.",
          "4. Chi phí thiết bị gồm chi phí mua sắm thiết bị công trình và thiết bị công nghệ; chi phí quản lý mua sắm thiết bị; chi phí lắp đặt, thí nghiệm, hiệu chỉnh; chi phí vận chuyển, bảo hiểm; thuế và các loại phí liên quan.",
          "5. Chi phí dự phòng gồm chi phí dự phòng cho khối lượng công việc phát sinh và chi phí dự phòng cho yếu tố trượt giá trong thời gian thực hiện dự án.",
        ],
      },
      {
        title: "Điều 6. Xác định tổng mức đầu tư xây dựng",
        paragraphs: [
          "1. Tổng mức đầu tư xây dựng được xác định theo khối lượng tính từ thiết kế cơ sở và các yêu cầu cần thiết khác của dự án; hoặc theo suất vốn đầu tư xây dựng; hoặc từ dữ liệu về chi phí các công trình tương tự đã thực hiện; hoặc kết hợp các phương pháp trên.",
          "2. Trường hợp dự án chỉ yêu cầu lập Báo cáo kinh tế - kỹ thuật đầu tư xây dựng, tổng mức đầu tư được xác định từ dự toán xây dựng công trình và chi phí bồi thường, hỗ trợ, tái định cư (nếu có).",
        ],
      },
      {
        title: "Điều 7. Thẩm định, phê duyệt tổng mức đầu tư xây dựng",
        paragraphs: [
          "1. Tổng mức đầu tư xây dựng được thẩm định đồng thời với việc thẩm định dự án đầu tư xây dựng và được người quyết định đầu tư phê duyệt.",
          "2. Nội dung thẩm định gồm: sự phù hợp của phương pháp xác định tổng mức đầu tư với đặc điểm, tính chất kỹ thuật và yêu cầu công nghệ của dự án; tính đầy đủ, hợp lý và phù hợp với yêu cầu thực tế thị trường của các khoản mục chi phí.",
        ],
      },
    ],
  },
  {
    heading: "Chương III. DỰ TOÁN XÂY DỰNG",
    articles: [
      {
        title: "Điều 8. Nội dung dự toán xây dựng công trình",
        paragraphs: [
          "1. Dự toán xây dựng công trình là toàn bộ chi phí cần thiết để xây dựng công trình được xác định ở giai đoạn thực hiện dự án phù hợp với thiết kế kỹ thuật, thiết kế bản vẽ thi công và các yêu cầu công việc phải thực hiện của công trình.",
          "2. Dự toán xây dựng công trình gồm chi phí xây dựng, chi phí thiết bị, chi phí quản lý dự án, chi phí tư vấn đầu tư xây dựng, chi phí khác và chi phí dự phòng.",
          "3. Chi phí xây dựng gồm chi phí trực tiếp, chi phí gián tiếp, thu nhập chịu thuế tính trước và thuế giá trị gia tăng.",
        ],
      },
      {
        title: "Điều 9. Xác định dự toán xây dựng công trình",
        paragraphs: [
          "1. Chi phí xây dựng được xác định từ khối lượng các công tác xây dựng tính theo thiết kế và đơn giá xây dựng chi tiết hoặc giá xây dựng tổng hợp; hoặc theo suất chi phí xây dựng trong suất vốn đầu tư xây dựng.",
          "2. Chi phí thiết bị được xác định từ khối lượng, số lượng, chủng loại thiết bị theo thiết kế và giá mua thiết bị tương ứng; trường hợp thiết bị chưa xác định được giá thì có thể dự tính theo báo giá của nhà sản xuất, nhà cung cấp.",
          "3. Chi phí dự phòng được xác định bằng tỷ lệ phần trăm trên tổng các khoản mục chi phí đối với khối lượng công việc phát sinh và theo chỉ số giá xây dựng bình quân đối với yếu tố trượt giá.",
        ],
      },
      {
        title: "Điều 10. Thẩm định, phê duyệt dự toán xây dựng",
        paragraphs: [
          "1. Dự toán xây dựng công trình được thẩm định đồng thời với thiết kế triển khai sau thiết kế cơ sở; cơ quan chuyên môn về xây dựng thẩm định dự toán đối với công trình thuộc dự án sử dụng vốn đầu tư công.",
          "2. Chủ đầu tư phê duyệt dự toán xây dựng sau khi có kết quả thẩm định; dự toán được phê duyệt là cơ sở để xác định giá gói thầu và làm cơ sở đàm phán, ký kết hợp đồng xây dựng.",
        ],
      },
      {
        title: "Điều 11. Điều chỉnh dự toán xây dựng",
        paragraphs: [
          "1. Dự toán xây dựng đã phê duyệt được điều chỉnh trong các trường hợp: điều chỉnh tổng mức đầu tư; thay đổi, bổ sung thiết kế không trái với thiết kế cơ sở; thay đổi cơ cấu chi phí trong dự toán nhưng không vượt dự toán đã phê duyệt.",
          "2. Chủ đầu tư tổ chức xác định dự toán điều chỉnh, thẩm định và phê duyệt theo quy định; trường hợp làm vượt tổng mức đầu tư thì phải được người quyết định đầu tư chấp thuận trước.",
        ],
      },
    ],
  },
  {
    heading: "Chương IV. ĐỊNH MỨC, GIÁ XÂY DỰNG VÀ CHỈ SỐ GIÁ XÂY DỰNG",
    articles: [
      {
        title: "Điều 12. Hệ thống định mức xây dựng",
        paragraphs: [
          "1. Hệ thống định mức xây dựng gồm định mức kinh tế - kỹ thuật và định mức chi phí; định mức kinh tế - kỹ thuật gồm định mức cơ sở và định mức dự toán xây dựng công trình.",
          "2. Bộ Xây dựng ban hành định mức dự toán các công tác xây dựng phổ biến, định mức chi phí; Ủy ban nhân dân cấp tỉnh ban hành định mức dự toán cho các công tác đặc thù của địa phương.",
        ],
      },
      {
        title: "Điều 13. Giá xây dựng công trình",
        paragraphs: [
          "1. Giá xây dựng công trình gồm đơn giá xây dựng chi tiết của công trình và giá xây dựng tổng hợp; được xác định trên cơ sở định mức dự toán, giá vật liệu, giá nhân công và giá ca máy thi công.",
          "2. Ủy ban nhân dân cấp tỉnh công bố giá vật liệu xây dựng, đơn giá nhân công, giá ca máy và thiết bị thi công làm cơ sở tham khảo để lập và quản lý chi phí đầu tư xây dựng trên địa bàn.",
        ],
      },
      {
        title: "Điều 14. Chỉ số giá xây dựng",
        paragraphs: [
          "1. Chỉ số giá xây dựng là chỉ tiêu phản ánh mức độ biến động của giá xây dựng theo thời gian, làm cơ sở xác định, điều chỉnh tổng mức đầu tư, dự toán, giá hợp đồng và quy đổi vốn đầu tư.",
          "2. Ủy ban nhân dân cấp tỉnh xác định và công bố chỉ số giá xây dựng định kỳ theo quý, năm cho các loại công trình xây dựng trên địa bàn.",
        ],
      },
    ],
  },
  {
    heading: "Chương V. ĐIỀU KHOẢN THI HÀNH",
    articles: [
      {
        title: "Điều 15. Xử lý chuyển tiếp",
        paragraphs: [
          "1. Dự án đã được phê duyệt trước thời điểm Nghị định này có hiệu lực thì tiếp tục thực hiện theo quyết định phê duyệt; các công việc thực hiện sau thời điểm có hiệu lực thì áp dụng Nghị định này.",
          "2. Gói thầu đã phát hành hồ sơ mời thầu trước thời điểm Nghị định này có hiệu lực thì thực hiện theo hồ sơ mời thầu đã phát hành.",
        ],
      },
      {
        title: "Điều 16. Hiệu lực thi hành",
        paragraphs: [
          "1. Nghị định này có hiệu lực thi hành kể từ ngày ký ban hành.",
          "2. Các Bộ trưởng, Thủ trưởng cơ quan ngang bộ, Thủ trưởng cơ quan thuộc Chính phủ, Chủ tịch Ủy ban nhân dân tỉnh, thành phố trực thuộc trung ương và các tổ chức, cá nhân có liên quan chịu trách nhiệm thi hành Nghị định này.",
        ],
      },
    ],
  },
];
