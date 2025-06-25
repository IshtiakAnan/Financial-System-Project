import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import DataTable, { Column } from '../../components/DataTable';
import Form, { FormField } from '../../components/Form';
import api from '../../services/api';

interface Student {
  id: number;
  name: string;
}

interface Fee {
  id: number;
  name: string;
  amount: number;
}

interface Payment {
  id: number;
  student_id: number;
  fee_id: number;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'card' | 'bank_transfer';
  transaction_id: string;
  status: 'pending' | 'completed' | 'failed';
  notes: string;
}

interface PaymentsResponse {
  items: Payment[];
  total: number;
}

interface NewPayment {
  student_id: number;
  fee_id: number;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'card' | 'bank_transfer';
  transaction_id?: string;
  status: 'pending' | 'completed' | 'failed';
  notes?: string;
}

interface ApiError {
  response?: { data?: { detail?: string } };
}

const Payments: React.FC = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof Payment>('payment_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data, isLoading, error } = useQuery<PaymentsResponse, ApiError>({
    queryKey: ['payments', currentPage, sortField, sortOrder],
    queryFn: async () => {
      const response = await api.get('/payments', {
        params: {
          skip: (currentPage - 1) * 10,
          limit: 10,
          sort_by: sortField,
          order: sortOrder,
        },
      });
      return response.data;
    },
  });

  const { data: students, isLoading: studentsLoading } = useQuery<Student[], ApiError>({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await api.get('/students');
      return response.data.items;
    },
  });

  const { data: fees, isLoading: feesLoading } = useQuery<Fee[], ApiError>({
    queryKey: ['fees'],
    queryFn: async () => {
      const response = await api.get('/fees');
      return response.data.items;
    },
  });

  const createMutation = useMutation<Payment, ApiError, NewPayment>({
    mutationFn: (newPayment) => api.post('/payments', newPayment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment recorded successfully');
      setShowForm(false);
      setSelectedPayment(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to record payment');
    },
  });

  const updateMutation = useMutation<Payment, ApiError, Partial<Payment> & { id: number }>({
    mutationFn: (payment) => api.put(`/payments/${payment.id}`, payment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment updated successfully');
      setShowForm(false);
      setSelectedPayment(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update payment');
    },
  });

  const deleteMutation = useMutation<void, ApiError, number>({
    mutationFn: (id) => api.delete(`/payments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to delete payment');
    },
  });

  const columns: Column<Payment>[] = [
    {
      header: 'Student',
      accessor: (payment) =>
        students?.find((s) => s.id === payment.student_id)?.name || 'Unknown',
      sortable: true,
    },
    {
      header: 'Fee Type',
      accessor: (payment) =>
        fees?.find((f) => f.id === payment.fee_id)?.name || 'Unknown',
      sortable: true,
    },
    {
      header: 'Amount',
      accessor: (payment) => `₹${payment.amount.toLocaleString()}`,
      className: 'text-right',
      sortable: true,
    },
    {
      header: 'Payment Date',
      accessor: (payment) => new Date(payment.payment_date).toLocaleDateString(),
      sortable: true,
    },
    {
      header: 'Payment Method',
      accessor: (payment) =>
        payment.payment_method
          .replace('_', ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase()),
    },
    {
      header: 'Status',
      accessor: (payment) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            payment.status === 'completed'
              ? 'bg-primary-100 text-primary-800'
              : payment.status === 'pending'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
        </span>
      ),
    },
    {
      header: 'Transaction ID',
      accessor: 'transaction_id',
    },
  ];

  const formFields: FormField[] = [
    {
      name: 'student_id',
      label: 'Student',
      type: 'select',
      required: true,
      options:
        students?.map((student) => ({
          value: student.id,
          label: student.name,
        })) || [],
    },
    {
      name: 'fee_id',
      label: 'Fee',
      type: 'select',
      required: true,
      options:
        fees?.map((fee) => ({
          value: fee.id,
          label: `${fee.name} (₹${fee.amount.toLocaleString()})`,
        })) || [],
    },
    {
      name: 'amount',
      label: 'Amount',
      type: 'number',
      required: true,
      min: 0,
      step: '',
      placeholder: 'Enter amount',
    },
    {
      name: 'payment_date',
      label: 'Payment Date',
      type: 'date',
      required: true,
    },
    {
      name: 'payment_method',
      label: 'Payment Method',
      type: 'select',
      required: true,
      options: [
        { value: 'cash', label: 'Cash' },
        { value: 'card', label: 'Card' },
        { value: 'bank_transfer', label: 'Bank Transfer' },
      ],
    },
    {
      name: 'transaction_id',
      label: 'Transaction ID',
      type: 'text',
      placeholder: 'Enter transaction ID (optional)',
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'completed', label: 'Completed' },
        { value: 'failed', label: 'Failed' },
      ],
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      placeholder: 'Enter any additional notes (optional)',
    },
  ];

  const handleSubmit = (values: Partial<Payment>) => {
    const submission: NewPayment = {
      student_id: Number(values.student_id),
      fee_id: Number(values.fee_id),
      amount: Number(values.amount),
      payment_date: values.payment_date!,
      payment_method: values.payment_method as 'cash' | 'card' | 'bank_transfer',
      transaction_id: values.transaction_id || undefined,
      status: values.status as 'pending' | 'completed' | 'failed',
      notes: values.notes || undefined,
    };

    if (selectedPayment) {
      updateMutation.mutate({ ...submission, id: selectedPayment.id });
    } else {
      createMutation.mutate(submission);
    }
  };

  const handleEdit = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowForm(true);
  };

  const handleDelete = (payment: Payment) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      deleteMutation.mutate(payment.id);
    }
  };

  const handleSort = (field: keyof Payment) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const initialValues = selectedPayment
    ? {
        student_id: selectedPayment.student_id,
        fee_id: selectedPayment.fee_id,
        amount: selectedPayment.amount,
        payment_date: selectedPayment.payment_date,
        payment_method: selectedPayment.payment_method,
        transaction_id: selectedPayment.transaction_id || '',
        status: selectedPayment.status,
        notes: selectedPayment.notes || '',
      }
    : {
        student_id: '',
        fee_id: '',
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        transaction_id: '',
        status: 'pending',
        notes: '',
      };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Payments</h1>
        <button
          onClick={() => {
            setSelectedPayment(null);
            setShowForm(true);
          }}
          className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          Record New Payment
        </button>
      </div>

      <DataTable<Payment>
        columns={columns}
        data={data?.items || []}
        totalItems={data?.total || 0}
        currentPage={currentPage}
        pageSize={10}
        onPageChange={setCurrentPage}
        isLoading={isLoading}
        error={error ? (error.response?.data?.detail || 'Error loading payments') : undefined}
        onSort={handleSort}
        sortField={sortField}
        sortOrder={sortOrder}
        actions={(payment) => (
          <div className="space-x-2">
            <button
              onClick={() => handleEdit(payment)}
              className="text-blue-600 hover:text-blue-800"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(payment)}
              className="text-red-600 hover:text-red-800"
              disabled={deleteMutation.isPending}
            >
              Delete
            </button>
          </div>
        )}
      />

      {showForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedPayment ? 'Edit Payment' : 'Record New Payment'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setSelectedPayment(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <Form
              fields={formFields}
              initialValues={initialValues}
              onSubmit={handleSubmit}
              isLoading={
                createMutation.isPending ||
                updateMutation.isPending ||
                studentsLoading ||
                feesLoading
              }
              error={
                (createMutation.error as ApiError)?.response?.data?.detail ||
                (updateMutation.error as ApiError)?.response?.data?.detail ||
                ''
              }
              submitLabel={selectedPayment ? 'Update' : 'Record'}
            >
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setSelectedPayment(null);
                }}
                className="mt-4 inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;