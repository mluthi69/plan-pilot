import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search } from "lucide-react";
import { useStaff, staffDisplayName } from "@/hooks/useStaff";
import StaffFormDialog from "@/components/StaffFormDialog";

export default function Staff() {
  const { data: staff = [], isLoading } = useStaff();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const rows = useMemo(() => {
    const s = search.toLowerCase();
    return staff.filter(
      (m) =>
        !s ||
        staffDisplayName(m).toLowerCase().includes(s) ||
        m.email?.toLowerCase().includes(s) ||
        m.mobile?.includes(s)
    );
  }, [staff, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Staff</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Bookable staff who deliver NDIS services to participants.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} size="sm">
          <Plus className="mr-1.5 h-4 w-4" /> Add staff
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, mobile…"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Employment</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Bookable</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground">Loading…</TableCell></TableRow>
                )}
                {!isLoading && rows.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground">No staff found.</TableCell></TableRow>
                )}
                {rows.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Link to={`/staff/${s.id}`} className="font-medium text-primary hover:underline">
                        {staffDisplayName(s)}
                      </Link>
                    </TableCell>
                    <TableCell className="capitalize text-sm">{s.employment_type.replace("_", " ")}</TableCell>
                    <TableCell className="text-sm">
                      {s.email ?? "—"}
                      {s.mobile && <span className="block text-muted-foreground">{s.mobile}</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.bookable ? "default" : "secondary"}>{s.bookable ? "Yes" : "No"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.status === "active" ? "default" : "secondary"} className="capitalize">
                        {s.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <StaffFormDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}