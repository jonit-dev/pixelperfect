import React, { useEffect } from 'react';
import { useUserStore } from '@client/store/userStore';

export const Logout: React.FC = () => {
  const { signOut } = useUserStore();

  useEffect(() => {
    const performLogout = async () => {
      await signOut();
      // Redirect is handled by auth state change listener in userStore.ts
    };

    performLogout();
  }, [signOut]);

  return <div>Logging out...</div>;
};
