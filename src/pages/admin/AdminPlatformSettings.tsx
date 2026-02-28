import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function AdminPlatformSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground text-sm">Global configuration for the NDIS platform</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">General</CardTitle>
          <CardDescription>Platform-wide settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Platform Name</Label>
            <Input defaultValue="NDIS Ops" />
          </div>
          <div className="grid gap-2">
            <Label>Support Email</Label>
            <Input defaultValue="support@ndisops.com.au" type="email" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Security</CardTitle>
          <CardDescription>Authentication and security policies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enforce MFA</Label>
              <p className="text-xs text-muted-foreground">Require multi-factor authentication for all users</p>
            </div>
            <Switch />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Allow Self-Registration</Label>
              <p className="text-xs text-muted-foreground">Let users sign up without an invitation</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Session Timeout (minutes)</Label>
              <p className="text-xs text-muted-foreground">Auto-logout after inactivity</p>
            </div>
            <Input className="w-24" type="number" defaultValue="60" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">NDIS Configuration</CardTitle>
          <CardDescription>NDIS-specific platform settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-validate NDIS Numbers</Label>
              <p className="text-xs text-muted-foreground">Validate participant NDIS numbers on entry</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Price Guide Auto-Update</Label>
              <p className="text-xs text-muted-foreground">Automatically pull latest NDIS price guide</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button>Save Settings</Button>
      </div>
    </div>
  );
}
