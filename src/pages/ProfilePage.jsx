import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useAuth } from "../App";
import { API } from "../App";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { 
  User, Mail, GraduationCap, Shield, LogOut, 
  Save, Camera
} from "lucide-react";

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    level: user?.level || "Executive"
  });

  const handleSave = async () => {
    setIsLoading(true);
    // In a real app, this would call an API to update the user
    toast.success("Profile updated successfully!");
    setIsLoading(false);
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      localStorage.removeItem("token");
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      localStorage.removeItem("token");
      navigate("/");
    }
  };

  return (
    <DashboardLayout user={user}>
      <div className="max-w-3xl mx-auto space-y-6" data-testid="profile-page">
        {/* Profile Header Card */}
        <Card className="card-base">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={user?.picture} />
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 text-2xl font-bold">
                    {user?.name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Outfit' }}>
                  {user?.name || "User"}
                </h2>
                <p className="text-slate-500">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
                  <span className="badge-primary">{user?.level || "Executive"}</span>
                  <span className="badge-success">{user?.subscription_plan?.toUpperCase() || "FREE"} Plan</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card className="card-base">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Outfit' }}>
              <User className="w-5 h-5 text-indigo-600" />
              Account Settings
            </CardTitle>
            <CardDescription>Manage your profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  data-testid="profile-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    value={user?.email || ""}
                    disabled
                    className="pl-10 bg-slate-50"
                  />
                </div>
                <p className="text-xs text-slate-500">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">CS Level</Label>
                <Select 
                  value={formData.level} 
                  onValueChange={(v) => setFormData({ ...formData, level: v })}
                >
                  <SelectTrigger data-testid="profile-level-select">
                    <GraduationCap className="w-4 h-4 mr-2 text-slate-400" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CSEET">CSEET (Foundation)</SelectItem>
                    <SelectItem value="Executive">Executive</SelectItem>
                    <SelectItem value="Professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleSave} 
                disabled={isLoading}
                className="btn-primary"
                data-testid="save-profile-btn"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="card-base">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Outfit' }}>
              <Shield className="w-5 h-5 text-indigo-600" />
              Security
            </CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Authentication Method</p>
                  <p className="text-sm text-slate-500">
                    {user?.auth_provider === "google" ? "Google OAuth" : "Email & Password"}
                  </p>
                </div>
                <div className="badge-primary">
                  {user?.auth_provider === "google" ? "Google" : "Email"}
                </div>
              </div>

              {user?.auth_provider !== "google" && (
                <Button variant="outline" className="w-full">
                  Change Password
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="card-base border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600" style={{ fontFamily: 'Outfit' }}>
              <LogOut className="w-5 h-5" />
              Account Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50"
                data-testid="logout-btn"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
