import { useState } from "react";
import { Plus, Pencil, Trash2, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ParticipantAddress, useDeleteParticipantAddress, useParticipantAddresses,
} from "@/hooks/useParticipantAddresses";
import ParticipantAddressDialog from "./ParticipantAddressDialog";

interface Props { participantId: string }

const labelText: Record<string, string> = {
  home: "Home", work: "Work", respite: "Respite", school: "School", family: "Family", other: "Other",
};

export default function ParticipantAddressesPanel({ participantId }: Props) {
  const { data: addresses = [], isLoading } = useParticipantAddresses(participantId);
  const del = useDeleteParticipantAddress();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ParticipantAddress | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ParticipantAddress | null>(null);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm">Saved addresses</CardTitle>
          <CardDescription>Reusable locations for bookings — home, work, respite, etc.</CardDescription>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />Add address
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>
        ) : addresses.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No addresses saved yet.</p>
        ) : (
          <div className="space-y-2">
            {addresses.map((a) => (
              <div key={a.id} className="flex items-start gap-3 p-3 rounded-md border bg-card hover:bg-muted/30 transition-colors">
                <div className={`mt-0.5 ${a.lat ? "text-success" : "text-muted-foreground"}`}>
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium">{labelText[a.label] ?? a.label}</span>
                    {a.is_primary && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-accent/10 text-accent border-accent/20">
                        <Star className="h-2.5 w-2.5 mr-1" />Primary
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-foreground/80">{a.address}</p>
                  {a.notes && <p className="text-xs text-muted-foreground mt-1">{a.notes}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => { setEditing(a); setOpen(true); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                    onClick={() => setConfirmDelete(a)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <ParticipantAddressDialog
        open={open} onOpenChange={setOpen}
        participantId={participantId} address={editing}
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete address?</AlertDialogTitle>
            <AlertDialogDescription>
              This address will be removed from the participant's saved list.
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
