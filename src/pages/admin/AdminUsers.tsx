import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus, Trash2, Info } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { useAdminUsers, inviteAdminUser, removeAdminUser } from "./useAdminData";
import type { AdminRole } from "./adminTypes";

// ── Styles ────────────────────────────────────────────────

const inputStyle = { backgroundColor: "white", borderColor: "#E8E0D5", color: "#1E2D3D" };
const labelStyle = { color: "#1E2D3D", opacity: 0.6, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.08em" };

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  content_admin: "Content Admin",
};

const ROLE_COLORS: Record<string, React.CSSProperties> = {
  super_admin:   { backgroundColor: "#FFF8E1", color: "#C17B4A" },
  content_admin: { backgroundColor: "#E8F0F8", color: "#1E2D3D" },
};

// ── Invite form ────────────────────────────────────────────

const inviteSchema = z.object({
  email: z.string().email("Enter a valid email"),
  role: z.enum(["super_admin", "content_admin"]),
});
type InviteForm = z.infer<typeof inviteSchema>;

interface Props {
  currentUserId: string;
  currentRole: AdminRole;
}

export function AdminUsers({ currentUserId, currentRole }: Props) {
  const qc = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: admins = [], isLoading, error } = useAdminUsers();

  const form = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "content_admin" },
  });

  if (currentRole !== "super_admin") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center" style={{ maxWidth: 340 }}>
          <p className="font-semibold" style={{ color: "#1E2D3D" }}>No access</p>
          <p className="text-sm mt-2" style={{ color: "#1E2D3D", opacity: 0.5 }}>
            Admin user management is restricted to super admins.
          </p>
        </div>
      </div>
    );
  }

  const handleInvite = form.handleSubmit(async (values) => {
    setSaving(true);
    try {
      await inviteAdminUser(values.email, values.role, currentUserId);
      qc.invalidateQueries({ queryKey: ["admin", "adminUsers"] });
      toast.success(`Invite record created for ${values.email}.`);
      setInviteOpen(false);
      form.reset();
    } catch (err: any) {
      if (err?.message?.includes("relation") || err?.code === "42P01") {
        toast.error("Run the SQL migration to enable admin user management.");
      } else {
        toast.error("Failed to create invite. " + (err?.message ?? ""));
      }
    } finally {
      setSaving(false);
    }
  });

  const handleRemove = async (userId: string) => {
    await removeAdminUser(userId);
    qc.invalidateQueries({ queryKey: ["admin", "adminUsers"] });
  };

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: 720 }}>
      <div className="flex items-center justify-between">
        <h2
          className="text-xl font-bold"
          style={{ color: "#1E2D3D", fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Admin Users
        </h2>
        <button
          onClick={() => setInviteOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: "#1E2D3D", color: "#FAF6F0", border: "none", cursor: "pointer" }}
        >
          <UserPlus size={14} /> Invite Admin
        </button>
      </div>

      {/* Info banner */}
      <div
        className="flex items-start gap-3 rounded-xl px-4 py-3"
        style={{ backgroundColor: "#F0F6FB", border: "1.5px solid #6BA3C8" }}
      >
        <Info size={15} style={{ color: "#6BA3C8", flexShrink: 0, marginTop: 1 }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: "#1E2D3D" }}>About invites</p>
          <p className="text-xs mt-1" style={{ color: "#1E2D3D", opacity: 0.65 }}>
            Inviting creates a pending record. To automatically send the invite email and pre-set the role on signup, deploy the <code style={{ fontFamily: "monospace" }}>send-admin-invite</code> Supabase Edge Function. Until then, the invited user can sign up manually and you update their metadata via SQL.
          </p>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-sm" style={{ color: "#1E2D3D", opacity: 0.4 }}>Loading…</p>
      ) : error ? (
        <div className="rounded-xl p-4" style={{ backgroundColor: "#FBE9E7", border: "1.5px solid #C17B4A" }}>
          <p className="text-sm font-semibold" style={{ color: "#C17B4A" }}>Migration required</p>
          <p className="text-xs mt-1" style={{ color: "#1E2D3D", opacity: 0.7 }}>
            Run the <code>supabase/migrations/20260429_publish_roles.sql</code> migration to enable this feature.
          </p>
        </div>
      ) : admins.length === 0 ? (
        <p className="text-sm" style={{ color: "#1E2D3D", opacity: 0.35 }}>
          No admin users found. Invite one using the button above.
        </p>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid #E8E0D5" }}>
          <Table>
            <TableHeader>
              <TableRow style={{ backgroundColor: "white", borderBottom: "1.5px solid #E8E0D5" }}>
                <TableHead style={{ color: "#1E2D3D", opacity: 0.5, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Name</TableHead>
                <TableHead style={{ color: "#1E2D3D", opacity: 0.5, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Email</TableHead>
                <TableHead style={{ color: "#1E2D3D", opacity: 0.5, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Role</TableHead>
                <TableHead style={{ color: "#1E2D3D", opacity: 0.5, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Added</TableHead>
                <TableHead style={{ width: 60 }} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin, i) => (
                <TableRow
                  key={admin.id}
                  style={{ backgroundColor: i % 2 === 0 ? "white" : "#FDFAF6", borderBottom: "1px solid #F0EAE0" }}
                >
                  <TableCell style={{ color: "#1E2D3D", fontWeight: 500 }}>
                    {admin.display_name ?? "—"}
                  </TableCell>
                  <TableCell style={{ color: "#1E2D3D", opacity: 0.7, fontSize: 13 }}>
                    {admin.email}
                  </TableCell>
                  <TableCell>
                    <Badge style={{ ...(ROLE_COLORS[admin.role] ?? {}), fontWeight: 600, fontSize: 10 }}>
                      {ROLE_LABELS[admin.role] ?? admin.role}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ color: "#1E2D3D", opacity: 0.5, fontSize: 12 }}>
                    {new Date(admin.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {admin.user_id !== currentUserId && (
                      <DeleteConfirmDialog
                        trigger={
                          <button title="Remove admin access" style={{ background: "none", border: "none", cursor: "pointer", color: "#C17B4A", opacity: 0.7, padding: 2 }}>
                            <Trash2 size={14} />
                          </button>
                        }
                        itemLabel={`${admin.email}'s admin access`}
                        onConfirm={() => handleRemove(admin.user_id)}
                      />
                    )}
                    {admin.user_id === currentUserId && (
                      <span style={{ fontSize: 10, color: "#1E2D3D", opacity: 0.35 }}>You</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent style={{ backgroundColor: "#FAF6F0", border: "1.5px solid #E8E0D5", maxWidth: 420 }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#1E2D3D", fontFamily: "'Playfair Display', Georgia, serif" }}>
              Invite Admin
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={handleInvite} className="flex flex-col gap-4 mt-2">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel style={labelStyle}>Email address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="user@example.com" style={inputStyle} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel style={labelStyle}>Role</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger style={{ backgroundColor: "white", borderColor: "#E8E0D5", color: "#1E2D3D" }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: "white", borderColor: "#E8E0D5" }}>
                      <SelectItem value="content_admin" style={{ color: "#1E2D3D" }}>
                        Content Admin — create, edit, publish content
                      </SelectItem>
                      <SelectItem value="super_admin" style={{ color: "#1E2D3D" }}>
                        Super Admin — full access including admin management
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl text-sm font-bold mt-2"
                style={{
                  backgroundColor: "#D4A853",
                  color: "#1E2D3D",
                  border: "none",
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? "Saving…" : "Create Invite Record"}
              </button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
