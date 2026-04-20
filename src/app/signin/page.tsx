"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "@/app/actions/auth";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const action = mode === "signin" ? signIn : signUp;
    const result = await action(formData);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Registered users get their projects persisted across sessions.
        </p>
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <label className="block text-xs font-medium text-slate-700">
            Email
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </label>
          <label className="block text-xs font-medium text-slate-700">
            Password
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </label>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:bg-slate-300"
          >
            {pending ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
        <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="text-indigo-600 hover:underline"
          >
            {mode === "signin" ? "Need an account? Sign up" : "Already have one? Sign in"}
          </button>
          <Link href="/" className="text-slate-500 hover:text-slate-900">
            Continue as anonymous →
          </Link>
        </div>
      </div>
    </div>
  );
}
