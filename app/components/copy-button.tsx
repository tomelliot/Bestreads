"use client";

import { useState } from "react";
import { ClipboardCopy, CheckCircle } from "@ainativekit/ui/icons";

type CopyButtonProps = {
  text: string;
};

export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-muted transition-colors cursor-pointer"
      aria-label={copied ? "Copied!" : "Copy to clipboard"}
      title={copied ? "Copied!" : "Click to copy"}
    >
      {copied ? (
        <CheckCircle size="md" className="text-accent" />
      ) : (
        <ClipboardCopy
          size="md"
          className="text-accent opacity-70 group-hover:opacity-100 transition-opacity"
        />
      )}
    </button>
  );
}
