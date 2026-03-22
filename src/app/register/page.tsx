'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { API_BASE } from '@/lib/api';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    password2: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.password !== formData.password2) {
      newErrors.password2 = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Register the user
      const registerResponse = await fetch(API_BASE + '/api/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json();
        // Handle validation errors from the backend
        if (errorData) {
          const backendErrors: Record<string, string> = {};
          Object.entries(errorData).forEach(([key, value]) => {
            if (Array.isArray(value) && value.length > 0) {
              backendErrors[key] = value[0] as string;
            } else if (typeof value === 'string') {
              backendErrors[key] = value;
            }
          });
          setErrors(backendErrors);
        }
        throw new Error('Registration failed');
      }

      // Show success message
      toast.success('Account created successfully!');
      
      // Redirect to login page with success parameter
      router.push('/login?registered=true');
    } catch (error) {
      console.error('Registration error:', error);
      if (Object.keys(errors).length === 0) {
        // Only set generic error if no specific errors were set
        toast.error('Registration failed. Please try again.');
        setErrors({ form: 'Registration failed. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-md mx-auto px-6">
        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Create an Account</h1>
            <p className="text-muted-foreground">
              Join Quant (h)Edge to access premium trading models
            </p>
          </div>

          {errors.form && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
              <p className="text-destructive">{errors.form}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="full_name" className="form-label">
                Full Name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                value={formData.full_name}
                onChange={handleChange}
                className={`form-input ${errors.full_name ? 'border-destructive' : ''}`}
                placeholder="John Doe"
              />
              {errors.full_name && <p className="mt-1 text-sm text-destructive">{errors.full_name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-input ${errors.email ? 'border-destructive' : ''}`}
                placeholder="john@example.com"
              />
              {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-input ${errors.password ? 'border-destructive' : ''}`}
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="password2" className="form-label">
                Confirm Password
              </label>
              <input
                id="password2"
                name="password2"
                type="password"
                value={formData.password2}
                onChange={handleChange}
                className={`form-input ${errors.password2 ? 'border-destructive' : ''}`}
                placeholder="••••••••"
              />
              {errors.password2 && <p className="mt-1 text-sm text-destructive">{errors.password2}</p>}
            </div>

            <div>
              <button
                type="submit"
                className="btn-primary w-full flex justify-center items-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>

            <div className="text-center mt-4">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  Log in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
