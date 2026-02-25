import { useState } from "react";
import { Building2, Palette, Users, Shield, Link2, CreditCard, FileText, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const roles = [
  { name: "Tenant Admin", users: 2, permissions: "Full access", builtin: true },
  { name: "Finance Admin", users: 3, permissions: "Invoices, payments, budgets, reports", builtin: true },
  { name: "Plan Manager", users: 8, permissions: "Participants, plans, invoices, providers", builtin: true },
  { name: "Support Coordinator", users: 5, permissions: "Participants, tasks, notes, goals", builtin: true },
  { name: "Approver", users: 4, permissions: "Invoice approval, payment release", builtin: true },
  { name: "Read-Only Auditor", users: 1, permissions: "Read access to all modules", builtin: true },
  { name: "Claims Specialist", users: 2, permissions: "Invoices, price guide, claims prep", builtin: false },
];

const integrations = [
  { name: "Xero", category: "Accounting", status: "connected", description: "Sync invoices and payments" },
  { name: "MYOB", category: "Accounting", status: "available", description: "Push financial data" },
  { name: "Microsoft 365", category: "Productivity", status: "connected", description: "SSO via Entra ID" },
  { name: "Slack", category: "Communication", status: "connected", description: "Notifications and alerts" },
  { name: "Power Automate", category: "Automation", status: "connected", description: "Workflow triggers" },
  { name: "Stripe", category: "Payments", status: "available", description: "Subscription billing" },
];

export default function Settings() {
  const [tab, setTab] = useState("organisation");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Tenant configuration, branding, workflows, permissions, and integrations.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="organisation"><Building2 className="mr-1.5 h-3.5 w-3.5" />Organisation</TabsTrigger>
          <TabsTrigger value="branding"><Palette className="mr-1.5 h-3.5 w-3.5" />Branding</TabsTrigger>
          <TabsTrigger value="roles"><Shield className="mr-1.5 h-3.5 w-3.5" />Roles & Permissions</TabsTrigger>
          <TabsTrigger value="workflows"><FileText className="mr-1.5 h-3.5 w-3.5" />Workflows</TabsTrigger>
          <TabsTrigger value="integrations"><Link2 className="mr-1.5 h-3.5 w-3.5" />Integrations</TabsTrigger>
          <TabsTrigger value="billing"><CreditCard className="mr-1.5 h-3.5 w-3.5" />Billing</TabsTrigger>
        </TabsList>

        {/* Organisation */}
        <TabsContent value="organisation">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Organisation Profile</CardTitle>
              <CardDescription>Manage your organisation's identity and contact information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Organisation Name</Label>
                  <Input defaultValue="Acme Plan Managers" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">ABN</Label>
                  <Input defaultValue="12 345 678 901" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Primary Contact Email</Label>
                  <Input defaultValue="admin@acme-pm.com.au" type="email" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Phone</Label>
                  <Input defaultValue="+61 2 9876 5432" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Address</Label>
                  <Input defaultValue="Level 4, 100 George St, Sydney NSW 2000" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button size="sm"><Save className="mr-1.5 h-3.5 w-3.5" />Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Branding & Appearance</CardTitle>
              <CardDescription>Customise the look of participant-facing documents and portals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Primary Colour</Label>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-md bg-primary border" />
                    <Input defaultValue="#1E3A5F" className="flex-1" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Accent Colour</Label>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-md bg-accent border" />
                    <Input defaultValue="#1A9E8F" className="flex-1" />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-1.5">
                <Label className="text-xs">Statement Header Template</Label>
                <Select defaultValue="standard">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard — Logo + Org Details</SelectItem>
                    <SelectItem value="minimal">Minimal — Logo Only</SelectItem>
                    <SelectItem value="detailed">Detailed — Full Letterhead</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end">
                <Button size="sm"><Save className="mr-1.5 h-3.5 w-3.5" />Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles */}
        <TabsContent value="roles">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Roles & Permissions</CardTitle>
                <CardDescription>Manage security roles and permission bundles for your organisation.</CardDescription>
              </div>
              <Button size="sm" variant="outline"><Shield className="mr-1.5 h-3.5 w-3.5" />Create Custom Role</Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {roles.map((role) => (
                  <div key={role.name} className="flex items-center justify-between px-6 py-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{role.name}</p>
                        {role.builtin ? (
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5">Built-in</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-accent/10 text-accent border-accent/20">Custom</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{role.permissions}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{role.users}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs h-7">Edit</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflows */}
        <TabsContent value="workflows">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Invoice Approval Rules</CardTitle>
                <CardDescription>Configure when invoices require manual approval.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Auto-approve threshold</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">$</span>
                      <Input defaultValue="2000" type="number" />
                    </div>
                    <p className="text-[11px] text-muted-foreground">Invoices above this amount require manual approval</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">High-value threshold (2-person approval)</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">$</span>
                      <Input defaultValue="5000" type="number" />
                    </div>
                    <p className="text-[11px] text-muted-foreground">Requires two approvers (segregation of duties)</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Participant approval</p>
                      <p className="text-xs text-muted-foreground">Require participant to approve invoices before processing</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Price limit breach auto-hold</p>
                      <p className="text-xs text-muted-foreground">Automatically flag invoices exceeding NDIS price limits</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Duplicate detection</p>
                      <p className="text-xs text-muted-foreground">Block near-duplicate invoices from the same provider</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Payment Run Settings</CardTitle>
                <CardDescription>Configure payment batching and release rules.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Creator ≠ Approver enforcement</p>
                    <p className="text-xs text-muted-foreground">Payment run creator cannot also approve release</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Default payment schedule</Label>
                  <Select defaultValue="weekly">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly (Tuesday)</SelectItem>
                      <SelectItem value="fortnightly">Fortnightly</SelectItem>
                      <SelectItem value="manual">Manual Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations">
          <div className="grid grid-cols-2 gap-4">
            {integrations.map((intg) => (
              <Card key={intg.name}>
                <CardContent className="flex items-center gap-4 py-4 px-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-sm font-bold text-muted-foreground">
                    {intg.name.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{intg.name}</p>
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5">{intg.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{intg.description}</p>
                  </div>
                  {intg.status === "connected" ? (
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">Connected</Badge>
                  ) : (
                    <Button variant="outline" size="sm" className="text-xs h-7">Connect</Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Billing */}
        <TabsContent value="billing">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Current Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold">Professional</p>
                    <p className="text-sm text-muted-foreground">$299/mo base + $12/seat + $0.50/invoice</p>
                  </div>
                  <Button variant="outline" size="sm">Upgrade Plan</Button>
                </div>
                <Separator className="my-4" />
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Seats Used</p>
                    <p className="text-lg font-semibold">18 <span className="text-xs font-normal text-muted-foreground">/ 25</span></p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Invoices This Month</p>
                    <p className="text-lg font-semibold">847</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Next Invoice</p>
                    <p className="text-lg font-semibold">$1,039.50</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Add-ons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Advanced OCR Pack</p>
                    <p className="text-xs text-muted-foreground">AI-powered invoice extraction with document understanding</p>
                  </div>
                  <Badge className="bg-success/10 text-success border-success/20" variant="outline">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Automation Pack</p>
                    <p className="text-xs text-muted-foreground">Unlimited webhook endpoints and email connectors</p>
                  </div>
                  <Badge className="bg-success/10 text-success border-success/20" variant="outline">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Premium Integrations</p>
                    <p className="text-xs text-muted-foreground">Xero, MYOB, Power Automate connectors</p>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs h-7">Add — $49/mo</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
