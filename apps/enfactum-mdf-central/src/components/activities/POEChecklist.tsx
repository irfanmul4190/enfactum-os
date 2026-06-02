import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  FileText, 
  Upload, 
  Plus, 
  CheckCircle, 
  Clock, 
  XCircle,
  Trash2,
  AlertCircle,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { POERecord, ActivityType } from "@/types/database";
import { POE_CATEGORIES, SPECIAL_POE_ACTIVITY_TYPES } from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface POEChecklistProps {
  activityId: string;
  activityType?: ActivityType;
}

const poeFormSchema = z.object({
  checklist_type: z.enum(['Event', 'Digital', 'Incentive']),
  file_url: z.string().url().optional().or(z.literal('')),
  comments: z.string().optional(),
  // Sales Incentive specific fields
  sku_list: z.string().optional(),
  weekly_sales_report_url: z.string().url().optional().or(z.literal('')),
});

type POEFormValues = z.infer<typeof poeFormSchema>;

const checklistRequirements = {
  Event: [
    { id: 'attendance', label: 'Attendance Sheet', required: true },
    { id: 'photos', label: 'Event Photos (min 5)', required: true },
    { id: 'agenda', label: 'Event Agenda', required: true },
    { id: 'survey', label: 'Post-Event Survey', required: false },
    { id: 'venue', label: 'Venue Receipt/Invoice', required: true },
  ],
  Digital: [
    { id: 'screenshot', label: 'Campaign Screenshots', required: true },
    { id: 'analytics', label: 'Performance Analytics Report', required: true },
    { id: 'creative', label: 'Creative Assets Used', required: true },
    { id: 'reach', label: 'Reach & Engagement Metrics', required: true },
  ],
  Incentive: [
    { id: 'sku_list', label: 'SKU List', required: true },
    { id: 'weekly_sales', label: 'Weekly Sales Reports', required: true },
    { id: 'reward_delivery', label: 'Reward Delivery Proof', required: true },
    { id: 'participant_list', label: 'Participant List with Payouts', required: true },
    { id: 'terms', label: 'Program Terms & Conditions', required: true },
  ],
};

// Special requirements for specific activity types
const activityTypeSpecificRequirements: Record<string, typeof checklistRequirements.Event> = {
  'Sales Incentives': [
    { id: 'sku_list', label: 'SKU List (HP Product Codes)', required: true },
    { id: 'weekly_sales', label: 'Weekly Sales Reports', required: true },
    { id: 'reward_delivery', label: 'Reward Delivery Proof (photos/receipts)', required: true },
    { id: 'participant_list', label: 'Participant List with Payouts', required: true },
    { id: 'terms', label: 'Program Terms & Conditions', required: true },
    { id: 'partner_certification', label: 'Partner Certification Letter', required: false },
  ],
  'Events and Training': [
    { id: 'attendance', label: 'Attendance Sheet with Signatures', required: true },
    { id: 'photos', label: 'Event Photos (min 10 with branding visible)', required: true },
    { id: 'agenda', label: 'Event Agenda/Training Curriculum', required: true },
    { id: 'survey', label: 'Post-Event Survey Results', required: true },
    { id: 'venue', label: 'Venue Receipt/Invoice', required: true },
    { id: 'materials', label: 'Training Materials Used', required: true },
    { id: 'certificates', label: 'Participant Certificates (if applicable)', required: false },
  ],
};

