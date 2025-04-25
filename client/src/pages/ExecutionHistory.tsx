import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  Search,
  AlertCircle,
  CheckCircle,
  XCircle,
  CalendarIcon,
  MoreHorizontal,
  Code,
  Terminal,
  AlertTriangle,
  FileJson,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ExecutionHistory() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedExecution, setSelectedExecution] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all");
  const itemsPerPage = 10;
  
  const {
    data: executionHistory,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/execution-history"],
  });

  if (error) {
    toast({
      title: "Error",
      description: "Failed to load execution history",
      variant: "destructive",
    });
  }

  const filteredHistory = executionHistory && Array.isArray(executionHistory)
    ? executionHistory.filter((item: any) =>
        item.automationName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const totalPages = Math.ceil((filteredHistory?.length || 0) / itemsPerPage);
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const viewExecutionDetails = (execution: any) => {
    setSelectedExecution(execution);
    setDetailsDialogOpen(true);
  };

  // Function to render the execution error details with syntax highlighting and collapsible sections
  const renderErrorDetails = (execution: any) => {
    if (!execution || execution.status !== "failed") return null;
    
    const errorData = execution.data?.error || {};
    const errorSteps = execution.data?.steps || [];
    
    return (
      <div className="space-y-4 mt-4">
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400 mt-0.5 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Error Details</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-200">
                <p>{errorData.message || execution.message || "An unknown error occurred"}</p>
                {errorData.location && (
                  <p className="mt-1 font-mono text-xs">
                    Location: {errorData.location}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Execution Steps with Status Indicators */}
        {errorSteps.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Execution Steps</h3>
            <div className="space-y-2">
              {errorSteps.map((step: any, index: number) => (
                <div 
                  key={index}
                  className={`border rounded-md p-3 ${
                    step.status === 'success' 
                      ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' 
                      : step.status === 'failed' 
                      ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' 
                      : 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      {step.status === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      ) : step.status === 'failed' ? (
                        <XCircle className="h-4 w-4 text-red-500 mr-2" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-blue-500 mr-2" />
                      )}
                      <div>
                        <span className="font-medium text-sm">
                          {step.name || `Step ${index + 1}`}
                        </span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {step.description || "No description available"}
                        </p>
                      </div>
                    </div>
                    <Badge variant={
                      step.status === 'success' ? 'default' : 
                      step.status === 'failed' ? 'destructive' : 'secondary'
                    }>
                      {step.status}
                    </Badge>
                  </div>
                  
                  {/* Show error details for the failed step */}
                  {step.status === 'failed' && step.error && (
                    <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                      <p className="text-xs text-red-700 dark:text-red-200 font-mono">
                        {step.error.message || "Unknown error"}
                      </p>
                      {step.error.stack && (
                        <details className="mt-1">
                          <summary className="text-xs cursor-pointer font-medium">Stack trace</summary>
                          <pre className="mt-2 text-xs whitespace-pre-wrap overflow-x-auto bg-red-50 dark:bg-red-900/40 p-2 rounded border border-red-200 dark:border-red-800">
                            {step.error.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}
                  
                  {/* Show input/output for each step */}
                  {(step.input || step.output) && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {step.input && (
                        <div className="text-xs">
                          <details>
                            <summary className="cursor-pointer font-medium">Input</summary>
                            <pre className="mt-1 bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto">
                              {typeof step.input === 'object' 
                                ? JSON.stringify(step.input, null, 2) 
                                : step.input}
                            </pre>
                          </details>
                        </div>
                      )}
                      
                      {step.output && (
                        <div className="text-xs">
                          <details>
                            <summary className="cursor-pointer font-medium">Output</summary>
                            <pre className="mt-1 bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto">
                              {typeof step.output === 'object' 
                                ? JSON.stringify(step.output, null, 2) 
                                : step.output}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Raw Request/Response Data */}
        {(execution.data?.request || execution.data?.response) && (
          <div className="space-y-2 mt-4">
            <h3 className="text-sm font-medium">Request/Response Data</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {execution.data?.request && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center">
                      <Code className="h-4 w-4 mr-2" />
                      Request Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-0">
                    <ScrollArea className="h-[200px]">
                      <pre className="text-xs font-mono whitespace-pre-wrap overflow-x-auto bg-gray-50 dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-800">
                        {typeof execution.data.request === 'object' 
                          ? JSON.stringify(execution.data.request, null, 2)
                          : execution.data.request}
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
              
              {execution.data?.response && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center">
                      <Terminal className="h-4 w-4 mr-2" />
                      Response Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-0">
                    <ScrollArea className="h-[200px]">
                      <pre className="text-xs font-mono whitespace-pre-wrap overflow-x-auto bg-gray-50 dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-800">
                        {typeof execution.data.response === 'object' 
                          ? JSON.stringify(execution.data.response, null, 2)
                          : execution.data.response}
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Execution History</h1>
        <p className="text-muted-foreground">
          View and analyze the execution history of your automations with detailed logs
        </p>
      </div>

      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by automation name"
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs 
        defaultValue="all" 
        value={selectedTab}
        onValueChange={setSelectedTab}
      >
        <TabsList>
          <TabsTrigger value="all">All Executions</TabsTrigger>
          <TabsTrigger value="success">Successful</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {renderExecutionTable(paginatedHistory, isLoading, viewExecutionDetails)}
        </TabsContent>
        
        <TabsContent value="success" className="space-y-4">
          {renderExecutionTable(
            paginatedHistory.filter((item: any) => item.status === "success"),
            isLoading,
            viewExecutionDetails
          )}
        </TabsContent>
        
        <TabsContent value="failed" className="space-y-4">
          {renderExecutionTable(
            paginatedHistory.filter((item: any) => item.status === "failed"),
            isLoading,
            viewExecutionDetails
          )}
        </TabsContent>
      </Tabs>
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="px-3 py-1 border rounded-md flex items-center justify-center min-w-[60px]">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
      
      {/* Execution Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedExecution && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center">
                  <span className="mr-2">Execution Details</span>
                  <Badge variant={selectedExecution.status === "success" ? "default" : "destructive"}>
                    {selectedExecution.status}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Complete execution information for {selectedExecution.automationName}
                </DialogDescription>
              </DialogHeader>
              
              {/* Execution Header Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Automation</h3>
                  <p className="text-base font-medium">{selectedExecution.automationName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Date & Time</h3>
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1 text-muted-foreground" />
                    <p className="text-base">{new Date(selectedExecution.timestamp).toLocaleString()}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(selectedExecution.timestamp), { addSuffix: true })}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Duration</h3>
                  <p className="text-base">{selectedExecution.duration || "N/A"} ms</p>
                </div>
              </div>
              
              {/* Render detailed error info for failed executions */}
              {selectedExecution.status === "failed" ? (
                renderErrorDetails(selectedExecution)
              ) : (
                <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-800 mt-4">
                  <div className="flex">
                    <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mt-0.5 mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-green-800 dark:text-green-300">Successful Execution</h3>
                      <p className="mt-2 text-sm text-green-700 dark:text-green-200">
                        This automation ran successfully without any errors.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Additional Raw JSON Data View */}
              <div className="mt-6">
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium flex items-center">
                    <FileJson className="h-4 w-4 mr-2" />
                    View Raw Execution Data
                  </summary>
                  <div className="mt-3">
                    <ScrollArea className="h-[300px] w-full">
                      <pre className="text-xs font-mono bg-gray-50 dark:bg-gray-900 p-4 rounded border border-gray-200 dark:border-gray-800 whitespace-pre-wrap overflow-x-auto">
                        {JSON.stringify(selectedExecution, null, 2)}
                      </pre>
                    </ScrollArea>
                  </div>
                </details>
              </div>
              
              <DialogFooter>
                <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function renderExecutionTable(data: any[], isLoading: boolean, onViewDetails: (execution: any) => void) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No executions found</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          There is no execution history matching your criteria.
        </p>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Automation</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Log Level</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((execution: any) => (
              <TableRow key={execution.id} className={
                execution.status === "failed" ? "bg-red-50/50 dark:bg-red-900/10" : ""
              }>
                <TableCell className="font-medium">{execution.automationName}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    {execution.status === "success" ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-green-600 dark:text-green-400">Success</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-500 mr-1" />
                        <span className="text-red-600 dark:text-red-400">Failed</span>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{new Date(execution.timestamp).toLocaleString()}</span>
                  </div>
                </TableCell>
                <TableCell>{execution.duration || "N/A"} ms</TableCell>
                <TableCell>
                  <Badge variant={
                    execution.level === "error" ? "destructive" : 
                    execution.level === "warning" ? "outline" : "secondary"
                  }>
                    {execution.level || "info"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewDetails(execution)}>
                        View details
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(execution, null, 2));
                        }}
                      >
                        Copy as JSON
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}