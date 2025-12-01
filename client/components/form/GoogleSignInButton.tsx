import { OAuthButton } from '@client/components/form/OAuthButton';
import { useGoogleSignIn } from '@client/hooks/useGoogleSignIn';
import React from 'react';
import { FaGoogle } from 'react-icons/fa';

export const GoogleSignInButton: React.FC = () => {
  const { signIn, loading } = useGoogleSignIn();

  return (
    <OAuthButton
      provider="Google"
      icon={<FaGoogle className="text-lg" />}
      loading={loading}
      onClick={signIn}
    />
  );
};
