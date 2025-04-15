import { FC, useState } from "react";
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

  // Validate input to ensure it's a positive number
  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setInterval(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      interval,
      unit
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Timer Configuration</CardTitle>
        <CardDescription>Set up a recurring timer to run your automation</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          
          <div className="pt-2">
            <Button type="submit" className="w-full">Save Timer Config</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default TimerConfigForm;