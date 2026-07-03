"use client";

import { useState, type ComponentProps } from "react";
import { EyeIcon } from "@/components/icons";
import { Input } from "@/components/ui/input";

/** Password field with a show/hide toggle. */
export function PasswordInput(props: Omit<ComponentProps<typeof Input>, "type">) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input type={visible ? "text" : "password"} className="pr-11" {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="focus-ring absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 text-subtle transition-colors hover:text-foreground"
      >
        <EyeIcon off={visible} className="size-4.5" />
      </button>
    </div>
  );
}
