import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserIcon, ServerIcon, KeyIcon } from "lucide-react";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { GeneralSettings } from "@/components/settings/GeneralSettings";
import { AccountSettings } from "@/components/settings/AccountSettings";

export default function Settings() {
  return (
    <div className="container py-6 max-w-5xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-muted-foreground text-lg">
          Configure your BRNOUT settings and account preferences
        </p>
      </header>

      <Tabs defaultValue="api-credentials" className="space-y-8">
        <TabsList className="grid grid-cols-3 max-w-lg">
          <TabsTrigger value="api-credentials" className="flex items-center gap-2">
            <KeyIcon className="h-4 w-4" />
            API Credentials
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
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