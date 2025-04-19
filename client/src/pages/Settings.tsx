import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserIcon, ServerIcon, KeyIcon } from "lucide-react";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { GeneralSettings } from "@/components/settings/GeneralSettings";
import { AccountSettings } from "@/components/settings/AccountSettings";

export default function Settings() {
  return (
    <div className="container py-6 max-w-5xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          Configure your BRNOUT settings and account preferences
        </p>
      </header>

      <Tabs defaultValue="api-credentials" className="space-y-8">
        <TabsList className="grid grid-cols-3 w-full p-1 bg-gray-100 dark:bg-[#181818] border border-gray-200 dark:border-[#2a2a2a] rounded-sm">
          <TabsTrigger 
            value="api-credentials" 
            className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-[#0f0f0f] data-[state=active]:text-blue-500 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:rounded-none rounded-sm text-gray-800 dark:text-white transition-all"
          >
            <KeyIcon className="h-4 w-4" />
            API Credentials
          </TabsTrigger>
          <TabsTrigger 
            value="account" 
            className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-[#0f0f0f] data-[state=active]:text-blue-500 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:rounded-none rounded-sm text-gray-800 dark:text-white transition-all"
          >
            <UserIcon className="h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger 
            value="general" 
            className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-[#0f0f0f] data-[state=active]:text-blue-500 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:rounded-none rounded-sm text-gray-800 dark:text-white transition-all"
          >
            <ServerIcon className="h-4 w-4" />
            General
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api-credentials">
          <SettingsForm />
        </TabsContent>

        <TabsContent value="account">
          <AccountSettings />
        </TabsContent>

        <TabsContent value="general">
          <GeneralSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}