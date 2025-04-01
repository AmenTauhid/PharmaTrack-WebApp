import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import styled from 'styled-components';

const LoginContainer = styled.div`
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--background);
`;

const LoginCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h1`
  text-align: center;
  color: var(--primary);
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const SubmitButton = styled.button`
  margin-top: 1rem;
  padding: 0.8rem;
  font-size: 1rem;
`;

const ErrorMessage = styled.div`
  color: var(--error);
  background-color: rgba(231, 76, 60, 0.1);
  padding: 0.8rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
`;

const DemoCredentials = styled.div`
  margin-top: 1.5rem;
  padding: 0.8rem;
  background-color: var(--light-gray);
  border-radius: 4px;
  font-size: 0.9rem;
`;

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, authError } = useAuth();
  const navigate = useNavigate();

  // Update error state when authError changes
  useEffect(() => {
    if (authError) {
      const errorCode = authError.code;
      let errorMessage;
      
      switch (errorCode) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'Invalid email or password. Please try again.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email format.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed login attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        default:
          errorMessage = `Login error: ${authError.message}`;
      }
      
      setError(errorMessage);
    }
  }, [authError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    
    try {
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (error) {
      // Error is handled in useEffect via authError
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Title>PharmaTrack</Title>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Form onSubmit={handleSubmit}>
          <Label>Email</Label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          
          <Label>Password</Label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          
          <SubmitButton type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </SubmitButton>
        </Form>
        
        <DemoCredentials>
          <p><strong>Demo Credentials:</strong></p>
          <p>Email: pharmacist@example.com</p>
          <p>Password: password123</p>
          <p>(You need to set up these credentials in Firebase Authentication)</p>
        </DemoCredentials>
      </LoginCard>
    </LoginContainer>
  );
}

export default Login;