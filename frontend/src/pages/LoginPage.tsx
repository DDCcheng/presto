import React, { useState } from "react";
import { useNavigate,Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { useAuth } from "../hooks/useAuth";
import { login as loginApi } from "../services/api";
import ErrorPopup from "../components/common/ErrorPopup";
import { isBlank, isValidEmail, normalizeInput } from "../lib/utils";

const LoginPage =()=>{
  const navigate=useNavigate();
  const {login}=useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async ()=>{
    if (loading) return;

    const trimmedEmail = normalizeInput(email);
    const trimmedPassword = normalizeInput(password);

    if (isBlank(trimmedEmail) || isBlank(trimmedPassword)) {
      setError('Please enter email and password');
      return ;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const data=await loginApi({ email: trimmedEmail, password: trimmedPassword });
      login(data.token);
      navigate('/dashboard');
    }catch(error){
      setError( error instanceof Error ? error.message : 'Login failed');
    }finally{
      setLoading(false);
    }
  };

  const handleKeyDown =(e:React.KeyboardEvent)=>{
    if (e.key=='Enter') handleSubmit();
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Login</h1>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-invalid={!!error}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your email"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-invalid={!!error}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your password"
          />
        </div>

        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </Button>

        <p className="mt-4 text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">
            Register
          </Link>
        </p>
      </div>

      {error && (
        <div role="alert">
          <ErrorPopup message={error} onClose={() => setError(null)} />
        </div>
      )}
    </div>
  );
};
export default LoginPage;
