import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UIGen — AI React component generator",
  description:
    "Describe a React component in natural language and preview generated code live.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="h-full">{children}</body>
    </html>
  );
}
