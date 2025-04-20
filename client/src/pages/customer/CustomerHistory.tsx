import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CalendarIcon, CheckCircle, XCircle, Search, MoreHorizontal } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CustomerHistory() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedExecution, setSelectedExecution] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
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

  const filteredHistory = executionHistory
    ? executionHistory.filter((item: any) =>
        item.automationName.toLowerCase().includes(searchQuery.toLowerCase())
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Execution History</h1>
        <p className="text-muted-foreground">
          View the execution history of your automations
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

      <Tabs defaultValue="all">
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

      {filteredHistory.length > 0 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Calculate which page numbers to show
              let pageNum = i + 1;
              if (totalPages > 5) {
                if (currentPage > 3) {
                  pageNum = currentPage - 3 + i;
                }
                if (currentPage > totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                }
              }
              
              if (pageNum <= totalPages) {
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNum)}
                      isActive={currentPage === pageNum}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              }
              return null;
            })}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Execution Details</DialogTitle>
            <DialogDescription>
              Detailed information about this automation execution
            </DialogDescription>
          </DialogHeader>
          
          {selectedExecution && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Automation</h3>
                  <p className="text-base">{selectedExecution.automationName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <div className="flex items-center">
                    {selectedExecution.status === "success" ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-green-600 dark:text-green-400">Successful</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-500 mr-1" />
                        <span className="text-red-600 dark:text-red-400">Failed</span>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Date & Time</h3>
                  <p className="text-base">{new Date(selectedExecution.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Duration</h3>
                  <p className="text-base">{selectedExecution.duration || "N/A"} ms</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Execution Data</h3>
                <div className="bg-muted p-4 rounded-md overflow-auto max-h-60">
                  <pre className="text-xs">
                    {JSON.stringify(selectedExecution.data || {}, null, 2)}
                  </pre>
                </div>
              </div>

              {selectedExecution.errorMessage && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Error Details</h3>
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-4 rounded-md overflow-auto max-h-60">
                    <pre className="text-xs whitespace-pre-wrap">
                      {selectedExecution.errorMessage}
                    </pre>
                  </div>
                </div>
              )}
            </div>
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
      <CardHeader className="pb-1">
        <CardTitle>Execution History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Automation</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((execution: any) => (
              <TableRow key={execution.id}>
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