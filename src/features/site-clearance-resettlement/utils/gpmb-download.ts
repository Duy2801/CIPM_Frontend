/**
 * gpmb-download.ts — Tạo và tải xuống tệp PDF chuẩn cho hồ sơ và biểu mẫu GPMB
 */

export interface DownloadGpmbOptions {
  fileName: string;
  title: string;
  details: string[];
}

export function downloadGpmbDocument({ fileName, title, details }: DownloadGpmbOptions) {
  const contentLines = [
    "CONG HOA XA HOI CHU NGHIA VIET NAM",
    "Doc lap - Tu do - Hanh phuc",
    "----------------------------------------",
    "BAN QUAN LY DU AN DAU TU XAY DUNG KHU VUC HA TIEN",
    "HO SO BOI THUONG, HO TRO VA TAI DINH CU (GPMB)",
    "",
    title.toUpperCase(),
    "",
    ...details,
    "",
    "----------------------------------------",
    "Can cu: Luat Dat dai 2024, Nghi dinh 88/2024/ND-CP.",
    "Van ban dien tu xac thuc boi He thong QLDA Ha Tien.",
  ];

  const streamLines = [
    "BT",
    "/F1 12 Tf",
    "50 780 Td",
    ...contentLines.flatMap((line, idx) => {
      const isHeader = idx < 6;
      const clean = line
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[\\()]/g, "");
      return [
        isHeader ? "/F1 12 Tf" : "/F1 10 Tf",
        `(${clean}) Tj`,
        "0 -18 Td",
      ];
    }),
    "ET",
  ].join("\n");

  const streamLength = streamLines.length;
  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length ${streamLength} >>
stream
${streamLines}
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000224 00000 n 
0000000305 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${400 + streamLength}
%%EOF`;

  const blob = new Blob([pdfString], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const safeName = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
  link.download = safeName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
