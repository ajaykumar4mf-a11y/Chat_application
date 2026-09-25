import { createContext, useContext, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

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
      const response = await fetch('/api/user/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          fullName: data.fullName.trim(),
          userName: data.userName.trim(),
          password: data.password,
          confirmPassword: data.confirmPassword,
          gender: data.gender,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        const errorMsg = resData.error || resData.message || 'Signup failed';
        setError(errorMsg);
        toast.error(errorMsg);
        setLoading(false);
        return { success: false, error: errorMsg };
      }

      const successMsg = resData.message || 'Account created successfully!';
      setSuccess(successMsg);
      toast.success(successMsg);
      navigate('/login');
      setLoading(false);
      return { success: true, data: resData };
    } catch (err) {
      const errorMsg = err.message || 'Network error. Please try again.';
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
      const response = await fetch('/api/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userName: userName.trim(),
          password,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        const errorMsg = resData.error || resData.message || 'Login failed';
        setError(errorMsg);
        toast.error(errorMsg);
        setLoading(false);
        return { success: false, error: errorMsg };
      }

      if (resData.user) {
        setAuthUser(resData.user);
        try {
          localStorage.setItem('chat-user', JSON.stringify(resData.user));
        } catch (storageErr) {
          console.error('Storage error:', storageErr);
        }
      }

      const successMsg = resData.message || 'Login successful!';
      setSuccess(successMsg);
      toast.success(successMsg);
      navigate('/');
      setLoading(false);
      return { success: true, data: resData };
    } catch (err) {
      const errorMsg = err.message || 'Network error. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
      return { success: false, error: errorMsg };
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/logout', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      setAuthUser(null);
      localStorage.removeItem('chat-user');
      navigate('/login');
      toast.success(data?.message || 'Logged out successfully');
    } catch (err) {
      console.error('Logout error:', err);
      setAuthUser(null);
      localStorage.removeItem('chat-user');
      navigate('/login');
      toast.error('Logout failed');
    } finally {
      setLoading(false);
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
