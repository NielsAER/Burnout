import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import StatsCard from "@/components/automation/StatsCard";
import AutomationCard from "@/components/automation/AutomationCard";
import TemplateCard from "@/components/automation/TemplateCard";
import ActivityFeed from "@/components/automation/ActivityFeed";
import { Automation, ExecutionHistory, Template } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";

const Dashboard = () => {
  // Fetch automations
  const { data: automations, isLoading: loadingAutomations } = useQuery<Automation[]>({
    queryKey: ["/api/automations"],
  });

  // Fetch execution histories
  const { data: executionHistories, isLoading: loadingHistories } = useQuery<ExecutionHistory[]>({
    queryKey: ["/api/execution-history"],
  });

  // Fetch popular templates
  const { data: popularTemplates, isLoading: loadingTemplates } = useQuery<Template[]>({
    queryKey: ["/api/templates/popular"],
  });

  // Calculate stats
  const activeAutomations = automations?.filter(a => a.active).length || 0;
  const totalTasks = automations?.reduce((acc, curr) => acc + curr.runsToday, 0) || 0;
  const connectedApps = new Set([
    ...(automations?.map(a => a.triggerAppId) || []),
    ...(automations?.map(a => a.actionAppId) || [])
  ]).size;
  
  // Calculate error rate
  const totalExecutions = executionHistories?.length || 0;
  const errorExecutions = executionHistories?.filter(h => h.status === "error").length || 0;
  const errorRate = totalExecutions > 0 
    ? ((errorExecutions / totalExecutions) * 100).toFixed(1) 
    : "0.0";

  return (
    <div className="pb-12">
      {/* Stats Cards */}
      <div className="py-6 px-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Active Automations"
            value={activeAutomations}
            icon="rocket"
            color="success"
            link="/automations"
            linkText="View all"
            isLoading={loadingAutomations}
          />
          
          <StatsCard
            title="Tasks Automated"
            value={totalTasks}
            icon="task"
            color="primary"
            change={12}
            changeDirection="up"
            link="#"
            linkText="Last 30 days"
            isLoading={loadingAutomations}
          />
          
          <StatsCard
            title="Connected Apps"
            value={connectedApps}
            icon="apps"
            color="secondary"
            link="/connections"
            linkText="Add more"
            isLoading={loadingAutomations}
          />
          
          <StatsCard
            title="Error Rate"
            value={`${errorRate}%`}
            icon="error"
            color="error"
            change={3}
            changeDirection="down"
            link="/history"
            linkText="View issues"
            isLoading={loadingHistories}
          />
        </div>
      </div>
      
      {/* My Automations Section */}
      <div className="py-4 px-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-white">My Automations</h2>
          <div className="flex">
            <Link href="/automations" className="text-sm font-medium text-blue-400 hover:text-blue-300 flex items-center">
                View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loadingAutomations ? (
            // Loading skeleton
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-[#0f0f0f] border border-[#2a2a2a] shadow rounded-sm overflow-hidden">
                <div className="p-4 border-b border-[#2a2a2a]">
                  <Skeleton className="h-6 w-3/4" />
                </div>
                <div className="p-4">
                  <div className="flex items-center mb-4">
                    <Skeleton className="h-10 w-10 rounded-sm" />
                    <Skeleton className="h-5 w-5 mx-3" />
                    <Skeleton className="h-10 w-10 rounded-sm" />
                  </div>
                  <Skeleton className="h-4 w-full mb-4" />
                  <div className="flex justify-between mt-4">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <>
              {automations?.slice(0, 3).map((automation) => (
                <AutomationCard 
                  key={automation.id}
                  automation={automation}
                />
              ))}
            </>
          )}
        </div>
      </div>
      
      {/* Popular Templates Section */}
      <div className="py-4 px-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Popular Templates</h2>
        
        <div className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] shadow rounded-sm overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {loadingTemplates ? (
                // Loading skeleton
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="border border-gray-200 dark:border-[#2a2a2a] rounded-sm overflow-hidden bg-gray-50 dark:bg-[#181818]">
                    <div className="px-4 py-3 bg-gray-100 dark:bg-[#1f1f1f] border-b border-gray-200 dark:border-[#2a2a2a]">
                      <Skeleton className="h-5 w-3/4" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center mb-3">
                        <Skeleton className="h-8 w-8 rounded-sm" />
                        <Skeleton className="h-5 w-5 mx-2" />
                        <Skeleton className="h-8 w-8 rounded-sm" />
                      </div>
                      <Skeleton className="h-4 w-full mb-3" />
                      <Skeleton className="h-8 w-full rounded-sm" />
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {popularTemplates?.map((template) => (
                    <TemplateCard 
                      key={template.id}
                      template={template}
                    />
                  ))}
                </>
              )}
            </div>
            
            <div className="mt-6 text-center">
              <Link href="/templates" className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
                View all templates
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Activity Section */}
      <div className="py-4 px-6 pb-12">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Activity</h2>
        
        <div className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] shadow rounded-sm overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            {loadingHistories ? (
              <div className="space-y-8">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i} className="flex">
                    <Skeleton className="h-10 w-10 rounded-full mr-4" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <ActivityFeed 
                  activities={executionHistories || []}
                  automations={automations || []}
                  limit={4}
                />
                
                <div className="mt-6 text-center">
                  <Link href="/history" className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
                    View all activity
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
