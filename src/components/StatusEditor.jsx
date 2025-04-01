import React, { useState } from 'react';
import styled from 'styled-components';
import { FaEdit, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { updatePrescriptionStatus } from '../services/dataService';

const StatusContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 1rem;
`;

const StatusControls = styled.div`
  display: flex;
  gap: 0.8rem;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const StatusDropdown = styled.select`
  padding: 0.6rem;
  border-radius: 4px;
  border: 1px solid var(--border);
  flex: 1;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background-color: ${props => props.primary ? 'var(--primary)' : props.danger ? '#e74c3c' : '#f1f1f1'};
  color: ${props => props.primary || props.danger ? 'white' : 'var(--text)'};
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StyledButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: ${props => props.color || 'var(--primary)'};
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

const StatusBadge = styled.span`
  background-color: ${props => {
    switch(props.status) {
      case 'Request Received': return '#3498db';
      case 'Entered into System': return '#f39c12';
      case 'Pharmacist Check': return '#e74c3c';
      case 'Prep & Packaging': return '#9b59b6';
      case 'Billing': return '#34495e';
      case 'Ready for Pickup': return '#2ecc71';
      case 'Completed': return '#7f8c8d';
      default: return 'var(--secondary)';
    }
  }};
  color: white;
  padding: 0.3rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
`;

const StatusEditor = ({ prescription, onStatusUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(prescription.status);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusNote, setStatusNote] = useState('');

  const statusOptions = [
    'Request Received',
    'Entered into System',
    'Pharmacist Check',
    'Prep & Packaging',
    'Billing',
    'Ready for Pickup',
    'Completed'
  ];

  const handleStatusChange = async () => {
    if (selectedStatus === prescription.status) {
      setIsEditing(false);
      return;
    }

    if (window.confirm(`Are you sure you want to update this prescription status to "${selectedStatus}"?`)) {
      setIsSubmitting(true);
      try {
        await updatePrescriptionStatus(prescription.id, selectedStatus, statusNote);
        if (onStatusUpdate) onStatusUpdate();
        setIsEditing(false);
      } catch (error) {
        console.error('Error updating prescription status:', error);
        alert('Failed to update prescription status');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <StatusContainer>
      {isEditing ? (
        <>
          <StatusControls>
            <StatusDropdown 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </StatusDropdown>
          </StatusControls>
          
          <textarea
            placeholder="Add a note about this status change (optional)"
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
            style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem', minHeight: '80px' }}
          />
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <ActionButton 
              primary 
              onClick={handleStatusChange}
              disabled={isSubmitting}
            >
              <FaCheckCircle /> Update Status
            </ActionButton>
            <ActionButton 
              onClick={() => setIsEditing(false)}
              disabled={isSubmitting}
            >
              <FaTimesCircle /> Cancel
            </ActionButton>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <StatusBadge status={prescription.status}>
            {prescription.status}
          </StatusBadge>
          <StyledButton onClick={() => setIsEditing(true)}>
            <FaEdit /> Edit Status
          </StyledButton>
        </div>
      )}
    </StatusContainer>
  );
};

export default StatusEditor;