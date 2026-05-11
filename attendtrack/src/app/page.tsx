import React from 'react';
import AppLayout from '@/components/AppLayout';
import EmployeeCheckInClient from './components/EmployeeCheckInClient';

export default function EmployeeCheckInPage() {
  return (
    <AppLayout activePath="/">
      <EmployeeCheckInClient />
    </AppLayout>
  );
}