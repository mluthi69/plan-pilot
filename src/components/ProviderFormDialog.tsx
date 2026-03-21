import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateProvider, useUpdateProvider, type Provider } from "@/hooks/useProviders";

interface ProviderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider?: Provider | null;
}

export default function ProviderFormDialog({ open, onOpenChange, provider }: ProviderFormDialogProps) {
  const isEdit = !!provider;
  const createProvider = useCreateProvider();
  const updateProvider = useUpdateProvider();
  const isPending = createProvider.isPending || updateProvider.isPending;

  const [form, setForm] = useState({
    name: provider?.name ?? "",
    abn: provider?.abn ?? "",
    registration: provider?.registration ?? "unregistered",
    status: provider?.status ?? "pending",
    services: provider?.services?.join(", ") ?? "",
    contact: provider?.contact ?? "",
    email: provider?.email ?? "",
    phone: provider?.phone ?? "",
    website: provider?.website ?? "",
    address: provider?.address ?? "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      abn: form.abn,
      registration: form.registration as "registered" | "unregistered",
      status: form.status as "active" | "inactive" | "pending",
      services: form.services.split(",").map((s) => s.trim()).filter(Boolean),
      contact: form.contact || null,
      email: form.email || null,
      phone: form.phone || null,
      website: form.website || null,
      address: form.address || null,
    };

    if (isEdit) {
      updateProvider.mutate({ id: provider.id, ...payload }, { onSuccess: () => onOpenChange(false) });
    } else {
      createProvider.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Provider" : "Add Provider"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Provider Name *</Label>
              <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="abn">ABN *</Label>
              <Input id="abn" value={form.abn} onChange={(e) => set("abn", e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="registration">Registration</Label>
              <Select value={form.registration} onValueChange={(v) => set("registration", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="registered">Registered</SelectItem>
                  <SelectItem value="unregistered">Unregistered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="services">Services (comma-separated)</Label>
              <Input id="services" value={form.services} onChange={(e) => set("services", e.target.value)} placeholder="OT, Physio, Speech" />
            </div>
            <div>
              <Label htmlFor="contact">Contact Person</Label>
              <Input id="contact" value={form.contact} onChange={(e) => set("contact", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input id="website" value={form.website} onChange={(e) => set("website", e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={form.address} onChange={(e) => set("address", e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
