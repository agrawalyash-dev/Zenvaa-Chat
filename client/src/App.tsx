import { useEffect } from "react";
import { useAuth, useUser } from "@clerk/react";
import { useQuery } from "convex/react";
import { anyApi } from "convex/server";
import Footer from "./components/footer";
import Header from "./components/header";
import Main from "./components/main";
import Home from "./pages/home";
import SetUsernameDialog from "./components/set-username-dialog";
import SignInPrompt from "./components/sign-in-prompt";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { ensureKeyPair } from "@/lib/crypto";

function App() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();

  const me = useQuery(
    anyApi.users.getMe,
    isSignedIn && user?.id ? { clerkUserId: user.id } : "skip",
  ) as { username: string | null; hasPublicKey: boolean } | null | undefined;

  const checkingUsername = isSignedIn && me === undefined;
  const needsUsername = isSignedIn && me !== undefined && !me?.username;

  // Once we know the user has a username (whether they just set it, or
  // already had one from a previous session), make sure this device has
  // a keypair. If it doesn't — first time on this device, or local
  // storage was cleared — generate one and upload the public half.
  useEffect(() => {
    // Wait until we have a username and the backend sync state (`me`) is fully loaded
    if (!isSignedIn || !me?.username || me.hasPublicKey === undefined) return;

    let cancelled = false;

    (async () => {
      try {
        // Ensure local keypair exists (generates one if missing)
        const { publicKeyBase64 } = await ensureKeyPair();

        // If the backend already knows about a public key, we don't need to re-upload
        if (me.hasPublicKey) return;

        const token = await getToken();
        if (!token || cancelled) return;

        // Sync local public key up to the backend if it's missing there
        await apiFetch("/users/public-key", token, {
          method: "POST",
          body: JSON.stringify({ publicKey: publicKeyBase64 }),
        });
      } catch (err) {
        console.error("Failed to ensure encryption keys:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, me?.username, me?.hasPublicKey, getToken]);

  const renderMain = () => {
    if (!isLoaded) {
      // Clerk hasn't resolved auth state yet — don't flash the sign-in
      // prompt or the app before we actually know.
      return <Skeleton className="h-full w-full rounded-none" />;
    }

    if (!isSignedIn) {
      return <SignInPrompt />;
    }

    if (checkingUsername) {
      return <Skeleton className="h-full w-full rounded-none" />;
    }

    if (needsUsername) {
      return <SetUsernameDialog />;
    }

    return <Home />;
  };

  return (
    <>
      <div className="flex flex-col h-screen w-full max-w-7xl mx-auto md:border-x overflow-hidden">
        <Header />
        <Main>{renderMain()}</Main>
        <Footer />
      </div>
    </>
  );
}

export default App;
