/**
 * TestUserManager - Admin tool for managing test users
 * 
 * Provides proper user deletion via Supabase Auth Admin API
 * and tracks deleted emails for cooldown enforcement.
 * 
 * IMPORTANT: This component should only be used in development/testing.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Trash2, RefreshCw, Info, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { addEmailToCooldown, clearEmailCooldowns, isEmailInCooldown } from '@/lib/authErrorHandler';

const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';

interface DeleteResult {
  success: boolean;
  message: string;
  userId?: string;
  email?: string;
}

export default function TestUserManager() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DeleteResult | null>(null);
  const [lookupResult, setLookupResult] = useState<any>(null);

  // Look up user by email
  const handleLookup = async () => {
    if (!email) return;
    
    setLoading(true);
    setResult(null);
    setLookupResult(null);
    
    try {
      // Check users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, role, created_at')
        .eq('email', email.toLowerCase())
        .maybeSingle();
      
      // Check clients table
      const { data: clientData } = await supabase
        .from('clients')
        .select('id, email, first_name, last_name')
        .eq('email', email.toLowerCase())
        .maybeSingle();
      
      // Check landscapers table
      const { data: landscaperData } = await supabase
        .from('landscapers')
        .select('id, email, first_name, last_name, approved')
        .eq('email', email.toLowerCase())
        .maybeSingle();
      
      // Check cooldown status
      const cooldownStatus = isEmailInCooldown(email);
      
      setLookupResult({
        user: userData,
        client: clientData,
        landscaper: landscaperData,
        cooldown: cooldownStatus,
        error: userError?.message
      });
    } catch (err: any) {
      setResult({
        success: false,
        message: `Lookup failed: ${err.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete user (profile records only - Auth deletion requires server-side)
  const handleDeleteProfile = async () => {
    if (!email) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      const emailLower = email.toLowerCase();
      
      // Delete from clients table
      const { error: clientError } = await supabase
        .from('clients')
        .delete()
        .eq('email', emailLower);
      
      // Delete from landscapers table
      const { error: landscaperError } = await supabase
        .from('landscapers')
        .delete()
        .eq('email', emailLower);
      
      // Delete from users table
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('email', emailLower);
      
      // Add to cooldown list
      addEmailToCooldown(emailLower);
      
      if (userError && clientError && landscaperError) {
        setResult({
          success: false,
          message: 'No records found to delete',
          email: emailLower
        });
      } else {
        setResult({
          success: true,
          message: `Profile records deleted. Email added to 5-minute cooldown. NOTE: Auth record may still exist - use Supabase Dashboard to fully delete.`,
          email: emailLower
        });
      }
      
      // Refresh lookup
      await handleLookup();
    } catch (err: any) {
      setResult({
        success: false,
        message: `Delete failed: ${err.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  // Clear all cooldowns
  const handleClearCooldowns = () => {
    clearEmailCooldowns();
    setResult({
      success: true,
      message: 'All email cooldowns cleared'
    });
    if (lookupResult) {
      setLookupResult({
        ...lookupResult,
        cooldown: { inCooldown: false, remainingMinutes: 0 }
      });
    }
  };

  if (!isDev) {
    return (
      <Card className="bg-gray-900/50 border-red-500/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>Test User Manager is only available in development mode</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/50 border-emerald-500/30">
      <CardHeader>
        <CardTitle className="text-emerald-300 flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          Test User Manager
        </CardTitle>
        <p className="text-sm text-gray-400">
          Manage test users and email cooldowns for signup testing
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Email Input */}
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Enter email to lookup/delete"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-gray-800/50 border-emerald-500/30 text-white flex-1"
          />
          <Button
            onClick={handleLookup}
            disabled={loading || !email}
            variant="outline"
            className="border-emerald-500/30 text-emerald-400"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Lookup
          </Button>
        </div>

        {/* Lookup Results */}
        {lookupResult && (
          <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-medium text-emerald-300">Lookup Results</h4>
            
            {/* Cooldown Status */}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4" />
              <span className={lookupResult.cooldown?.inCooldown ? 'text-yellow-400' : 'text-gray-400'}>
                Cooldown: {lookupResult.cooldown?.inCooldown 
                  ? `Active (${lookupResult.cooldown.remainingMinutes} min remaining)` 
                  : 'Not active'}
              </span>
            </div>
            
            {/* User Record */}
            <div className="text-sm">
              <span className="text-gray-400">Users table: </span>
              {lookupResult.user ? (
                <span className="text-emerald-300">
                  Found (ID: {lookupResult.user.id?.slice(0, 8)}..., Role: {lookupResult.user.role})
                </span>
              ) : (
                <span className="text-gray-500">Not found</span>
              )}
            </div>
            
            {/* Client Record */}
            <div className="text-sm">
              <span className="text-gray-400">Clients table: </span>
              {lookupResult.client ? (
                <span className="text-emerald-300">
                  Found ({lookupResult.client.first_name} {lookupResult.client.last_name})
                </span>
              ) : (
                <span className="text-gray-500">Not found</span>
              )}
            </div>
            
            {/* Landscaper Record */}
            <div className="text-sm">
              <span className="text-gray-400">Landscapers table: </span>
              {lookupResult.landscaper ? (
                <span className="text-emerald-300">
                  Found ({lookupResult.landscaper.first_name} {lookupResult.landscaper.last_name}, Approved: {lookupResult.landscaper.approved ? 'Yes' : 'No'})
                </span>
              ) : (
                <span className="text-gray-500">Not found</span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleDeleteProfile}
            disabled={loading || !email}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Profile Records
          </Button>
          
          <Button
            onClick={handleClearCooldowns}
            variant="outline"
            className="border-yellow-500/30 text-yellow-400"
          >
            <Clock className="w-4 h-4 mr-2" />
            Clear All Cooldowns
          </Button>
        </div>

        {/* Result Message */}
        {result && (
          <div className={`flex items-start gap-2 p-3 rounded-lg ${
            result.success 
              ? 'bg-emerald-900/20 text-emerald-400' 
              : 'bg-red-900/20 text-red-400'
          }`}>
            {result.success ? (
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            )}
            <span className="text-sm">{result.message}</span>
          </div>
        )}

        {/* Important Note */}
        <div className="flex items-start gap-2 p-3 bg-blue-900/20 rounded-lg text-blue-300 text-sm">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Important:</strong> This tool deletes profile records but cannot delete Auth records. 
            To fully delete a test user, use the Supabase Dashboard → Authentication → Users → Delete User.
            The proper way is via <code className="bg-gray-800 px-1 rounded">supabase.auth.admin.deleteUser()</code> 
            which requires a service role key (server-side only).
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
