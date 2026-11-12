"use client";

import { useState } from "react";
import { useDisableSwipeBack } from "../hooks/useDisableSwipeBack";
import ReportDetail from "./ReportDetail";
import ReportHistoryTab from "./ReportHistoryTab";
import ReportScreenTabs, { type ReportScreenTab } from "./ReportScreenTabs";
import ReportTypeGrid from "./ReportTypeGrid";

export default function ReportsScreen() {
  const [openedTypeId, setOpenedTypeId] = useState<string | null>(null);
  const [tab, setTab] = useState<ReportScreenTab>("list");
  useDisableSwipeBack();

  return (
    <div className="mx-auto flex w-full max-w-[2560px] flex-col gap-4">
      {openedTypeId ? (
        <ReportDetail key={openedTypeId} typeId={openedTypeId} onBack={() => setOpenedTypeId(null)} />
      ) : (
        <>
          <ReportScreenTabs value={tab} onChange={setTab} />
          {tab === "history" ? <ReportHistoryTab /> : <ReportTypeGrid onOpen={setOpenedTypeId} />}
        </>
      )}
    </div>
  );
}
