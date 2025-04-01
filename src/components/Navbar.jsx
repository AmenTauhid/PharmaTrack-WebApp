import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import styled from 'styled-components';
import { FaUser, FaComments, FaSignOutAlt } from 'react-icons/fa';

const NavContainer = styled.nav`
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 0.8rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled(Link)`
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 1.5rem;
  align-items: center;
`;

const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text);
  font-weight: 500;
  font-size: 0.9rem;
  transition: color 0.2s ease;
  
  &:hover {
    color: var(--primary);
  }
`;

const LogoutButton = styled.button`
  background: none;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background: var(--light-gray);
    color: var(--primary);
  }
`;

function Navbar() {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <NavContainer>
      <Logo to="/">
        PharmaTrack
      </Logo>
      
      {currentUser && (
        <NavLinks>
          <NavLink to="/">
            <FaUser /> Patients
          </NavLink>
          <NavLink to="/messages">
            <FaComments /> Messages
          </NavLink>
          <LogoutButton onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </LogoutButton>
        </NavLinks>
      )}
    </NavContainer>
  );
}

export default Navbar;