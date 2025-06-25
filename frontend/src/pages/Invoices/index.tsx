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

interface InvoiceItem {
  fee_id: number;
  amount: number;
  description: string;
}

interface Invoice {
  id: number;
  student_id: number;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  status: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled';
  items: InvoiceItem[];
  notes: string;
}

interface InvoicesResponse {
  items: Invoice[];
  total: number;
}

interface NewInvoice {
  student_id: number;
  issue_date: string;
  due_date: string;
  status: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled';
  items: InvoiceItem[];
  notes?: string;
}

interface ApiError {
  response?: { data?: { detail?: string } };
}

const Invoices: React.FC = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof Invoice>('issue_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [items, setItems] = useState<InvoiceItem[]>([]);

  const { data, isLoading, error } = useQuery<InvoicesResponse, ApiError>({
    queryKey: ['invoices', currentPage, sortField, sortOrder],
    queryFn: async () => {
      const response = await api.get('/invoices', {
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

  const createMutation = useMutation<Invoice, ApiError, NewInvoice>({
    mutationFn: (newInvoice) => api.post('/invoices', newInvoice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice created successfully');
      setShowForm(false);
      setSelectedInvoice(null);
      setItems([]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to create invoice');
    },
  });

  const updateMutation = useMutation<Invoice, ApiError, Partial<NewInvoice> & { id: number }>({
    mutationFn: (invoice) => api.put(`/invoices/${invoice.id}`, invoice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice updated successfully');
      setShowForm(false);
      setSelectedInvoice(null);
      setItems([]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update invoice');
    },
  });

  const deleteMutation = useMutation<void, ApiError, number>({
    mutationFn: (id) => api.delete(`/invoices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to delete invoice');
    },
  });

  const generatePDFMutation = useMutation<Blob, ApiError, { id: number; invoice_number: string }>({
    mutationFn: ({ id }) =>
      api
        .get(`/invoices/${id}/pdf`, { responseType: 'blob' })
        .then((response) => response.data),
    onSuccess: (data, { invoice_number }) => {
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF generated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to generate PDF');
    },
  });

  const columns: Column<Invoice>[] = [
    {
      header: 'Invoice Number',
      accessor: 'invoice_number',
      sortable: true,
    },
    {
      header: 'Student',
      accessor: (invoice) =>
        students?.find((s) => s.id === invoice.student_id)?.name || 'Unknown',
      sortable: true,
    },
    {
      header: 'Issue Date',
      accessor: (invoice) => new Date(invoice.issue_date).toLocaleDateString(),
      sortable: true,
    },
    {
      header: 'Due Date',
      accessor: (invoice) => new Date(invoice.due_date).toLocaleDateString(),
      sortable: true,
    },
    {
      header: 'Total Amount',
      accessor: (invoice) => `₹${invoice.total_amount.toLocaleString()}`,
      className: 'text-right',
      sortable: true,
    },
    {
      header: 'Paid Amount',
      accessor: (invoice) => `₹${invoice.paid_amount.toLocaleString()}`,
      className: 'text-right',
    },
    {
      header: 'Status',
      accessor: (invoice) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            invoice.status === 'paid'
              ? 'bg-primary-100 text-primary-800'
              : invoice.status === 'overdue'
              ? 'bg-red-100 text-red-800'
              : invoice.status === 'draft'
              ? 'bg-gray-100 text-gray-800'
              : invoice.status === 'issued'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
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
      options:
        students?.map((student) => ({
          value: student.id,
          label: student.name,
        })) || [],
    },
    {
      name: 'issue_date',
      label: 'Issue Date',
      type: 'date',
      required: true,
    },
    {
      name: 'due_date',
      label: 'Due Date',
      type: 'date',
      required: true,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'issued', label: 'Issued' },
        { value: 'paid', label: 'Paid' },
        { value: 'overdue', label: 'Overdue' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      placeholder: 'Enter any additional notes (optional)',
    },
  ];

  const itemFields: FormField[] = [
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
      step: 0.01,
      placeholder: 'Enter amount',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'text',
      required: true,
      placeholder: 'Enter item description',
    },
  ];

  const handleSubmit = (values: Partial<Invoice>) => {
    if (!items.length) {
      toast.error('At least one invoice item is required');
      return;
    }

    const submission: NewInvoice = {
      student_id: Number(values.student_id),
      issue_date: values.issue_date!,
      due_date: values.due_date!,
      status: values.status as 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled',
      items: items.map((item) => ({
        fee_id: Number(item.fee_id),
        amount: Number(item.amount),
        description: item.description,
      })),
      notes: values.notes || undefined,
    };

    if (selectedInvoice) {
      updateMutation.mutate({ ...submission, id: selectedInvoice.id });
    } else {
      createMutation.mutate(submission);
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setItems(invoice.items);
    setShowForm(true);
  };

  const handleDelete = (invoice: Invoice) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      deleteMutation.mutate(invoice.id);
    }
  };

  const handleGeneratePDF = (invoice: Invoice) => {
    generatePDFMutation.mutate({ id: invoice.id, invoice_number: invoice.invoice_number });
  };

  const handleSort = (field: keyof Invoice) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const addItem = (itemValues: Partial<InvoiceItem>) => {
    if (itemValues.fee_id && itemValues.amount && itemValues.description) {
      setItems([
        ...items,
        {
          fee_id: Number(itemValues.fee_id),
          amount: Number(itemValues.amount),
          description: itemValues.description,
        },
      ]);
    }
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const initialValues = selectedInvoice
    ? {
        student_id: selectedInvoice.student_id,
        issue_date: selectedInvoice.issue_date,
        due_date: selectedInvoice.due_date,
        status: selectedInvoice.status,
        notes: selectedInvoice.notes || '',
      }
    : {
        student_id: '',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: '',
        status: 'draft',
        notes: '',
      };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
        <button
          onClick={() => {
            setSelectedInvoice(null);
            setItems([]);
            setShowForm(true);
          }}
          className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          Create New Invoice
        </button>
      </div>

      <DataTable<Invoice>
        columns={columns}
        data={data?.items || []}
        totalItems={data?.total || 0}
        currentPage={currentPage}
        pageSize={10}
        onPageChange={setCurrentPage}
        isLoading={isLoading}
        error={error ? (error.response?.data?.detail || 'Error loading invoices') : undefined}
        onSort={handleSort}
        sortField={sortField}
        sortOrder={sortOrder}
        actions={(invoice) => (
          <div className="space-x-2">
            <button
              onClick={() => handleEdit(invoice)}
              className="text-blue-600 hover:text-blue-800"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(invoice)}
              className="text-red-600 hover:text-red-800"
              disabled={deleteMutation.isPending}
            >
              Delete
            </button>
            <button
              onClick={() => handleGeneratePDF(invoice)}
              className="text-green-600 hover:text-green-800"
              disabled={generatePDFMutation.isPending}
            >
              PDF
            </button>
          </div>
        )}
      />

      {showForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedInvoice ? 'Edit Invoice' : 'Create New Invoice'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setSelectedInvoice(null);
                  setItems([]);
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
              submitLabel={selectedInvoice ? 'Update' : 'Create'}
            >
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice Items</h3>
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-4 p-4 bg-gray-50 rounded-md"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {fees?.find((f) => f.id === item.fee_id)?.name || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-500">
                          ₹{item.amount.toLocaleString()} - {item.description}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <Form
                    fields={itemFields}
                    initialValues={{ fee_id: '', amount: 0, description: '' }}
                    onSubmit={addItem}
                    submitLabel="Add Item"
                    className="space-y-4"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setSelectedInvoice(null);
                  setItems([]);
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

export default Invoices;