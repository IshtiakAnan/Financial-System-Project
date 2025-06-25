import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Form, { FormField } from '../components/Form';
import api from '../services/api';
import { RootState } from '../store';
import { login } from '../store/slices/authSlice';

interface LoginCredentials {
  username: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: {
    id: number;
    username: string;
    role: { name: string };
  };
}

interface ApiError {
  response?: { data?: { detail?: string } };
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { accessToken } = useSelector((state: RootState) => state.auth);

  // Redirect if already logged in
  useEffect(() => {
    if (accessToken) {
      const redirectPath = location.state?.from?.pathname || '/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [accessToken, navigate, location]);

  const loginMutation = useMutation<LoginResponse, ApiError, LoginCredentials>({
    mutationFn: async (credentials) => {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    },
    onSuccess: (data) => {
      // Update Redux store
      dispatch(
        login({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          user: data.user,
        })
      );

      // Store tokens in localStorage for persistence
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('refreshToken', data.refresh_token);

      toast.success('Login successful!');
      const redirectPath = location.state?.from?.pathname || '/dashboard';
      navigate(redirectPath, { replace: true });
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Login failed');
    },
  });

  const formFields: FormField[] = [
    {
      name: 'username',
      label: 'Username',
      type: 'text',
      required: true,
      placeholder: 'Enter your username',
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      required: true,
      placeholder: 'Enter your password',
    },
  ];

  const handleSubmit = (values: LoginCredentials) => {
    loginMutation.mutate(values);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <Form
          fields={formFields}
          initialValues={{ username: '', password: '' }}
          onSubmit={(values: Record<string, any>) => handleSubmit(values as LoginCredentials)}
          isLoading={loginMutation.isPending}
          error={loginMutation.error?.response?.data?.detail}
          submitLabel="Sign in"
        />
      </div>
    </div>
  );
};

export default Login;