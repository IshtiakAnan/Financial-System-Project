import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import DataTable from '../components/DataTable';
import { Column } from '../components/DataTable';
import Form, { FormField } from '../components/Form';
import api from '../services/api';

interface Payment {
  id: number;
  student_id: number;
  fee_id: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  transaction_id: string;
  status: string;
  student: {
    id: number;
    name: string;
    roll_number: string;
    class_: string;
  };
  fee: {
    id: number;
    name: string;
    amount: number;
    due_date: string;
  };
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

const Payments: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const { data, isLoading, error } = useQuery<PaginatedResponse<Payment>>({
    queryKey: ['payments', page],
    queryFn: async () => {
      const response = await api.get('/payments', {
        params: {
          skip: (page - 1) * 10,
          limit: 10,
        },
      });
      return response.data;
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await api.get('/students');
      return response.data.items;
    },
  });

  const { data: fees = [] } = useQuery({
    queryKey: ['fees'],
    queryFn: async () => {
      const response = await api.get('/fees');
      return response.data.items;
    },
  });

  const createMutation = useMutation({
    mutationFn: (newPayment: Omit<Payment, 'id' | 'student' | 'fee'>) =>
      api.post('/payments', newPayment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment recorded successfully');
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to record payment');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payment: Partial<Payment>) =>
      api.put(`/payments/${payment.id}`, payment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment updated successfully');
      setIsModalOpen(false);
      setSelectedPayment(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update payment');
    },
  });

  const columns: Column<Payment>[] = [
    {
      header: 'Student',
      accessor: (payment: Payment) => `${payment.student.name} (${payment.student.roll_number})`,
    },
    {
      header: 'Fee',
      accessor: (payment: Payment) => payment.fee.name,
    },
    {
      header: 'Amount',
      accessor: (payment: Payment) => `₹${payment.amount.toLocaleString()}`,
      className: 'text-right',
    },
    {
      header: 'Date',
      accessor: (payment: Payment) => new Date(payment.payment_date).toLocaleDateString(),
    },
    { header: 'Method', accessor: 'payment_method' },
    { header: 'Transaction ID', accessor: 'transaction_id' },
    {
      header: 'Status',
      accessor: (payment: Payment) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            payment.status === 'completed'
              ? 'bg-green-100 text-green-800'
              : payment.status === 'pending'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
        </span>
      ),
    },
  ];

  const formFields: FormField[] = [
    {
      name: 'student_id',
      label: 'Student',
      type: 'select',
      required: true,
      options: students.map((s: any) => ({
        value: s.id,
        label: `${s.name} (${s.roll_number})`,
      })),
    },
    {
      name: 'fee_id',
      label: 'Fee',
      type: 'select',
      required: true,
      options: fees.map((f: any) => ({
        value: f.id,
        label: `${f.name} (₹${f.amount})`,
      })),
    },
    { name: 'amount', label: 'Amount', type: 'number', required: true },
    { name: 'payment_date', label: 'Payment Date', type: 'date', required: true },
    {
      name: 'payment_method',
      label: 'Payment Method',
      type: 'select',
      required: true,
      options: [
        { value: 'cash', label: 'Cash' },
        { value: 'card', label: 'Card' },
        { value: 'upi', label: 'UPI' },
        { value: 'bank_transfer', label: 'Bank Transfer' },
      ],
    },
    { name: 'transaction_id', label: 'Transaction ID', type: 'text', required: false },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { value: 'completed', label: 'Completed' },
        { value: 'pending', label: 'Pending' },
        { value: 'failed', label: 'Failed' },
      ],
    },
  ];

  const handleCreate = () => {
    setSelectedPayment(null);
    setIsModalOpen(true);
  };

  const handleEdit = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  const handleSubmit = (values: any) => {
    if (selectedPayment) {
      updateMutation.mutate({ ...values, id: selectedPayment.id });
    } else {
      createMutation.mutate(values);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Payments</h1>
        <button onClick={handleCreate} className="btn-primary">
          Record Payment
        </button>
      </div>

      <DataTable<Payment>
        columns={columns}
        data={data?.items || []}
        totalItems={data?.total || 0}
        currentPage={page}
        pageSize={10}
        onPageChange={setPage}
        isLoading={isLoading}
        error={error?.message}
        actions={(payment) => (
          <button
            onClick={() => handleEdit(payment)}
            className="text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
        )}
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {selectedPayment ? 'Edit Payment' : 'Record Payment'}
            </h2>
            <Form
              fields={formFields}
              initialValues={selectedPayment || {
                student_id: '',
                fee_id: '',
                amount: '',
                payment_date: new Date().toISOString().split('T')[0],
                payment_method: '',
                transaction_id: '',
                status: 'pending',
              }}
              onSubmit={handleSubmit}
              isLoading={createMutation.isPending || updateMutation.isPending}
              error={createMutation.error?.message || updateMutation.error?.message}
              submitLabel={selectedPayment ? 'Update' : 'Record'}
            />
            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-4 btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
