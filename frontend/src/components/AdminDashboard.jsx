import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../lib/apiClient';
import { toast } from 'sonner';
import { Users, Briefcase, CheckCircle, XCircle, FileText, Loader2, ArrowRight, Server } from 'lucide-react';
import CloudsBackground from './CloudsBackground';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { user, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('CUSTOMERS'); // CUSTOMERS or VENDORS
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [services, setServices] = useState([]);
  const [actionLoading, setActionLoading] = useState(null); // stores id of item being processed

  useEffect(() => {
    // Basic protection (though protected route handles it too)
    if (user && !user.roles?.includes('ADMIN') && !user.roles?.includes('ROLE_ADMIN')) {
      toast.error("Unauthorized access.");
      navigate('/');
      return;
    }
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'CUSTOMERS') {
        const res = await apiClient.get('/api/admin/requests/customer');
        setCustomers(res.data?.data || res.data || []);
      } else if (activeTab === 'VENDORS') {
        const res = await apiClient.get('/api/admin/requests/vendor');
        setVendors(res.data?.data || res.data || []);
      } else if (activeTab === 'SERVICES') {
        const res = await apiClient.get('/api/admin/requests/service');
        setServices(res.data?.data || res.data || []);
      }
    } catch (err) {
      console.error(`Error fetching ${activeTab.toLowerCase()} requests:`, err);
      toast.error(`Failed to load ${activeTab.toLowerCase()} requests`);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (type, action, id) => {
    setActionLoading(id);
    try {
      const endpoint = `/api/admin/requests/${type}/${action}/${id}`;
      await apiClient.post(endpoint);
      toast.success(`${type === 'customer' ? 'Customer' : 'Vendor'} ${action}d successfully`);
      fetchData(); // Refresh list
      await refreshUser(); // Auto-refresh auth context in case admin approved their own request
    } catch (err) {
      console.error(`Error performing ${action} on ${type}:`, err);
      toast.error(`Failed to ${action} ${type}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <CloudsBackground>
      <div className="flex-1 pt-32 relative font-sans w-full min-h-screen py-12 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Dashboard</h1>
              <p className="text-gray-600 font-medium mt-1">Manage pending approvals for the platform</p>
            </div>
            
            <div className="flex bg-gray-100/80 p-1.5 rounded-2xl border border-white/50 backdrop-blur-md">
              <button
                onClick={() => setActiveTab('CUSTOMERS')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'CUSTOMERS' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Users size={18} /> Customers
              </button>
              <button
                onClick={() => setActiveTab('VENDORS')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'VENDORS' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Briefcase size={18} /> Vendors
              </button>
              <button
                onClick={() => setActiveTab('SERVICES')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'SERVICES' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Server size={18} /> Services
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-sm border border-white p-6 md:p-8 min-h-[500px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
                <p className="text-gray-500 font-medium">Loading requests...</p>
              </div>
            ) : (
              <>
                {activeTab === 'CUSTOMERS' && (
                  <div className="space-y-6">
                    {customers.length === 0 ? (
                      <div className="text-center py-20">
                        <Users size={48} className="text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-700">No pending customers</h3>
                        <p className="text-gray-500 mt-2">All customer verifications have been processed.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {customers.map((customer) => (
                          <div key={customer.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] transition-all">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                                  {customer.firstName?.charAt(0)}{customer.lastName?.charAt(0)}
                                </div>
                                <div>
                                  <h3 className="font-bold text-gray-900">{customer.firstName} {customer.lastName}</h3>
                                  <p className="text-sm text-gray-500">{customer.phoneNumber}</p>
                                </div>
                              </div>
                            </div>
                            
                            {customer.aadharUrl && (
                              <div className="mb-6 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 p-2">
                                <p className="text-xs font-semibold text-gray-500 mb-2 px-2 flex items-center gap-1"><FileText size={14}/> Aadhar Document</p>
                                <img src={customer.aadharUrl} alt="Aadhar" className="w-full h-40 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(customer.aadharUrl, '_blank')} />
                              </div>
                            )}

                            <div className="flex gap-3">
                              <button 
                                onClick={() => handleAction('customer', 'approve', customer.id)}
                                disabled={actionLoading === customer.id}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
                              >
                                {actionLoading === customer.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                Approve
                              </button>
                              <button 
                                onClick={() => handleAction('customer', 'reject', customer.id)}
                                disabled={actionLoading === customer.id}
                                className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
                              >
                                <XCircle size={18} /> Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'VENDORS' && (
                  <div className="space-y-6">
                    {vendors.length === 0 ? (
                      <div className="text-center py-20">
                        <Briefcase size={48} className="text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-700">No pending vendor requests</h3>
                        <p className="text-gray-500 mt-2">All vendor applications have been processed.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {vendors.map((vendor) => (
                          <div key={vendor.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] transition-all flex flex-col">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg mb-2">{vendor.category}</span>
                                <h3 className="font-bold text-gray-900 text-lg">{vendor.businessName}</h3>
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{vendor.description}</p>
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 rounded-xl p-4 mb-6 mt-auto space-y-3">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Phone</span>
                                <span className="font-semibold text-gray-800">{vendor.phoneNumber}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">PAN</span>
                                <span className="font-semibold text-gray-800 uppercase">{vendor.pan}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">GST</span>
                                <span className="font-semibold text-gray-800 uppercase">{vendor.gstNumber}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">State</span>
                                <span className="font-semibold text-gray-800">{vendor.state}</span>
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <button 
                                onClick={() => handleAction('vendor', 'approve', vendor.id)}
                                disabled={actionLoading === vendor.id}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
                              >
                                {actionLoading === vendor.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                Approve
                              </button>
                              <button 
                                onClick={() => handleAction('vendor', 'reject', vendor.id)}
                                disabled={actionLoading === vendor.id}
                                className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
                              >
                                <XCircle size={18} /> Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'SERVICES' && (
                  <div className="space-y-6">
                    {services.length === 0 ? (
                      <div className="text-center py-20">
                        <Server size={48} className="text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-700">No pending service requests</h3>
                        <p className="text-gray-500 mt-2">All vendor services have been processed.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {services.map((service) => (
                          <div key={service.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] transition-all flex flex-col">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <span className="inline-block px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg mb-2">{service.category}</span>
                                <h3 className="font-bold text-gray-900 text-lg">{service.name}</h3>
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{service.description}</p>
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 rounded-xl p-4 mb-6 mt-auto space-y-3">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Price</span>
                                <span className="font-semibold text-gray-800">₹{service.price}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Location</span>
                                <span className="font-semibold text-gray-800">{service.location || 'N/A'}</span>
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <button 
                                onClick={() => handleAction('service', 'approve', service.id)}
                                disabled={actionLoading === service.id}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
                              >
                                {actionLoading === service.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                Approve
                              </button>
                              <button 
                                onClick={() => handleAction('service', 'reject', service.id)}
                                disabled={actionLoading === service.id}
                                className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
                              >
                                <XCircle size={18} /> Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </CloudsBackground>
  );
}
