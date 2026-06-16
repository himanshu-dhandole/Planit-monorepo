import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../lib/apiClient';
import { toast } from 'sonner';
import { Camera, FileText, User, MapPin, Phone, CheckCircle, Clock, AlertCircle, Loader2, Shield } from 'lucide-react';
import CloudsBackground from './CloudsBackground';

export default function Profile() {
  const { user, refreshUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customerId, setCustomerId] = useState(null);
  const [status, setStatus] = useState('PENDING'); // PENDING, VERIFIED, NOT_VERIFIED
  const [isEditing, setIsEditing] = useState(true);
  
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    phoneNumber: '',
    bio: '',
    addressLine1: '',
    addressLine2: '',
    state: '',
    pincode: ''
  });

  const [files, setFiles] = useState({
    profilePic: null,
    aadhar: null
  });

  const [preview, setPreview] = useState({
    profilePic: null,
    aadhar: null
  });

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const res = await apiClient.get(`/api/customer/user/${user.id}`);
      if (res.data) {
        // Backend returns an ApiResponse wrapper: { timeStamp, data: {...}, error }
        const profile = res.data.data || res.data;
        
        if (profile && profile.id) {
          setCustomerId(profile.id);
          setStatus(profile.verificationStatus || 'PENDING');
          setFormData({
            firstName: profile.firstName || '',
            middleName: profile.middleName || '',
            lastName: profile.lastName || '',
            phoneNumber: profile.phoneNumber || '',
            bio: profile.bio || '',
            addressLine1: profile.addressLine1 || '',
            addressLine2: profile.addressLine2 || '',
            state: profile.state || '',
            pincode: profile.pincode || ''
          });
          setPreview({
            profilePic: profile.profilePictureUrl || null,
            aadhar: profile.aadharUrl || null
          });
          setIsEditing(false); // Found a profile, so default to read-only
        }
      }
    } catch (err) {
      if (err.response?.status !== 404 && err.response?.status !== 500) {
        console.error("Error fetching profile:", err);
      }
      // If 404 or error, it means profile might not exist yet, which is fine
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    console.log(`[Profile.jsx] File selected for ${field}:`, file ? file.name : 'No file selected');
    if (file) {
      setFiles(prev => ({ ...prev, [field]: file }));
      setPreview(prev => ({ ...prev, [field]: URL.createObjectURL(file) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("[Profile.jsx] Starting profile save process...");
    console.log("[Profile.jsx] Current customerId:", customerId);
    console.log("[Profile.jsx] Files state:", files);
    
    setSaving(true);
    
    try {
      const data = new FormData();
      
      const customerDto = {
        userId: user.id,
        ...formData
      };
      
      console.log("[Profile.jsx] Customer DTO being sent:", customerDto);
      
      data.append('customer', new Blob([JSON.stringify(customerDto)], {
        type: "application/json"
      }));

      if (files.profilePic) {
        console.log("[Profile.jsx] Appending profilePic file to FormData");
        data.append('profilePic', files.profilePic);
      }
      if (files.aadhar) {
        console.log("[Profile.jsx] Appending aadhar file to FormData");
        data.append('aadhar', files.aadhar);
      }

      let res;
      if (customerId) {
        // Update
        console.log(`[Profile.jsx] Sending PUT request to /api/customer/${customerId}`);
        res = await apiClient.put(`/api/customer/${customerId}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        console.log("[Profile.jsx] PUT request successful. Response:", res.data);
        toast.success("Profile updated successfully!");
      } else {
        // Create
        console.log("[Profile.jsx] Sending POST request to /api/customer");
        res = await apiClient.post(`/api/customer`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        console.log("[Profile.jsx] POST request successful. Response:", res.data);
        toast.success("Profile created successfully!");
      }
      
      if (res.data) {
        const savedProfile = res.data.data || res.data;
        setStatus(savedProfile.verificationStatus || 'PENDING');
        setPreview({
          profilePic: savedProfile.profilePictureUrl || preview.profilePic,
          aadhar: savedProfile.aadharUrl || preview.aadhar
        });
        setFiles({ profilePic: null, aadhar: null }); // Clear selected files after successful upload
        setIsEditing(false); // Switch back to read-only after saving
        
        // Refresh token to get the updated CUSTOMER role
        await refreshUser();
      }

    } catch (err) {
      console.error("[Profile.jsx] Error occurred during save:", err);
      console.error("[Profile.jsx] Error Response Data:", err.response?.data);
      console.error("[Profile.jsx] Detailed Backend Error:", err.response?.data?.error);
      console.error("[Profile.jsx] Error Status:", err.response?.status);
      toast.error(err.response?.data?.message || "Failed to save profile. Please check the fields.");
    } finally {
      console.log("[Profile.jsx] Save process finished.");
      setSaving(false);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'VERIFIED':
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold border border-green-200 shadow-sm"><CheckCircle size={14}/> Verified</span>;
      case 'NOT_VERIFIED':
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold border border-red-200 shadow-sm"><AlertCircle size={14}/> Not Verified</span>;
      default:
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold border border-yellow-200 shadow-sm"><Clock size={14}/> Pending Verification</span>;
    }
  };

  if (loading) {
    return (
      <CloudsBackground>
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="animate-spin text-blue-500" size={48} />
        </div>
      </CloudsBackground>
    );
  }

  return (
    <CloudsBackground>
      <div className="flex-1 pt-32 relative font-sans w-full py-12 px-4 sm:px-6 lg:px-8 overflow-y-auto z-10">
        <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center">
                {preview.profilePic ? (
                  <img src={preview.profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-gray-300" />
                )}
              </div>
              <label className={`absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 transition-colors text-white p-2.5 rounded-full shadow-lg cursor-pointer transform translate-x-2 -translate-y-2 group-hover:scale-110 ${!isEditing && 'hidden'}`}>
                <Camera size={18} />
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'profilePic')} disabled={!isEditing} />
              </label>
            </div>
            
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {formData.firstName || formData.lastName ? `${formData.firstName} ${formData.lastName}` : 'Complete Your Profile'}
              </h1>
              <p className="text-gray-500 font-medium">{user?.email}</p>
              
              {user?.roles && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {(Array.isArray(user.roles) ? user.roles : [user.roles]).map((role, idx) => {
                    const roleName = typeof role === 'string' ? role.replace('ROLE_', '').replace('_', ' ') : String(role);
                    return (
                      <span key={idx} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 shadow-sm">
                        <Shield size={14} />
                        <span className="capitalize">{roleName.toLowerCase()}</span>
                      </span>
                    );
                  })}
                </div>
              )}

              <div className="mt-3">
                {getStatusBadge()}
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 self-start md:self-center">
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)} 
                className="bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 px-6 py-2.5 rounded-xl shadow-sm transition-all font-semibold flex items-center gap-2"
              >
                Edit Profile
              </button>
            )}
            {isEditing && (
              <button 
                onClick={handleSubmit} 
                disabled={saving}
                className="bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-xl shadow-md transition-all font-semibold flex items-center gap-2 disabled:opacity-70"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : null}
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            )}
          </div>
        </div>

        {/* Main Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Info Card */}
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-white">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <User className="text-blue-500" /> Personal Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} disabled={!isEditing} required className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-800 shadow-sm disabled:opacity-60 disabled:bg-gray-50" placeholder="John" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Middle Name</label>
                  <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} disabled={!isEditing} className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-800 shadow-sm disabled:opacity-60 disabled:bg-gray-50" placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} disabled={!isEditing} required className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-800 shadow-sm disabled:opacity-60 disabled:bg-gray-50" placeholder="Doe" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-gray-400"><Phone size={18} /></span>
                    <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} disabled={!isEditing} required className="w-full bg-white pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-800 shadow-sm disabled:opacity-60 disabled:bg-gray-50" placeholder="+1 (555) 000-0000" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                  <textarea name="bio" value={formData.bio} onChange={handleChange} disabled={!isEditing} rows="4" className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-800 shadow-sm resize-none disabled:opacity-60 disabled:bg-gray-50" placeholder="Tell us a bit about yourself..."></textarea>
                </div>
              </div>
            </div>

            {/* Address Card */}
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-white">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <MapPin className="text-rose-500" /> Address Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 1 *</label>
                  <input type="text" name="addressLine1" value={formData.addressLine1} onChange={handleChange} disabled={!isEditing} required className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all text-gray-800 shadow-sm disabled:opacity-60 disabled:bg-gray-50" placeholder="Street Address" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 2</label>
                  <input type="text" name="addressLine2" value={formData.addressLine2} onChange={handleChange} disabled={!isEditing} className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all text-gray-800 shadow-sm disabled:opacity-60 disabled:bg-gray-50" placeholder="Apartment, suite, etc." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">State *</label>
                  <input type="text" name="state" value={formData.state} onChange={handleChange} disabled={!isEditing} required className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all text-gray-800 shadow-sm disabled:opacity-60 disabled:bg-gray-50" placeholder="Your State" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Pincode *</label>
                  <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} disabled={!isEditing} required className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all text-gray-800 shadow-sm disabled:opacity-60 disabled:bg-gray-50" placeholder="000000" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Identity Card */}
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-white">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FileText className="text-amber-500" /> Identity Verification
              </h3>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">Please upload a clear picture of your Aadhar card for verification. This helps us maintain a secure platform.</p>
                
                <div className={`w-full h-48 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 flex flex-col items-center justify-center relative overflow-hidden group transition-colors ${isEditing ? 'hover:bg-gray-100' : ''}`}>
                  {preview.aadhar ? (
                    <div className="w-full h-full relative">
                      <img src={preview.aadhar} alt="Aadhar" className="w-full h-full object-cover" />
                      {isEditing && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white font-medium bg-black/50 px-4 py-2 rounded-lg">Change File</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center px-4">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Camera size={24} />
                      </div>
                      <p className="text-sm font-medium text-gray-700">Click to upload Aadhar</p>
                      <p className="text-xs text-gray-400 mt-1">JPEG, PNG or JPG (max. 5MB)</p>
                    </div>
                  )}
                  {isEditing && (
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => handleFileChange(e, 'aadhar')} />
                  )}
                </div>
              </div>
            </div>
            
          </div>
          
        </div>
      </div>
      </div>
    </CloudsBackground>
  );
}
