"use client";

import Link from "next/link";
import { Sparkles, Eye, Code2, LogOut, LogIn } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

export function Header({
  user,
  subtitle,
  view,
  onViewChange,
}: {
  user: { email: string } | null;
  subtitle: string;
  view: "preview" | "code";
  onViewChange: (v: "preview" | "code") => void;
}) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-slate-900">UIGen</h1>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>

      <div className="inline-flex rounded-lg border border-slate-200 p-0.5">
        <ViewButton active={view === "preview"} onClick={() => onViewChange("preview")}>
          <Eye className="h-3.5 w-3.5" />
          Preview
        </ViewButton>
        <ViewButton active={view === "code"} onClick={() => onViewChange("code")}>
          <Code2 className="h-3.5 w-3.5" />
          Code
        </ViewButton>
      </div>

      <div className="flex items-center gap-2">
        {user ? (
          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </form>
        ) : (
          <Link
            href="/signin"
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
          >
            <LogIn className="h-3.5 w-3.5" />
            Sign in / up
          </Link>
        )}
      </div>
    </header>
  );
}

function ViewButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors",
        active ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900",
      )}
    >
      {children}
    </button>
  );
}
