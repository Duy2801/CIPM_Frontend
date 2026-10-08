export interface AssistantAnswer {
  text: string;
  citations: { title: string; code: string; article?: string }[];
}

export function answerLegalQuestion(question: string): AssistantAnswer {
  const q = question.toLowerCase();

  if (q.includes("niêm yết") || q.includes("bước 6") || q.includes("10 ngày") || q.includes("gpmb")) {
    return {
      text: `Theo quy định tại Điều 87 Luật Đất đai số 31/2024/QH15 và Quy trình 16 bước GPMB của Ban Quản lý Dự án ĐTXD Hà Tiên:
1. **Thời hạn bắt buộc**: Phương án bồi thường, hỗ trợ, tái định cư phải được niêm yết công khai trong thời hạn **tối thiểu 10 ngày làm việc (bắt buộc)** tại trụ sở UBND cấp xã/phường và địa điểm sinh hoạt chung của khu dân cư nơi có đất thu hồi.
2. **Hồ sơ yêu cầu**: Lập Biên bản niêm yết công khai theo **Mẫu 04-GPMB** và danh sách niêm yết kèm theo chữ ký của đại diện BQL, UBND phường và đại diện khu phố.
3. **Cảnh báo hệ thống**: Đây là mốc thời hạn pháp lý bắt buộc (Cảnh báo Cam/Đỏ), hệ thống CIPM sẽ tự động tính đếm ngược và khóa bước tiếp theo nếu chưa đủ 10 ngày niêm yết.`,
      citations: [
        { title: "Luật Đất đai 2024", code: "31/2024/QH15", article: "Khoản 2 Điều 87" },
        { title: "Quyết định bồi thường GPMB Kiên Giang", code: "18/2024/QĐ-UBND", article: "Điều 14" },
        { title: "Biểu mẫu niêm yết GPMB", code: "Mẫu 04-GPMB" },
      ],
    };
  }

  if (q.includes("bảo lãnh") || q.includes("bảo hành") || q.includes("hoàn trả") || q.includes("5%")) {
    return {
      text: `Căn cứ theo Điều 125 Luật Xây dựng số 50/2014/QH13, Nghị định 15/2021/NĐ-CP và Quy định Quản lý bảo hành M8 của Ban:
1. **Giá trị bảo lãnh**: Thường là **5% giá trị hợp đồng xây lắp** (đối với công trình cấp đặc biệt, cấp I) hoặc từ **3% - 5%** theo quy định tại hợp đồng thi công.
2. **Điều kiện hoàn trả bảo lãnh bảo hành**:
   - Công trình đã **hết thời hạn bảo hành** (tính từ ngày ký biên bản nghiệm thu hoàn thành đưa vào sử dụng).
   - **Tất cả các sự cố, khiếm khuyết kỹ thuật** phát sinh trong thời gian bảo hành đã được nhà thầu khắc phục xong và có biên bản nghiệm thu xác nhận của Tổ Giám sát - Kỹ thuật.
3. **Thủ tục tại KBNN**: Chứng thư bảo lãnh chỉ được Kế toán trưởng lập thủ tục hoàn trả cho nhà thầu sau khi có văn bản xác nhận hoàn thành nghĩa vụ bảo hành của Giám đốc Ban.`,
      citations: [
        { title: "Luật Xây dựng", code: "50/2014/QH13", article: "Điều 125" },
        { title: "Nghị định quản lý dự án ĐTXD", code: "15/2021/NĐ-CP", article: "Điều 28" },
        { title: "Hợp đồng mẫu BQL Hà Tiên", code: "Mẫu HĐ-XL-05", article: "Điều 18" },
      ],
    };
  }

  if (q.includes("giải ngân") || q.includes("kho bạc") || q.includes("kbnn") || q.includes("thanh toán")) {
    return {
      text: `Quy trình thanh toán vốn đầu tư công qua Kho bạc Nhà nước Hà Tiên (Module M4 - Tài chính):
1. **Hồ sơ gửi KBNN**: Bảng xác định giá trị khối lượng công việc hoàn thành (Mẫu 08a), Giấy đề nghị thanh toán vốn đầu tư (Mẫu 04a/TT), chứng từ chuyển tiền điện tử.
2. **Quy trình duyệt 2 cấp nội bộ**:
   - Cấp 1: Kế toán viên lập hồ sơ -> Kế toán trưởng soát xét và phê duyệt tính hợp lệ, định mức và số dư hạn mức hợp đồng.
   - Cấp 2: Giám đốc Ban phê duyệt điện tử và ký số trước khi truyền dữ liệu sang Dịch vụ công KBNN.
3. **Thời hạn giải quyết**: KBNN kiểm soát thanh toán trong vòng 03 ngày làm việc kể từ ngày nhận đủ hồ sơ hợp lệ theo Thông tư 96/2021/TT-BTC.`,
      citations: [
        { title: "Nghị định quản lý chi phí ĐTXD", code: "10/2021/NĐ-CP", article: "Điều 33" },
        { title: "Thông tư thanh toán vốn NSNN", code: "96/2021/TT-BTC", article: "Điều 8" },
      ],
    };
  }

  if (q.includes("đấu thầu") || q.includes("hsmt") || q.includes("9 bước")) {
    return {
      text: `Theo Luật Đấu thầu số 22/2023/QH15 và Nghị định 24/2024/NĐ-CP, quy trình lựa chọn nhà thầu qua mạng tại BQL Hà Tiên gồm 9 bước chuẩn:
1. Lập và phê duyệt kế hoạch lựa chọn nhà thầu (KHLCNT).
2. Lập hồ sơ mời thầu (E-HSMT).
3. Thẩm định và phê duyệt E-HSMT.
4. Đăng tải thông báo mời thầu trên Hệ thống mạng đấu thầu quốc gia (tối thiểu 12-18 ngày trước thời điểm đóng thầu).
5. Mở thầu điện tử tự động.
6. Đánh giá hồ sơ dự thầu (E-HSDT).
7. Thương thảo hợp đồng (nếu có).
8. Thẩm định và phê duyệt kết quả lựa chọn nhà thầu.
9. Công khai kết quả và ký kết hợp đồng thi công.`,
      citations: [
        { title: "Luật Đấu thầu 2023", code: "22/2023/QH15", article: "Điều 38 - 43" },
        { title: "Nghị định chi tiết Luật Đấu thầu", code: "24/2024/NĐ-CP", article: "Điều 26" },
      ],
    };
  }

  // Câu trả lời tổng quát
  return {
    text: `Căn cứ theo hệ thống văn bản quy phạm pháp luật ngành Xây dựng và quy chế nội bộ Ban QLDA ĐTXD Hà Tiên:
- Mọi hoạt động quản lý dự án, thủ tục đầu tư, giải ngân thanh toán, GPMB và đấu thầu đều phải tuân thủ nghiêm ngặt Luật Xây dựng, Luật Đất đai 2024, Luật Đấu thầu 2023 và các Nghị định hướng dẫn của Chính phủ.
- Về nội dung bạn vừa hỏi ("${question}"), bạn có thể tra cứu chi tiết văn bản gốc trong Thư viện pháp lý hoặc sử dụng các biểu mẫu quy chuẩn đã được ban hành trong hệ thống. Nếu cần số liệu báo cáo cụ thể, bạn có thể chuyển sang tab "AI Kết xuất báo cáo" để tạo văn bản lời hoàn chỉnh.`,
    citations: [
      { title: "Luật Xây dựng", code: "50/2014/QH13" },
      { title: "Luật Đất đai 2024", code: "31/2024/QH15" },
      { title: "Quyết định UBND tỉnh Kiên Giang", code: "18/2024/QĐ-UBND" },
    ],
  };
}

export function askLegalAiAssistant(question: string): {
  answer: string;
  citations: { title: string; code: string; article?: string }[];
} {
  const result = answerLegalQuestion(question);
  return {
    answer: result.text,
    citations: result.citations,
  };
}
