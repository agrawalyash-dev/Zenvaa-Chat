import {
  RiGithubFill,
  RiInformationFill,
  RiShieldUserFill,
} from "@remixicon/react";

const Footer = () => {
  return (
    <div className="h-12 flex items-center justify-between border-t px-3 sm:px-4 text-muted-foreground">
      <div className="text-xs sm:text-sm truncate">
        &copy; 2026 Zenvaa Chat
        <span className="hidden sm:inline">- By Yash Agrawal</span>
      </div>
      <div className="flex items-center justify-end gap-3 sm:gap-4 shrink-0">
        <a href="https://app.notion.com/p/agrawalyash/Zenvaa-Chat-Case-Study-3a35c8bb362a809cbec4d91556020819">
          <RiInformationFill className="size-4 sm:size-5" />
        </a>
        <a href="">
          <RiShieldUserFill className="size-4 sm:size-5" />
        </a>
        <a href="https://github.com/agrawalyash-dev/Zenvaa-Chat">
          <RiGithubFill className="size-4 sm:size-5" />
        </a>
      </div>
    </div>
  );
};

export default Footer;
