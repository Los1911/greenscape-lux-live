import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import UnifiedPortalAuth from '@/components/auth/UnifiedPortalAuth';

export default function UnifiedPortalAuthPage() {
  const { roleIntent } = useParams<{ roleIntent: 'client' | 'landscaper' }>();
  const navigate = useNavigate();

  // Default to client if no role intent specified
  const role = (roleIntent === 'client' || roleIntent === 'landscaper') ? roleIntent : 'client';

  const handleBack = () => {
    navigate('/get-started');
  };

  return (
    <UnifiedPortalAuth 
      roleIntent={role}
      onBack={handleBack}
    />
  );
}