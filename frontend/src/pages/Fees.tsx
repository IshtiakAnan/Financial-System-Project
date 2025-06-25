import React, { useState, useEffect } from 'react';
type Decimal = number; // Using number type as a temporary replacement for Decimal.js
import api from '../services/api';

interface Fee {
  id: number;
  name: string;
  amount: Decimal;
  due_date: string;
  class_: string;
  is_recurring: boolean;
}

interface FeesResponse {
  items: Fee[];
  total: number;
}

const Fees: React.FC = () => {
  const [fees, setFees] = useState<Fee[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const limit = 10;

  useEffect(() => {
    const fetchFees = async () => {
      try {
        setLoading(true);
        const skip = (page - 1) * limit;
        const response = await api.get<FeesResponse>(`/fees?skip=${skip}&limit=${limit}`);
        setFees(response.data.items);
        setTotal(response.data.total);
      } catch (err) {
        setError('Failed to fetch fees');
        console.error('Error fetching fees:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFees();
  }, [page]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Fees Management</h1>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recurring</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {fees.map((fee) => (
              <tr key={fee.id}>
                <td className="px-6 py-4 whitespace-nowrap">{fee.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{fee.amount.toString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(fee.due_date).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{fee.class_}</td>
                <td className="px-6 py-4 whitespace-nowrap">{fee.is_recurring ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <button
          className="btn-secondary"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span>Page {page}</span>
        <button
          className="btn-primary"
          onClick={() => setPage(p => p + 1)}
          disabled={page * limit >= total}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Fees;