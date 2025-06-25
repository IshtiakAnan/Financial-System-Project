import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import DataTable from '../components/DataTable';
import { Column } from '../components/DataTable';
import Form, { FormField } from '../components/Form';
import api from '../services/api';

export interface Student {
  id: number;
  name: string;
  roll_number: string;
  class_: string;
  section: string;
  parent_name: string;
  contact_number: string;
  address: string;
  admission_date: string;
}

interface StudentsResponse {
  items: Student[];
  total: number;
}

type StudentFormValues = Omit<Student, 'id'>;

interface ApiError {
  response?: { data?: { detail?: string } };
}

const Students: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [sortField, setSortField] = useState<keyof Student>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const { data, isLoading, error } = useQuery<StudentsResponse>({
    queryKey: ['students', page, sortField, sortOrder],
    queryFn: async () => {
      const response = await api.get('/students', {
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

  const createMutation = useMutation({
    mutationFn: (newStudent: StudentFormValues) => api.post('/students', newStudent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student created successfully');
      setIsModalOpen(false);
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.detail || 'Failed to create student');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (student: Student) => api.put(`/students/${student.id}`, student),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student updated successfully');
      setIsModalOpen(false);
      setSelectedStudent(null);
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.detail || 'Failed to update student');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/students/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student deleted successfully');
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.detail || 'Failed to delete student');
    },
  });

  const columns: Column<Student>[] = [
    { header: 'Name', accessor: 'name', sortable: true },
    { header: 'Roll Number', accessor: 'roll_number', sortable: true },
    { header: 'Class', accessor: 'class_', sortable: true },
    { header: 'Section', accessor: 'section', sortable: true },
    { header: 'Parent Name', accessor: 'parent_name', sortable: true },
    { header: 'Contact', accessor: 'contact_number', sortable: true },
  ];

  const formFields: FormField[] = [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'roll_number', label: 'Roll Number', type: 'text', required: true },
    { name: 'class_', label: 'Class', type: 'text', required: true },
    { name: 'section', label: 'Section', type: 'text', required: true },
    { name: 'parent_name', label: 'Parent Name', type: 'text', required: true },
    { name: 'contact_number', label: 'Contact Number', type: 'text', required: true },
    { name: 'address', label: 'Address', type: 'textarea', required: true, rows: 4 },
    { name: 'admission_date', label: 'Admission Date', type: 'date', required: true },
  ];

  const handleSort = (field: keyof Student) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleCreate = () => {
    setSelectedStudent(null);
    setIsModalOpen(true);
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleDelete = (student: Student) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      deleteMutation.mutate(student.id);
    }
  };

  const handleSubmit = (values: StudentFormValues) => {
    if (selectedStudent) {
      updateMutation.mutate({ ...values, id: selectedStudent.id });
    } else {
      createMutation.mutate(values);
    }
  };

  const initialValues: StudentFormValues = selectedStudent || {
    name: '',
    roll_number: '',
    class_: '',
    section: '',
    parent_name: '',
    contact_number: '',
    address: '',
    admission_date: new Date().toISOString().split('T')[0],
  };

  const errorMessage =
    (createMutation.error as ApiError)?.response?.data?.detail ||
    (updateMutation.error as ApiError)?.response?.data?.detail ||
    '';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Students</h1>
        <button
          onClick={handleCreate}
          className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          Add Student
        </button>
      </div>

      <DataTable<Student>
        columns={columns}
        data={data?.items || []}
        totalItems={data?.total || 0}
        currentPage={page}
        pageSize={10}
        onPageChange={setPage}
        isLoading={isLoading}
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
            >
              Delete
            </button>
          </div>
        )}
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {selectedStudent ? 'Edit Student' : 'Add Student'}
            </h2>
            <Form
              fields={formFields}
              initialValues={initialValues}
              onSubmit={(values: Record<string, any>) => handleSubmit(values as StudentFormValues)}
              isLoading={createMutation.isPending || updateMutation.isPending}
              error={errorMessage}
              submitLabel={selectedStudent ? 'Update' : 'Create'}
            />
            <button
              onClick={() => setIsModalOpen(false)}
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

export default Students;