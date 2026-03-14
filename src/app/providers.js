"use client";

import { ClerkProvider } from "@clerk/nextjs";

export function Providers({ children }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: "#3b82f6",
          colorText: "#1f2937",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}