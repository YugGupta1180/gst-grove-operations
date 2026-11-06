import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Pill } from "@/components/AppShell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthState, type Profile, type Role } from "@/lib/store";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "Team & Roles · NexusRetail OS" },
      { name: "description", content: "Manage store staff and what each role can access." },
      { property: "og:title", content: "Team & Roles · NexusRetail OS" },
      { property: "og:description", content: "Owner, supervisor and cashier access control." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Team,
});

const labels: Record<Role, string> = {
  owner: "Store Owner / Area Manager",
  supervisor: "Department / Floor Supervisor",
  cashier: "Cashier / Floor Associate",
};

function Team() {
  const { userId } = useAuthState();
  const [rows, setRows] = useState<(Profile & { role: Role | null })[]>([]);

  const load = async () => {
    const [p, r] = await Promise.all([
      supabase.from("profiles").select("id, full_name, phone, branch, email").order("created_at"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const roles = new Map((r.data ?? []).map((x) => [x.user_id, x.role as Role]));
    setRows((p.data ?? []).map((x) => ({ ...x, role: roles.get(x.id) ?? null })));
  };
  useEffect(() => { void load(); }, []);

  const change = async (id: string, role: Role) => {
    const { error } = await supabase.from("user_roles").upsert({ user_id: id, role }, { onConflict: "user_id" });
    if (error) toast.error("Couldn't change role", { description: error.message });
    else { toast.success(`Role set to ${labels[role]}`); void load(); }
  };

  return (
    <>
      <PageHeader title="Team & Roles" sub="New sign-ups join as Cashier. Promote staff here." />
      <div className="panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground"><tr className="border-b border-border">
            <th className="p-3">Name</th><th>Email</th><th>Phone</th><th>Branch</th><th className="w-72">Role</th>
          </tr></thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-border">
                <td className="p-3 font-medium">{u.full_name || "—"}</td>
                <td className="text-xs">{u.email}</td>
                <td className="num text-xs">{u.phone || "—"}</td>
                <td className="text-xs">{u.branch || "—"}</td>
                <td className="pr-3">
                  {u.id === userId ? <Pill tone="info">{labels.owner} (you)</Pill> : (
                    <Select value={u.role ?? undefined} onValueChange={(v) => change(u.id, v as Role)}>
                      <SelectTrigger className="h-8"><SelectValue placeholder="No role" /></SelectTrigger>
                      <SelectContent>{(Object.keys(labels) as Role[]).map((r) => <SelectItem key={r} value={r}>{labels[r]}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
