"use client";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { CheckIcon } from "lucide-react";

interface BorderAvatarProps {
  src?: string | null;
  fallback: string;
  size?: string;
  verified?: boolean;
}

const BorderAvatar: React.FC<BorderAvatarProps> = ({
  src,
  fallback,
  size = "h-10 w-10",
  verified = false,
}) => {
  return (
    <div className="relative w-fit">
      <Avatar
        className={`${size} ring-offset-[#0a0a0a] ring-2 ring-[#22c55e]/60 ring-offset-2`}
      >
        <AvatarImage src={src ?? undefined} alt={fallback} />
        <AvatarFallback className="text-xs">{fallback}</AvatarFallback>
      </Avatar>
      {verified && (
        <span className="absolute -right-1.5 -bottom-1.5 inline-flex size-4 items-center justify-center rounded-full bg-[#22c55e]">
          <CheckIcon className="size-3 text-white" strokeWidth={3} />
        </span>
      )}
    </div>
  );
};

export default BorderAvatar;
