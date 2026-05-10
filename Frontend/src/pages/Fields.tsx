// frontend/src/pages/Fields.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, UserCheck, Eye } from 'lucide-react';

interface Field {
  id: string;
  name: string;
  cropType: string;
  plantingDate: string;
  currentStage: string;
  computedStatus: string;
  agent?: { id: string; name: string; email: string };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const Fields = () => {
  const { user } = useAuth();
  const [fields, setFields] = useState<Field[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFields();
    if (user?.role === 'ADMIN') {
      fetchAgents();
    }
  }, []);

  const fetchFields = async () => {
    try {
      const response = await api.get('/fields');
      setFields(response.data);
    } catch (error) {
      toast.error('Failed to fetch fields');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await api.get('/users?role=AGENT');
      setAgents(response.data);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      cropType: formData.get('cropType'),
      plantingDate: formData.get('plantingDate'),
      currentStage: formData.get('currentStage'),
    };

    try {
      if (editingField) {
        await api.put(`/fields/${editingField.id}`, data);
        toast.success('Field updated successfully');
      } else {
        await api.post('/fields', data);
        toast.success('Field created successfully');
      }
      setShowModal(false);
      setEditingField(null);
      fetchFields();
    } catch (error) {
      toast.error('Failed to save field');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this field?')) {
      try {
        await api.delete(`/fields/${id}`);
        toast.success('Field deleted successfully');
        fetchFields();
      } catch (error) {
        toast.error('Failed to delete field');
      }
    }
  };

  const handleAssignAgent = async (fieldId: string, agentId: string) => {
    try {
      await api.patch(`/fields/${fieldId}/assign`, { agentId });
      toast.success('Agent assigned successfully');
      fetchFields();
    } catch (error) {
      toast.error('Failed to assign agent');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'At Risk': return 'bg-orange-100 text-orange-800';
      case 'Completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading fields...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fields</h1>
            <p className="text-gray-600 mt-2">Manage your agricultural fields</p>
          </div>
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => {
                setEditingField(null);
                setShowModal(true);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add Field
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crop</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planting Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  {user?.role === 'ADMIN' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </>
                  )}
                  {user?.role === 'AGENT' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fields.map((field) => (
                  <tr key={field.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{field.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{field.cropType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(field.plantingDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{field.currentStage}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(field.computedStatus)}`}>
                        {field.computedStatus}
                      </span>
                    </td>
                    {user?.role === 'ADMIN' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <select
                            value={field.agent?.id || ''}
                            onChange={(e) => handleAssignAgent(field.id, e.target.value)}
                            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            <option value="">Unassigned</option>
                            {agents.map((agent) => (
                              <option key={agent.id} value={agent.id}>
                                {agent.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingField(field);
                                setShowModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 transition"
                              title="Edit"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(field.id)}
                              className="text-red-600 hover:text-red-800 transition"
                              title="Delete"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                            <a
                              href={`/fields/${field.id}`}
                              className="text-green-600 hover:text-green-800 transition"
                              title="View Details"
                            >
                              <Eye className="h-5 w-5" />
                            </a>
                          </div>
                        </td>
                      </>
                    )}
                    {user?.role === 'AGENT' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <a
                          href={`/fields/${field.id}`}
                          className="inline-flex items-center gap-1 text-green-600 hover:text-green-800 font-medium transition"
                        >
                          <Eye className="h-4 w-4" />
                          Update Progress
                        </a>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal for adding/editing fields */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">
                {editingField ? 'Edit Field' : 'Add New Field'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Field Name</label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingField?.name}
                      required
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., North Field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Crop Type</label>
                    <input
                      type="text"
                      name="cropType"
                      defaultValue={editingField?.cropType}
                      required
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., Corn, Wheat, Soybeans"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Planting Date</label>
                    <input
                      type="date"
                      name="plantingDate"
                      defaultValue={editingField?.plantingDate?.split('T')[0]}
                      required
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Stage</label>
                    <select
                      name="currentStage"
                      defaultValue={editingField?.currentStage || 'PLANTED'}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="PLANTED">Planted</option>
                      <option value="GROWING">Growing</option>
                      <option value="READY">Ready</option>
                      <option value="HARVESTED">Harvested</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingField(null);
                    }}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    {editingField ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Fields;