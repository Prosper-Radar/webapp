"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
      <Toaster richColors position="top-center" theme="system" closeButton className="font-sans" />
    </ThemeProvider>
  );
}
