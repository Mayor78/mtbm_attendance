import React from 'react';
import { Mail, Lock, LogIn } from 'lucide-react';
import InputField from '../common/InputField';

const LoginForm = ({ formData, onChange, onSubmit, loading }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <InputField
        id="loginEmail"
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => onChange('email', e.target.value)}
        placeholder="your.email@university.edu"
        icon={Mail}
        required
        disabled={loading}
      />

      <InputField
        id="loginPassword"
        label="Password"
        type="password"
        value={formData.password}
        onChange={(e) => onChange('password', e.target.value)}
        placeholder="••••••••"
        icon={Lock}
        required
        disabled={loading}
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Signing in...
          </span>
        ) : (
          <>
            <LogIn size={16} className="mr-2" />
            Sign In
          </>
        )}
      </button>
    </form>
  );
};

export default LoginForm;