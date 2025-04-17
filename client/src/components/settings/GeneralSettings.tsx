import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SunIcon, MoonIcon, MonitorIcon, GlobeIcon, LanguagesIcon, RefreshCcwIcon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useState } from "react";

export function GeneralSettings() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [language, setLanguage] = useState("english");
  const [notifications, setNotifications] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5); // minutes
  
  const handleAutoRefreshChange = (checked: boolean) => {
    setAutoRefresh(checked);
  };
  
  const handleNotificationsChange = (checked: boolean) => {
    setNotifications(checked);
  };
  
  const handleRefreshIntervalChange = (value: number[]) => {
    setRefreshInterval(value[0]);
  };
  
  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Theme Settings */}
      <Card className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-sm">
        <CardHeader>
          <CardTitle className="text-white">Appearance</CardTitle>
          <CardDescription className="text-gray-400">
            Customize how BRNOUT looks on your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-base">Theme</Label>
            <p className="text-sm text-gray-400">
              Select the theme for the dashboard
            </p>
            <RadioGroup
              defaultValue={theme}
              onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}
              className="grid grid-cols-3 gap-4 pt-2"
            >
              <div>
                <RadioGroupItem
                  value="light"
                  id="theme-light"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="theme-light"
                  className="flex flex-col items-center justify-between rounded-sm border-2 border-[#2a2a2a] bg-[#181818] p-4 hover:bg-[#2a2a2a] peer-data-[state=checked]:border-blue-600 [&:has([data-state=checked])]:border-blue-600 cursor-pointer transition-all"
                >
                  <SunIcon className="mb-3 h-6 w-6 text-white" />
                  <span className="text-white">Light</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="dark"
                  id="theme-dark"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="theme-dark"
                  className="flex flex-col items-center justify-between rounded-sm border-2 border-[#2a2a2a] bg-[#181818] p-4 hover:bg-[#2a2a2a] peer-data-[state=checked]:border-blue-600 [&:has([data-state=checked])]:border-blue-600 cursor-pointer transition-all"
                >
                  <MoonIcon className="mb-3 h-6 w-6 text-white" />
                  <span className="text-white">Dark</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="system"
                  id="theme-system"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="theme-system"
                  className="flex flex-col items-center justify-between rounded-sm border-2 border-[#2a2a2a] bg-[#181818] p-4 hover:bg-[#2a2a2a] peer-data-[state=checked]:border-blue-600 [&:has([data-state=checked])]:border-blue-600 cursor-pointer transition-all"
                >
                  <MonitorIcon className="mb-3 h-6 w-6 text-white" />
                  <span className="text-white">System</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>
      
      {/* Language Settings */}
      <Card className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-sm">
        <CardHeader>
          <CardTitle className="text-white">Language & Region</CardTitle>
          <CardDescription className="text-gray-400">
            Set your preferred language and regional settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="language" className="text-white">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language" className="w-full bg-[#181818] border-[#2a2a2a] text-white rounded-sm focus:ring-blue-600 focus:ring-offset-0">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent className="bg-[#181818] border-[#2a2a2a] text-white rounded-sm">
                <SelectItem value="english" className="focus:bg-[#2a2a2a] focus:text-white">English</SelectItem>
                <SelectItem value="spanish" className="focus:bg-[#2a2a2a] focus:text-white">Spanish</SelectItem>
                <SelectItem value="french" className="focus:bg-[#2a2a2a] focus:text-white">French</SelectItem>
                <SelectItem value="german" className="focus:bg-[#2a2a2a] focus:text-white">German</SelectItem>
                <SelectItem value="japanese" className="focus:bg-[#2a2a2a] focus:text-white">Japanese</SelectItem>
                <SelectItem value="chinese" className="focus:bg-[#2a2a2a] focus:text-white">Chinese</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              More languages coming soon
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Application Behavior */}
      <Card className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-sm">
        <CardHeader>
          <CardTitle className="text-white">Application Behavior</CardTitle>
          <CardDescription className="text-gray-400">
            Configure how the application works for you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications" className="text-white">Desktop Notifications</Label>
              <p className="text-sm text-gray-400">
                Receive notifications when automations execute
              </p>
            </div>
            <Switch
              id="notifications"
              checked={notifications}
              onCheckedChange={handleNotificationsChange}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-refresh" className="text-white">Auto Refresh Dashboard</Label>
                <p className="text-sm text-gray-400">
                  Automatically refresh dashboard data
                </p>
              </div>
              <Switch
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={handleAutoRefreshChange}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
            
            {autoRefresh && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="refresh-interval" className="text-white">Refresh Interval: {refreshInterval} minutes</Label>
                </div>
                <Slider
                  id="refresh-interval"
                  min={1}
                  max={60}
                  step={1}
                  value={[refreshInterval]}
                  onValueChange={handleRefreshIntervalChange}
                  className="[&>[role=slider]]:bg-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1 min</span>
                  <span>15 min</span>
                  <span>30 min</span>
                  <span>60 min</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}