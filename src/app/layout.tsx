import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "NextFlow | AI Workflow Builder",
  description: "Pixel-perfect Krea.ai clone focused on LLM workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}>
      <html lang="en" className="dark" suppressHydrationWarning>
        <body className="antialiased flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
