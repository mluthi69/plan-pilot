import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/useOrg";
import { toast } from "sonner";

export type EmploymentType = "full_time" | "part_time" | "casual" | "contractor";
export type StaffStatus = "active" | "on_leave" | "inactive";

export interface Staff {
  id: string;
  org_id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  address: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  date_of_birth: string | null;
  gender: string | null;
  employment_type: EmploymentType;
  contracted_hours_per_week: number | null;
  start_date: string | null;
  end_date: string | null;
  tfn_last4: string | null;
  super_fund: string | null;
  bank_bsb_last3: string | null;
  bank_acct_last3: string | null;
  ndis_worker_screening_no: string | null;
  screening_expiry: string | null;
  working_with_children_no: string | null;
  wwc_expiry: string | null;
  first_aid_expiry: string | null;
  drivers_licence_no: string | null;
  vehicle_available: boolean;
  bookable: boolean;
  status: StaffStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type StaffInput = Omit<Staff, "id" | "org_id" | "created_at" | "updated_at">;

export function useStaff() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["staff", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .eq("org_id", orgId!)
        .order("last_name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Staff[];
    },
  });
}

export function useStaffMember(id: string | undefined) {
  return useQuery({
    queryKey: ["staff", "one", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as Staff | null;
    },
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  const orgId = useOrgId();
  return useMutation({
    mutationFn: async (input: StaffInput) => {
      if (!orgId) throw new Error("Missing organisation");
      const { data, error } = await supabase
        .from("staff")
        .insert({ ...input, org_id: orgId })
        .select()
        .single();
      if (error) throw error;
      return data as Staff;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff member created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<StaffInput> }) => {
      const { data, error } = await supabase
        .from("staff")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Staff;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff member updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("staff").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff member deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Helper: full display name with optional preferred. */
export function staffDisplayName(s: Pick<Staff, "first_name" | "last_name" | "preferred_name">): string {
  const first = s.preferred_name?.trim() || s.first_name;
  return `${first} ${s.last_name}`.trim();
}