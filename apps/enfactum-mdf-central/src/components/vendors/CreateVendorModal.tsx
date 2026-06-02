import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { useCreateVendor } from "@/hooks/useVendors";
import type { VendorType } from "@/types/database";
import { MARKETS } from "@/lib/constants";

const vendorTypes: VendorType[] = [
  'Distributor',
  'Reseller',
  'Agency',
  'Event Company',
  'Print House',
  'Digital Agency',
  'Media Agency',
  'Production House',
  'Other'
];

const serviceOptions = [
  { value: 'Design', label: 'Design' },
  { value: 'Print', label: 'Print' },
  { value: 'Events', label: 'Events' },
  { value: 'Digital Marketing', label: 'Digital Marketing' },
  { value: 'Social Media', label: 'Social Media' },
  { value: 'Video Production', label: 'Video Production' },
  { value: 'Photography', label: 'Photography' },
  { value: 'Merchandising', label: 'Merchandising' },
  { value: 'Fulfillment', label: 'Fulfillment' },
  { value: 'Training', label: 'Training' },
];

const formSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  type: z.enum(vendorTypes as [VendorType, ...VendorType[]]),
  market: z.string().min(1, "Market is required"),
  services: z.array(z.string()).optional(),
  contact_name: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  meta_pixel_id: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateVendorModal() {
  const [open, setOpen] = useState(false);
  const createVendor = useCreateVendor();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "Agency",
      market: "",
      services: [],
      contact_name: "",
      contact_email: "",
      phone: "",
      meta_pixel_id: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    await createVendor.mutateAsync({
      name: data.name,
      type: data.type,
      market: data.market,
      services: data.services,
      contact_name: data.contact_name || undefined,
      contact_email: data.contact_email || undefined,
      phone: data.phone || undefined,
      meta_pixel_id: data.meta_pixel_id || undefined,
    });
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Vendor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter vendor name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vendorTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="market"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Market *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select market" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MARKETS.map((market) => (
                          <SelectItem key={market.value} value={market.value}>
                            {market.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="services"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Services</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={serviceOptions}
                      selected={field.value || []}
                      onChange={field.onChange}
                      placeholder="Select services..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contact_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Primary contact" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 234 567 890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="meta_pixel_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta Pixel ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createVendor.isPending}>
                {createVendor.isPending ? "Creating..." : "Create Vendor"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
