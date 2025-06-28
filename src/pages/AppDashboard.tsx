
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import UserOnboarding from "@/components/UserOnboarding";
import UserDashboard from "./UserDashboard";
import VendorDashboard from "./VendorDashboard";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

const AppDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, needsOnboarding } = useUserProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  if (needsOnboarding) {
    return <UserOnboarding onComplete={() => window.location.reload()} />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Loading your profile...</h2>
          <Loader2 className="h-6 w-6 animate-spin text-orange-500 mx-auto mt-2" />
        </div>
      </div>
    );
  }

  return profile.role === 'customer' ? <UserDashboard /> : <VendorDashboard />;
};

export default AppDashboard;
