"use client";
import React, { useState, useEffect } from "react";
// Import the default export
import Fiction from "fiction-chat-client";
// Or destructure what you need
// import { FictionChatClient } from "fiction-chat-client";
import "fiction-chat-client/dist/index.css";

export default function Home() {
  const [token, setToken] = useState(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MX0.fhc3wykrAnRpcKApKhXiahxaOe8PSHatad31NuIZ0Zg"
  );

  return (
    <>
      <div className="flex flex-row w-full border-2 h-screen">
        <Fiction.FictionChatClient
          authToken={token}
          contentContainerClassName=" "
          chatServerUrl={process.env.NEXT_PUBLIC_CHAT_SERVER_URL}
          chatWsUrl={process.env.NEXT_PUBLIC_CHAT_WS_URL}
        />
      </div>
    </>
  );
}
