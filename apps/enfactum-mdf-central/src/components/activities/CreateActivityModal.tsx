import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Loader2, Check, ChevronsUpDown, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MultiSelect } from "@/components/ui/multi-select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BUSINESS_UNITS, MARKETS, FUNDING_SOURCES, CURRENCIES, HP_QUARTERS, ACTIVITY_TYPES, PBM_NAMES, ACTIVITY_STATUSES_V3, generateActivityId, getCurrentHPQuarter } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useProjects } from "@/hooks/useProjects";
import { useCurrentUserPermissions } from "@/hooks/useCurrentUserPermissions";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  activity_id: z.string().min(1, "Activity ID is required").regex(/^00/, "Activity ID must start with '00'"),
  name: z.string().min(1, "Activity name is required").max(200),
  project_id: z.string().optional(),
  bu_array: z.array(z.string()).min(1, "At least one Business Unit is required"),
  pbm_names: z.array(z.string()).optional(),
  market: z.string().min(1, "Market is required"),
  funding_source: z.enum(['HP', 'Intel', 'AMD', 'Mixed']),
  activity_type: z.string().optional(),
  assigned_to: z.string().optional(),
  status_v3: z.string().optional(),
  approved_budget: z.string().min(1, "Budget is required").transform(val => parseFloat(val)),
  currency: z.string().min(1, "Currency is required"),
  fiscal_quarter: z.string().min(1, "Fiscal quarter is required"),
  execution_start_date: z.string().optional(),
  execution_end_date: z.string().optional(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateActivityModalProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function CreateActivityModal({ onSuccess, trigger }: CreateActivityModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);

  const { data: teamMembers = [] } = useTeamMembers();
  const { data: projects = [] } = useProjects();
  const permissions = useCurrentUserPermissions();

  const currentQuarter = getCurrentHPQuarter();
  const defaultActivityId = generateActivityId();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      activity_id: defaultActivityId,
      name: "",
      project_id: "",
      bu_array: [],
      pbm_names: [],
      market: "SG",
      funding_source: "HP",
      activity_type: "",
      assigned_to: "",
      status_v3: "Not Start",
      approved_budget: "" as any,
      currency: "USD",
      fiscal_quarter: `${currentQuarter.quarter} FY${currentQuarter.year}`,
      execution_start_date: "",
      execution_end_date: "",
      description: "",
    },
  });

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('activities')
        .insert({
          activity_id: data.activity_id,
          name: data.name,
          project_id: data.project_id || null,
          bu: data.bu_array[0] || 'PC Commercial', // Legacy field - use first selected BU
          bu_array: data.bu_array,
          pbm_names: data.pbm_names || [],
          market: data.market,
          funding_source: data.funding_source,
          activity_type: data.activity_type || null,
          assigned_to: data.assigned_to || null,
          status: 'Not Started', // Legacy field
          status_v3: data.status_v3 || 'Not Start',
          approved_budget: data.approved_budget,
          currency: data.currency,
          fiscal_quarter: data.fiscal_quarter,
          execution_start_date: data.execution_start_date || null,
          execution_end_date: data.execution_end_date || null,
          description: data.description || null,
        } as any);

      if (error) throw error;

      toast.success("Activity created successfully");
      setOpen(false);
      form.reset({
        activity_id: generateActivityId(),
        name: "",
        project_id: "",
        bu_array: [],
        pbm_names: [],
        market: "SG",
        funding_source: "HP",
        activity_type: "",
        assigned_to: "",
        status_v3: "Not Start",
        approved_budget: "" as any,
        currency: "USD",
        fiscal_quarter: `${currentQuarter.quarter} FY${currentQuarter.year}`,
        execution_start_date: "",
        execution_end_date: "",
        description: "",
      });
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating activity:', error);
      toast.error(error.message || "Failed to create activity");
    } finally {
      setIsLoading(false);
    }
  }

  const selectedAssignee = teamMembers.find(m => m.id === form.watch('assigned_to'));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Activity
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create New Activity</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-4">
            {/* Activity ID and Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="activity_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HP Activity ID</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="00xxxxxxxx" 
                        {...field} 
                        className="font-mono"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fiscal_quarter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fiscal Quarter</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select quarter" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {HP_QUARTERS.map((q) => (
                          <SelectItem key={q.value} value={`${q.value} FY${currentQuarter.year}`}>
                            {q.label} FY{currentQuarter.year}
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter activity name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Project */}
            <FormField
              control={form.control}
              name="project_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects
                        .filter(p => p.status === 'Active' || p.status === 'Draft')
                        .map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Activity Type and Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="activity_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select activity type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ACTIVITY_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
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
                name="status_v3"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ACTIVITY_STATUSES_V3.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Assigned To */}
            <FormField
              control={form.control}
              name="assigned_to"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Assigned To</FormLabel>
                  <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={assigneeOpen}
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {selectedAssignee 
                            ? `${selectedAssignee.full_name} - ${selectedAssignee.team}`
                            : "Select team member"
                          }
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search team member..." />
                        <CommandList>
                          <CommandEmpty>No team member found.</CommandEmpty>
                          <CommandGroup>
                            {teamMembers.map((member) => (
                              <CommandItem
                                key={member.id}
                                value={`${member.full_name} ${member.team}`}
                                onSelect={() => {
                                  form.setValue('assigned_to', member.id);
                                  setAssigneeOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === member.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">{member.full_name}</span>
                                  <span className="text-xs text-muted-foreground">{member.team}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Business Units (Multi-select) */}
            <FormField
              control={form.control}
              name="bu_array"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Units</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={BUSINESS_UNITS.map(bu => ({ value: bu.value, label: bu.label }))}
                      selected={field.value || []}
                      onChange={field.onChange}
                      placeholder="Select business units..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* PBM Names (Multi-select) */}
            <FormField
              control={form.control}
              name="pbm_names"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PBM Names</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={PBM_NAMES.map(pbm => ({ value: pbm.value, label: pbm.label }))}
                      selected={field.value || []}
                      onChange={field.onChange}
                      placeholder="Select PBM names..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Market and Funding */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="market"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Market</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select market" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MARKETS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
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
                name="funding_source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funding Source</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FUNDING_SOURCES.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="approved_budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      Approved Budget
                      {!permissions.can_edit_budget && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Lock className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>You don't have permission to set budget</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        {...field}
                        disabled={!permissions.can_edit_budget}
                        className={cn(!permissions.can_edit_budget && "opacity-60")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.symbol} {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="execution_start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Execution Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="execution_end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Execution End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of the activity..." 
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Activity
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}