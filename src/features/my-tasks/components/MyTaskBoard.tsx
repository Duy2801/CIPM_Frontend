"use client";

import { MY_TASK_COLUMN_ORDER } from "../constants/my-task-tabs";
import { useHorizontalBoard } from "../hooks/useHorizontalBoard";
import MyTaskBoardColumn from "./MyTaskBoardColumn";
import MyTaskScrollButton from "./MyTaskScrollButton";

export default function MyTaskBoard() {
  const { ref, canLeft, canRight, columnWidth, scrollByColumn, panHandlers } = useHorizontalBoard();

  return (
    <div className="relative min-h-0 flex-1">
      {canLeft && <MyTaskScrollButton side="left" onClick={() => scrollByColumn(-1)} />}
      {canRight && <MyTaskScrollButton side="right" onClick={() => scrollByColumn(1)} />}
      <div
        ref={ref}
        {...panHandlers}
        className="flex h-full gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {MY_TASK_COLUMN_ORDER.map((col) => (
          <MyTaskBoardColumn key={col} column={col} width={columnWidth} />
        ))}
      </div>
    </div>
  );
}
