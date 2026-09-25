import { createContext, useContext, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Create the context
export const AuthContext = createContext(null);

export const genderOptions = [
  {
    value: 'male',
    label: 'Male',
    icon: (
      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="10" cy="14" r="5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 5l-5.4 5.4M19 5h-5M19 5v5" />
      </svg>
    ),
  },
  {
    value: 'female',
    label: 'Female',
    icon: (
      <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="9" r="5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v7M9 18h6" />
      </svg>
    ),
  },
  {
    value: 'other',
    label: 'Other / Non-binary',
    icon: (
      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        <circle cx="12" cy="12" r="7" />
      </svg>
    ),
  },
];

const initialFormData = {
  fullName: '',
  userName: '',
  password: '',
  confirmPassword: '',
  gender: 'male',
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [authUser, setAuthUser] = useState(() => {
    try {
      const stored = localStorage.getItem('chat-user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError('');
  };

  const handleGenderSelect = (val) => {
    setFormData((prev) => ({
      ...prev,
      gender: val,
    }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setError('');
    setSuccess('');
  };

  const signup = async (customData) => {
    const data = customData || formData;
    setLoading(true);
    setError('');
    setSuccess('');

    // Client-side validation
    if (!data.fullName?.trim() || !data.userName?.trim() || !data.password || !data.confirmPassword || !data.gender) {
      const msg = 'All fields are required';
      setError(msg);
      setLoading(false);
      return { success: false, error: msg };
    }

    if (data.password !== data.confirmPassword) {
      const msg = 'Passwords do not match';
      setError(msg);
      setLoading(false);
      return { success: false, error: msg };
    }

    // Enforce strong password: >=8 chars, uppercase, lowercase, number, special char
    const minLength = data.password.length >= 8;
    const hasUpper = /[A-Z]/.test(data.password);
    const hasLower = /[a-z]/.test(data.password);
    const hasNumber = /[0-9]/.test(data.password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=\\/\[\]]/.test(data.password);

    if (!minLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      const msg = 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.';
      setError(msg);
      toast.error(msg);
      setLoading(false);
      return { success: false, error: msg };
    }

    try {
      const { data } = await axios.post('/api/user/register', {
        fullName: data.fullName.trim(),
        userName: data.userName.trim(),
        password: data.password,
        confirmPassword: data.confirmPassword,
        gender: data.gender,
      });

      if (data.success) {
        setSuccess(data.message || 'Account created successfully!');
        toast.success(data.message || 'Account created successfully!');
        navigate('/login');
        setLoading(false);
        return { success: true, data };
      } else {
        setError(data.message || 'Signup failed');
        toast.error(data.message || 'Signup failed');
        setLoading(false);
        return { success: false, error: data.message };
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Signup failed';
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
      return { success: false, error: errorMsg };
    }
  };

  const login = async ({ userName, password }) => {
    setLoading(true);
    setError('');
    setSuccess('');

    if (!userName?.trim() || !password) {
      const msg = 'All fields are required';
      setError(msg);
      toast.error(msg);
      setLoading(false);
      return { success: false, error: msg };
    }

    try {
      const { data } = await axios.post('/api/user/login', {
        userName: userName.trim(),
        password,
      });

      if (data.success) {
        if (data.user) {
          setAuthUser(data.user);
          try {
            localStorage.setItem('chat-user', JSON.stringify(data.user));
          } catch (storageErr) {
            console.error('Storage error:', storageErr);
          }
        }
        setSuccess(data.message || 'Login successful!');
        toast.success(data.message || 'Login successful!');
        navigate('/');
        setLoading(false);
        return { success: true, data };
      } else {
        setError(data.message || 'Login failed');
        toast.error(data.message || 'Login failed');
        setLoading(false);
        return { success: false, error: data.message };
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Login failed';
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
      return { success: false, error: errorMsg };
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post('/api/user/logout');
      setAuthUser(null);
      localStorage.removeItem('chat-user');
      navigate('/login');
      toast.success(data?.message || 'Logged out successfully');
    } catch (err) {
      console.error('Logout error:', err);
      setAuthUser(null);
      localStorage.removeItem('chat-user');
      navigate('/login');
      toast.error(err.response?.data?.error || err.message || 'Logout failed');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async ({ fullName, profilePhoto, gender }) => {
    setLoading(true);
    try {
      const { data } = await axios.put('/api/user/profile', {
        fullName,
        profilePhoto,
        gender,
      });

      if (data.success) {
        if (data.user) {
          setAuthUser(data.user);
          try {
            localStorage.setItem('chat-user', JSON.stringify(data.user));
          } catch (storageErr) {
            console.error('Storage error:', storageErr);
          }
        }
        toast.success(data.message || 'Profile updated successfully!');
        setLoading(false);
        return { success: true, user: data.user };
      } else {
        toast.error(data.message || 'Failed to update profile');
        setLoading(false);
        return { success: false, error: data.message };
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Failed to update profile';
      toast.error(errorMsg);
      setLoading(false);
      return { success: false, error: errorMsg };
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    return await signup(formData);
  };

  const value = {
    formData,
    setFormData,
    genderOptions,
    loading,
    setLoading,
    error,
    setError,
    success,
    setSuccess,
    authUser,
    setAuthUser,
    handleChange,
    handleGenderSelect,
    handleSubmit,
    signup,
    login,
    logout,
    updateProfile,
    resetForm,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom Hook to consume AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Alias for convenience
export const useAuthContext = useAuth;

export default AuthContext;
