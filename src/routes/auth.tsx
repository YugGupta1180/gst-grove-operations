import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Store } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · NexusRetail OS" },
      { name: "description", content: "Staff sign-in for NexusRetail OS store operations." },
      { property: "og:title", content: "Sign in · NexusRetail OS" },
      { property: "og:description", content: "Staff sign-in for store operations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"in" | "up" | "sent">("in");
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ email: "", password: "", full_name: "", phone: "", branch: "" });
  const up = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email: f.email, password: f.password });
      if (error) toast.error("Couldn't sign in", { description: error.message });
    } else {
      const { error } = await supabase.auth.signUp({
        email: f.email, password: f.password,
        options: { emailRedirectTo: window.location.origin, data: { full_name: f.full_name, phone: f.phone, branch: f.branch } },
      });
      if (error) toast.error("Couldn't create account", { description: error.message });
      else setMode("sent");
    }
    setBusy(false);
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Google sign-in failed", { description: String(r.error.message ?? r.error) });
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground"><Store className="size-5" /></div>
          <div><div className="font-semibold">NexusRetail OS</div><div className="text-xs text-muted-foreground">Staff sign-in</div></div>
        </div>
        <div className="panel p-6">
          {mode === "sent" ? (
            <div className="space-y-3 text-sm">
              <h1 className="text-lg font-semibold">Check your email</h1>
              <p className="text-muted-foreground">We sent a confirmation link to <span className="text-foreground">{f.email}</span>. Open it to finish creating your account.</p>
              <Button variant="outline" className="w-full" onClick={() => setMode("in")}>Back to sign in</Button>
            </div>
          ) : (
            <>
              <h1 className="mb-4 text-lg font-semibold">{mode === "in" ? "Sign in" : "Create staff account"}</h1>
              <button type="button" onClick={google}
                className="flex h-10 w-full items-center justify-center gap-2.5 rounded-md border px-3 text-sm font-medium"
                style={{ background: "#131314", borderColor: "#8E918F", color: "#E3E3E3" }}>
                <svg aria-hidden="true" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
                Continue with Google
              </button>
              <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />or<div className="h-px flex-1 bg-border" /></div>
              <form onSubmit={submit} className="space-y-3">
                {mode === "up" && (
                  <>
                    <div><Label htmlFor="n">Full name</Label><Input id="n" required value={f.full_name} onChange={up("full_name")} /></div>
                    <div><Label htmlFor="ph">Phone</Label><Input id="ph" value={f.phone} onChange={up("phone")} placeholder="+91" /></div>
                    <div><Label htmlFor="b">Store / branch</Label><Input id="b" value={f.branch} onChange={up("branch")} placeholder="Andheri West · Store #014" /></div>
                  </>
                )}
                <div><Label htmlFor="e">Email</Label><Input id="e" type="email" required value={f.email} onChange={up("email")} /></div>
                <div><Label htmlFor="p">Password</Label><Input id="p" type="password" required minLength={6} value={f.password} onChange={up("password")} /></div>
                <Button type="submit" className="w-full" disabled={busy}>{mode === "in" ? "Sign in" : "Create account"}</Button>
              </form>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                {mode === "in" ? "New staff member? " : "Already have an account? "}
                <button className="text-primary hover:underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>{mode === "in" ? "Create an account" : "Sign in"}</button>
              </p>
            </>
          )}
        </div>
        <p className="mt-4 text-center text-[11px] text-muted-foreground">The first account becomes the Store Owner. Everyone after joins as Cashier until the owner changes their role.</p>
      </div>
    </div>
  );
}
