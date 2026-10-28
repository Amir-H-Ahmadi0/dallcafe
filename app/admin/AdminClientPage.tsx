'use client';

import React, { useState, useEffect } from 'react';
import { Category, MenuItem, CafeInfo } from '@/types/menu';
import { AdminLogin } from '@/components/admin/AdminLogin';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

interface AdminClientPageProps {
  initialCategories: Category[];
  initialItems: MenuItem[];
  initialCafeInfo: CafeInfo;
}

export function AdminClientPage({
  initialCategories,
  initialItems,
  initialCafeInfo,
}: AdminClientPageProps) {
  // Default to false: renders the login form directly without delay or synchronous effect setState
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    try {
      const localToken = localStorage.getItem('dall_admin_token');
      if (!localToken) return;

      // Verify stored token asynchronously with backend
      fetch('/api/admin/auth', {
        headers: { Authorization: `Bearer ${localToken}` },
      })
        .then((res) => (res.ok ? res.json() : { authenticated: false }))
        .then((data) => {
          if (isMounted && data.authenticated) {
            setIsAuthenticated(true);
          }
        })
        .catch(() => {
          // Token invalid or network issue, stay on login
        });
    } catch {
      // Ignore localStorage access restrictions in private mode
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
    } catch {
      // Ignore network errors on logout
    }
    try {
      localStorage.removeItem('dall_admin_token');
    } catch {
      // Ignore
    }
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <AdminDashboard
      initialCategories={initialCategories}
      initialItems={initialItems}
      initialCafeInfo={initialCafeInfo}
      onLogout={handleLogout}
    />
  );
}
