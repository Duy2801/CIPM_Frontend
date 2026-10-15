/**
 * format-money.ts — Tiện ích định dạng số tiền tiếng Việt (phân cách hàng nghìn bằng dấu chấm)
 *
 * Hỗ trợ hiển thị trực quan:
 * 1000 -> "1.000"
 * 100000000 -> "100.000.000"
 * 25.5 -> "25,5"
 * 1000000.5 -> "1.000.000,5"
 * -2000 -> "-2.000"
 */

/**
 * Định dạng chuỗi hoặc số thành định dạng tiền tệ có dấu chấm phân cách hàng nghìn.
 */
export function formatMoneyString(
  input: string | number | undefined | null,
  allowNegative = false,
  maxDecimals = 3
): string {
  if (input === undefined || input === null || input === "") return "";

  // Nếu đầu vào là kiểu số thuần túy (từ state hoặc database)
  if (typeof input === "number") {
    if (isNaN(input)) return "";
    const isNeg = allowNegative && input < 0;
    const abs = Math.abs(input);
    const [intPart, decPart] = abs.toString().split(".");
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const formattedDec = decPart ? `,${decPart.slice(0, maxDecimals)}` : "";
    return `${isNeg ? "-" : ""}${formattedInt}${formattedDec}`;
  }

  let str = String(input).trim();
  if (!str) return "";

  const isNeg = allowNegative && str.startsWith("-");
  str = str.replace(/^-/, "");

  if (isNeg && !str) return "-";

  let intRaw = str;
  let decRaw: string | null = null;

  if (str.includes(",")) {
    const parts = str.split(",");
    intRaw = parts[0];
    decRaw = parts.slice(1).join("");
  } else if (str.endsWith(".")) {
    // Nếu người dùng nhập kết thúc bằng dấu chấm: vd "25." -> chuẩn bị nhập số thập phân
    intRaw = str.slice(0, -1);
    decRaw = "";
  }

  // Loại bỏ tất cả ký tự không phải chữ số ở phần nguyên (bao gồm các dấu chấm phân cách hàng nghìn cũ)
  const cleanInt = intRaw.replace(/[^\d]/g, "");
  if (!cleanInt && decRaw === null) return isNeg ? "-" : "";

  // Định dạng phần nguyên: tự động thêm dấu chấm mỗi 3 chữ số
  const formattedInt = cleanInt ? cleanInt.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "0";

  // Định dạng phần thập phân
  let formattedDec = "";
  if (decRaw !== null) {
    const cleanDec = decRaw.replace(/[^\d]/g, "").slice(0, maxDecimals);
    formattedDec = `,${cleanDec}`;
  }

  return `${isNeg ? "-" : ""}${formattedInt}${formattedDec}`;
}

/**
 * Chuyển đổi chuỗi tiền tệ (có dấu chấm phân cách nghìn và phẩy thập phân) thành Number thuần túy.
 */
export function parseMoney(val: string | number | undefined | null): number {
  if (val === undefined || val === null || val === "") return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;

  let str = String(val).trim();
  if (!str) return 0;

  const isNeg = str.startsWith("-");
  str = str.replace(/^-/, "");

  if (str.includes(",")) {
    // Tiêu chuẩn tiếng Việt: chấm là hàng nghìn, phẩy là thập phân
    str = str.replace(/\./g, "").replace(",", ".");
  } else {
    // Không có dấu phẩy: mọi dấu chấm đều là dấu phân cách hàng nghìn
    str = str.replace(/\./g, "");
  }

  const num = parseFloat(str);
  if (isNaN(num)) return 0;
  return isNeg ? -num : num;
}