export function POEChecklist({ activityId, activityType }: POEChecklistProps) {
  const [records, setRecords] = useState<POERecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<'Event' | 'Digital' | 'Incentive'>('Event');

  const form = useForm<POEFormValues>({
    resolver: zodResolver(poeFormSchema),
    defaultValues: {
      checklist_type: 'Event',
      file_url: '',
      comments: '',
      sku_list: '',
      weekly_sales_report_url: '',
    },
  });

  useEffect(() => {
    fetchRecords();
  }, [activityId]);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('poe_records')
        .select('*')
        .eq('activity_id', activityId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecords((data || []) as POERecord[]);
    } catch (error) {
      console.error('Error fetching POE records:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: POEFormValues) => {
    try {
      const { error } = await supabase
        .from('poe_records')
        .insert({
          activity_id: activityId,
          checklist_type: values.checklist_type,
          file_url: values.file_url || null,
          comments: values.comments || null,
          sku_list: values.sku_list ? { data: values.sku_list } : null,
          weekly_sales_reports: values.weekly_sales_report_url ? { url: values.weekly_sales_report_url } : null,
          status: 'Pending',
          submitted_at: new Date().toISOString(),
        });

      if (error) throw error;
      
      toast.success('POE record added successfully');
      setDialogOpen(false);
      form.reset();
      fetchRecords();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add POE record');
    }
  };

  const statusIcons = {
    Pending: <Clock className="h-4 w-4 text-amber-500" />,
    Approved: <CheckCircle className="h-4 w-4 text-green-500" />,
    Rejected: <XCircle className="h-4 w-4 text-red-500" />,
  };

  const statusColors = {
    Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    Approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    Rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const watchedType = form.watch('checklist_type');

  // Check if this activity type has special requirements
  const hasSpecialRequirements = activityType && SPECIAL_POE_ACTIVITY_TYPES.includes(activityType as any);
  const specialRequirements = activityType ? activityTypeSpecificRequirements[activityType] : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">POE Requirements</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Add POE Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add POE Record</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="checklist_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Checklist Type</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedType(value as any);
                        }} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Event">Event</SelectItem>
                          <SelectItem value="Digital">Digital</SelectItem>
                          <SelectItem value="Incentive">Sales Incentive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Dynamic requirements based on type */}
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                    Required Documents
                  </p>
                  <div className="space-y-1.5">
                    {checklistRequirements[watchedType]?.map((req) => (
                      <div key={req.id} className="flex items-center gap-2 text-sm">
                        {req.required ? (
                          <AlertCircle className="h-3 w-3 text-destructive" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-muted-foreground/30" />
                        )}
                        <span className={req.required ? '' : 'text-muted-foreground'}>
                          {req.label}
                        </span>
                        {req.required && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1">Required</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sales Incentive specific fields */}
                {watchedType === 'Incentive' && (
                  <>
                    <FormField
                      control={form.control}
                      name="sku_list"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU List</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter SKU codes, one per line..."
                              className="min-h-[80px] font-mono text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="weekly_sales_report_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weekly Sales Report URL</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://..."
                              type="url"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <FormField
                  control={form.control}
                  name="file_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://..."
                          type="url"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="comments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comments (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any additional notes..."
                          className="min-h-[60px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Submit POE Record
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Activity Type-specific requirements notice */}
      {hasSpecialRequirements && specialRequirements && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-2">
              This is a "{activityType}" activity. Special POE requirements apply:
            </p>
            <div className="grid grid-cols-2 gap-1">
              {specialRequirements.map((req) => (
                <div key={req.id} className="flex items-center gap-1.5 text-xs">
                  {req.required ? (
                    <AlertCircle className="h-3 w-3 text-destructive shrink-0" />
                  ) : (
                    <CheckCircle className="h-3 w-3 text-muted-foreground shrink-0" />
                  )}
                  <span className={req.required ? 'font-medium' : 'text-muted-foreground'}>
                    {req.label}
                  </span>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Existing Records */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : records.length > 0 ? (
        <Accordion type="single" collapsible className="space-y-2">
          {records.map((record) => (
            <AccordionItem 
              key={record.id} 
              value={record.id}
              className="border rounded-lg px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  {statusIcons[record.status]}
                  <div>
                    <p className="font-medium text-sm">{record.checklist_type} POE</p>
                    <p className="text-xs text-muted-foreground">
                      Submitted {new Date(record.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className={cn("ml-auto mr-4 text-xs", statusColors[record.status])}>
                    {record.status}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <div className="space-y-3">
                  {record.file_url && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Document URL</Label>
                      <a 
                        href={record.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline block"
                      >
                        {record.file_url}
                      </a>
                    </div>
                  )}
                  {record.sku_list && (
                    <div>
                      <Label className="text-xs text-muted-foreground">SKU List</Label>
                      <pre className="text-sm bg-muted p-2 rounded mt-1 font-mono text-xs overflow-x-auto">
                        {JSON.stringify(record.sku_list, null, 2)}
                      </pre>
                    </div>
                  )}
                  {record.comments && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Comments</Label>
                      <p className="text-sm">{record.comments}</p>
                    </div>
                  )}
                  {record.status === 'Rejected' && (
                    <div className="p-2 bg-destructive/10 rounded-lg">
                      <p className="text-xs text-destructive font-medium">Rejection Reason:</p>
                      <p className="text-sm text-destructive/80">
                        {record.comments || 'No reason provided'}
                      </p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">No POE records submitted yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add POE documentation to complete this activity
          </p>
        </div>
      )}
    </div>
  );
}
