import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiUser,
  FiLock,
  FiSliders,
  FiSave,
  FiMail,
  FiPhone,
  FiEye,
  FiEyeOff,
} from 'react-icons/fi';
import {
  getSettings,
  updateProfile,
  updatePassword,
  updatePreferences,
} from '../store/slices/settingsSlice';

const TABS = [
  { key: 'profile', label: 'Profile', icon: FiUser },
  { key: 'security', label: 'Security', icon: FiLock },
  { key: 'preferences', label: 'Preferences', icon: FiSliders },
];

const inputClass =
  'w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors disabled:bg-slate-50 disabled:text-slate-400';
const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5';

const Settings = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('profile');
  const { profile, preferences, loading } = useSelector((state) => state.settings);

  useEffect(() => {
    dispatch(getSettings());
  }, [dispatch]);

  return (
    <div>
      <p className="text-sm text-slate-500 mb-5">
        Manage your profile, password, and notification preferences.
      </p>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Tabs — vertical on desktop, horizontal pills on mobile */}
        <div className="lg:w-56 shrink-0">
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel */}
        <div className="flex-1 min-w-0">
          {loading && !profile ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-10 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'profile' && <ProfileTab profile={profile} />}
              {activeTab === 'security' && <SecurityTab />}
              {activeTab === 'preferences' && <PreferencesTab preferences={preferences} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------- Profile Tab ----------------
const ProfileTab = ({ profile }) => {
  const dispatch = useDispatch();
  const { savingProfile } = useSelector((state) => state.settings);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(updateProfile(form));
  };

  const initial = form.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-800">Profile Information</h2>
        <p className="text-xs text-slate-500 mt-0.5">Update your name, email, and contact number.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-5">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {initial}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{form.name || 'Your name'}</p>
            <p className="text-xs text-slate-500">{profile?.role || 'User'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Full Name *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Email Address *</label>
            <div className="relative">
              <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>
          <div className="sm:col-span-2 sm:max-w-xs">
            <label className={labelClass}>Phone Number</label>
            <div className="relative">
              <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+971 50 123 4567"
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={savingProfile}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSave size={15} />
            {savingProfile ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ---------------- Security Tab ----------------
const SecurityTab = () => {
  const dispatch = useDispatch();
  const { savingPassword } = useSelector((state) => state.settings);
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState(false);
  const [formError, setFormError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (form.newPassword.length < 6) {
      setFormError('New password must be at least 6 characters');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setFormError('New password and confirmation do not match');
      return;
    }

    const result = await dispatch(
      updatePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      }),
    );

    if (updatePassword.fulfilled.match(result)) {
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }
  };

  const inputType = showPasswords ? 'text' : 'password';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-800">Change Password</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Use a strong password you're not using anywhere else.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-5 max-w-sm">
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Current Password *</label>
            <input
              type={inputType}
              name="currentPassword"
              value={form.currentPassword}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>New Password *</label>
            <input
              type={inputType}
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              required
              minLength={6}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Confirm New Password *</label>
            <input
              type={inputType}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
              className={inputClass}
            />
          </div>

          <button
            type="button"
            onClick={() => setShowPasswords((s) => !s)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            {showPasswords ? <FiEyeOff size={14} /> : <FiEye size={14} />}
            {showPasswords ? 'Hide passwords' : 'Show passwords'}
          </button>

          {formError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {formError}
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={savingPassword}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSave size={15} />
            {savingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ---------------- Preferences Tab ----------------
const ToggleRow = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between py-3.5 border-b border-slate-100 last:border-0">
    <div className="pr-4">
      <p className="text-sm font-medium text-slate-800">{label}</p>
      {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-blue-600' : 'bg-slate-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

const PreferencesTab = ({ preferences }) => {
  const dispatch = useDispatch();
  const { savingPreferences } = useSelector((state) => state.settings);
  const [form, setForm] = useState({
    emailNotifications: true,
    expiryReminderDays: 30,
    dateFormat: 'dd MMM yyyy',
    itemsPerPage: 10,
  });

  useEffect(() => {
    if (preferences) {
      setForm({
        emailNotifications: preferences.emailNotifications ?? true,
        expiryReminderDays: preferences.expiryReminderDays ?? 30,
        dateFormat: preferences.dateFormat ?? 'dd MMM yyyy',
        itemsPerPage: preferences.itemsPerPage ?? 10,
      });
    }
  }, [preferences]);

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: Number(value) || value }));
  };

  const handleSave = () => {
    dispatch(updatePreferences(form));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-800">Notifications &amp; Display</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Control how and when you're notified about expiring documents.
        </p>
      </div>

      <div className="p-5">
        <ToggleRow
          label="Email notifications"
          description="Get emailed when a document is approaching its expiry date"
          checked={form.emailNotifications}
          onChange={(val) => setForm((prev) => ({ ...prev, emailNotifications: val }))}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <div>
            <label className={labelClass}>Remind me before expiry</label>
            <select
              name="expiryReminderDays"
              value={form.expiryReminderDays}
              onChange={handleSelectChange}
              className={inputClass}
            >
              <option value={7}>7 days before</option>
              <option value={15}>15 days before</option>
              <option value={30}>30 days before</option>
              <option value={60}>60 days before</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Date format</label>
            <select
              name="dateFormat"
              value={form.dateFormat}
              onChange={handleSelectChange}
              className={inputClass}
            >
              <option value="dd MMM yyyy">31 Dec 2026</option>
              <option value="MM/dd/yyyy">12/31/2026</option>
              <option value="yyyy-MM-dd">2026-12-31</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Rows per page</label>
            <select
              name="itemsPerPage"
              value={form.itemsPerPage}
              onChange={handleSelectChange}
              className={inputClass}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={savingPreferences}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSave size={15} />
            {savingPreferences ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;