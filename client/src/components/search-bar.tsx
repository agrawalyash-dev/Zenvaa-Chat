import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { anyApi } from "convex/server";
import { RiSearchLine } from "@remixicon/react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface SearchResult {
  username: string;
}

interface SearchBarProps {
  onSelectUser: (username: string) => void;
}

const SearchBar = ({ onSelectUser }: SearchBarProps) => {
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(term.trim()), 250);
    return () => clearTimeout(timeout);
  }, [term]);

  // anyApi is untyped, so we cast the result ourselves.
  const results = useQuery(
    anyApi.users.searchUsers,
    debounced.length > 0 ? { searchTerm: debounced } : "skip",
  ) as SearchResult[] | undefined;

  return (
    <div className="relative">
      <div className="relative">
        <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search by username..."
          className="pl-9"
        />
      </div>

      {debounced.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-popover border rounded-md shadow-md max-h-64 overflow-y-auto">
          {results === undefined && (
            <div className="p-3 text-sm text-muted-foreground">
              Searching...
            </div>
          )}
          {results && results.length === 0 && (
            <div className="p-3 text-sm text-muted-foreground">
              No users found
            </div>
          )}
          {results?.map((user) => (
            <button
              key={user.username}
              type="button"
              onClick={() => {
                onSelectUser(user.username);
                setTerm("");
                setDebounced("");
              }}
              className="w-full flex items-center gap-3 p-3 hover:bg-muted text-left transition-colors"
            >
              <Avatar className="size-8">
                <AvatarFallback>
                  {user.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{user.username}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
