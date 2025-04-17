import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { User, Save, UploadCloud, User2, Building2, Mail, AtSign } from "lucide-react";

export function AccountSettings() {
  const { user } = useAuth();
  
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [companyName, setCompanyName] = useState(user?.companyName || "");
  const [vatNumber, setVatNumber] = useState(user?.vatNumber || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Function to handle profile update
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    // In a real implementation, this would call an API
    setTimeout(() => {
      // Simulating API call completion
      setIsSubmitting(false);
    }, 1000);
  };
  
  // Function to get user's initials for avatar fallback
  const getUserInitials = () => {
    if (user?.fullName) {
      return user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
    }
    
    return user?.username?.substring(0, 2).toUpperCase() || "U";
  };
  
  return (
    <div className="grid grid-cols-1 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your account's profile information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user?.avatarUrl || ""} alt={user?.username || "User"} />
                <AvatarFallback className="text-lg">{getUserInitials()}</AvatarFallback>
              </Avatar>
              
              <Button type="button" variant="outline" className="h-10">
                <UploadCloud className="mr-2 h-4 w-4" />
                Change Avatar
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">
                  <span className="flex items-center gap-2">
                    <AtSign className="h-4 w-4" />
                    Username
                  </span>
                </Label>
                <Input
                  id="username"
                  value={user?.username || ""}
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Your username cannot be changed
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="full-name">
                  <span className="flex items-center gap-2">
                    <User2 className="h-4 w-4" />
                    Full Name
                  </span>
                </Label>
                <Input
                  id="full-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company-name">
                  <span className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Company Name
                  </span>
                </Label>
                <Input
                  id="company-name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter your company name"
                />
              </div>
              
              <div className="space-y-2 col-span-2">
                <Label htmlFor="vat-number">VAT Number (Optional)</Label>
                <Input
                  id="vat-number"
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value)}
                  placeholder="Enter your VAT number"
                />
              </div>
              
              <div className="space-y-2 col-span-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Write a short bio about yourself"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Brief description for your profile
                </p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>
            Manage your account's security settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Security settings will be available in a future update, including:
          </p>
          <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground">
            <li>Password changes</li>
            <li>Two-factor authentication</li>
            <li>Login session management</li>
            <li>Account recovery options</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}