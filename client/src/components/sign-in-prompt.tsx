import { SignInButton, SignUpButton } from "@clerk/react";
import { Button } from "@/components/ui/button";

const SignInPrompt = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 text-center px-4">
      <div>
        <h2 className="text-lg font-medium">Welcome to Zenvaa Chat</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Sign in to start messaging.
        </p>
      </div>
      <div className="flex gap-3">
        <Button>
          <SignInButton />
        </Button>
        <Button variant="secondary">
          <SignUpButton />
        </Button>
      </div>
    </div>
  );
};

export default SignInPrompt;
