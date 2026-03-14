"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function AuthSync({ children }) {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // Force a hard refresh of the router to ensure redirects work
      router.refresh();
    }
  }, [isLoaded, isSignedIn, router]);

  return children;
}

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
      <AuthSync>
        {children}
      </AuthSync>
    </ClerkProvider>
  );
}