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
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize how BRNOUT looks on your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-base">Theme</Label>
            <p className="text-sm text-muted-foreground">
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
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <SunIcon className="mb-3 h-6 w-6" />
                  Light
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
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <MoonIcon className="mb-3 h-6 w-6" />
                  Dark
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
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <MonitorIcon className="mb-3 h-6 w-6" />
                  System
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>
      
      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Language & Region</CardTitle>
          <CardDescription>
            Set your preferred language and regional settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language" className="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="spanish">Spanish</SelectItem>
                <SelectItem value="french">French</SelectItem>
                <SelectItem value="german">German</SelectItem>
                <SelectItem value="japanese">Japanese</SelectItem>
                <SelectItem value="chinese">Chinese</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              More languages coming soon
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Application Behavior */}
      <Card>
        <CardHeader>
          <CardTitle>Application Behavior</CardTitle>
          <CardDescription>
            Configure how the application works for you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications">Desktop Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications when automations execute
              </p>
            </div>
            <Switch
              id="notifications"
              checked={notifications}
              onCheckedChange={handleNotificationsChange}
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-refresh">Auto Refresh Dashboard</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically refresh dashboard data
                </p>
              </div>
              <Switch
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={handleAutoRefreshChange}
              />
            </div>
            
            {autoRefresh && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="refresh-interval">Refresh Interval: {refreshInterval} minutes</Label>
                </div>
                <Slider
                  id="refresh-interval"
                  min={1}
                  max={60}
                  step={1}
                  value={[refreshInterval]}
                  onValueChange={handleRefreshIntervalChange}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
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