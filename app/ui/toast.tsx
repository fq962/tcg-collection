"use client";

import { useState } from "react";

export function useToast() {
  const [message, setMessage] = useState("");

  function show(text: string) {
    setMessage(text);
    setTimeout(() => setMessage(""), 2500);
  }

  const toast = message ? (
    <div role="status" className="fixed inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-50 mx-auto w-fit max-w-[90vw] rounded-full bg-foreground px-5 py-2.5 text-center text-sm font-medium text-background shadow-xl">
      {message}
    </div>
  ) : null;

  return { show, toast };
}
