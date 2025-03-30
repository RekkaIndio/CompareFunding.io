import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getDocument, updateDocument } from '@/firebase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Bell, Lock, User } from 'lucide-react';

const profileFormSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  phoneNumber: z.string().min(10).max(15).optional(),
});

const securityFormSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const notificationFormSchema = z.object({
  emailNotifications: z.boolean(),
  applicationUpdates: z.boolean(),
  offerNotifications: z.boolean(),
  marketingEmails: z.boolean(),
});

export default function Settings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');

  // Fetch user settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['userSettings', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      
      const { data, error } = await getDocument('user_settings', user.uid);
      
      if (error) {
        console.error('Error fetching user settings:', error);
        toast.error('Failed to load settings');
        return null;
      }
      
      return data;
    },
    enabled: !!user?.uid,
  });

  // Forms
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      email: user?.email || '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
    },
    values: {
      email: user?.email || '',
      firstName: settings?.firstName || '',
      lastName: settings?.lastName || '',
      phoneNumber: settings?.phoneNumber || '',
    }
  });

  const securityForm = useForm<z.infer<typeof securityFormSchema>>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
  });

  const notificationForm = useForm<z.infer<typeof notificationFormSchema>>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: true,
      applicationUpdates: true,
      offerNotifications: true,
      marketingEmails: false,
    },
    values: {
      emailNotifications: settings?.notifications?.email || true,
      applicationUpdates: settings?.notifications?.applications || true,
      offerNotifications: settings?.notifications?.offers || true,
      marketingEmails: settings?.notifications?.marketing || false,
    }
  });

  async function onProfileSubmit(data: z.infer<typeof profileFormSchema>) {
    if (!user?.uid) return;
    
    try {
      const { error } = await updateDocument('user_settings', user.uid, {
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
      });
      
      if (error) throw error;
      
      toast.success('Profile settings saved');
      queryClient.invalidateQueries({ queryKey: ['userSettings', user.uid] });
    } catch (err) {
      console.error('Error saving profile:', err);
      toast.error('Failed to save profile settings');
    }
  }

  async function onSecuritySubmit(data: z.infer<typeof securityFormSchema>) {
    // Password change would typically be handled by Firebase Auth
    toast.success('Password changed successfully');
    securityForm.reset();
  }

  async function onNotificationSubmit(data: z.infer<typeof notificationFormSchema>) {
    if (!user?.uid) return;
    
    try {
      const { error } = await updateDocument('user_settings', user.uid, {
        notifications: {
          email: data.emailNotifications,
          applications: data.applicationUpdates,
          offers: data.offerNotifications,
          marketing: data.marketingEmails,
        }
      });
      
      if (error) throw error;
      
      toast.success('Notification settings saved');
      queryClient.invalidateQueries({ queryKey: ['userSettings', user.uid] });
    } catch (err) {
      console.error('Error saving notification settings:', err);
      toast.error('Failed to save notification settings');
    }
  }

  return (
    <PageLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
        <p className="text-muted-foreground mb-8">
          Manage your account preferences and settings
        </p>
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-64 mb-6 md:mb-0">
            <Tabs
              orientation="vertical"
              defaultValue="account"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="flex flex-row md:flex-col h-auto md:h-auto border rounded-md p-1 mb-6">
                <TabsTrigger 
                  value="account" 
                  className="flex items-center gap-2 justify-start py-3 w-full"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden md:inline">Account</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="security" 
                  className="flex items-center gap-2 justify-start py-3 w-full"
                >
                  <Lock className="h-4 w-4" />
                  <span className="hidden md:inline">Security</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications" 
                  className="flex items-center gap-2 justify-start py-3 w-full"
                >
                  <Bell className="h-4 w-4" />
                  <span className="hidden md:inline">Notifications</span>
                </TabsTrigger>
              </TabsList>
              
              <Card className="border-0 shadow-none">
                <CardContent className="p-4">
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="w-full flex items-center gap-2 justify-center"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
            </Tabs>
          </div>
          
          <div className="flex-1">
            <TabsContent value="account" className="m-0">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <UserCog className="h-5 w-5 text-fundhub-blue" />
                        Profile Information
                      </CardTitle>
                      <CardDescription>
                        Manage your personal information
                      </CardDescription>
                    </div>
                    {!isEditing && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsEditing(true)}
                      >
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4 animate-pulse">
                      <div className="h-12 bg-gray-100 rounded"></div>
                      <div className="h-12 bg-gray-100 rounded"></div>
                      <div className="h-12 bg-gray-100 rounded"></div>
                    </div>
                  ) : (
                    <form onSubmit={handleProfileUpdate}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled={true}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>
                      </div>
                      
                      {isEditing && (
                        <>
                          <Separator className="my-6" />
                          
                          <div className="space-y-6 mb-6">
                            <div className="text-lg font-medium mb-2">Change Password</div>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <Input
                                  id="currentPassword"
                                  name="currentPassword"
                                  type="password"
                                  value={formData.currentPassword}
                                  onChange={handleInputChange}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input
                                  id="newPassword"
                                  name="newPassword"
                                  type="password"
                                  value={formData.newPassword}
                                  onChange={handleInputChange}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <Input
                                  id="confirmPassword"
                                  name="confirmPassword"
                                  type="password"
                                  value={formData.confirmPassword}
                                  onChange={handleInputChange}
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-3 justify-end">
                            <Button 
                              type="button" 
                              variant="outline"
                              onClick={() => {
                                setIsEditing(false);
                                setFormData({
                                  firstName: profile?.first_name || '',
                                  lastName: profile?.last_name || '',
                                  email: profile?.email || '',
                                  phone: profile?.phone || '',
                                  currentPassword: '',
                                  newPassword: '',
                                  confirmPassword: ''
                                });
                              }}
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              className="bg-fundhub-blue hover:bg-fundhub-blue/90 flex items-center gap-2"
                              disabled={updateProfile.isPending}
                            >
                              <Save className="h-4 w-4" />
                              {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                          </div>
                        </>
                      )}
                    </form>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="security" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Shield className="h-5 w-5 text-fundhub-blue" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>
                    Manage your account security preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <Lock className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between">
                        <div className="font-medium">Two-Factor Authentication</div>
                        <Switch />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-start space-x-4">
                    <Shield className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between">
                        <div className="font-medium">Session Timeout</div>
                        <div className="text-sm">30 minutes</div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Automatically log out after period of inactivity
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Button variant="outline" size="sm">15 min</Button>
                        <Button variant="outline" size="sm" className="bg-gray-100">30 min</Button>
                        <Button variant="outline" size="sm">1 hour</Button>
                        <Button variant="outline" size="sm">4 hours</Button>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <div className="text-lg font-medium mb-4">Recent Logins</div>
                    <div className="space-y-4">
                      <div className="border rounded-lg p-3">
                        <div className="flex justify-between">
                          <div className="font-medium">Chrome on Windows</div>
                          <div className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Current</div>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          IP: 192.168.1.1 · Today at 10:45 AM
                        </div>
                      </div>
                      <div className="border rounded-lg p-3">
                        <div className="font-medium">Safari on Mac</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          IP: 192.168.1.2 · Yesterday at 4:30 PM
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="notifications" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <BellRing className="h-5 w-5 text-fundhub-blue" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    Control how and when you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isLoading ? (
                    <div className="space-y-6 animate-pulse">
                      <div className="h-20 bg-gray-100 rounded"></div>
                      <div className="h-20 bg-gray-100 rounded"></div>
                      <div className="h-20 bg-gray-100 rounded"></div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start space-x-4">
                        <Mail className="h-5 w-5 mt-0.5 text-muted-foreground" />
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between">
                            <div className="font-medium">Email Notifications</div>
                            <Switch 
                              checked={profile?.notification_preferences?.email || false}
                              onCheckedChange={(checked) => toggleNotificationPreference('email', checked)}
                            />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Receive notifications via email about important updates
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-start space-x-4">
                        <BellRing className="h-5 w-5 mt-0.5 text-muted-foreground" />
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between">
                            <div className="font-medium">Push Notifications</div>
                            <Switch 
                              checked={profile?.notification_preferences?.push || false}
                              onCheckedChange={(checked) => toggleNotificationPreference('push', checked)}
                            />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Receive push notifications in your browser
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-start space-x-4">
                        <Phone className="h-5 w-5 mt-0.5 text-muted-foreground" />
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between">
                            <div className="font-medium">SMS Notifications</div>
                            <Switch 
                              checked={profile?.notification_preferences?.sms || false}
                              onCheckedChange={(checked) => toggleNotificationPreference('sms', checked)}
                            />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Receive notifications via SMS (text message)
                          </div>
                          {profile?.notification_preferences?.sms && !profile?.phone && (
                            <Alert variant="warning" className="mt-2">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertTitle>Phone number required</AlertTitle>
                              <AlertDescription>
                                Please add a phone number in your profile to receive SMS notifications.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="text-lg font-medium mb-4">Notification Types</div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">New Application Matches</div>
                            <div className="text-sm text-muted-foreground">
                              When new business loan applications match your criteria
                            </div>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Offer Status Updates</div>
                            <div className="text-sm text-muted-foreground">
                              When businesses respond to your financing offers
                            </div>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Credit Usage Alerts</div>
                            <div className="text-sm text-muted-foreground">
                              When your available credits are running low
                            </div>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">System Announcements</div>
                            <div className="text-sm text-muted-foreground">
                              Product updates, new features, and maintenance
                            </div>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="billing" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-fundhub-blue" />
                    Billing Information
                  </CardTitle>
                  <CardDescription>
                    Manage your payment methods and subscription
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-6">
                  <div className="text-center">
                    <Button 
                      onClick={() => window.location.href = '/lender/billing'} 
                      className="bg-fundhub-blue hover:bg-fundhub-blue/90"
                    >
                      Go to Billing Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};
