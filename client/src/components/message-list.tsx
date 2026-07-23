import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { anyApi } from "convex/server";
import { decryptMessage } from "@/lib/crypto";

interface Message {
  _id: string;
  _creationTime: number;
  ciphertext: string;
  isMine: boolean;
}

interface MessageListProps {
  conversationId: string | null;
  myClerkUserId: string | null | undefined;
  peerPublicKey: string | null;
}

const MessageList = (
  { conversationId, myClerkUserId, peerPublicKey }: MessageListProps,
) => {
  const messages = useQuery(
    anyApi.messages.listMessages,
    conversationId && myClerkUserId
      ? { conversationId, myClerkUserId }
      : "skip",
  ) as Message[] | undefined;

  const [decryptedTexts, setDecryptedTexts] = useState<Record<string, string>>(
    {},
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!messages || !peerPublicKey) return;

    let cancelled = false;

    (async () => {
      const texts: Record<string, string> = {};
      for (const msg of messages) {
        try {
          texts[msg._id] = await decryptMessage(peerPublicKey, msg.ciphertext);
        } catch (err) {
          texts[msg._id] = "[Unable to decrypt message]";
        }
      }
      if (!cancelled) {
        setDecryptedTexts(texts);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [messages, peerPublicKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [decryptedTexts]);

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Say hi to start the conversation
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
      {messages?.map((msg) => (
        <div
          key={msg._id}
          className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
            msg.isMine
              ? "bg-primary text-primary-foreground self-end"
              : "bg-muted self-start"
          }`}
        >
          {decryptedTexts[msg._id] ?? "Decrypting..."}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
