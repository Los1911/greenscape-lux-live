import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Share2, Gift, Users, DollarSign } from 'lucide-react';

interface Referral {
  id: string;
  referral_code: string;
  referred_email: string;
  status: string;
  reward_amount: number;
  created_at: string;
}

export const ReferralProgram: React.FC = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralCode, setReferralCode] = useState('');
  const [email, setEmail] = useState('');
  const [stats, setStats] = useState({
    totalReferrals: 0,
    completedReferrals: 0,
    totalEarnings: 0
  });

  useEffect(() => {
    loadReferrals();
    generateReferralCode();
  }, []);

  const generateReferralCode = () => {
    const code = 'REF' + Math.random().toString(36).substr(2, 8).toUpperCase();
    setReferralCode(code);
  };

  const loadReferrals = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const { data } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setReferrals(data);
      setStats({
        totalReferrals: data.length,
        completedReferrals: data.filter(r => r.status === 'completed').length,
        totalEarnings: data
          .filter(r => r.status === 'completed')
          .reduce((sum, r) => sum + r.reward_amount, 0)
      });
    }
  };

  const sendReferral = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user || !email) return;

    const { error } = await supabase
      .from('referrals')
      .insert([{
        referrer_id: user.user.id,
        referred_email: email,
        referral_code: referralCode
      }]);

    if (!error) {
      // Send referral email (would integrate with email service)
      alert(`Referral sent to ${email}!`);
      setEmail('');
      generateReferralCode();
      loadReferrals();
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/signup?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    alert('Referral link copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalReferrals}</p>
                <p className="text-sm text-gray-600">Total Referrals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Gift className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.completedReferrals}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">${stats.totalEarnings}</p>
                <p className="text-sm text-gray-600">Total Earnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Share2 className="h-5 w-5" />
            <span>Refer Friends & Earn $50</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800">How it works:</h3>
            <ol className="list-decimal list-inside text-sm text-green-700 mt-2 space-y-1">
              <li>Share your referral code with friends</li>
              <li>They sign up and complete their first job</li>
              <li>You both earn $50 credit!</li>
            </ol>
          </div>

          <div className="space-y-3">
            <div>
              <Label>Your Referral Code</Label>
              <div className="flex space-x-2">
                <Input value={referralCode} readOnly />
                <Button onClick={copyReferralLink} variant="outline">
                  Copy Link
                </Button>
              </div>
            </div>

            <div>
              <Label>Send Direct Referral</Label>
              <div className="flex space-x-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="friend@example.com"
                />
                <Button onClick={sendReferral}>Send Invite</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {referrals.map((referral) => (
              <div key={referral.id} className="flex justify-between items-center p-3 border rounded">
                <div>
                  <div className="font-medium">{referral.referred_email}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(referral.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={referral.status === 'completed' ? 'default' : 'secondary'}>
                    {referral.status}
                  </Badge>
                  {referral.status === 'completed' && (
                    <span className="text-green-600 font-semibold">
                      +${referral.reward_amount}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {referrals.length === 0 && (
              <p className="text-center text-gray-500 py-4">No referrals yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};