import type {
  DetailedLegalDocument,
  RelatedCategoryMeta,
  RelatedDocumentItem,
} from "../types/legal-viewer.types";

export const RELATED_CATEGORIES_METAS: RelatedCategoryMeta[] = [
  {
    key: "all",
    label: "Tất cả",
    count: 66,
    description: "Tổng hợp toàn bộ các văn bản có mối quan hệ pháp lý với văn bản đang xem.",
  },
  {
    key: "basis",
    label: "Văn bản căn cứ",
    count: 1,
    description: "Văn bản là cơ sở pháp lý cao hơn được viện dẫn để ban hành văn bản đang xem (ví dụ: Hiến pháp, Luật).",
  },
  {
    key: "expired",
    label: "Văn bản hết hiệu lực",
    count: 1,
    description: "Văn bản hết hiệu lực là văn bản ban hành trước Văn bản đang xem và được Văn bản đang xem thay thế nội dung.",
  },
  {
    key: "guiding",
    label: "Văn bản hướng dẫn",
    count: 35,
    description: "Văn bản ban hành sau nhằm hướng dẫn chi tiết thi hành các điều, khoản trong văn bản đang xem (Nghị định, Thông tư).",
  },
  {
    key: "amended_by",
    label: "Văn bản bị sửa đổi, bổ sung",
    count: 2,
    description: "Văn bản ban hành trước có một số điều, khoản bị văn bản đang xem sửa đổi hoặc bổ sung nội dung.",
  },
  {
    key: "amending",
    label: "Văn bản sửa đổi, bổ sung",
    count: 3,
    description: "Văn bản ban hành sau có nội dung sửa đổi, bổ sung, bãi bỏ một phần quy định của văn bản đang xem.",
  },
  {
    key: "referenced",
    label: "Văn bản được dẫn chiếu",
    count: 9,
    description: "Văn bản có điều, khoản được văn bản đang xem viện dẫn hoặc trích dẫn để áp dụng.",
  },
  {
    key: "partial_expired",
    label: "Văn bản hết hiệu lực một phần",
    count: 1,
    description: "Văn bản ban hành trước bị văn bản đang xem tuyên bố chấm dứt hiệu lực một số phần hoặc điều khoản cụ thể.",
  },
  {
    key: "stipulating_partial_expired",
    label: "Văn bản quy định hết hiệu lực một phần",
    count: 1,
    description: "Văn bản ban hành sau có quy định làm hết hiệu lực một phần nội dung của văn bản đang xem.",
  },
  {
    key: "consolidated_from",
    label: "Văn bản được hợp nhất",
    count: 2,
    description: "Các văn bản sửa đổi, bổ sung được cơ quan có thẩm quyền tích hợp vào bản hợp nhất kỹ thuật.",
  },
  {
    key: "consolidated",
    label: "Văn bản hợp nhất",
    count: 11,
    description: "Văn bản tổng hợp đầy đủ các lần sửa đổi bổ sung của cơ quan chức năng để người đọc dễ tra cứu.",
  },
];

