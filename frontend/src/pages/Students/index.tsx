import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import DataTable, { Column } from '../../components/DataTable';
import Form, { FormField } from '../../components/Form';
import api from '../../services/api';

interface Student {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  enrollment_date: string;
  status: 'active' | 'inactive';
}

interface StudentsResponse {
  items: Student[];
  total: number;
}

interface NewStudent {
  name: string;
  email: string;
  phone: string;
  address: string;
  enrollment_date: string;
  status: 'active' | 'inactive';
}

interface ApiError {
  response?: { data?: { detail?: string } };
}

const Students: React.FC = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof Student>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const { data, isLoading, error } = useQuery<StudentsResponse, ApiError>({
    queryKey: ['students', currentPage, sortField, sortOrder],
    queryFn: async () => {
      const response = await api.get('/students', {
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

  const createMutation = useMutation<Student, ApiError, NewStudent>({
    mutationFn: (newStudent) => api.post('/students', newStudent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student created successfully');
      setShowForm(false);
      setSelectedStudent(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to create student');
    },
  });

  const updateMutation = useMutation<Student, ApiError, Partial<Student> & { id: number }>({
    mutationFn: (student) => api.put(`/students/${student.id}`, student),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student updated successfully');
      setShowForm(false);
      setSelectedStudent(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update student');
    },
  });

  const deleteMutation = useMutation<void, ApiError, number>({
    mutationFn: (id) => api.delete(`/students/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to delete student');
    },
  });

  const columns: Column<Student>[] = [
    {
      header: 'Name',
      accessor: 'name',
      sortable: true,
    },
    {
      header: 'Email',
      accessor: 'email',
      sortable: true,
    },
    {
      header: 'Phone',
      accessor: 'phone',
    },
    {
      header: 'Status',
      accessor: (student) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            student.status === 'active'
              ? 'bg-primary-100 text-primary-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
        </span>
      ),
    },
    {
      header: 'Enrollment Date',
      accessor: (student) => new Date(student.enrollment_date).toLocaleDateString(),
      sortable: true,
    },
  ];

  const formFields: FormField[] = [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      placeholder: 'Enter student name',
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      placeholder: 'Enter student email',
    },
    {
      name: 'phone',
      label: 'Phone',
      type: 'text',
      required: true,
      placeholder: 'Enter phone number',
    },
    {
      name: 'address',
      label: 'Address',
      type: 'text',
      required: true,
      placeholder: 'Enter address',
    },
    {
      name: 'enrollment_date',
      label: 'Enrollment Date',
      type: 'date',
      required: true,
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

  const handleSubmit = (values: Partial<Student>) => {
    if (selectedStudent) {
      updateMutation.mutate({ ...values, id: selectedStudent.id });
    } else {
      createMutation.mutate(values as NewStudent);
    }
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setShowForm(true);
  };

  const handleDelete = (student: Student) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      deleteMutation.mutate(student.id);
    }
  };

  const handleSort = (field: keyof Student) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const initialValues = selectedStudent
    ? {
        name: selectedStudent.name,
        email: selectedStudent.email,
        phone: selectedStudent.phone,
        address: selectedStudent.address,
        enrollment_date: selectedStudent.enrollment_date,
        status: selectedStudent.status,
      }
    : {
        name: '',
        email: '',
        phone: '',
        address: '',
        enrollment_date: new Date().toISOString().split('T')[0],
        status: 'active',
      };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Students</h1>
        <button
          onClick={() => {
            setSelectedStudent(null);
            setShowForm(true);
          }}
          className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          Add New Student
        </button>
      </div>

      <DataTable<Student>
        columns={columns}
        data={data?.items || []}
        totalItems={data?.total || 0}
        currentPage={currentPage}
        pageSize={10}
        onPageChange={setCurrentPage}
        isLoading={isLoading}
        error={error ? (error.response?.data?.detail || 'Error loading students') : undefined}
        onSort={handleSort}
        sortField={sortField}
        sortOrder={sortOrder}
        actions={(student) => (
          <div className="space-x-2">
            <button
              onClick={() => handleEdit(student)}
              className="text-blue-600 hover:text-blue-800"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(student)}
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
                {selectedStudent ? 'Edit Student' : 'Add New Student'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setSelectedStudent(null);
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
              submitLabel={selectedStudent ? 'Update' : 'Create'}
            >
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setSelectedStudent(null);
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

export default Students;