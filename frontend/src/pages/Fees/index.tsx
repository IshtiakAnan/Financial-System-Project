import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import DataTable, { Column } from '../../components/DataTable';
import Form, { FormField } from '../../components/Form';
import api from '../../services/api';

interface Fee {
  id: number;
  name: string;
  amount: number;
  frequency: 'one-time' | 'monthly' | 'quarterly' | 'annually';
  category: string;
  description: string;
  due_date: string;
  late_fee: number;
  status: 'active' | 'inactive';
}

interface FeesResponse {
  items: Fee[];
  total: number;
}

interface NewFee {
  name: string;
  amount: number;
  frequency: 'one-time' | 'monthly' | 'quarterly' | 'annually';
  category: string;
  description?: string;
  due_date: string;
  late_fee?: number;
  status: 'active' | 'inactive';
}

interface ApiError {
  response?: { data?: { detail?: string } };
}

const Fees: React.FC = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof Fee>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const { data, isLoading, error } = useQuery<FeesResponse, ApiError>({
    queryKey: ['fees', currentPage, sortField, sortOrder],
    queryFn: async () => {
      const response = await api.get('/fees', {
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

  const createMutation = useMutation<Fee, ApiError, NewFee>({
    mutationFn: (newFee) => api.post('/fees', newFee),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      toast.success('Fee created successfully');
      setShowForm(false);
      setSelectedFee(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to create fee');
    },
  });

  const updateMutation = useMutation<Fee, ApiError, Partial<NewFee> & { id: number }>({
    mutationFn: (fee) => api.put(`/fees/${fee.id}`, fee),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      toast.success('Fee updated successfully');
      setShowForm(false);
      setSelectedFee(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update fee');
    },
  });

  const deleteMutation = useMutation<void, ApiError, number>({
    mutationFn: (id) => api.delete(`/fees/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      toast.success('Fee deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to delete fee');
    },
  });

  const columns: Column<Fee>[] = [
    {
      header: 'Name',
      accessor: 'name',
      sortable: true,
    },
    {
      header: 'Amount',
      accessor: (fee) => `₹${fee.amount.toLocaleString()}`,
      className: 'text-right',
      sortable: true,
    },
    {
      header: 'Frequency',
      accessor: (fee) =>
        fee.frequency.charAt(0).toUpperCase() + fee.frequency.slice(1).replace('-', ' '),
      sortable: true,
    },
    {
      header: 'Category',
      accessor: 'category',
      sortable: true,
    },
    {
      header: 'Due Date',
      accessor: (fee) => new Date(fee.due_date).toLocaleDateString(),
      sortable: true,
    },
    {
      header: 'Status',
      accessor: (fee) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            fee.status === 'active'
              ? 'bg-primary-100 text-primary-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
        </span>
      ),
    },
  ];

  const formFields: FormField[] = [
    {
      name: 'name',
      label: 'Fee Name',
      type: 'text',
      required: true,
      placeholder: 'Enter fee name',
    },
    {
      name: 'amount',
      label: 'Amount',
      type: 'number',
      required: true,
      min: 0,
      step: 0.01,
      placeholder: 'Enter amount',
    },
    {
      name: 'frequency',
      label: 'Frequency',
      type: 'select',
      required: true,
      options: [
        { value: 'one-time', label: 'One Time' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'quarterly', label: 'Quarterly' },
        { value: 'annually', label: 'Annually' },
      ],
    },
    {
      name: 'category',
      label: 'Category',
      type: 'text',
      required: true,
      placeholder: 'Enter category',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Enter description (optional)',
    },
    {
      name: 'due_date',
      label: 'Due Date',
      type: 'date',
      required: true,
    },
    {
      name: 'late_fee',
      label: 'Late Fee',
      type: 'number',
      min: 0,
      step: 0.01,
      placeholder: 'Enter late fee (optional)',
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
  ];

  const handleSubmit = (values: Partial<Fee>) => {
    const submission: NewFee = {
      name: values.name!,
      amount: Number(values.amount),
      frequency: values.frequency as 'one-time' | 'monthly' | 'quarterly' | 'annually',
      category: values.category!,
      description: values.description || undefined,
      due_date: values.due_date!,
      late_fee: values.late_fee ? Number(values.late_fee) : undefined,
      status: values.status as 'active' | 'inactive',
    };

    if (selectedFee) {
      updateMutation.mutate({ ...submission, id: selectedFee.id });
    } else {
      createMutation.mutate(submission);
    }
  };

  const handleEdit = (fee: Fee) => {
    setSelectedFee(fee);
    setShowForm(true);
  };

  const handleDelete = (fee: Fee) => {
    if (window.confirm('Are you sure you want to delete this fee?')) {
      deleteMutation.mutate(fee.id);
    }
  };

  const handleSort = (field: keyof Fee) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const initialValues = selectedFee
    ? {
        name: selectedFee.name,
        amount: selectedFee.amount,
        frequency: selectedFee.frequency,
        category: selectedFee.category,
        description: selectedFee.description || '',
        due_date: selectedFee.due_date,
        late_fee: selectedFee.late_fee || '',
        status: selectedFee.status,
      }
    : {
        name: '',
        amount: 0,
        frequency: 'one-time',
        category: '',
        description: '',
        due_date: new Date().toISOString().split('T')[0],
        late_fee: '',
        status: 'active',
      };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Fees</h1>
        <button
          onClick={() => {
            setSelectedFee(null);
            setShowForm(true);
          }}
          className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          Add New Fee
        </button>
      </div>

      <DataTable<Fee>
        columns={columns}
        data={data?.items || []}
        totalItems={data?.total || 0}
        currentPage={currentPage}
        pageSize={10}
        onPageChange={setCurrentPage}
        isLoading={isLoading}
        error={error ? (error.response?.data?.detail || 'Error loading fees') : undefined}
        onSort={handleSort}
        sortField={sortField}
        sortOrder={sortOrder}
        actions={(fee) => (
          <div className="space-x-2">
            <button
              onClick={() => handleEdit(fee)}
              className="text-blue-600 hover:text-blue-800"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(fee)}
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
                {selectedFee ? 'Edit Fee' : 'Add New Fee'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setSelectedFee(null);
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
              isLoading={createMutation.isPending || updateMutation.isPending}
              error={
                (createMutation.error as ApiError)?.response?.data?.detail ||
                (updateMutation.error as ApiError)?.response?.data?.detail ||
                ''
              }
              submitLabel={selectedFee ? 'Update' : 'Create'}
            >
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setSelectedFee(null);
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

export default Fees;