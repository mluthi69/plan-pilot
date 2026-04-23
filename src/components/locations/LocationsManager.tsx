import { useState } from "react";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import LocationFormDialog from "./LocationFormDialog";
import { AppLocation, useDeleteLocation, useLocations } from "@/hooks/useLocations";

const typeLabel: Record<string, string> = {
  office: "Office", clinic: "Clinic", community: "Community", school: "School",
  shc: "SIL", sda: "SDA", other: "Other",
};

export default function LocationsManager() {
  const { data: locations = [], isLoading } = useLocations();
  const del = useDeleteLocation();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AppLocation | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AppLocation | null>(null);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm">Locations</CardTitle>
          <CardDescription>Saved venues for bookings — clinics, offices, community spaces, SDA properties.</CardDescription>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />Add location
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : locations.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No saved locations yet. Add one to use it on bookings.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                      {typeLabel[l.location_type] ?? l.location_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <MapPin className={`h-3 w-3 ${l.lat ? "text-success" : "text-muted-foreground"}`} />
                      <span>{l.address}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {l.active ? (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-[10px] h-4 px-1.5">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => { setEditing(l); setOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                        onClick={() => setConfirmDelete(l)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <LocationFormDialog open={open} onOpenChange={setOpen} location={editing} />

      <AlertDialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete location?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmDelete?.name}" will be removed. Existing bookings using it will keep their address text.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (confirmDelete) await del.mutateAsync(confirmDelete.id);
                setConfirmDelete(null);
              }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
