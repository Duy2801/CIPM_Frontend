"use client";

import { useEffect, useRef, useState } from "react";
import {
  BookOutlined,
  ClearOutlined,
  FileSearchOutlined,
  LoadingOutlined,
  RobotOutlined,
  SendOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Input, Text } from "@/components/ui";
import {
  AI_SUGGESTED_QUESTIONS,
  INITIAL_CHAT_MESSAGES,
} from "../constants/legal-mock-data";
import type { ChatMessage, LegalDocument } from "../types/legal-ai.types";
import { askLegalAiAssistant } from "../utils/legal-ai-assistant";

interface AiLegalAssistantDrawerProps {
  open: boolean;
  onClose: () => void;
  onSelectDocument?: (docId: string) => void;
}

export default function AiLegalAssistantDrawer({
  open,
  onClose,
  onSelectDocument,
}: AiLegalAssistantDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (open) {
      setTimeout(scrollToBottom, 150);
    }
  }, [open, messages, isThinking]);

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isThinking) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsThinking(true);

    // Giả lập AI phản hồi sau 700ms
    setTimeout(() => {
      const response = askLegalAiAssistant(query);
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        sender: "ai",
        text: response.answer,
        timestamp: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        citations: response.citations,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsThinking(false);
    }, 750);
  };

  const handleClearHistory = () => {
    setMessages([INITIAL_CHAT_MESSAGES[0]]);
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="min(680px, 100vw)"
      title={
        <div className="py-1">
          <div className="flex items-center gap-2 text-base font-bold text-slate-800">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-[#007A78]">
              <RobotOutlined className="text-base" />
            </span>
            <span>Trợ lý AI Pháp lý & Nghiệp vụ XDCB</span>
          </div>
          <div className="mt-0.5 text-xs font-normal text-slate-500">
            Tra cứu văn bản quy phạm, đối chiếu quy trình 16 bước GPMB, giải ngân KBNN và đấu thầu
          </div>
        </div>
      }
      footer={
        <div className="flex w-full items-center justify-between py-1">
          <Button
            intent="outline"
            scale="sm"
            icon={<ClearOutlined />}
            onClick={handleClearHistory}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Xóa lịch sử hội thoại
          </Button>
          <Button
            intent="primary"
            scale="sm"
            onClick={onClose}
            className="!border-[#007A78] !bg-[#007A78] px-5 text-xs font-semibold !text-white shadow-sm hover:!bg-[#006361]"
          >
            Đóng
          </Button>
        </div>
      }
    >
      <div className="flex h-[calc(100vh-175px)] flex-col gap-3">
        {/* Câu hỏi gợi ý nhanh */}
        <div className="shrink-0 rounded-xl border border-slate-200/90 bg-slate-50/80 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-[11.5px] font-bold text-slate-700">
            <FileSearchOutlined className="text-[#007A78]" />
            Câu hỏi tình huống pháp lý phổ biến:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {AI_SUGGESTED_QUESTIONS.map((question, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(question)}
                className="cursor-pointer rounded-lg border border-teal-200/80 bg-white px-2.5 py-1 text-left text-xs font-medium text-teal-900 transition-colors hover:border-teal-500 hover:bg-teal-50/80"
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* Khung tin nhắn hội thoại */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {msg.sender === "user" ? (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white shadow-xs">
                  <UserOutlined />
                </div>
              ) : (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#007A78] text-xs text-white shadow-xs">
                  <RobotOutlined />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-xs ${
                  msg.sender === "user"
                    ? "bg-[#007A78] text-white rounded-tr-none"
                    : "border border-slate-200 bg-white text-slate-800 rounded-tl-none"
                }`}
              >
                <div className="whitespace-pre-wrap font-normal">{msg.text}</div>

                {/* Trích dẫn văn bản pháp lý */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-2.5 border-t border-slate-100 pt-2">
                    <div className="mb-1.5 flex items-center gap-1 text-[11px] font-bold text-teal-800">
                      <BookOutlined />
                      Căn cứ pháp lý trích dẫn:
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {msg.citations.map((cite, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-lg border border-slate-200/90 bg-slate-50/90 px-2.5 py-1.5 text-[11px] text-slate-700"
                        >
                          <span className="font-medium">
                            <strong className="text-teal-700">{cite.code}</strong>: {cite.title}{" "}
                            {cite.article && <span className="text-slate-500">({cite.article})</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div
                  className={`mt-1.5 text-right text-[10px] ${
                    msg.sender === "user" ? "text-teal-100" : "text-slate-400"
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#007A78] text-xs text-white shadow-xs">
                <RobotOutlined />
              </div>
              <div className="rounded-2xl rounded-tl-none border border-slate-200 bg-white p-3 text-xs text-slate-600 shadow-xs">
                <div className="flex items-center gap-2 font-medium">
                  <LoadingOutlined className="text-teal-600" />
                  <span>AI đang tra cứu cơ sở dữ liệu pháp lý & các mô-đun BQL...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Khung nhập tin nhắn */}
        <div className="shrink-0 rounded-xl border border-slate-200 bg-white p-2 shadow-xs">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <Input
              intent="clean"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Đặt câu hỏi pháp lý, quy trình GPMB, đấu thầu, giải ngân..."
              className="flex-1 text-xs h-9 border-none shadow-none focus:ring-0"
              disabled={isThinking}
            />
            <Button
              htmlType="submit"
              intent="primary"
              scale="sm"
              icon={<SendOutlined />}
              disabled={!inputText.trim() || isThinking}
              className="!border-[#007A78] !bg-[#007A78] px-4 text-xs font-semibold !text-white shadow-xs hover:!bg-[#006361]"
            >
              Gửi
            </Button>
          </form>
        </div>
      </div>
    </Drawer>
  );
}
