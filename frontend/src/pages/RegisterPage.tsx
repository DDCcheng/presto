import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { useAuth } from "../hooks/useAuth";
import { register as registerApi } from "../services/api";
import ErrorPopup from "../components/common/ErrorPopup";
import { isBlank, isValidEmail, normalizeInput } from "../lib/utils";

//register page for creating new user
const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  //form states
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  //ui states
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /*
   * Handles form submission for registration
   * Validates input and creates account via API
   */
  const handleSubmit = async () => {
    if (loading) return;
    //check required fields
    const trimmedEmail = normalizeInput(email);
    const trimmedName = normalizeInput(name);
    const trimmedPassword = normalizeInput(password);
    const trimmedConfirmPassword = normalizeInput(confirmPassword);

    if (isBlank(trimmedEmail) || isBlank(trimmedPassword) || isBlank(trimmedName) || isBlank(trimmedConfirmPassword)) {
      setError('Please fill in all fields');
      return;
    }

    //email format validation
    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    //passwords confirmation check 
    if (trimmedPassword !== trimmedConfirmPassword) {
      setError('Password do not match')
      return;
    }

    setLoading(true);
    try {
      //calling registration api
      const data = await registerApi({ email: trimmedEmail, password: trimmedPassword, name: trimmedName });
      login(data.token)
      navigate('/dashboard');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'register failed');
    } finally {
      setLoading(false);
    }
  };

  /*
   * Allows form submission via Enter key
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key == 'Enter') handleSubmit();
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">🪄 Presto</h1>
          <p className="text-gray-500 text-sm mt-1">Create your account</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your name"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
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
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your password"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Confirm your password"
          />
        </div>

        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={loading}
          aria-busy={loading}
          aria-disabled={loading}
        >
          {loading ? 'Registering ...' : 'Create Account'}
        </Button>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login
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
}

export default RegisterPage;
