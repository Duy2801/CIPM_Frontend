"use client";

import { Modal } from "@/components/ui";

interface ColorGuideModalProps {
  open: boolean;
  onClose: () => void;
}

const COLOR_GUIDES = [
  {
    color: "bg-emerald-600",
    name: "Màu xanh lá đậm",
    status: "Còn hiệu lực toàn bộ",
    desc: "Văn bản hoặc điều khoản đang có hiệu lực thi hành đầy đủ, chưa bị sửa đổi, bổ sung hay bãi bỏ.",
  },
  {
    color: "bg-amber-500",
    name: "Màu cam vàng",
    status: "Hết hiệu lực một phần / Bị sửa đổi bổ sung",
    desc: "Văn bản đã bị một văn bản khác sửa đổi, bổ sung, bãi bỏ một số điều, khoản; các phần còn lại vẫn áp dụng bình thường.",
  },
  {
    color: "bg-rose-600",
    name: "Màu đỏ",
    status: "Hết hiệu lực toàn bộ",
    desc: "Văn bản đã bị thay thế hoàn toàn bởi văn bản mới hoặc đã hết thời hạn thi hành ghi trong văn bản.",
  },
  {
    color: "bg-blue-600",
    name: "Màu xanh dương / lam",
    status: "Chưa áp dụng / Có hiệu lực trong tương lai",
    desc: "Văn bản đã được ban hành chính thức nhưng chưa tới ngày có hiệu lực thi hành theo quy định.",
  },
  {
    color: "bg-slate-500",
    name: "Màu xám",
    status: "Đang cập nhật tình trạng hiệu lực",
    desc: "Văn bản đang trong quá trình rà soát, đối chiếu bởi ban biên tập pháp lý hoặc cơ quan quản lý nhà nước.",
  },
];

export default function ColorGuideModal({ open, onClose }: ColorGuideModalProps) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <span className="inline-block h-3.5 w-3.5 rounded-full bg-[#DC2626]" />
          <span className="text-base font-bold text-slate-800">
            Chú thích màu chỉ dẫn tình trạng hiệu lực
          </span>
        </div>
      }
      width={560}
      centered
    >
      <div className="py-2 space-y-3.5">
        <p className="m-0 text-xs text-slate-500 leading-relaxed">
          Hệ thống Thư viện Pháp lý sử dụng chuẩn màu sắc quy ước thống nhất để bạn nhận biết nhanh chóng tình trạng pháp lý của văn bản và các điều khoản:
        </p>

        <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-slate-50/50">
          {COLOR_GUIDES.map((item) => (
            <div key={item.status} className="flex items-start gap-3 p-3">
              <span
                className={`mt-1 h-3.5 w-3.5 shrink-0 rounded-full ${item.color} shadow-xs ring-2 ring-white`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800">{item.status}</span>
                  <span className="text-[11px] font-medium text-slate-400">{item.name}</span>
                </div>
                <p className="m-0 mt-0.5 text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-md bg-blue-50 p-2.5 text-[11px] text-blue-700">
          💡 <strong>Mẹo tra cứu:</strong> Bạn có thể bật chế độ xem <em>Chỉ xem điều khoản còn hiệu lực</em> tại Tab <strong>Nội dung</strong> để loại bỏ các điều khoản đã hết hiệu lực một phần.
        </div>
      </div>
    </Modal>
  );
}
