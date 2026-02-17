import React, { useEffect, useState, useRef } from 'react';
import { User, Mail, Phone, Building, Save, Upload, FileText } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const Profile: React.FC = () => {
  const { user, session, refreshProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    farmName: '',
    khasraNumber: '',
    khataNumber: '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    setFormData({
      name: user.name ?? '',
      email: user.email ?? '',
      phone: user.phone ?? '',
      farmName: user.farmName ?? '',
      khasraNumber: user.khasraNumber ?? '',
      khataNumber: user.khataNumber ?? '',
    });
    setAvatarPreview(user.avatar ?? null);
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setAvatarPreview(null);
    setAvatarFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      return;
    }

    setErrorMessage(null);
    setSaving(true);

    let avatarUrl = user?.avatar ?? null;
    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop() || 'jpg';
      const filePath = `${session.user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true });

      if (uploadError) {
        setSaving(false);
        setErrorMessage(uploadError.message);
        return;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      avatarUrl = data.publicUrl;
    }

    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      farm_name: formData.farmName,
      khasra_number: formData.khasraNumber || null,
      khata_number: formData.khataNumber || null,
      avatar_url: avatarUrl,
    });

    if (error) {
      setSaving(false);
      setErrorMessage(error.message);
      return;
    }

    await refreshProfile();
    setSaving(false);
    alert('Profile updated successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture Section */}
        <Card className="p-6">
          <div className="text-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <div 
              className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleImageClick}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-16 h-16 text-green-600" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{formData.name}</h3>
            <p className="text-sm text-gray-500 mb-4">{formData.farmName}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={handleImageClick}>
                <Upload className="w-4 h-4 mr-2" />
                {avatarPreview ? 'Change Photo' : 'Upload Photo'}
              </Button>
              {avatarPreview && (
                <Button variant="outline" size="sm" onClick={handleRemoveImage}>
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">Max 5MB, JPG/PNG</p>
          </div>
        </Card>

        {/* Profile Form */}
        <Card className="p-6 lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="farmName" className="block text-sm font-medium text-gray-700 mb-2">
                  Farm Name
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="farmName"
                    name="farmName"
                    type="text"
                    value={formData.farmName}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="khasraNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Khasra Number <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="khasraNumber"
                    name="khasraNumber"
                    type="text"
                    value={formData.khasraNumber}
                    onChange={handleInputChange}
                    placeholder="Enter Khasra number"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="khataNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Khata Number <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="khataNumber"
                    name="khataNumber"
                    type="text"
                    value={formData.khataNumber}
                    onChange={handleInputChange}
                    placeholder="Enter Khata number"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              {errorMessage && (
                <p className="text-sm text-red-600 mb-4" role="alert">
                  {errorMessage}
                </p>
              )}
              <div className="flex justify-end space-x-4">
                <Button variant="outline">
                  Cancel
                </Button>
                <Button type="submit" className="flex items-center space-x-2" disabled={saving}>
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>

      {/* Additional Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
              <p className="text-sm text-gray-500">Receive alerts and updates via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <h4 className="text-sm font-medium text-gray-900">SMS Alerts</h4>
              <p className="text-sm text-gray-500">Receive urgent alerts via SMS</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Weather Updates</h4>
              <p className="text-sm text-gray-500">Daily weather forecasts and alerts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Profile;