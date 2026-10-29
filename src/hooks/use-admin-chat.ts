"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

export function useAdminChat() {
  const [input, setInput] = useState("");
  const [errorDismissed, setErrorDismissed] = useState(false);
  const chat = useChat({ transport: new DefaultChatTransport({ api: "/api/admin/chat" }) });

  return {
    input,
    setInput,
    errorDismissed,
    setErrorDismissed,
    messages: chat.messages,
    sendMessage: chat.sendMessage,
    status: chat.status,
    regenerate: chat.regenerate,
    stop: chat.stop,
    error: chat.error,
  };
}