export const MOCK_LABOR_CODE_2019: DetailedLegalDocument = {
  id: "doc-labor-2019",
  code: "45/2019/QH14",
  title: "Bộ luật Lao động 2019, số 45/2019/QH14",
  shortTitle: "Bộ luật Lao động 2019",
  categoryName: "Bộ luật",
  issuer: "Quốc hội",
  gazetteNumber: "993&994-12/2019",
  gazetteDate: "26/12/2019",
  signer: "Nguyễn Thị Kim Ngân",
  issueDate: "20/11/2019",
  effectiveDate: "01/01/2021",
  expiredDate: "Đang cập nhật",
  statusText: "Hết Hiệu lực một phần",
  statusCode: "PARTIAL",
  field: "Lao động-Tiền lương",
  updatedAtText: "Thứ Tư, 11/12/2019 15:46 (GMT+7)",
  totalChapters: 17,
  totalArticles: 220,
  summaryHighlights: [
    "Bộ luật Lao động 2019 gồm 17 Chương và 220 Điều, thay thế Bộ luật Lao động 2012 (16 Chương, 242 Điều).",
    "Mở rộng diện điều chỉnh tới cả người lao động không có quan hệ lao động (lao động tự do, hợp tác xã).",
    "Chỉ còn 02 loại hợp đồng lao động: Hợp đồng lao động không xác định thời hạn và Hợp đồng lao động xác định thời hạn (tối đa 36 tháng).",
    "Cho phép người lao động đơn phương chấm dứt hợp đồng lao động không cần lý do, chỉ cần báo trước theo thời hạn quy định.",
    "Lộ trình tăng tuổi nghỉ hưu: Nam đủ 62 tuổi vào năm 2028, Nữ đủ 60 tuổi vào năm 2035.",
    "Bổ sung thêm 01 ngày nghỉ lễ liền kề trước hoặc sau ngày Quốc khánh 02/9.",
  ],
  chapters: [
    {
      number: "Chương I",
      title: "NHỮNG QUY ĐỊNH CHUNG",
      articles: [
        {
          number: "Điều 1",
          title: "Phạm vi điều chỉnh",
          paragraphs: [
            "Bộ luật Lao động quy định tiêu chuẩn lao động; quyền, nghĩa vụ, trách nhiệm của người lao động, người sử dụng lao động, tổ chức đại diện người lao động tại cơ sở, tổ chức đại diện người sử dụng lao động trong quan hệ lao động và các quan hệ khác liên quan trực tiếp đến quan hệ lao động; quản lý nhà nước về lao động.",
          ],
        },
        {
          number: "Điều 2",
          title: "Đối tượng áp dụng",
          paragraphs: [
            "1. Người lao động, người học nghề, người tập nghề và người làm việc không có quan hệ lao động.",
            "2. Người sử dụng lao động.",
            "3. Người lao động nước ngoài làm việc tại Việt Nam.",
            "4. Cơ quan, tổ chức, cá nhân khác có liên quan trực tiếp đến quan hệ lao động.",
          ],
        },
        {
          number: "Điều 3",
          title: "Giải thích từ ngữ",
          paragraphs: [
            "Trong Bộ luật này, các từ ngữ dưới đây được hiểu như sau:",
            "1. Người lao động là người làm việc cho người sử dụng lao động theo thỏa thuận, được trả lương và chịu sự quản lý, điều hành, giám sát của người sử dụng lao động.",
            "2. Người sử dụng lao động là doanh nghiệp, cơ quan, tổ chức, hợp tác xã, hộ gia đình, cá nhân có thuê mướn, sử dụng người lao động làm việc cho mình theo thỏa thuận.",
            "3. Quan hệ lao động là quan hệ xã hội phát sinh trong việc thuê mướn, sử dụng lao động, trả lương giữa người lao động, người sử dụng lao động, các tổ chức đại diện của các bên, cơ quan nhà nước có thẩm quyền.",
          ],
        },
        {
          number: "Điều 4",
          title: "Chính sách của Nhà nước về lao động",
          paragraphs: [
            "1. Bảo đảm quyền và lợi ích hợp pháp, chính đáng của người lao động, người làm việc không có quan hệ lao động; khuyến khích những thỏa thuận bảo đảm cho người lao động có điều kiện thuận lợi hơn so với quy định của pháp luật về lao động.",
            "2. Bảo đảm quyền và lợi ích hợp pháp của người sử dụng lao động, quản lý lao động đúng pháp luật, dân chủ, công bằng, văn minh và nâng cao trách nhiệm xã hội.",
            "3. Tạo điều kiện thuận lợi đối với hoạt động tạo việc làm, tự tạo việc làm, dạy nghề và học nghề để có việc làm.",
          ],
        },
      ],
    },
    {
      number: "Chương II",
      title: "VIỆC LÀM, TUYỂN DỤNG VÀ QUẢN LÝ LAO ĐỘNG",
      articles: [
        {
          number: "Điều 9",
          title: "Việc làm và giải quyết việc làm",
          paragraphs: [
            "1. Việc làm là hoạt động lao động tạo ra thu nhập mà pháp luật không cấm.",
            "2. Nhà nước, người sử dụng lao động và xã hội có trách nhiệm tham gia giải quyết việc làm, bảo đảm cho mọi người có khả năng lao động đều có cơ hội có việc làm.",
          ],
        },
        {
          number: "Điều 10",
          title: "Quyền làm việc của người lao động",
          paragraphs: [
            "1. Được tự do lựa chọn việc làm, làm việc cho bất kỳ người sử dụng lao động nào và ở bất kỳ nơi nào mà pháp luật không cấm.",
            "2. Trực tiếp liên hệ với người sử dụng lao động hoặc thông qua tổ chức dịch vụ việc làm để tìm việc làm theo nguyện vọng, khả năng, trình độ nghề nghiệp và sức khỏe của mình.",
          ],
        },
      ],
    },
    {
      number: "Chương III",
      title: "HỢP ĐỒNG LAO ĐỘNG",
      articles: [
        {
          number: "Điều 13",
          title: "Khái niệm hợp đồng lao động",
          paragraphs: [
            "1. Hợp đồng lao động là sự thỏa thuận giữa người lao động và người sử dụng lao động về việc làm có trả công, tiền lương, điều kiện lao động, quyền và nghĩa vụ của mỗi bên trong quan hệ lao động.",
            "Trường hợp hai bên thỏa thuận bằng tên gọi khác nhưng có nội dung thể hiện về việc làm có trả công, tiền lương và sự quản lý, điều hành, giám sát của một bên thì vẫn được coi là hợp đồng lao động.",
          ],
        },
        {
          number: "Điều 20",
          title: "Loại hợp đồng lao động",
          paragraphs: [
            "1. Hợp đồng lao động phải được giao kết theo một trong các loại sau đây:",
            "a) Hợp đồng lao động không xác định thời hạn là hợp đồng mà trong đó hai bên không xác định thời hạn, thời điểm chấm dứt hiệu lực của hợp đồng;",
            "b) Hợp đồng lao động xác định thời hạn là hợp đồng mà trong đó hai bên xác định thời hạn, thời điểm chấm dứt hiệu lực của hợp đồng trong thời gian không quá 36 tháng kể từ thời điểm có hiệu lực của hợp đồng.",
          ],
        },
      ],
    },
    {
      number: "Chương VI",
      title: "TIỀN LƯƠNG",
      articles: [
        {
          number: "Điều 90",
          title: "Tiền lương",
          paragraphs: [
            "1. Tiền lương là số tiền mà người sử dụng lao động trả cho người lao động theo thỏa thuận để thực hiện công việc, bao gồm mức lương theo công việc hoặc chức danh, phụ cấp lương và các khoản bổ sung khác.",
            "2. Mức lương theo công việc hoặc chức danh không được thấp hơn mức lương tối thiểu.",
          ],
        },
        {
          number: "Điều 91",
          title: "Mức lương tối thiểu",
          paragraphs: [
            "1. Mức lương tối thiểu là mức lương thấp nhất được trả cho người lao động làm công việc giản đơn nhất trong điều kiện lao động bình thường nhằm bảo đảm mức sống tối thiểu của người lao động và gia đình họ, phù hợp với điều kiện phát triển kinh tế - xã hội.",
            "2. Mức lương tối thiểu được xác lập theo vùng, ấn định theo tháng, giờ.",
          ],
        },
      ],
    },
    {
      number: "Chương VII",
      title: "THỜI GIỜ LÀM VIỆC, NGHỈ NGƠI",
      articles: [
        {
          number: "Điều 105",
          title: "Thời giờ làm việc bình thường",
          paragraphs: [
            "1. Thời giờ làm việc bình thường không quá 08 giờ trong 01 ngày và không quá 48 giờ trong 01 tuần.",
            "2. Người sử dụng lao động có quyền quy định thời giờ làm việc theo ngày hoặc tuần nhưng phải thông báo cho người lao động biết; trường hợp theo tuần thì thời giờ làm việc bình thường không quá 10 giờ trong 01 ngày và không quá 48 giờ trong 01 tuần.",
            "Nhà nước khuyến khích người sử dụng lao động thực hiện tuần làm việc 40 giờ đối với người lao động.",
          ],
        },
        {
          number: "Điều 112",
          title: "Nghỉ lễ, tết",
          paragraphs: [
            "1. Người lao động được nghỉ làm việc, hưởng nguyên lương trong những ngày lễ, tết sau đây:",
            "a) Tết Dương lịch: 01 ngày (ngày 01 tháng 01 dương lịch);",
            "b) Tết Âm lịch: 05 ngày;",
            "c) Ngày Chiến thắng: 01 ngày (ngày 30 tháng 4 dương lịch);",
            "d) Ngày Quốc tế lao động: 01 ngày (ngày 01 tháng 5 dương lịch);",
            "đ) Quốc khánh: 02 ngày (ngày 02 tháng 9 dương lịch và 01 ngày liền kề trước hoặc sau);",
            "e) Ngày Giỗ Tổ Hùng Vương: 01 ngày (ngày 10 tháng 3 âm lịch).",
          ],
        },
      ],
    },
  ],
  amendedByCodes: ["113/2025/QH15", "124/2025/QH15", "71/2025/QH15"],
  keywords: [
    "Bộ luật Lao động 2012",
    "Luật Bảo hiểm xã hội 2014",
    "Bộ luật Tố tụng dân sự 2015",
    "Nghị định 135/2020",
    "Nghị định 145/2020",
    "Nghị định 152/2020",
    "Thông tư 10/2020/TT-BLĐTBXH",
    "Thông tư 56/2025/TT-BQP",
    "Hợp đồng lao động",
    "Nghỉ phép năm",
    "Tiền lương tối thiểu vùng",
    "Tuổi nghỉ hưu",
  ],
  faqs: [
    {
      question: "Bộ luật Lao động 2019 có bao nhiêu loại hợp đồng lao động?",
      answer:
        "Theo Điều 20 Bộ luật Lao động 2019, từ ngày 01/01/2021 chỉ còn 02 loại hợp đồng lao động: Hợp đồng lao động không xác định thời hạn và Hợp đồng lao động xác định thời hạn (thời hạn không quá 36 tháng). Loại hợp đồng theo mùa vụ dưới 12 tháng đã chính thức bị bãi bỏ.",
    },
    {
      question: "Người lao động có thể đơn phương chấm dứt hợp đồng lao động không cần lý do không?",
      answer:
        "Có. Theo Điều 35 Bộ luật Lao động 2019, người lao động có quyền đơn phương chấm dứt hợp đồng lao động mà không cần lý do, chỉ cần báo trước cho người sử dụng lao động theo thời hạn quy định (ít nhất 45 ngày đối với hợp đồng không xác định thời hạn; ít nhất 30 ngày đối với hợp đồng xác định thời hạn từ 12-36 tháng).",
    },
    {
      question: "Quy định về thời gian nghỉ lễ Quốc khánh 02/9 như thế nào?",
      answer:
        "Theo điểm đ khoản 1 Điều 112 Bộ luật Lao động 2019, dịp Quốc khánh người lao động được nghỉ 02 ngày hưởng nguyên lương, gồm ngày 02/9 và 01 ngày liền kề trước hoặc sau do Thủ tướng Chính phủ quyết định hằng năm.",
    },
    {
      question: "Lộ trình điều chỉnh tuổi nghỉ hưu theo Bộ luật mới ra sao?",
      answer:
        "Theo Điều 169, tuổi nghỉ hưu của người lao động trong điều kiện bình thường được điều chỉnh theo lộ trình: kể từ năm 2021 là đủ 60 tuổi 03 tháng đối với nam và đủ 55 tuổi 04 tháng đối với nữ; sau đó mỗi năm tăng thêm 03 tháng đối với nam cho đến khi đủ 62 tuổi vào năm 2028 và thêm 04 tháng đối với nữ cho đến khi đủ 60 tuổi vào năm 2035.",
    },
  ],
  authors: ["Hải Yến", "Lan Vũ"],
  englishTitle: "Labor Code No. 45/2019/QH14 dated November 20, 2019 of the National Assembly",
  originalPdfUrl: "/sample-docs/Bo-luat-Lao-dong-45-2019-QH14.pdf",
  englishContent: `NATIONAL ASSEMBLY OF THE SOCIALIST REPUBLIC OF VIETNAM
Independence - Freedom - Happiness
-----------------
Labor Code No. 45/2019/QH14

Pursuant to the Constitution of the Socialist Republic of Vietnam;
The National Assembly hereby promulgates the Labor Code.

CHAPTER I: GENERAL PROVISIONS
Article 1. Scope of regulation
This Labor Code prescribes labor standards; rights, obligations and responsibilities of employees, employers, employee representative organizations at grassroots levels, employer representative organizations in labor relations and other relations directly related to labor relations; and state management of labor.

Article 2. Regulated entities
1. Employees, trainees, apprentices and non-contractual workers.
2. Employers.
3. Foreign employees working in Vietnam.
4. Other agencies, organizations and individuals directly related to labor relations.

Article 13. Definition of employment contract
1. An employment contract is an agreement between an employee and an employer on paid employment, wage, working conditions, rights and obligations of each party in labor relations.
Where both parties agree on a contract under a different name but the contents reflect paid employment, wage and the management, direction and supervision of one party, such contract shall still be deemed an employment contract.`,
  consolidatedNote:
    "Nội dung hợp nhất Bộ luật Lao động số 45/2019/QH14 tích hợp các sửa đổi từ Luật Bảo hiểm xã hội 41/2024/QH15, Luật Công nghiệp công nghệ số 71/2025/QH15 và Luật Dân số 113/2025/QH15.",
};

