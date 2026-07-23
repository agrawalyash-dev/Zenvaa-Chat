import { useState } from "react";
import { useAuth } from "@clerk/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";

const SetUsernameDialog = () => {
  const { getToken } = useAuth();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = username.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      await apiFetch("/users/username", token, {
        method: "POST",
        body: JSON.stringify({ username: trimmed }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open modal>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Choose a username</DialogTitle>
          <DialogDescription>
            Pick a username to continue. This is how other people will find and
            message you.
          </DialogDescription>
        </DialogHeader>

        <Field>
          <Input
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            placeholder="e.g. yash_agrawal"
            maxLength={20}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </Field>

        <Button
          onClick={handleSubmit}
          disabled={submitting || !username.trim()}
        >
          {submitting ? "Saving..." : "Continue"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default SetUsernameDialog;
