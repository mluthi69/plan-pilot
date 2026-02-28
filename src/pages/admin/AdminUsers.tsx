import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminCall } from "@/lib/adminApi";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { useNavigate } from "react-router-dom";
import { Eye, Ban, CheckCircle, MoreHorizontal, Search, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AdminUsers() {
  const { user } = useUser();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { startImpersonatingUser } = useImpersonation();
  const [search, setSearch] = useState("");

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["admin", "users", search],
    queryFn: () =>
      adminCall<any>({
        action: "list-users",
        params: search ? { query: search } : {},
        clerkUserId: user!.id,
      }),
    enabled: !!user,
  });

  const users = Array.isArray(usersData) ? usersData : usersData?.data ?? [];

  const banMutation = useMutation({
    mutationFn: (userId: string) =>
      adminCall({ action: "ban-user", params: { user_id: userId }, method: "POST", clerkUserId: user!.id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User banned");
    },
    onError: (e) => toast.error(e.message),
  });

  const unbanMutation = useMutation({
    mutationFn: (userId: string) =>
      adminCall({ action: "unban-user", params: { user_id: userId }, method: "POST", clerkUserId: user!.id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User unbanned");
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleSystemAdmin = useMutation({
    mutationFn: (u: any) => {
      const isAdmin = u.public_metadata?.role === "system_admin";
      return adminCall({
        action: "update-user",
        params: { user_id: u.id },
        method: "PATCH",
        body: { public_metadata: { ...u.public_metadata, role: isAdmin ? undefined : "system_admin" } },
        clerkUserId: user!.id,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User role updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleImpersonate = (u: any) => {
    const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email_addresses?.[0]?.email_address || u.id;
    startImpersonatingUser(u.id, name);
    navigate("/");
  };

  const getUserName = (u: any) => {
    const full = [u.first_name, u.last_name].filter(Boolean).join(" ");
    return full || "—";
  };

  const getUserEmail = (u: any) => u.email_addresses?.[0]?.email_address ?? "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground text-sm">Manage all users across the platform</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading…</TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No users found</TableCell>
                </TableRow>
              ) : (
                users.map((u: any) => {
                  const isAdmin = u.public_metadata?.role === "system_admin";
                  const isBanned = u.banned;
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{getUserName(u)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{getUserEmail(u)}</TableCell>
                      <TableCell>
                        {isAdmin ? (
                          <Badge variant="destructive" className="gap-1">
                            <Shield className="h-3 w-3" /> System Admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary">User</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {isBanned ? (
                          <Badge variant="destructive">Banned</Badge>
                        ) : (
                          <Badge variant="outline" className="text-success border-success/30">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleImpersonate(u)} className="gap-2">
                              <Eye className="h-4 w-4" /> View as User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleSystemAdmin.mutate(u)} className="gap-2">
                              <Shield className="h-4 w-4" /> {isAdmin ? "Remove Admin" : "Make Admin"}
                            </DropdownMenuItem>
                            {isBanned ? (
                              <DropdownMenuItem onClick={() => unbanMutation.mutate(u.id)} className="gap-2">
                                <CheckCircle className="h-4 w-4" /> Unban
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => banMutation.mutate(u.id)}
                                className="gap-2 text-destructive focus:text-destructive"
                              >
                                <Ban className="h-4 w-4" /> Ban User
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