export const MOCK_RELATED_DOCUMENTS: RelatedDocumentItem[] = [
  {
    id: "rel-01",
    orderNumber: "01",
    code: "393/2026/NĐ-CP",
    title: "Nghị định 393/2026/NĐ-CP quy định lao động nước ngoài tại Việt Nam",
    issuer: "Chính phủ",
    issueDate: "20/10/2026",
    effectiveDate: "05/12/2026",
    statusText: "Chưa áp dụng",
    statusCode: "PENDING",
    categoryKey: "guiding",
  },
  {
    id: "rel-02",
    orderNumber: "02",
    code: "371/2026/NĐ-CP",
    title: "Nghị định 371/2026/NĐ-CP quy định tuyển dụng lao động Việt Nam cho tổ chức nước ngoài",
    issuer: "Chính phủ",
    issueDate: "25/09/2026",
    effectiveDate: "15/11/2026",
    statusText: "Chưa áp dụng",
    statusCode: "PENDING",
    categoryKey: "guiding",
  },
  {
    id: "rel-03",
    orderNumber: "03",
    code: "283/2026/NĐ-CP",
    title: "Nghị định 283/2026/NĐ-CP: Xử phạt vi phạm hành chính lao động, bảo hiểm xã hội",
    issuer: "Chính phủ",
    issueDate: "15/07/2026",
    effectiveDate: "10/09/2026",
    statusText: "Còn hiệu lực",
    statusCode: "EFFECTIVE",
    categoryKey: "guiding",
  },
  {
    id: "rel-04",
    orderNumber: "04",
    code: "56/2026/TT-BXD",
    title: "Thông tư 56/2026/TT-BXD quy định thời giờ làm việc, nghỉ ngơi cho lao động trên biển",
    issuer: "Bộ Xây dựng",
    issueDate: "06/07/2026",
    effectiveDate: "01/09/2026",
    statusText: "Còn hiệu lực",
    statusCode: "EFFECTIVE",
    categoryKey: "guiding",
  },
  {
    id: "rel-05",
    orderNumber: "05",
    code: "235/2026/NĐ-CP",
    title: "Nghị định 235/2026/NĐ-CP về hợp đồng công việc trong đơn vị sự nghiệp công lập",
    issuer: "Chính phủ",
    issueDate: "26/06/2026",
    effectiveDate: "01/07/2026",
    statusText: "Còn hiệu lực",
    statusCode: "EFFECTIVE",
    categoryKey: "guiding",
  },
  {
    id: "rel-06",
    orderNumber: "06",
    code: "41/2024/QH15",
    title: "Luật Bảo hiểm xã hội của Quốc hội, số 41/2024/QH15",
    issuer: "Quốc hội",
    issueDate: "29/06/2024",
    effectiveDate: "01/07/2025",
    statusText: "Hết hiệu lực một phần",
    statusCode: "PARTIAL",
    categoryKey: "stipulating_partial_expired",
  },
  {
    id: "rel-07",
    orderNumber: "07",
    code: "71/2025/QH15",
    title: "Luật Công nghiệp công nghệ số của Quốc hội, số 71/2025/QH15",
    issuer: "Quốc hội",
    issueDate: "14/06/2025",
    effectiveDate: "01/01/2026",
    statusText: "Hết hiệu lực một phần",
    statusCode: "PARTIAL",
    categoryKey: "amending",
  },
  {
    id: "rel-08",
    orderNumber: "08",
    code: "113/2025/QH15",
    title: "Luật Dân số của Quốc hội, số 113/2025/QH15",
    issuer: "Quốc hội",
    issueDate: "10/12/2025",
    effectiveDate: "01/07/2026",
    statusText: "Còn hiệu lực",
    statusCode: "EFFECTIVE",
    categoryKey: "amending",
  },
  {
    id: "rel-09",
    orderNumber: "09",
    code: "124/2025/QH15",
    title: "Luật Giáo dục nghề nghiệp của Quốc hội, số 124/2025/QH15",
    issuer: "Quốc hội",
    issueDate: "20/11/2025",
    effectiveDate: "01/07/2026",
    statusText: "Còn hiệu lực",
    statusCode: "EFFECTIVE",
    categoryKey: "amending",
  },
  {
    id: "rel-10",
    orderNumber: "10",
    code: "10/2012/QH13",
    title: "Bộ luật Lao động của Quốc hội, số 10/2012/QH13",
    issuer: "Quốc hội",
    issueDate: "18/06/2012",
    effectiveDate: "01/05/2013",
    statusText: "Hết hiệu lực",
    statusCode: "EXPIRED",
    categoryKey: "expired",
  },
  {
    id: "rel-11",
    orderNumber: "11",
    code: "HP-2013",
    title: "Hiến pháp năm 2013 của nước Cộng hòa xã hội chủ nghĩa Việt Nam",
    issuer: "Quốc hội",
    issueDate: "28/11/2013",
    effectiveDate: "01/01/2014",
    statusText: "Còn hiệu lực",
    statusCode: "EFFECTIVE",
    categoryKey: "basis",
  },
  {
    id: "rel-12",
    orderNumber: "12",
    code: "92/2015/QH13",
    title: "Bộ luật Tố tụng dân sự của Quốc hội, số 92/2015/QH13",
    issuer: "Quốc hội",
    issueDate: "25/11/2015",
    effectiveDate: "01/07/2016",
    statusText: "Hết hiệu lực một phần",
    statusCode: "PARTIAL",
    categoryKey: "amended_by",
  },
  {
    id: "rel-13",
    orderNumber: "13",
    code: "58/2014/QH13",
    title: "Luật Bảo hiểm xã hội của Quốc hội, số 58/2014/QH13",
    issuer: "Quốc hội",
    issueDate: "20/11/2014",
    effectiveDate: "01/01/2016",
    statusText: "Hết hiệu lực một phần",
    statusCode: "PARTIAL",
    categoryKey: "amended_by",
  },
];

