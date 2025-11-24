"use client";

import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {children}{" "}
      <Toaster
        richColors={true}
        theme="dark"
      />
    </SessionProvider>
  );
}
