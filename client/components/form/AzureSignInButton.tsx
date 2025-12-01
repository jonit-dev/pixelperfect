import { OAuthButton } from '@client/components/form/OAuthButton';
import { useAzureSignIn } from '@client/hooks/useAzureSignIn';
import React from 'react';
import { FaMicrosoft } from 'react-icons/fa';

export const AzureSignInButton: React.FC = () => {
  const { signIn, loading } = useAzureSignIn();

  return (
    <OAuthButton
      provider="Azure"
      icon={<FaMicrosoft className="text-lg" />}
      loading={loading}
      onClick={signIn}
    />
  );
};
