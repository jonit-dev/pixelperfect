import React from 'react';

interface IOAuthButtonProps {
  provider: string;
  icon: React.ReactNode;
  loading: boolean;
  onClick: () => void;
}

export const OAuthButton: React.FC<IOAuthButtonProps> = ({ provider, icon, loading, onClick }) => {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full px-4 py-3 flex items-center justify-center gap-3 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md group"
    >
      <span className="text-lg group-hover:scale-110 transition-transform">{icon}</span>
      <span>{loading ? 'Signing in...' : `Continue with ${provider}`}</span>
    </button>
  );
};
