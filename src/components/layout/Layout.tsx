'use client';

import { BarChart2, Home, Menu as MenuIcon, Settings } from 'lucide-react';
import React, { JSX } from 'react';
import { Navbar } from 'react-daisyui';
import { LoadingBackdrop } from '../common/LoadingBackdrop';
import { NavBar } from '../navigation/NavBar';

interface ILayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: ILayoutProps): JSX.Element => {
  return (
    <div className="min-h-screen bg-base-100">
      <LoadingBackdrop />
      <div className="max-w-[1600px] mx-auto">
        <Navbar className="bg-base-200/50 backdrop-blur-sm border-b border-primary/20 sticky top-0 z-[100] relative">
          <div className="flex-1">
            <div className="dropdown relative">
              <label tabIndex={0} className="btn btn-ghost lg:hidden">
                <MenuIcon className="h-5 w-5" />
              </label>
              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content mt-3 z-[999] p-2 shadow bg-base-200 rounded-box w-52"
              >
                <NavMenuItems />
              </ul>
            </div>
          </div>

          <NavBar />
        </Navbar>
        <main className="min-h-[calc(100vh-4rem)] p-6">{children}</main>
      </div>
    </div>
  );
};

const NavMenuItems = (): JSX.Element => (
  <>
    <li>
      <a>
        <Home className="h-4 w-4" /> Dashboard
      </a>
    </li>
    <li>
      <a>
        <BarChart2 className="h-4 w-4" /> Analytics
      </a>
    </li>
    <li>
      <a>
        <Settings className="h-4 w-4" /> Settings
      </a>
    </li>
  </>
);
