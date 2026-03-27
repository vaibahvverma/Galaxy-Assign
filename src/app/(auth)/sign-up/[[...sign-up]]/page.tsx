"use client";

import { SignUp } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function SignUpPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  // If already signed in, bounce directly to canvas
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/");
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">NextFlow</h1>
          <p className="text-muted-foreground text-sm">AI Workflow Builder</p>
        </div>

        {/* Show spinner while Clerk JS loads, then show form */}
        {!isLoaded ? (
          <div className="w-[400px] h-[420px] flex flex-col items-center justify-center gap-4 bg-card/60 border border-border/50 rounded-2xl backdrop-blur-md">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        ) : !isSignedIn ? (
          <SignUp forceRedirectUrl="/" />
        ) : null}
      </div>
    </div>
  );
}