export const MOCK_CONSTRUCTION_LAW_2014: DetailedLegalDocument = {
  id: "doc-const-2014",
  code: "50/2014/QH13",
  title: "Luật Xây dựng 2014, số 50/2014/QH13 (được sửa đổi bởi Luật số 62/2020/QH14)",
  shortTitle: "Luật Xây dựng 2014",
  categoryName: "Luật",
  issuer: "Quốc hội",
  gazetteNumber: "631+632-07/2014",
  gazetteDate: "15/07/2014",
  signer: "Nguyễn Sinh Hùng",
  issueDate: "18/06/2014",
  effectiveDate: "01/01/2015",
  expiredDate: "Đang cập nhật",
  statusText: "Hết Hiệu lực một phần",
  statusCode: "PARTIAL",
  field: "Đầu tư xây dựng",
  updatedAtText: "Thứ Hai, 15/09/2025 09:30 (GMT+7)",
  totalChapters: 10,
  totalArticles: 168,
  summaryHighlights: [
    "Quy định quyền và nghĩa vụ của chủ đầu tư, ban quản lý dự án chuyên ngành đối với dự án đầu tư xây dựng.",
    "Trình tự, thủ tục thẩm định Báo cáo nghiên cứu khả thi, thẩm định thiết kế triển khai sau thiết kế cơ sở và dự toán xây dựng công trình.",
    "Quy chuẩn cấp giấy phép xây dựng, điều kiện khởi công và nghiệm thu bàn giao đưa vào khai thác sử dụng.",
  ],
  chapters: [
    {
      number: "Chương I",
      title: "NHỮNG QUY ĐỊNH CHUNG",
      articles: [
        {
          number: "Điều 1",
          title: "Phạm vi điều chỉnh",
          paragraphs: [
            "Luật này quy định về quyền, nghĩa vụ, trách nhiệm của cơ quan, tổ chức, cá nhân và quản lý nhà nước trong hoạt động đầu tư xây dựng.",
          ],
        },
        {
          number: "Điều 2",
          title: "Đối tượng áp dụng",
          paragraphs: [
            "Luật này áp dụng đối với cơ quan, tổ chức, cá nhân trong nước; tổ chức, cá nhân nước ngoài hoạt động đầu tư xây dựng trên lãnh thổ Việt Nam.",
          ],
        },
      ],
    },
    {
      number: "Chương III",
      title: "DỰ ÁN ĐẦU TƯ XÂY DỰNG",
      articles: [
        {
          number: "Điều 62",
          title: "Hình thức quản lý dự án đầu tư xây dựng",
          paragraphs: [
            "1. Ban quản lý dự án đầu tư xây dựng chuyên ngành, Ban quản lý dự án đầu tư xây dựng khu vực áp dụng đối với dự án sử dụng vốn đầu tư công khi người quyết định đầu tư giao quản lý thực hiện đồng thời hoặc liên tục các dự án.",
            "2. Ban quản lý dự án đầu tư xây dựng một dự án áp dụng đối với dự án sử dụng vốn đầu tư công khi người quyết định đầu tư giao quản lý thực hiện một dự án nhóm A có công trình cấp đặc biệt; dự án áp dụng công nghệ cao; dự án quốc phòng, an ninh.",
          ],
        },
      ],
    },
  ],
  amendedByCodes: ["62/2020/QH14", "35/2023/QH15", "43/2024/QH15"],
  keywords: [
    "Luật Xây dựng 2003",
    "Nghị định 15/2021/NĐ-CP",
    "Nghị định 10/2021/NĐ-CP",
    "Nghị định 06/2021/NĐ-CP",
    "Ban quản lý dự án",
    "Thẩm định thiết kế",
    "Nghiệm thu công trình",
  ],
  faqs: [
    {
      question: "Chủ đầu tư có được ủy quyền toàn bộ cho Ban QLDA chuyên ngành không?",
      answer:
        "Theo Điều 63 Luật Xây dựng sửa đổi 2020, Ban quản lý dự án chuyên ngành thực hiện quyền, nghĩa vụ của chủ đầu tư theo phân cấp, ủy quyền của người quyết định đầu tư hoặc theo thỏa thuận giao nhiệm vụ.",
    },
  ],
  authors: ["Nguyễn Văn Tuấn", "Phạm Quốc Doanh"],
  englishTitle: "Law on Construction No. 50/2014/QH13 amended by Law No. 62/2020/QH14",
};

export const POPULAR_LEGAL_DOCUMENTS: DetailedLegalDocument[] = [
  MOCK_LABOR_CODE_2019,
  MOCK_CONSTRUCTION_LAW_2014,
];
