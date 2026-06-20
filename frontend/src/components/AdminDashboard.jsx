import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../lib/apiClient';
import { toast } from 'sonner';
import { Users, Briefcase, CheckCircle, XCircle, FileText, Loader2, ArrowRight, Server, Scale, X, AlertTriangle, Search } from 'lucide-react';
import CloudsBackground from './CloudsBackground';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard() {
  const { user, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('CUSTOMERS'); // CUSTOMERS, VENDORS, SERVICES, DISPUTES, COMPLAINTS, AUDIT_TRAIL
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [services, setServices] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [auditTrail, setAuditTrail] = useState([]);

  // Complaints state
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [complaintActionType, setComplaintActionType] = useState('RESOLVE'); // RESOLVE or DISMISS
  const [complaintBlame, setComplaintBlame] = useState('VENDOR_FAULT'); // VENDOR_FAULT, CUSTOMER_FAULT, SYSTEM_FAULT, UNDETERMINED
  const [dismissMalicious, setDismissMalicious] = useState(false);

  // Audit Logs search ID
  const [searchUserId, setSearchUserId] = useState('');

  const [selectedDispute, setSelectedDispute] = useState(null);
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
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
        setCustomers(Array.isArray(res.data?.data) ? res.data.data : []);
      } else if (activeTab === 'VENDORS') {
        const res = await apiClient.get('/api/admin/requests/vendor');
        setVendors(Array.isArray(res.data?.data) ? res.data.data : []);
      } else if (activeTab === 'SERVICES') {
        const res = await apiClient.get('/api/admin/requests/service');
        setServices(Array.isArray(res.data?.data) ? res.data.data : []);
      } else if (activeTab === 'DISPUTES') {
        const res = await apiClient.get('/api/admin/disputes');
        let dataList = [];
        if (res.data?.data?.content && Array.isArray(res.data.data.content)) {
          dataList = res.data.data.content;
        } else if (res.data?.data && Array.isArray(res.data.data)) {
          dataList = res.data.data;
        } else if (res.data?.content && Array.isArray(res.data.content)) {
          dataList = res.data.content;
        } else if (Array.isArray(res.data)) {
          dataList = res.data;
        }
        setDisputes(dataList);
      } else if (activeTab === 'COMPLAINTS') {
        const res = await apiClient.get('/api/admin/complaints');
        const dataList = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
        setComplaints(dataList);
      } else if (activeTab === 'AUDIT_TRAIL') {
        const url = searchUserId.trim() 
          ? `/api/admin/aura/user/${searchUserId.trim()}`
          : '/api/admin/aura/audit-trail';
        const res = await apiClient.get(url);
        const dataList = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
        setAuditTrail(dataList);
      }
    } catch (err) {
      console.error(`Error fetching ${activeTab.toLowerCase()} requests:`, err);
      toast.error(`Failed to load ${activeTab.toLowerCase()} requests`);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDispute = async (e) => {
    e.preventDefault();
    if (!selectedDispute) return;
    setActionLoading(selectedDispute.id);
    try {
      const endpoint = `/api/admin/disputes/${selectedDispute.id}/status`;
      await apiClient.patch(endpoint, {
        newStatus,
        resolutionNote
      });
      toast.success("Dispute status updated successfully");
      setIsResolutionModalOpen(false);
      setSelectedDispute(null);
      fetchData();
    } catch (err) {
      console.error("Error updating dispute status:", err);
      toast.error(err.response?.data?.message || "Failed to update dispute status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolveComplaintSubmit = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setActionLoading(selectedComplaint.id);
    try {
      const endpoint = `/api/admin/complaints/${selectedComplaint.id}/resolve?blame=${complaintBlame}`;
      await apiClient.post(endpoint);
      toast.success("Complaint resolved successfully and Aura updated.");
      setIsComplaintModalOpen(false);
      setSelectedComplaint(null);
      fetchData();
    } catch (err) {
      console.error("Error resolving complaint:", err);
      toast.error(err.response?.data?.message || "Failed to resolve complaint");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDismissComplaint = async (complaintId, malicious) => {
    setActionLoading(complaintId);
    try {
      const endpoint = `/api/admin/complaints/${complaintId}/dismiss?malicious=${malicious}`;
      await apiClient.post(endpoint);
      toast.success(`Complaint dismissed successfully ${malicious ? 'as malicious' : ''}`);
      setIsComplaintModalOpen(false);
      setSelectedComplaint(null);
      fetchData();
    } catch (err) {
      console.error("Error dismissing complaint:", err);
      toast.error(err.response?.data?.message || "Failed to dismiss complaint");
    } finally {
      setActionLoading(null);
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
          <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white flex flex-col xl:flex-row items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Dashboard</h1>
              <p className="text-gray-600 font-medium mt-1">Manage platform approvals and resolve user disputes</p>
            </div>
            
            <div className="flex flex-wrap bg-gray-100/80 p-1.5 rounded-2xl border border-white/50 backdrop-blur-md gap-1">
              <button
                onClick={() => setActiveTab('CUSTOMERS')}
                className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'CUSTOMERS' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Users size={18} /> Customers
              </button>
              <button
                onClick={() => setActiveTab('VENDORS')}
                className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'VENDORS' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Briefcase size={18} /> Vendors
              </button>
              <button
                onClick={() => setActiveTab('SERVICES')}
                className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'SERVICES' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Server size={18} /> Services
              </button>
              <button
                onClick={() => setActiveTab('DISPUTES')}
                className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'DISPUTES' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Scale size={18} /> Disputes
              </button>
              <button
                onClick={() => setActiveTab('COMPLAINTS')}
                className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'COMPLAINTS' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <AlertTriangle size={18} /> Complaints
              </button>
              <button
                onClick={() => setActiveTab('AUDIT_TRAIL')}
                className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'AUDIT_TRAIL' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <FileText size={18} /> Aura Logs
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

                {activeTab === 'DISPUTES' && (
                  <div className="space-y-6">
                    {disputes.length === 0 ? (
                      <div className="text-center py-20">
                        <Scale size={48} className="text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-700">No disputes found</h3>
                        <p className="text-gray-500 mt-2">All disputes have been resolved or none have been raised yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {disputes.map((dispute) => (
                          <div key={dispute.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] transition-all flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <span className="inline-block px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg mb-2">
                                    {dispute.type ? dispute.type.replace(/_/g, ' ') : 'DISPUTE'}
                                  </span>
                                  <h3 className="font-bold text-gray-900 text-lg">Dispute #{dispute.id}</h3>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  dispute.status === 'OPEN' ? 'bg-red-50 text-red-600 border border-red-100' :
                                  dispute.status === 'IN_REVIEW' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                  dispute.status === 'RESOLVED' ? 'bg-green-50 text-green-600 border border-green-100' :
                                  'bg-gray-100 text-gray-600 border border-gray-200'
                                }`}>
                                  {dispute.status}
                                </span>
                              </div>
                              
                              <p className="text-sm text-gray-600 bg-gray-50/50 p-4 rounded-xl border border-gray-100/50 italic mb-4">
                                "{dispute.reason}"
                              </p>

                              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 mb-6 font-medium">
                                <div>
                                  <span className="block text-gray-400">Booking ID</span>
                                  <span className="font-semibold text-gray-700">#{dispute.bookingId}</span>
                                </div>
                                <div>
                                  <span className="block text-gray-400">Created At</span>
                                  <span className="font-semibold text-gray-700">
                                    {dispute.createdAt ? new Date(dispute.createdAt).toLocaleDateString() : 'N/A'}
                                  </span>
                                </div>
                                <div>
                                  <span className="block text-gray-400">Raised By User ID</span>
                                  <span className="font-semibold text-gray-700">#{dispute.raisedByUserId}</span>
                                </div>
                                <div>
                                  <span className="block text-gray-400">Against User ID</span>
                                  <span className="font-semibold text-gray-700">#{dispute.againstUserId}</span>
                                </div>
                              </div>

                              {dispute.resolutionNote && (
                                <div className="mt-2 mb-6 p-4 bg-blue-50/30 border border-blue-100/50 rounded-xl">
                                  <span className="block text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">Resolution Notes</span>
                                  <p className="text-sm text-blue-900">{dispute.resolutionNote}</p>
                                </div>
                              )}
                            </div>

                            <div className="mt-4">
                              <button
                                onClick={() => {
                                  setSelectedDispute(dispute);
                                  setNewStatus(dispute.status);
                                  setResolutionNote(dispute.resolutionNote || '');
                                  setIsResolutionModalOpen(true);
                                }}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                              >
                                <Scale size={18} />
                                Manage Dispute
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'COMPLAINTS' && (
                  <div className="space-y-6">
                    {complaints.length === 0 ? (
                      <div className="text-center py-20">
                        <AlertTriangle size={48} className="text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-700">No complaints found</h3>
                        <p className="text-gray-500 mt-2">All complaints have been resolved or dismissed.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {complaints.map((complaint) => (
                          <div key={complaint.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] transition-all flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h3 className="font-bold text-gray-900 text-lg">Complaint #{complaint.id}</h3>
                                  <p className="text-xs text-blue-600 font-bold mt-1">Booking ID: #{complaint.bookingId}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  complaint.status === 'OPEN' ? 'bg-red-50 text-red-600 border border-red-100' :
                                  complaint.status === 'RESOLVED' ? 'bg-green-50 text-green-600 border border-green-100' :
                                  'bg-gray-100 text-gray-600 border border-gray-200'
                                }`}>
                                  {complaint.status}
                                </span>
                              </div>
                              
                              <p className="text-sm text-gray-600 bg-gray-50/50 p-4 rounded-xl border border-gray-100/50 italic mb-4 font-medium">
                                "{complaint.description}"
                              </p>

                              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 mb-6 font-semibold">
                                <div>
                                  <span className="block text-gray-400">Raised By User</span>
                                  <span className="font-semibold text-gray-700">ID #{complaint.raisedByUserId}</span>
                                </div>
                                <div>
                                  <span className="block text-gray-400">Against User</span>
                                  <div className="flex flex-col gap-1">
                                    <span className="font-semibold text-gray-700">ID #{complaint.againstUserId}</span>
                                    {complaint.isAgainstUserRepeatOffender && (
                                      <span className="inline-block w-fit px-1.5 py-0.5 bg-red-100 text-red-700 text-[9px] font-black rounded animate-pulse">
                                        ⚠️ REPEAT OFFENDER ({complaint.againstUserResolvedComplaintsCount} cases)
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <span className="block text-gray-400">Raised At</span>
                                  <span className="font-semibold text-gray-700">
                                    {complaint.raisedAt ? new Date(complaint.raisedAt).toLocaleString() : 'N/A'}
                                  </span>
                                </div>
                                {complaint.status !== 'OPEN' && (
                                  <div>
                                    <span className="block text-gray-400">Blame Party</span>
                                    <span className="font-semibold text-gray-700">{complaint.blame || 'DISMISSED'}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {complaint.status === 'OPEN' && (
                              <div className="mt-4">
                                <button
                                  onClick={() => {
                                    setSelectedComplaint(complaint);
                                    setComplaintBlame('VENDOR_FAULT');
                                    setDismissMalicious(false);
                                    setComplaintActionType('RESOLVE');
                                    setIsComplaintModalOpen(true);
                                  }}
                                  className="w-full bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                                >
                                  <AlertTriangle size={18} />
                                  Manage Complaint
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'AUDIT_TRAIL' && (
                  <div className="space-y-6">
                    {/* Filter bar */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
                      <div className="relative flex-1 w-full">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="number"
                          placeholder="Search Audit Logs by User ID..."
                          value={searchUserId}
                          onChange={(e) => setSearchUserId(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-sm"
                        />
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={fetchData}
                          className="flex-1 sm:flex-initial px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
                        >
                          Search
                        </button>
                        <button
                          onClick={() => {
                            setSearchUserId('');
                            setTimeout(() => {
                              fetchData();
                            }, 50);
                          }}
                          className="flex-1 sm:flex-initial px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-all shadow-sm text-sm"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {/* Audit trail logs */}
                    {auditTrail.length === 0 ? (
                      <div className="text-center py-20 bg-white/60 rounded-3xl border border-white">
                        <FileText size={48} className="text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-700">No aura logs found</h3>
                        <p className="text-gray-500 mt-2">No aura transactions match the filter criteria.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                              <th className="px-6 py-4">ID</th>
                              <th className="px-6 py-4">User</th>
                              <th className="px-6 py-4">Role</th>
                              <th className="px-6 py-4">Change</th>
                              <th className="px-6 py-4">Aura Range</th>
                              <th className="px-6 py-4">Rule / Context</th>
                              <th className="px-6 py-4">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 text-sm">
                            {auditTrail.map((tx) => (
                              <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-bold text-gray-500">#{tx.id}</td>
                                <td className="px-6 py-4">
                                  <span className="font-semibold text-gray-800">User #{tx.userId}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                    tx.actionRole === 'VENDOR' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'
                                  }`}>
                                    {tx.actionRole}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`font-bold ${
                                    tx.amount >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {tx.amount >= 0 ? `+${tx.amount.toFixed(2)}` : tx.amount.toFixed(2)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                                  {tx.previousAura !== undefined && tx.previousAura !== null ? tx.previousAura.toFixed(1) : '500.0'} → {tx.newAura !== undefined && tx.newAura !== null ? tx.newAura.toFixed(1) : '500.0'}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="font-semibold text-gray-800 text-xs">{tx.ruleApplied}</div>
                                  <div className="text-gray-500 text-xs mt-0.5 font-medium">{tx.description}</div>
                                  <div className="flex gap-2 mt-1">
                                    {tx.bookingId && (
                                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                                        Booking: #{tx.bookingId}
                                      </span>
                                    )}
                                    {tx.complaintId && (
                                      <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold">
                                        Complaint: #{tx.complaintId}
                                      </span>
                                    )}
                                    {tx.reviewId && (
                                      <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-bold">
                                        Review: #{tx.reviewId}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-400 font-semibold whitespace-nowrap">
                                  {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </div>

      {/* Dispute Resolution Modal */}
      <AnimatePresence>
        {isResolutionModalOpen && selectedDispute && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setIsResolutionModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white/90 backdrop-blur-2xl border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-[2.5rem] p-8 md:p-10 z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                  <Scale className="text-blue-600" size={24} /> Resolve Dispute #{selectedDispute.id}
                </h3>
                <button 
                  onClick={() => setIsResolutionModalOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleResolveDispute} className="space-y-6">
                {/* Dispute Info */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm space-y-2">
                  <div>
                    <span className="font-semibold text-gray-500">Booking ID: </span>
                    <span className="font-medium text-gray-800">#{selectedDispute.bookingId}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500">Reason: </span>
                    <p className="text-gray-700 mt-1 bg-white p-3 rounded-xl border border-slate-100 italic">
                      "{selectedDispute.reason}"
                    </p>
                  </div>
                </div>

                {/* Status Dropdown */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">Update Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-4 py-3 bg-white/60 backdrop-blur-md border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-gray-800"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_REVIEW">IN REVIEW</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>

                {/* Resolution Notes */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">Resolution Notes</label>
                  <textarea
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="Provide details on the resolution, action taken, or reasoning..."
                    rows={4}
                    maxLength={2000}
                    className="w-full px-4 py-3 bg-white/60 backdrop-blur-md border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-gray-800 resize-none"
                  />
                  <div className="flex justify-end text-xs text-gray-400">
                    {resolutionNote.length}/2000 characters
                  </div>
                </div>

                {/* Submit buttons */}
                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsResolutionModalOpen(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 rounded-2xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading === selectedDispute.id}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 transition-all disabled:opacity-75"
                  >
                    {actionLoading === selectedDispute.id ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Complaint Resolution Modal */}
      <AnimatePresence>
        {isComplaintModalOpen && selectedComplaint && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setIsComplaintModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white/90 backdrop-blur-2xl border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-[2.5rem] p-8 md:p-10 z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                  <AlertTriangle className="text-red-500 animate-pulse" size={24} /> Manage Complaint #{selectedComplaint.id}
                </h3>
                <button 
                  onClick={() => setIsComplaintModalOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Info Block */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm space-y-2">
                  <div>
                    <span className="font-semibold text-gray-500">Booking ID: </span>
                    <span className="font-medium text-gray-800">#{selectedComplaint.bookingId}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500">Raised By: </span>
                    <span className="font-medium text-gray-800">User #{selectedComplaint.raisedByUserId}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500">Against: </span>
                    <span className="font-medium text-gray-800">User #{selectedComplaint.againstUserId}</span>
                    {selectedComplaint.isAgainstUserRepeatOffender && (
                      <span className="block mt-1 w-fit px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-black rounded animate-pulse">
                        ⚠️ WARNING: REPEAT OFFENDER ({selectedComplaint.againstUserResolvedComplaintsCount} resolved complaints)
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500">Reason: </span>
                    <p className="text-gray-700 mt-1 bg-white p-3 rounded-xl border border-slate-100 italic font-medium">
                      "{selectedComplaint.description}"
                    </p>
                  </div>
                </div>

                {/* Tabs inside Modal to choose Resolve vs Dismiss */}
                <div className="border-t border-slate-100 pt-6">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <button
                      type="button"
                      onClick={() => setComplaintActionType('RESOLVE')}
                      className={`py-2 rounded-xl text-sm font-bold border transition-all ${
                        complaintActionType === 'RESOLVE'
                          ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Resolve (Assign Blame)
                    </button>
                    <button
                      type="button"
                      onClick={() => setComplaintActionType('DISMISS')}
                      className={`py-2 rounded-xl text-sm font-bold border transition-all ${
                        complaintActionType === 'DISMISS'
                          ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Dismiss (Drop Charge)
                    </button>
                  </div>

                  {complaintActionType === 'RESOLVE' ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">Party at Fault</label>
                        <select
                          value={complaintBlame}
                          onChange={(e) => setComplaintBlame(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-bold text-gray-800"
                        >
                          <option value="VENDOR_FAULT">Vendor at Fault (Deduct Vendor Aura)</option>
                          <option value="CUSTOMER_FAULT">Customer at Fault (Deduct Customer Aura)</option>
                          <option value="SYSTEM_FAULT">System Error / Force Majeure (No Penalties)</option>
                          <option value="UNDETERMINED">Undetermined / Shared Blame</option>
                        </select>
                      </div>

                      <button
                        onClick={handleResolveComplaintSubmit}
                        disabled={actionLoading === selectedComplaint.id}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 transition-all disabled:opacity-75"
                      >
                        {actionLoading === selectedComplaint.id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          'Submit Resolution'
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 bg-amber-50/50 p-4 border border-amber-100 rounded-2xl">
                        <input
                          type="checkbox"
                          id="dismiss-malicious"
                          checked={dismissMalicious}
                          onChange={(e) => setDismissMalicious(e.target.checked)}
                          className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
                        />
                        <label htmlFor="dismiss-malicious" className="text-sm font-bold text-slate-700 select-none cursor-pointer">
                          Mark as Malicious (Penalizes customer aura)
                        </label>
                      </div>

                      <button
                        onClick={() => handleDismissComplaint(selectedComplaint.id, dismissMalicious)}
                        disabled={actionLoading === selectedComplaint.id}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 transition-all disabled:opacity-75"
                      >
                        {actionLoading === selectedComplaint.id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          dismissMalicious ? 'Dismiss & Penalize' : 'Dismiss Complaint'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </CloudsBackground>
  );
}
