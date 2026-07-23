import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserCardProps {
  username: string;
  lastMessage?: string | null;
  isLastMessageMine?: boolean;
  avatarUrl?: string;
  onClick?: () => void;
}

const UserCard = ({
  username,
  lastMessage,
  isLastMessageMine,
  avatarUrl,
  onClick,
}: UserCardProps) => {
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <div
      onClick={onClick}
      className="border p-4 flex items-center gap-4 rounded-md cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors"
    >
      <Avatar>
        {avatarUrl && <AvatarImage src={avatarUrl} alt={username} />}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <h2 className="truncate">{username}</h2>
        {lastMessage
          ? (
            <p className="text-sm text-muted-foreground -mt-0.5 truncate">
              {isLastMessageMine ? "You: " : ""}
              {lastMessage}
            </p>
          )
          : (
            <p className="text-sm text-muted-foreground -mt-0.5 truncate">
              No messages yet
            </p>
          )}
      </div>
    </div>
  );
};

export default UserCard;
