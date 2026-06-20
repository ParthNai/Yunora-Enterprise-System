import { useState, useEffect } from "react";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Globe, Phone, Settings as SettingsIcon, Share2, CreditCard, Map } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/image-upload";

export default function Settings() {
  const { data: settings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const { toast } = useToast();
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const set = (key: string, value: any) => setForm((prev: any) => ({ ...prev, [key]: value }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate({ data: form }, {
      onSuccess: () => toast({ title: "Settings saved successfully" }),
      onError: () => toast({ title: "Failed to save settings", variant: "destructive" }),
    });
  };

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid md:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Site Settings</h1>
        <p className="text-muted-foreground">Configure your store's global settings — changes apply instantly to the live website.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Tabs defaultValue="general">
          <TabsList className="mb-4">
            <TabsTrigger value="general"><Globe className="h-3.5 w-3.5 mr-1.5" />General</TabsTrigger>
            <TabsTrigger value="contact"><Phone className="h-3.5 w-3.5 mr-1.5" />Contact</TabsTrigger>
            <TabsTrigger value="social"><Share2 className="h-3.5 w-3.5 mr-1.5" />Social Media</TabsTrigger>
            <TabsTrigger value="payments"><CreditCard className="h-3.5 w-3.5 mr-1.5" />Payments</TabsTrigger>
            <TabsTrigger value="controls"><SettingsIcon className="h-3.5 w-3.5 mr-1.5" />Controls</TabsTrigger>
          </TabsList>

          {/* ── GENERAL ── */}
          <TabsContent value="general">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Globe className="h-4 w-4 text-primary" /> Store Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label>Store Name</Label><Input value={form.siteName || form.storeName || ""} onChange={e => set("siteName", e.target.value)} placeholder="Yunora Furnishings" /></div>
                  <div className="space-y-2"><Label>Store Tagline</Label><Input value={form.tagline || ""} onChange={e => set("tagline", e.target.value)} placeholder="Crafted for Living" /></div>
                  <div className="space-y-2"><Label>Website URL</Label><Input value={form.websiteUrl || ""} onChange={e => set("websiteUrl", e.target.value)} placeholder="https://yunora.in" /></div>
                  <div className="space-y-2"><Label>GST Number</Label><Input value={form.gstNumber || ""} onChange={e => set("gstNumber", e.target.value)} placeholder="27AABCU9603R1ZX" /></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Globe className="h-4 w-4 text-primary" /> SEO & Meta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label>Meta Title</Label><Input value={form.metaTitle || ""} onChange={e => set("metaTitle", e.target.value)} placeholder="Yunora Furnishings — Premium Furniture" /></div>
                  <div className="space-y-2"><Label>Meta Description</Label><Input value={form.metaDescription || ""} onChange={e => set("metaDescription", e.target.value)} placeholder="Luxury furniture for modern Indian homes" /></div>
                  <ImageUpload
                    label="Logo"
                    value={form.logoUrl || ""}
                    onChange={url => set("logoUrl", url)}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── CONTACT ── */}
          <TabsContent value="contact">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Phone className="h-4 w-4 text-primary" /> Contact Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label>Support Email</Label><Input type="email" value={form.email || form.supportEmail || ""} onChange={e => set("email", e.target.value)} placeholder="support@yunora.in" /></div>
                  <div className="space-y-2"><Label>Support Phone</Label><Input value={form.phone || form.supportPhone || ""} onChange={e => set("phone", e.target.value)} placeholder="+91 98765 43210" /></div>
                  <div className="space-y-2"><Label>WhatsApp Number</Label><Input value={form.whatsapp || form.whatsappNumber || ""} onChange={e => set("whatsapp", e.target.value)} placeholder="+91 98765 43210" /></div>
                  <div className="space-y-2"><Label>Business Address</Label><Input value={form.address || ""} onChange={e => set("address", e.target.value)} placeholder="Mumbai, Maharashtra, India" /></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Map className="h-4 w-4 text-primary" /> Google Maps
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Google Maps Embed URL</Label>
                    <Input
                      value={form.googleMapsEmbed || ""}
                      onChange={e => set("googleMapsEmbed", e.target.value)}
                      placeholder="https://www.google.com/maps/embed?pb=..."
                    />
                    <p className="text-xs text-muted-foreground">Paste the embed URL from Google Maps → Share → Embed a map.</p>
                  </div>
                  {form.googleMapsEmbed && (
                    <div className="rounded-md overflow-hidden border border-border">
                      <iframe
                        src={form.googleMapsEmbed}
                        width="100%"
                        height="200"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Store location"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── SOCIAL MEDIA ── */}
          <TabsContent value="social">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Share2 className="h-4 w-4 text-primary" /> Social Media Links
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {([
                    ["facebook", "Facebook", "https://facebook.com/yunora"],
                    ["instagram", "Instagram", "https://instagram.com/yunora"],
                    ["youtube", "YouTube", "https://youtube.com/@yunora"],
                    ["linkedin", "LinkedIn", "https://linkedin.com/company/yunora"],
                    ["twitter", "Twitter / X", "https://x.com/yunora"],
                    ["pinterest", "Pinterest", "https://pinterest.com/yunora"],
                  ] as [string, string, string][]).map(([key, label, placeholder]) => (
                    <div key={key} className="space-y-2">
                      <Label>{label}</Label>
                      <Input
                        value={form[key] || ""}
                        onChange={e => set(key, e.target.value)}
                        placeholder={placeholder}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── PAYMENTS ── */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4 text-primary" /> Razorpay Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md bg-orange-50 border border-orange-200 p-3 text-sm text-orange-800">
                  These keys are stored securely in your database. Use your Razorpay Dashboard to get your API keys. Test keys start with <code>rzp_test_</code>.
                </div>
                <div className="space-y-2">
                  <Label>Razorpay Key ID</Label>
                  <Input
                    value={form.razorpayKeyId || ""}
                    onChange={e => set("razorpayKeyId", e.target.value)}
                    placeholder="rzp_test_xxxxxxxxxxxxxxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Razorpay Key Secret</Label>
                  <Input
                    type="password"
                    value={form.razorpayKeySecret || ""}
                    onChange={e => set("razorpayKeySecret", e.target.value)}
                    placeholder="••••••••••••••••"
                  />
                </div>

                <div className="pt-4 border-t space-y-4">
                  <p className="text-sm font-medium text-muted-foreground">Payment Options</p>
                  {([
                    ["codEnabled", "Cash on Delivery", "Enable COD payment option"],
                    ["razorpayEnabled", "Razorpay Online Payment", "Enable card/UPI/netbanking payments"],
                  ] as [string, string, string][]).map(([key, label, desc]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                      <Switch checked={!!form[key]} onCheckedChange={v => set(key, v)} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── CONTROLS ── */}
          <TabsContent value="controls">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <SettingsIcon className="h-4 w-4 text-primary" /> Store Controls
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {([
                    ["maintenanceMode", "Maintenance Mode", "Temporarily take the site offline"],
                    ["allowReviews", "Allow Reviews", "Let customers post product reviews"],
                    ["allowDealerRegistration", "Dealer Registration", "Allow new dealers to apply"],
                  ] as [string, string, string][]).map(([key, label, desc]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                      <Switch checked={!!form[key]} onCheckedChange={v => set(key, v)} />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <SettingsIcon className="h-4 w-4 text-primary" /> Shipping & Orders
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Free Shipping Threshold (₹)</Label>
                    <Input type="number" value={form.freeShippingThreshold || ""} onChange={e => set("freeShippingThreshold", e.target.value)} placeholder="50000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Min Order Amount (₹)</Label>
                    <Input type="number" value={form.minOrderAmount || ""} onChange={e => set("minOrderAmount", e.target.value)} placeholder="1000" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <Button type="submit" disabled={updateSettings.isPending} className="w-full sm:w-auto">
          <Save className="mr-2 h-4 w-4" />
          {updateSettings.isPending ? "Saving..." : "Save All Settings"}
        </Button>
      </form>
    </div>
  );
}
