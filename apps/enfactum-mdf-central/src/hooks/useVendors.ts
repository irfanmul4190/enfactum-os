import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Vendor, VendorType, OnboardingStatus } from "@/types/database";

export function useVendors() {
  return useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Vendor[];
    },
  });
}

export function useVendor(vendorId: string | undefined) {
  return useQuery({
    queryKey: ['vendors', vendorId],
    queryFn: async () => {
      if (!vendorId) return null;
      
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendorId)
        .single();

      if (error) throw error;
      return data as Vendor;
    },
    enabled: !!vendorId,
  });
}

interface CreateVendorData {
  name: string;
  type: VendorType;
  market: string;
  services?: string[];
  contact_name?: string;
  contact_email?: string;
  phone?: string;
  meta_pixel_id?: string;
}

export function useCreateVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateVendorData) => {
      const { data: vendor, error } = await supabase
        .from('vendors')
        .insert({
          name: data.name,
          type: data.type,
          market: data.market,
          services: data.services || [],
          contact_name: data.contact_name,
          contact_email: data.contact_email,
          phone: data.phone,
          meta_pixel_id: data.meta_pixel_id,
        })
        .select()
        .single();

      if (error) throw error;
      return vendor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast({
        title: "Vendor created",
        description: "The vendor has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating vendor",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

interface UpdateVendorData {
  id: string;
  name?: string;
  type?: VendorType;
  market?: string;
  services?: string[];
  contact_name?: string;
  contact_email?: string;
  phone?: string;
  meta_pixel_id?: string;
  onboarding_status?: OnboardingStatus;
  is_active?: boolean;
}

export function useUpdateVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateVendorData) => {
      const { error } = await supabase
        .from('vendors')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast({
        title: "Vendor updated",
        description: "The vendor has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating vendor",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vendorId: string) => {
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', vendorId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast({
        title: "Vendor deleted",
        description: "The vendor has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting vendor",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Hook for activity-vendor relationships
export function useActivityVendors(activityId: string | undefined) {
  return useQuery({
    queryKey: ['activity-vendors', activityId],
    queryFn: async () => {
      if (!activityId) return [];
      
      const { data, error } = await supabase
        .from('activity_vendors')
        .select(`
          *,
          vendor:vendors(*)
        `)
        .eq('activity_id', activityId);

      if (error) throw error;
      return data;
    },
    enabled: !!activityId,
  });
}

export function useAddActivityVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      activity_id, 
      vendor_id, 
      role = 'Primary',
      budget_allocation,
      notes 
    }: { 
      activity_id: string; 
      vendor_id: string; 
      role?: 'Primary' | 'Secondary' | 'Support';
      budget_allocation?: number;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from('activity_vendors')
        .insert({ activity_id, vendor_id, role, budget_allocation, notes });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activity-vendors', variables.activity_id] });
      toast({
        title: "Vendor assigned",
        description: "The vendor has been assigned to this activity.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error assigning vendor",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useRemoveActivityVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ activity_id, vendor_id }: { activity_id: string; vendor_id: string }) => {
      const { error } = await supabase
        .from('activity_vendors')
        .delete()
        .eq('activity_id', activity_id)
        .eq('vendor_id', vendor_id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activity-vendors', variables.activity_id] });
      toast({
        title: "Vendor removed",
        description: "The vendor has been removed from this activity.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error removing vendor",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
