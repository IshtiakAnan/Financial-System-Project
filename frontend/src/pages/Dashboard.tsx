import React from 'react';
import { useQuery } from '@tanstack/react-query';
import DataTable, { Column } from '../components/DataTable';
import api from '../services/api';

interface Student {
  id: number;
  name: string;
}

interface Payment {
  id: number;
  amount: number;
  date: string;
  student: Student;
}

interface Fee {
  id: number;
  name: string;
  amount: number;
  due_date: string;
  class_: string;
}

interface DashboardMetrics {
  totalStudents: number;
  totalFees: number;
  totalPayments: number;
  totalInvoices: number;
  recentPayments: Payment[];
  upcomingFees: Fee[];
}

interface ApiError {
  response?: { data?: { detail?: string } };
}

const Dashboard: React.FC = () => {
  const { data: metrics, isLoading, error } = useQuery<DashboardMetrics, ApiError>({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const response = await api.get('/dashboard/metrics');
      return response.data;
    },
  });

  const paymentColumns: Column<Payment>[] = [
    {
      header: 'Student',
      accessor: (payment) => payment.student.name,
      sortable: true,
    },
    {
      header: 'Date',
      accessor: (payment) => new Date(payment.date).toLocaleDateString(),
      sortable: true,
    },
    {
      header: 'Amount',
      accessor: (payment) => `₹${payment.amount.toLocaleString()}`,
      className: 'text-right',
      sortable: true,
    },
  ];

  const feeColumns: Column<Fee>[] = [
    {
      header: 'Fee Name',
      accessor: 'name',
      sortable: true,
    },
    {
      header: 'Class',
      accessor: 'class_',
      sortable: true,
    },
    {
      header: 'Due Date',
      accessor: (fee) => new Date(fee.due_date).toLocaleDateString(),
      sortable: true,
    },
    {
      header: 'Amount',
      accessor: (fee) => `₹${fee.amount.toLocaleString()}`,
      className: 'text-right',
      sortable: true,
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm">
                <div className="p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                </div>
                <div className="border-t border-gray-200 p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Students</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {metrics?.totalStudents.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Fees</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            ₹{metrics?.totalFees.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Payments</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            ₹{metrics?.totalPayments.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Invoices</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {metrics?.totalInvoices.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900">Recent Payments</h2>
          </div>
          <DataTable<Payment>
            columns={paymentColumns}
            data={metrics?.recentPayments || []}
            totalItems={metrics?.recentPayments.length || 0}
            currentPage={1}
            pageSize={5}
            onPageChange={() => {}} // No pagination for recent payments
            isLoading={isLoading}
            error={error ? (error.response?.data?.detail || 'Error loading payments') : undefined}
          />
        </div>

        {/* Upcoming Fees */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900">Upcoming Fees</h2>
          </div>
          <DataTable<Fee>
            columns={feeColumns}
            data={metrics?.upcomingFees || []}
            totalItems={metrics?.upcomingFees.length || 0}
            currentPage={1}
            pageSize={5}
            onPageChange={() => {}} // No pagination for upcoming fees
            isLoading={isLoading}
            error={error ? (error.response?.data?.detail || 'Error loading fees') : undefined}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;