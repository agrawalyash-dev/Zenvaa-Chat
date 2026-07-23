import { useState } from "react";
import { useQuery } from "convex/react";
import { anyApi } from "convex/server";
import { RiArrowLeftLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import SearchBar from "@/components/search-bar";
import MessageList from "@/components/message-list";
import { apiFetch } from "@/lib/api";
import { encryptMessage } from "@/lib/crypto";
import { useAuth, useUser } from "@clerk/react";
import { Skeleton } from "@/components/ui/skeleton";
import { ConversationCard } from "@/components/conversation-card";

type ConversationListItem = {
  conversationId: string;
  otherUsername: string | null;
  otherPublicKey: string | null;
  lastMessage: {
    ciphertext: string;
    _creationTime: number;
    isMine: boolean;
  } | null;
};

const Home = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [view, setView] = useState<"list" | "chat">("list");
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const conversations = useQuery(
    anyApi.conversations.getConversations,
    user?.id ? { myClerkUserId: user.id } : "skip",
  ) as ConversationListItem[] | undefined;

  const conversation = useQuery(
    anyApi.conversations.getConversationWithUser,
    selectedUsername && user?.id
      ? { myClerkUserId: user.id, otherUsername: selectedUsername }
      : "skip",
  ) as { conversationId: string } | null | undefined;

  // The recipient's public key, needed to derive the shared AES key before
  // we can encrypt anything for them. Also used by MessageList to decrypt
  // the conversation history.
  const recipientKey = useQuery(
    anyApi.users.getPublicKeyByUsername,
    selectedUsername ? { username: selectedUsername } : "skip",
  ) as { publicKey: string } | null | undefined;

  const handleSelectUser = (username: string) => {
    setSelectedUsername(username);
    setSendError(null);
    setView("chat");
  };

  const handleSend = async () => {
    if (!messageText.trim() || !selectedUsername || sending) return;

    if (!recipientKey?.publicKey) {
      setSendError(
        "This user hasn't set up encryption on their device yet — you can't message them until they do.",
      );
      return;
    }

    setSending(true);
    setSendError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const ciphertext = await encryptMessage(
        recipientKey.publicKey,
        messageText,
      );

      await apiFetch(`/chat/${selectedUsername}/messages`, token, {
        method: "POST",
        body: JSON.stringify({ ciphertext }),
      });

      setMessageText("");
    } catch (err) {
      console.error("Failed to send message:", err);
      setSendError("Couldn't send that message. Try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 h-full overflow-hidden">
      <div
        className={`${
          view === "list" ? "flex" : "hidden"
        } md:flex md:col-span-2 bg-sidebar flex-col overflow-hidden`}
      >
        <div className="p-4 shrink-0">
          <SearchBar onSelectUser={handleSelectUser} />
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-2">
          {conversations === undefined && (
            <Skeleton className="h-18 w-full rounded-sm" />
          )}

          {conversations?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center mt-8">
              Search a username above to start a conversation.
            </p>
          )}

          {conversations?.filter((c) => c.otherUsername).map((c) => (
            <ConversationCard
              key={c.conversationId}
              username={c.otherUsername as string}
              peerPublicKey={c.otherPublicKey}
              ciphertext={c.lastMessage?.ciphertext}
              isMine={c.lastMessage?.isMine}
              onClick={() => handleSelectUser(c.otherUsername as string)}
            />
          ))}
        </div>
      </div>

      <div
        className={`${
          view === "chat" ? "flex" : "hidden"
        } md:flex md:col-span-5 flex-col h-full overflow-hidden`}
      >
        {selectedUsername
          ? (
            <>
              <div className="border-b p-4 flex items-center gap-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setView("list")}
                  aria-label="Back to conversations"
                  className="md:hidden -ml-1 p-1 rounded-md hover:bg-muted transition-colors"
                >
                  <RiArrowLeftLine className="size-5" />
                </button>
                <Avatar>
                  <AvatarFallback>
                    {selectedUsername.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2>{selectedUsername}</h2>
                </div>
              </div>

              <MessageList
                conversationId={conversation?.conversationId ?? null}
                myClerkUserId={user?.id}
                peerPublicKey={recipientKey?.publicKey ?? null}
              />

              <div className="p-4 shrink-0">
                {sendError && (
                  <p className="text-sm text-destructive mb-2">{sendError}</p>
                )}
                <Field orientation="horizontal">
                  <Input
                    type="text"
                    placeholder="Your Message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSend();
                    }}
                  />
                  <Button onClick={handleSend} disabled={sending}>
                    Send
                  </Button>
                </Field>
              </div>
            </>
          )
          : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Select a search result to start chatting
            </div>
          )}
      </div>
    </div>
  );
};

export default Home;
