import { useState, useRef } from "react";
import { useParams, Link, useLocation } from "wouter";
import MainLayout from "@/components/layout/main-layout";
import { 
  useGetField, 
  getGetFieldQueryKey,
  useListFieldUpdates,
  getListFieldUpdatesQueryKey,
  useGetMe,
  getGetMeQueryKey,
  useUpdateField,
  useDeleteField,
  useCreateFieldUpdate,
  useListFieldAgents,
  getListFieldAgentsQueryKey,
  Stage,
  FieldStatus
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  MapPin, 
  CalendarDays, 
  Sprout, 
  Activity,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  User,
  Ruler,
  Edit,
  Trash2,
  History,
  MessageSquare,
  ChevronRight
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const editFormSchema = z.object({
  name: z.string().min(2),
  cropType: z.string().min(2),
  location: z.string().optional().nullable(),
  areaHectares: z.coerce.number().min(0).optional().nullable(),
  plantingDate: z.string().min(1),
  expectedHarvestDate: z.string().optional().nullable(),
  assignedAgentId: z.coerce.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const updateFormSchema = z.object({
  note: z.string().min(1, "A note is required"),
  newStage: z.enum([Stage.planted, Stage.growing, Stage.ready, Stage.harvested]).optional().nullable(),
});

function StatusBadge({ status }: { status: FieldStatus }) {
  switch (status) {
    case "active":
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200"><Activity className="w-3 h-3 mr-1" /> On Track</Badge>;
    case "at_risk":
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200"><AlertTriangle className="w-3 h-3 mr-1" /> At Risk</Badge>;
    case "completed":
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function FieldDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  
  const { data: field, isLoading: isFieldLoading } = useGetField(id, {
    query: { enabled: !!id, queryKey: getGetFieldQueryKey(id) }
  });
  
  const { data: updates, isLoading: isUpdatesLoading } = useListFieldUpdates(id, {
    query: { enabled: !!id, queryKey: getListFieldUpdatesQueryKey(id) }
  });
  
  const { data: currentUserData } = useGetMe({
    query: { queryKey: getGetMeQueryKey() }
  });
  
  const { data: agents } = useListFieldAgents({
    query: { enabled: currentUserData?.user.role === "admin", queryKey: getListFieldAgentsQueryKey() }
  });

  const isAdmin = currentUserData?.user.role === "admin";
  const isAssigned = field?.assignedAgentId === currentUserData?.user.id;
  const canUpdate = isAdmin || isAssigned;

  const updateFieldMutation = useUpdateField();
  const deleteFieldMutation = useDeleteField();
  const createUpdateMutation = useCreateFieldUpdate();

  const editForm = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      name: "",
      cropType: "",
      location: "",
      areaHectares: undefined,
      plantingDate: "",
      expectedHarvestDate: "",
      assignedAgentId: undefined,
      notes: "",
    },
  });

  const updateForm = useForm<z.infer<typeof updateFormSchema>>({
    resolver: zodResolver(updateFormSchema),
    defaultValues: {
      note: "",
      newStage: undefined,
    },
  });

  // Populate edit form when field loads
  if (field && !isEditOpen && editForm.getValues("name") === "") {
    editForm.reset({
      name: field.name,
      cropType: field.cropType,
      location: field.location || "",
      areaHectares: field.areaHectares || undefined,
      plantingDate: field.plantingDate.split('T')[0],
      expectedHarvestDate: field.expectedHarvestDate?.split('T')[0] || "",
      assignedAgentId: field.assignedAgentId || undefined,
      notes: field.notes || "",
    });
  }

  function onEditSubmit(values: z.infer<typeof editFormSchema>) {
    updateFieldMutation.mutate(
      { id, data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetFieldQueryKey(id) });
          toast({ title: "Field updated successfully" });
          setIsEditOpen(false);
        },
        onError: () => toast({ title: "Error updating field", variant: "destructive" })
      }
    );
  }

  function onDelete() {
    deleteFieldMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetFieldQueryKey(id) });
          toast({ title: "Field deleted successfully" });
          setLocation("/fields");
        },
        onError: () => toast({ title: "Error deleting field", variant: "destructive" })
      }
    );
  }

  function onUpdateSubmit(values: z.infer<typeof updateFormSchema>) {
    createUpdateMutation.mutate(
      { id, data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetFieldQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getListFieldUpdatesQueryKey(id) });
          toast({ title: "Field log updated" });
          setIsUpdateOpen(false);
          updateForm.reset();
        },
        onError: () => toast({ title: "Error adding update", variant: "destructive" })
      }
    );
  }

  if (isFieldLoading) {
    return (
      <MainLayout>
        <Skeleton className="h-8 w-24 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!field) {
    return (
      <MainLayout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">Field not found</h2>
          <p className="text-muted-foreground mt-2 mb-6">This field may have been deleted or you don't have access.</p>
          <Link href="/fields">
            <Button>Back to Fields</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <Link href="/fields" className="text-muted-foreground hover:text-foreground inline-flex items-center text-sm font-medium transition-colors">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to fields
          </Link>
        </div>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-extrabold tracking-tight">{field.name}</h1>
              <StatusBadge status={field.status} />
            </div>
            <div className="flex items-center text-muted-foreground font-medium">
              <Sprout className="mr-2 h-5 w-5 text-primary" />
              {field.cropType} • Stage: <span className="ml-1 text-foreground capitalize">{field.stage}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {canUpdate && (
              <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2" data-testid="btn-add-update">
                    <MessageSquare className="h-4 w-4" /> Add Update
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Log Field Update</DialogTitle>
                    <DialogDescription>Record observations or change the crop stage.</DialogDescription>
                  </DialogHeader>
                  <Form {...updateForm}>
                    <form onSubmit={updateForm.handleSubmit(onUpdateSubmit)} className="space-y-4">
                      <FormField
                        control={updateForm.control}
                        name="note"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Observation Note</FormLabel>
                            <FormControl>
                              <Textarea placeholder="What did you observe today?" className="min-h-24" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={updateForm.control}
                        name="newStage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Update Stage (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={`Current: ${field.value || 'Select to change'}`} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={Stage.planted}>Planted</SelectItem>
                                <SelectItem value={Stage.growing}>Growing</SelectItem>
                                <SelectItem value={Stage.ready}>Ready for Harvest</SelectItem>
                                <SelectItem value={Stage.harvested}>Harvested</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsUpdateOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={createUpdateMutation.isPending}>Save Update</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}

            {isAdmin && (
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Edit className="h-4 w-4" /> Edit
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Edit Field</DialogTitle>
                  </DialogHeader>
                  <Form {...editForm}>
                    <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                      {/* Form fields same as create */}
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={editForm.control} name="name" render={({ field }) => (
                          <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={editForm.control} name="cropType" render={({ field }) => (
                          <FormItem><FormLabel>Crop</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={editForm.control} name="location" render={({ field }) => (
                          <FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem>
                        )} />
                        <FormField control={editForm.control} name="areaHectares" render={({ field }) => (
                          <FormItem><FormLabel>Area (ha)</FormLabel><FormControl><Input type="number" step="0.1" {...field} value={field.value || ''} /></FormControl></FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={editForm.control} name="plantingDate" render={({ field }) => (
                          <FormItem><FormLabel>Planted</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={editForm.control} name="expectedHarvestDate" render={({ field }) => (
                          <FormItem><FormLabel>Exp. Harvest</FormLabel><FormControl><Input type="date" {...field} value={field.value || ''} /></FormControl></FormItem>
                        )} />
                      </div>
                      <FormField control={editForm.control} name="assignedAgentId" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assigned Agent</FormLabel>
                          <Select onValueChange={(val) => field.onChange(val === "unassigned" ? null : Number(val))} value={field.value ? String(field.value) : "unassigned"}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Select Agent" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="unassigned">Unassigned</SelectItem>
                              {agents?.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                      <FormField control={editForm.control} name="notes" render={({ field }) => (
                          <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} value={field.value || ''} /></FormControl></FormItem>
                      )} />
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={updateFieldMutation.isPending}>Save Changes</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}

            {isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the field "{field.name}" and all its timeline updates.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete Field
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{field.location || "Not specified"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Ruler className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Area</p>
                    <p className="text-sm text-muted-foreground">{field.areaHectares ? `${field.areaHectares} hectares` : "Not specified"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CalendarDays className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Planting Date</p>
                    <p className="text-sm text-muted-foreground">{new Date(field.plantingDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CalendarDays className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5 opacity-60" />
                  <div>
                    <p className="text-sm font-medium">Expected Harvest</p>
                    <p className="text-sm text-muted-foreground">{field.expectedHarvestDate ? new Date(field.expectedHarvestDate).toLocaleDateString() : "Not set"}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Assigned Agent</p>
                    <p className="text-sm text-muted-foreground">{field.assignedAgentName || "Unassigned"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {field.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Coordinator Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{field.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2">
            <Card className="h-full border-border/60 shadow-sm">
              <CardHeader className="border-b border-border/40 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" /> Timeline
                </CardTitle>
                <CardDescription>Log of observations and stage changes</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {isUpdatesLoading ? (
                  <div className="space-y-8">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : updates && updates.length > 0 ? (
                  <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                    {updates.map((update, idx) => (
                      <div key={update.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-background text-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                          {update.newStage ? <Sprout className="h-4 w-4" /> : <MessageSquare className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-card shadow-sm hover:border-primary/30 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                            <span className="font-semibold text-foreground text-sm">{update.authorName}</span>
                            <time className="text-xs text-muted-foreground font-medium">
                              {new Date(update.createdAt).toLocaleDateString()} {new Date(update.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </time>
                          </div>
                          
                          {update.newStage && (
                            <div className="flex items-center gap-2 mb-3 bg-muted/50 p-2 rounded-md w-fit">
                              <Badge variant="outline" className="text-xs capitalize">{update.previousStage || "unknown"}</Badge>
                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              <Badge className="text-xs capitalize bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">{update.newStage}</Badge>
                            </div>
                          )}
                          
                          <p className="text-sm text-muted-foreground leading-relaxed">{update.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-muted-foreground border border-dashed rounded-lg bg-muted/10">
                    <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="font-medium text-foreground">No updates yet</p>
                    <p className="text-sm mt-1 mb-4">Start tracking progress by logging an observation.</p>
                    {canUpdate && (
                      <Button variant="outline" onClick={() => setIsUpdateOpen(true)}>Log first update</Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
