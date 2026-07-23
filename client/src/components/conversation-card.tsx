import { useEffect, useState } from "react";
import UserCard from "@/components/user-card";
import { decryptMessage } from "@/lib/crypto";

interface ConversationCardProps {
  username: string;
  peerPublicKey: string | null;
  ciphertext?: string | null;
  isMine?: boolean;
  onClick?: () => void;
}

export const ConversationCard = ({
  username,
  peerPublicKey,
  ciphertext,
  isMine,
  onClick,
}: ConversationCardProps) => {
  const [previewText, setPreviewText] = useState<string | null>(null);

  useEffect(() => {
    if (!ciphertext || !peerPublicKey) {
      setPreviewText(ciphertext ?? null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const decrypted = await decryptMessage(peerPublicKey, ciphertext);
        if (!cancelled) setPreviewText(decrypted);
      } catch (err) {
        if (!cancelled) setPreviewText("[Encrypted message]");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ciphertext, peerPublicKey]);

  return (
    <UserCard
      username={username}
      lastMessage={previewText}
      isLastMessageMine={isMine}
      onClick={onClick}
    />
  );
};
