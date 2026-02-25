import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Building2, Shield, CheckCircle2, Edit3, MapPin, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StandardizedButton } from '@/components/ui/standardized-button';
import { supabase } from '@/lib/supabase';
import { isUUID } from '@/lib/isUUID';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { BadgesSection } from '@/components/landscaper/BadgesSection';

interface ClientProfileData {
  clientName: string;
  type: 'client';
}

interface LandscaperProfileData {
  name: string;
  email: string;
  businessName?: string;
  phone?: string;
  bio: string;
  serviceArea: string;
  insuranceStatus: "verified" | "pending" | "expired";
  type: 'landscaper';
  landscaperId?: string;
}

type ProfileData = ClientProfileData | LandscaperProfileData;

interface ProfileCardProps {
  profile: ProfileData;
  loading?: boolean;
  showBadges?: boolean;
}

export default function ProfileCard({ profile, loading = false, showBadges = true }: ProfileCardProps) {
  const [verificationStatus, setVerificationStatus] = useState<"verified" | "pending" | "expired">("pending");
  const [landscaperId, setLandscaperId] = useState<string | null>(null);

  useEffect(() => {
    if (profile.type === 'landscaper') {
      fetchVerificationStatus();
    }
  }, [profile]);

  const fetchVerificationStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isUUID(user.id)) return;

      const { data: landscaper } = await supabase
        .from('v_landscapers')
        .select('id, insurance_status, insurance_expiry')
        .eq('id', user.id)
        .single();

      if (landscaper?.id) {
        setLandscaperId(landscaper.id);
      }

      if (landscaper?.insurance_status) {
        if (landscaper.insurance_expiry && new Date(landscaper.insurance_expiry) < new Date()) {
          setVerificationStatus("expired");
        } else {
          setVerificationStatus(landscaper.insurance_status);
        }
      }
    } catch (error) {
      console.error('Error fetching verification status:', error);
    }
  };

  if (loading) {
    return (
      <Card className="bg-black/60 backdrop-blur border border-green-500/25 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-green-400 flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (profile.type === 'client') {
    const { percentage } = useProfileCompletion();
    const getInitials = (name: string) => {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
      <Card className="bg-black/60 backdrop-blur border border-green-500/25 rounded-2xl ring-1 ring-green-500/20 shadow-[0_0_25px_-10px_rgba(34,197,94,0.25)]">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-semibold text-green-300">My Profile</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                <span className="text-white font-bold text-sm">{getInitials(profile.clientName)}</span>
              </div>
              <div>
                <div className="font-medium text-white">{profile.clientName}</div>
                <div className="text-xs text-gray-400">Premium Client</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Profile Complete</span>
                <span className="text-xs text-green-400">{percentage}%</span>
              </div>
              <Progress value={percentage} className="h-2 bg-gray-800" />
            </div>

            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-gray-300">Account Verified</span>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Landscaper profile
  const getInsuranceBadge = (status: string) => {
    const variants = {
      verified: "bg-green-500/20 text-green-400 border-green-500",
      pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500",
      expired: "bg-red-500/20 text-red-400 border-red-500"
    };
    const labels = { verified: "Verified", pending: "Pending", expired: "Expired" };
    return (
      <Badge className={`${variants[status as keyof typeof variants]} border`}>
        <Shield className="w-3 h-3 mr-1" />
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  // Get landscaper ID from profile or state
  const effectiveLandscaperId = (profile as LandscaperProfileData).landscaperId || landscaperId;

  return (
    <Card className="bg-black border-green-500 shadow-lg shadow-green-500/20">
      <CardHeader>
        <CardTitle className="text-green-400 flex items-center gap-2">
          <User className="w-5 h-5" />
          Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">{profile.name}</h3>
            {getInsuranceBadge(verificationStatus)}
          </div>
          <div className="space-y-2 mt-2">
            <div className="flex items-center gap-2 text-gray-300">
              <Mail className="w-4 h-4 text-green-400" />
              <span className="text-sm">{profile.email}</span>
            </div>
            {profile.businessName && (
              <div className="flex items-center gap-2 text-gray-300">
                <Building2 className="w-4 h-4 text-green-400" />
                <span className="text-sm">{profile.businessName}</span>
              </div>
            )}
            {profile.phone && (
              <div className="flex items-center gap-2 text-gray-300">
                <Phone className="w-4 h-4 text-green-400" />
                <span className="text-sm">{profile.phone}</span>
              </div>
            )}
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-300 mb-2">{profile.bio}</p>
          <p className="text-sm text-green-400">Service Area: {profile.serviceArea}</p>
        </div>
        
        {/* Compact Badges Display */}
        {showBadges && effectiveLandscaperId && (
          <div className="pt-3 border-t border-green-500/20">
            <BadgesSection landscaperId={effectiveLandscaperId} compact={true} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
