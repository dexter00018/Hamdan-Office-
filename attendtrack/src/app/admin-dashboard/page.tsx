import React from 'react';
import AppLayout from '@/components/AppLayout';
import AdminDashboardClient from './components/AdminDashboardClient';

export default function AdminDashboardPage() {
  return (
    <AppLayout activePath="/admin-dashboard">
      <AdminDashboardClient />
    </AppLayout>
  );
}