// frontend/src/pages/FieldDetails.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import { Calendar, User, AlertTriangle, CheckCircle, Sprout, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Update {
  id: string;
  stage: string;
  notes: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

const FieldDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [field, setField] = useState<any>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    fetchFieldDetails();
    fetchUpdates();
  }, [id]);

  const fetchFieldDetails = async () => {
    try {
      const response = await api.get(`/fields/${id}`);
      setField(response.data);
    } catch (error) {
      toast.error('Failed to fetch field details');
      navigate('/fields');
    }
  };

  const fetchUpdates = async () => {
    try {
      const response = await api.get(`/updates/field/${id}`);
      setUpdates(response.data);
    } catch (error) {
      console.error('Failed to fetch updates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      fieldId: id,
      stage: formData.get('stage'),
      notes: formData.get('notes'),
    };

    try {
      await api.post('/updates', data);
      toast.success('Field update added successfully');
      setShowUpdateModal(false);
      fetchFieldDetails();
      fetchUpdates();
    } catch (error) {
      toast.error('Failed to add update');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'text-green-600 bg-green-50';
      case 'At Risk': return 'text-orange-600 bg-orange-50';
      case 'Completed': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading field details...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={() => navigate('/fields')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Fields
        </button>

        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{field?.name}</h1>
            <p className="text-gray-600 mt-1">{field?.cropType}</p>
          </div>
          {user?.role === 'AGENT' && field?.currentStage !== 'HARVESTED' && (
            <button
              onClick={() => setShowUpdateModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Add Update
            </button>
          )}
        </div>

        {/* Field Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Current Stage</p>
                <p className="text-2xl font-bold mt-1">{field?.currentStage}</p>
              </div>
              <Sprout className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Status</p>
                <p className={`text-2xl font-bold mt-1 ${getStatusColor(field?.computedStatus)} inline-block px-3 py-1 rounded-full text-base`}>
                  {field?.computedStatus}
                </p>
              </div>
              {field?.computedStatus === 'At Risk' ? (
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              ) : field?.computedStatus === 'Completed' ? (
                <CheckCircle className="h-8 w-8 text-blue-500" />
              ) : (
                <CheckCircle className="h-8 w-8 text-green-500" />
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Planting Date</p>
                <p className="text-lg font-semibold mt-1">
                  {new Date(field?.plantingDate).toLocaleDateString()}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          {field?.agent && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Assigned Agent</p>
                  <p className="text-lg font-semibold mt-1">{field.agent.name}</p>
                  <p className="text-xs text-gray-500">{field.agent.email}</p>
                </div>
                <User className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          )}
        </div>

        {/* Updates Timeline */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">Field Updates Timeline</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {updates.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No updates yet. Add the first update to track progress.
              </div>
            ) : (
              updates.map((update) => (
                <div key={update.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          Stage updated to {update.stage}
                        </span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {update.stage}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        by {update.user.name} • {formatDistanceToNow(new Date(update.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  {update.notes && (
                    <p className="text-gray-700 mt-2 pl-0">{update.notes}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Update Modal */}
        {showUpdateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Add Field Update</h2>
              <form onSubmit={handleUpdate}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Stage
                    </label>
                    <select
                      name="stage"
                      required
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="PLANTED">Planted</option>
                      <option value="GROWING">Growing</option>
                      <option value="READY">Ready</option>
                      <option value="HARVESTED">Harvested</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (Optional)
                    </label>
                    <textarea
                      name="notes"
                      rows={4}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Add observations, issues, or comments..."
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowUpdateModal(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Submit Update
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

export default FieldDetails;