import { useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { adminCall } from "@/lib/adminApi";
import { Building2, Users, Shield, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboard() {
  const { user } = useUser();

  const { data: orgs } = useQuery({
    queryKey: ["admin", "orgs"],
    queryFn: () => adminCall<any[]>({ action: "list-orgs", clerkUserId: user!.id }),
    enabled: !!user,
  });

  const { data: users } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => adminCall<any[]>({ action: "list-users", clerkUserId: user!.id }),
    enabled: !!user,
  });

  const orgCount = Array.isArray(orgs) ? orgs.length : (orgs as any)?.data?.length ?? 0;
  const userCount = Array.isArray(users) ? users.length : (users as any)?.total_count ?? 0;

  const metrics = [
    { label: "Total Tenants", value: orgCount, icon: Building2, color: "text-primary" },
    { label: "Total Users", value: userCount, icon: Users, color: "text-accent" },
    { label: "System Admins", value: "—", icon: Shield, color: "text-destructive" },
    { label: "Platform Health", value: "OK", icon: Activity, color: "text-success" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Overview</h1>
        <p className="text-muted-foreground text-sm">Global administration dashboard</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{m.label}</CardTitle>
              <m.icon className={`h-4 w-4 ${m.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{m.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
