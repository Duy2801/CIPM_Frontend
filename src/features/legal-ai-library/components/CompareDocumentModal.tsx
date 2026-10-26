"use client";

import { useState } from "react";
import { DiffOutlined, SwapOutlined } from "@ant-design/icons";
import { Button, Modal, Select, Tag } from "@/components/ui";

interface CompareDocumentModalProps {
  open: boolean;
  onClose: () => void;
  currentTitle: string;
  currentCode: string;
}

export default function CompareDocumentModal({
  open,
  onClose,
  currentTitle,
  currentCode,
}: CompareDocumentModalProps) {
  const [compareTarget, setCompareTarget] = useState("amended_2025");

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-block h-3 w-3 rounded-xs bg-rose-100 border border-rose-300" />
            <span>Nội dung bị sửa đổi/bãi bỏ</span>
            <span className="inline-block h-3 w-3 rounded-xs bg-emerald-100 border border-emerald-300 ml-2" />
            <span>Nội dung mới bổ sung</span>
          </div>
          <Button intent="primary" onClick={onClose}>
            Đóng so sánh
          </Button>
        </div>
      }
      title={
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 pr-6">
          <div className="flex items-center gap-2">
            <DiffOutlined className="text-[#DC2626] text-lg" />
            <div>
              <h3 className="m-0 text-base font-bold text-slate-900">
                So sánh văn bản & điều khoản sửa đổi
              </h3>
              <p className="m-0 text-xs text-slate-500">
                Đối chiếu song song hai phiên bản quy phạm pháp luật
              </p>
            </div>
          </div>
        </div>
      }
      width={1000}
      centered
    >
      <div className="space-y-4 py-3">
        {/* Bộ chọn phiên bản so sánh */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-700">Văn bản gốc:</span>
            <Tag color="blue">{currentCode} (Gốc)</Tag>
          </div>
          <SwapOutlined className="text-slate-400" />
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-700">So sánh với:</span>
            <Select
              className="w-72"
              value={compareTarget}
              onChange={setCompareTarget}
              options={[
                {
                  value: "amended_2025",
                  label: "Luật Dân số 113/2025/QH15 (Sửa đổi BLLĐ)",
                },
                {
                  value: "amended_71_2025",
                  label: "Luật CN Công nghệ số 71/2025/QH15",
                },
                {
                  value: "prev_code_2012",
                  label: "Bộ luật Lao động cũ số 10/2012/QH13",
                },
              ]}
            />
          </div>
        </div>

        {/* Khung đối chiếu 2 cột */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cột trái: Văn bản hiện tại */}
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <div className="bg-slate-100/80 px-3.5 py-2.5 border-b border-slate-200 font-bold text-xs text-slate-800 flex items-center justify-between">
              <span>{currentTitle}</span>
              <span className="text-[11px] text-slate-500">Bản đang xem</span>
            </div>
            <div className="p-3.5 space-y-4 text-xs leading-relaxed max-h-[460px] overflow-y-auto">
              <div className="border-b border-slate-100 pb-3">
                <p className="font-bold text-slate-800 m-0">Điều 13. Hợp đồng lao động</p>
                <p className="mt-1.5 text-slate-700 m-0">
                  1. Hợp đồng lao động là sự thỏa thuận giữa người lao động và người sử dụng lao động về việc làm có trả công, tiền lương, điều kiện lao động, quyền và nghĩa vụ của mỗi bên trong quan hệ lao động.
                </p>
              </div>

              <div className="border-b border-slate-100 pb-3">
                <p className="font-bold text-slate-800 m-0">Điều 20. Loại hợp đồng lao động</p>
                <p className="mt-1.5 text-slate-700 m-0">
                  1. Hợp đồng lao động phải được giao kết theo một trong các loại sau đây:
                </p>
                <p className="mt-1 text-slate-700 m-0">
                  a) Hợp đồng lao động không xác định thời hạn;
                </p>
                <p className="mt-1 bg-rose-50 text-rose-800 p-1.5 rounded-xs border border-rose-200 m-0">
                  b) Hợp đồng lao động xác định thời hạn là hợp đồng mà trong đó hai bên xác định thời hạn trong thời gian không quá 36 tháng kể từ thời điểm có hiệu lực.
                </p>
              </div>

              <div>
                <p className="font-bold text-slate-800 m-0">Điều 112. Nghỉ lễ, tết</p>
                <p className="mt-1.5 text-slate-700 m-0">
                  đ) Quốc khánh: 02 ngày (ngày 02 tháng 9 dương lịch và 01 ngày liền kề trước hoặc sau).
                </p>
              </div>
            </div>
          </div>

          {/* Cột phải: Văn bản so sánh */}
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <div className="bg-blue-50/80 px-3.5 py-2.5 border-b border-blue-200 font-bold text-xs text-blue-900 flex items-center justify-between">
              <span>Luật sửa đổi, bổ sung (Phiên bản mới)</span>
              <span className="text-[11px] text-blue-600">Đã cập nhật sửa đổi</span>
            </div>
            <div className="p-3.5 space-y-4 text-xs leading-relaxed max-h-[460px] overflow-y-auto bg-slate-50/30">
              <div className="border-b border-slate-100 pb-3">
                <p className="font-bold text-slate-800 m-0">Điều 13. Hợp đồng lao động</p>
                <p className="mt-1.5 text-slate-700 m-0">
                  1. Giữ nguyên thỏa thuận hai bên về việc làm có trả công, tiền lương, mở rộng phương thức giao kết qua phương tiện điện tử có giá trị tương đương văn bản giấy.
                </p>
              </div>

              <div className="border-b border-slate-100 pb-3">
                <p className="font-bold text-slate-800 m-0">Điều 20. Loại hợp đồng lao động</p>
                <p className="mt-1.5 text-slate-700 m-0">
                  1. Hợp đồng lao động giao kết theo 02 loại:
                </p>
                <p className="mt-1 text-slate-700 m-0">
                  a) Hợp đồng không xác định thời hạn;
                </p>
                <p className="mt-1 bg-emerald-50 text-emerald-800 p-1.5 rounded-xs border border-emerald-200 m-0">
                  b) Hợp đồng xác định thời hạn (tối đa 36 tháng). Bổ sung quy định linh hoạt cho hợp đồng giao kết với lao động số, chuyên gia độc lập và nhân sự kỹ thuật cao.
                </p>
              </div>

              <div>
                <p className="font-bold text-slate-800 m-0">Điều 112. Nghỉ lễ, tết</p>
                <p className="mt-1.5 text-slate-700 m-0">
                  đ) Quốc khánh 02 ngày; bổ sung quy định tính ngày công trực tuyến nếu thời gian nghỉ trùng đợt tổng điều tra dân số quốc gia.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
