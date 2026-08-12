"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const OPEN_CREATE_APP_EVENT = "open-create-application";

function triggerOpenCreateModal(router?: ReturnType<typeof useRouter>) {
  if (typeof window !== "undefined") {
    const pathname = window.location.pathname;
    if (!pathname.startsWith("/applications") && router) {
      sessionStorage.setItem("auto_open_create_app", "true");
      router.push("/applications");
    } else {
      window.dispatchEvent(new CustomEvent(OPEN_CREATE_APP_EVENT));
    }
  }
}

interface NewApplicationButtonProps {
  onClick?: () => void;
  className?: string;
  fullWidth?: boolean;
  label?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
}

export function NewApplicationButton({
  onClick,
  className,
  fullWidth = false,
  label = "New Application",
  variant = "default",
}: NewApplicationButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      triggerOpenCreateModal(router);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      onClick={handleClick}
      className={cn(
        "gap-2 shadow-xs cursor-pointer font-medium text-xs h-9",
        fullWidth ? "w-full justify-start" : "",
        className,
      )}
    >
      <Plus className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </Button>
  );
}
