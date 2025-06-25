import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import DataTable, { Column } from '../components/DataTable';
import Form, { FormField } from '../components/Form';
import api from '../services/api';

interface Student {
  id: number;
  name: string;
  roll_number: string;
}

interface Fee {
  id: number;
  name: string;
}

interface InvoiceItem {
  fee_id: number;
  description: string;
  amount: number;
}

interface Invoice {
  id: number;
  student_id: number;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  total_amount: number;
  status: 'pending' | 'paid' | 'overdue';
  student: {
    id: number;
    name: string;
    roll_number: string;
    class_: string;
  };
  items: {
    id: number;
    fee_id: number;
    description: string;
    amount: number;
    fee: {
      id: number;
      name: string;
    };
  }[];
}

interface InvoicesResponse {
  items: Invoice[];
  total: number;
}

interface NewInvoice {
  student_id: number;
  issue_date: string;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
  items: InvoiceItem[];
}

interface ApiError {
  response?: { data?: { detail?: string } };
}

const Invoices: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [sortField, setSortField] = useState<keyof Invoice>('invoice_number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);

  const { data, isLoading, error } = useQuery<InvoicesResponse>({
    queryKey: ['invoices', page, sortField, sortOrder],
    queryFn: async () => {
      const response = await api.get('/invoices', {
        params: {
          skip: (page - 1) * 10,
          limit: 10,
          sort_by: sortField,
          order: sortOrder,
        },
      });
      return response.data;
    },
  });

  const { data: students, isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await api.get('/students');
      return response.data.items;
    },
  });

  const { data: fees, isLoading: feesLoading } = useQuery<Fee[]>({
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
      setIsModalOpen(false);
      setInvoiceItems([]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to create invoice');
    },
  });

  const updateMutation = useMutation<Invoice, ApiError, Partial<Invoice> & { id: number }>({
    mutationFn: (invoice) => api.put(`/invoices/${invoice.id}`, invoice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice updated successfully');
      setIsModalOpen(false);
      setSelectedInvoice(null);
      setInvoiceItems([]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update invoice');
    },
  });

  const downloadPdfMutation = useMutation<void, ApiError, number>({
    mutationFn: async (id) => {
      const response = await api.get(`/invoices/${id}/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to download PDF');
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
      accessor: (invoice) => `${invoice.student.name} (${invoice.student.roll_number})`,
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
      header: 'Amount',
      accessor: (invoice) => `₹${invoice.total_amount.toLocaleString()}`,
      className: 'text-right',
      sortable: true,
    },
    {
      header: 'Status',
      accessor: (invoice) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            invoice.status === 'paid'
              ? 'bg-primary-100 text-primary-800'
              : invoice.status === 'pending'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
        </span>
      ),
    },
  ];

  const baseFormFields: FormField[] = [
    {
      name: 'student_id',
      label: 'Student',
      type: 'select',
      required: true,
      options:
        students?.map((student) => ({
          value: student.id,
          label: `${student.name} (${student.roll_number})`,
        })) || [],
    },
    { name: 'issue_date', label: 'Issue Date', type: 'date', required: true },
    { name: 'due_date', label: 'Due Date', type: 'date', required: true },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'paid', label: 'Paid' },
        { value: 'overdue', label: 'Overdue' },
      ],
    },
  ];

  const addInvoiceItem = () => {
    setInvoiceItems([...invoiceItems, { fee_id: 0, description: '', amount: 0 }]);
  };

  const updateInvoiceItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...invoiceItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setInvoiceItems(updatedItems);
  };

  const removeInvoiceItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const handleSort = (field: keyof Invoice) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleCreate = () => {
    setSelectedInvoice(null);
    setInvoiceItems([]);
    setIsModalOpen(true);
  };

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setInvoiceItems(
      invoice.items.map((item) => ({
        fee_id: item.fee_id,
        description: item.description,
        amount: item.amount,
      }))
    );
    setIsModalOpen(true);
  };

  const handleDownloadPdf = (invoice: Invoice) => {
    downloadPdfMutation.mutate(invoice.id);
  };

  const handleSubmit = (values: any) => {
    const total_amount = invoiceItems.reduce((sum, item) => sum + Number(item.amount), 0);
    const submission = {
      ...values,
      student_id: Number(values.student_id),
      items: invoiceItems.map((item) => ({
        ...item,
        fee_id: Number(item.fee_id),
        amount: Number(item.amount),
      })),
      total_amount,
    };

    if (selectedInvoice) {
      updateMutation.mutate({ ...submission, id: selectedInvoice.id });
    } else {
      createMutation.mutate(submission);
    }
  };

  const initialValues = selectedInvoice
    ? {
        student_id: selectedInvoice.student_id,
        issue_date: selectedInvoice.issue_date,
        due_date: selectedInvoice.due_date,
        status: selectedInvoice.status,
      }
    : {
        student_id: '',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(new Date().setDate(new Date().getDate() + 30))
          .toISOString()
          .split('T')[0],
        status: 'pending',
      };

  const errorMessage =
    (createMutation.error as ApiError)?.response?.data?.detail ||
    (updateMutation.error as ApiError)?.response?.data?.detail ||
    '';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
        <button
          onClick={handleCreate}
          className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          Create Invoice
        </button>
      </div>

      <DataTable<Invoice>
        columns={columns}
        data={data?.items || []}
        totalItems={data?.total || 0}
        currentPage={page}
        pageSize={10}
        onPageChange={setPage}
        isLoading={isLoading}
        error={error ? String(error) : undefined}
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
              onClick={() => handleDownloadPdf(invoice)}
              className="text-primary-600 hover:text-primary-800"
              disabled={downloadPdfMutation.isPending}
            >
              {downloadPdfMutation.isPending ? 'Downloading...' : 'PDF'}
            </button>
          </div>
        )}
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {selectedInvoice ? 'Edit Invoice' : 'Create Invoice'}
            </h2>
            <Form
              fields={[
                ...baseFormFields,
                {
                  name: 'items',
                  label: 'Invoice Items',
                  type: 'custom' as any, // Temporary workaround; ideally extend FormField
                  required: true,
                },
              ]}
              initialValues={initialValues}
              onSubmit={handleSubmit}
              isLoading={
                createMutation.isPending ||
                updateMutation.isPending ||
                studentsLoading ||
                feesLoading
              }
              error={errorMessage}
              submitLabel={selectedInvoice ? 'Update' : 'Create'}
            >
              <div className="space-y-4 mt-4">
                <h3 className="text-lg font-medium text-gray-700">Invoice Items</h3>
                {invoiceItems.map((item, index) => (
                  <div key={index} className="flex space-x-4 items-end">
                    <div className="flex-1">
                      <label
                        htmlFor={`fee_id_${index}`}
                        className="block text-sm font-medium text-gray-700"
                      >
                        Fee
                      </label>
                      <select
                        id={`fee_id_${index}`}
                        value={item.fee_id}
                        onChange={(e) =>
                          updateInvoiceItem(index, 'fee_id', Number(e.target.value))
                        }
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        required
                      >
                        <option value="">Select Fee</option>
                        {fees?.map((fee) => (
                          <option key={fee.id} value={fee.id}>
                            {fee.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label
                        htmlFor={`description_${index}`}
                        className="block text-sm font-medium text-gray-700"
                      >
                        Description
                      </label>
                      <input
                        id={`description_${index}`}
                        value={item.description}
                        onChange={(e) =>
                          updateInvoiceItem(index, 'description', e.target.value)
                        }
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        required
                      />
                    </div>
                    <div className="w-24">
                      <label
                        htmlFor={`amount_${index}`}
                        className="block text-sm font-medium text-gray-700"
                      >
                        Amount
                      </label>
                      <input
                        id={`amount_${index}`}
                        type="number"
                        value={item.amount}
                        onChange={(e) =>
                          updateInvoiceItem(index, 'amount', Number(e.target.value))
                        }
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        required
                        min={0}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeInvoiceItem(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addInvoiceItem}
                  className="text-primary-600 hover:text-primary-800"
                >
                  + Add Item
                </button>
                <p className="text-sm text-gray-600">
                  Total: ₹{invoiceItems.reduce((sum, item) => sum + Number(item.amount), 0).toLocaleString()}
                </p>
              </div>
            </Form>
            <button
              onClick={() => {
                setIsModalOpen(false);
                setInvoiceItems([]);
              }}
              className="mt-4 inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;