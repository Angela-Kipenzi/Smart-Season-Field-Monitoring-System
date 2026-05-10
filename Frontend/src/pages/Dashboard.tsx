// frontend/src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import Layout from '../components/Layout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Calendar, AlertTriangle, CheckCircle, Sprout, TrendingUp } from 'lucide-react';

interface Field {
  id: string;
  name: string;
  cropType: string;
  currentStage: string;
  computedStatus: string;
  agent?: { name: string };
  plantingDate: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      const response = await api.get('/fields');
      setFields(response.data);
    } catch (error) {
      console.error('Failed to fetch fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusCounts = () => {
    const counts = { Active: 0, 'At Risk': 0, Completed: 0 };
    fields.forEach((field) => {
      counts[field.computedStatus as keyof typeof counts]++;
    });
    return counts;
  };

  const getStageCounts = () => {
    const stages = ['PLANTED', 'GROWING', 'READY', 'HARVESTED'];
    return stages.map((stage) => ({
      name: stage,
      count: fields.filter((f) => f.currentStage === stage).length,
    }));
  };

  const statusCounts = getStatusCounts();
  const stageCounts = getStageCounts();
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  const COLORS = ['#10B981', '#F59E0B', '#3B82F6'];

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading dashboard...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {user?.name}! Here's your field monitoring overview.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Fields</p>
                <p className="text-3xl font-bold text-gray-800">{fields.length}</p>
              </div>
              <Sprout className="h-10 w-10 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Active Fields</p>
                <p className="text-3xl font-bold text-green-600">{statusCounts.Active}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">At Risk</p>
                <p className="text-3xl font-bold text-orange-600">{statusCounts['At Risk']}</p>
              </div>
              <AlertTriangle className="h-10 w-10 text-orange-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Completed</p>
                <p className="text-3xl font-bold text-blue-600">{statusCounts.Completed}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Field Status Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Fields by Growth Stage</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stageCounts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">Recent Fields</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crop Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  {user?.role === 'ADMIN' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Agent</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fields.slice(0, 5).map((field) => (
                  <tr key={field.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/fields/${field.id}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{field.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{field.cropType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{field.currentStage}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${field.computedStatus === 'Active' ? 'bg-green-100 text-green-800' : ''}
                        ${field.computedStatus === 'At Risk' ? 'bg-orange-100 text-orange-800' : ''}
                        ${field.computedStatus === 'Completed' ? 'bg-blue-100 text-blue-800' : ''}
                      `}>
                        {field.computedStatus}
                      </span>
                    </td>
                    {user?.role === 'ADMIN' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{field.agent?.name || 'Unassigned'}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;