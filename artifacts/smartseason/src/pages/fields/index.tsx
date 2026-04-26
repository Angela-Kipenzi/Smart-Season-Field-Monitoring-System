import { useState } from "react";
import MainLayout from "@/components/layout/main-layout";
import { 
  useListFields, 
  getListFieldsQueryKey,
  useGetMe,
  getGetMeQueryKey,
  Field,
  FieldStatus,
  Stage,
  useCreateField
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { 
  Plus, 
  Search, 
  MapPin, 
  CalendarDays, 
  Sprout, 
  AlertTriangle, 
  CheckCircle2, 
  Activity,
  User,
  Download
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  cropType: z.string().min(2, "Crop type must be at least 2 characters"),
  location: z.string().optional(),
  areaHectares: z.coerce.number().min(0).optional(),
  plantingDate: z.string().min(1, "Planting date is required"),
  expectedHarvestDate: z.string().optional(),
});

async function downloadCsv(url: string) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    throw new Error(`Export failed (${res.status})`);
  }
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] ?? "export.csv";
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(downloadUrl);
}

function StatusBadge({ status }: { status: FieldStatus }) {
  switch (status) {
    case "active":
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"><Activity className="w-3 h-3 mr-1" /> On Track</Badge>;
    case "at_risk":
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800"><AlertTriangle className="w-3 h-3 mr-1" /> At Risk</Badge>;
    case "completed":
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function StageBadge({ stage }: { stage: Stage }) {
  return (
    <Badge variant="secondary" className="capitalize">
      {stage}
    </Badge>
  );
}

export default function FieldsPage() {
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();
  
  const { data: fields, isLoading } = useListFields({
    query: { queryKey: getListFieldsQueryKey() }
  });
  
  const { data: currentUserData } = useGetMe({
    query: { queryKey: getGetMeQueryKey() }
  });
  
  const isAdmin = currentUserData?.user.role === "admin";
  
  const createFieldMutation = useCreateField();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      cropType: "",
      location: "",
      areaHectares: 0,
      plantingDate: new Date().toISOString().split('T')[0],
      expectedHarvestDate: "",
    },
  });

  const filteredFields = fields?.filter(field => 
    field.name.toLowerCase().includes(search.toLowerCase()) || 
    field.cropType.toLowerCase().includes(search.toLowerCase()) ||
    (field.location && field.location.toLowerCase().includes(search.toLowerCase()))
  ) || [];

  function onSubmit(values: z.infer<typeof formSchema>) {
    createFieldMutation.mutate(
      { data: { ...values, stage: Stage.planted } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFieldsQueryKey() });
          toast({
            title: "Field created",
            description: `${values.name} has been added successfully.`,
          });
          setIsCreateOpen(false);
          form.reset();
        },
        onError: (error) => {
          toast({
            title: "Error creating field",
            description: "Please try again later.",
            variant: "destructive",
          });
        }
      }
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fields</h1>
            <p className="text-muted-foreground mt-1">
              {isAdmin ? "Manage all fields in your operation." : "Fields currently assigned to you."}
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search fields..."
                className="pl-9 bg-background w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search-fields"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="shrink-0 gap-2" data-testid="btn-export">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => downloadCsv("/api/exports/fields.csv")}
                  data-testid="btn-export-fields"
                >
                  <Sprout className="h-4 w-4 mr-2" /> Fields (CSV)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => downloadCsv("/api/exports/updates.csv")}
                  data-testid="btn-export-updates"
                >
                  <Activity className="h-4 w-4 mr-2" /> Updates (CSV)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {isAdmin && (
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="shrink-0 gap-2" data-testid="btn-new-field">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">New Field</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add New Field</DialogTitle>
                    <DialogDescription>
                      Create a new field profile to start tracking its crop cycle.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Field Name / ID</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. North Block 4" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="cropType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Crop Type</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Winter Wheat" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Coordinates or description" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="areaHectares"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Area (Hectares)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.1" min="0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="plantingDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Planting Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="expectedHarvestDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expected Harvest (Optional)</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={createFieldMutation.isPending} data-testid="btn-submit-field">
                          {createFieldMutation.isPending ? "Creating..." : "Create Field"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-2 mt-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </CardContent>
                <CardFooter className="pt-4 bg-muted/20 border-t">
                  <Skeleton className="h-8 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : filteredFields.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFields.map((field) => (
              <Link key={field.id} href={`/fields/${field.id}`}>
                <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group flex flex-col" data-testid={`card-field-${field.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <StatusBadge status={field.status} />
                      <StageBadge stage={field.stage} />
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-1">{field.name}</CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Sprout className="mr-1.5 h-3.5 w-3.5" />
                      {field.cropType}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4 flex-1">
                    <div className="grid grid-cols-1 gap-2.5 text-sm">
                      {field.location && (
                        <div className="flex items-start text-muted-foreground">
                          <MapPin className="mr-2 h-4 w-4 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{field.location}</span>
                        </div>
                      )}
                      <div className="flex items-center text-muted-foreground">
                        <CalendarDays className="mr-2 h-4 w-4 shrink-0" />
                        <span>Planted: {new Date(field.plantingDate).toLocaleDateString()}</span>
                      </div>
                      {field.assignedAgentName && (
                        <div className="flex items-center text-muted-foreground mt-2 pt-2 border-t border-border/50">
                          <User className="mr-2 h-4 w-4 shrink-0" />
                          <span className="line-clamp-1 font-medium">{field.assignedAgentName}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/30 border-t px-6 py-3">
                    <div className="text-xs text-muted-foreground w-full flex justify-between items-center">
                      <span>Updated</span>
                      <span className="font-medium text-foreground">
                        {field.lastUpdateAt ? new Date(field.lastUpdateAt).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-muted/20 border border-dashed rounded-xl h-64">
            <div className="bg-background p-4 rounded-full shadow-sm mb-4">
              <Sprout className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No fields found</h3>
            <p className="text-muted-foreground max-w-sm">
              {search 
                ? `No fields matching "${search}". Try a different search term.` 
                : isAdmin 
                  ? "Get started by creating your first field to monitor."
                  : "You don't have any fields assigned to you right now."}
            </p>
            {isAdmin && !search && (
              <Button className="mt-6" onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Create Field
              </Button>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
