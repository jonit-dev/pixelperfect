import { loadEnv } from '@config/env';
import { Button } from 'react-daisyui';
import { useAuthStore } from '../../store/authStore';
import { useModalStore } from '../../store/modalStore';
import { AuthProvider } from '../../types/authProviders';
import { CreditsDisplay } from '../stripe/CreditsDisplay';

export const NavBar = (): JSX.Element => {
  const { open } = useModalStore();
  const { isAuthenticated, user, signOut } = useAuthStore();

  const handleAuthClick = () => {
    if (!isAuthenticated) {
      open('authenticationModal');
    }
  };

  const handleChangePassword = () => {
    open('authenticationModal');
  };

  // Check if user is authenticated through email/password
  const isPasswordUser = user?.provider === AuthProvider.EMAIL;
  const { APP_NAME } = loadEnv();

  return (
    <div className="navbar bg-base-100">
      <div className="flex-1">
        <a className="btn btn-ghost normal-case text-xl">{APP_NAME}</a>
      </div>
      <div className="flex-none gap-2">
        {!isAuthenticated ? (
          <Button onClick={handleAuthClick} className="btn-primary">
            Sign In
          </Button>
        ) : (
          <>
            <div className="hidden md:flex items-center mr-4">
              <CreditsDisplay />
            </div>
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-ghost gap-2">
                <span className="text-sm">{user?.email}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </label>
              <ul
                tabIndex={0}
                className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
              >
                <li className="md:hidden">
                  <div className="pointer-events-none">
                    <CreditsDisplay />
                  </div>
                </li>
                <li>
                  <a href="/pricing" className="text-sm">
                    Buy Credits
                  </a>
                </li>
                {isPasswordUser && (
                  <li>
                    <button onClick={handleChangePassword} className="text-sm">
                      Change Password
                    </button>
                  </li>
                )}
                <li>
                  <button onClick={signOut} className="text-sm text-error">
                    Sign Out
                  </button>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
