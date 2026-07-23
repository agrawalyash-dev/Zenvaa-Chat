import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";
import { Button } from "./ui/button";

const Header = () => {
  return (
    <div className="h-20 md:h-28 flex items-center justify-center border-b overflow-hidden shrink-0 relative">
      <div className="overflow-hidden mt-2 md:mt-4">
        <img className="h-48 md:h-64" src="/logo.png" />
      </div>

      <div className="absolute right-4 z-10">
        <Show when="signed-out">
          <Button className={"mr-4"}>
            <SignInButton />
          </Button>
          <Button variant={"secondary"}>
            <SignUpButton />
          </Button>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    </div>
  );
};

export default Header;
