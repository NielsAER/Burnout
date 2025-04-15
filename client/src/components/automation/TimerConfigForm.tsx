import { FC, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TimerConfigFormProps {
  onSave: (config: TimerConfig) => void;
  initialConfig?: TimerConfig;
}

export interface TimerConfig {
  interval: number;
  unit: "minutes" | "hours";
}

const TimerConfigForm: FC<TimerConfigFormProps> = ({ onSave, initialConfig }) => {
  const [interval, setInterval] = useState<number>(initialConfig?.interval || 15);
  const [unit, setUnit] = useState<"minutes" | "hours">(initialConfig?.unit || "minutes");

  // Initialize timer config on component mount and when initialConfig changes
  useEffect(() => {
    if (initialConfig) {
      setInterval(initialConfig.interval);
      setUnit(initialConfig.unit);
    }
  }, [initialConfig]);

  // Validate input to ensure it's a positive number
  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setInterval(value);
    }
  };

  // Save timer config immediately when changes are made
  useEffect(() => {
    // Don't save on first render if no initialConfig
    if (interval && unit) {
      onSave({
        interval,
        unit
      });
    }
  }, [interval, unit, onSave]);

  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Timer Configuration</CardTitle>
        <CardDescription>Set up a recurring timer to run your automation</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interval">Interval</Label>
              <Input
                id="interval"
                type="number"
                min="1"
                value={interval}
                onChange={handleIntervalChange}
                placeholder="15"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select value={unit} onValueChange={(value: "minutes" | "hours") => setUnit(value)}>
                <SelectTrigger id="unit">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="pt-2 flex items-center text-sm">
            <div className="flex-1 text-gray-500">
              This automation will run every <span className="font-medium text-primary">{interval} {unit}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimerConfigForm;