import React, { useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { FaPrescriptionBottleAlt, FaCommentMedical, FaCheckCircle, FaTimesCircle, FaUser, FaEdit } from 'react-icons/fa';
import { updatePrescriptionStatus, addPharmacistMessage } from '../services/dataService';

const Card = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  margin-bottom: 1rem;
  border-left: 4px solid ${props => {
    switch(props.status) {
      case 'Request Received': return 'var(--primary)';
      case 'Entered into System': return '#f39c12';
      case 'Pharmacist Check': return '#e74c3c';
      case 'Prep & Packaging': return '#9b59b6';
      case 'Billing': return '#34495e';
      case 'Ready for Pickup': return '#2ecc71';
      case 'Completed': return '#7f8c8d';
      // Support legacy camelCase status values too
      case 'requestReceived': return 'var(--primary)';
      case 'entered': return '#f39c12';
      case 'pharmacistCheck': return '#e74c3c';
      case 'prepPackaging': return '#9b59b6';
      case 'billing': return '#34495e';
      case 'readyForPickup': return '#2ecc71';
      case 'completed': return '#7f8c8d';
      default: return 'var(--secondary)';
    }
  }};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const Title = styled.h3`
  font-size: 1.2rem;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text);
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
      // Support legacy camelCase status values too
      case 'requestReceived': return '#3498db';
      case 'entered': return '#f39c12';
      case 'pharmacistCheck': return '#e74c3c';
      case 'prepPackaging': return '#9b59b6';
      case 'billing': return '#34495e';
      case 'readyForPickup': return '#2ecc71';
      case 'completed': return '#7f8c8d';
      default: return 'var(--secondary)';
    }
  }};
  color: white;
  padding: 0.3rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
`;

const InfoItem = styled.div`
  margin-bottom: 0.8rem;
  
  span:first-child {
    font-weight: 500;
    display: block;
    margin-bottom: 0.2rem;
    color: var(--text);
  }
  
  span:last-child {
    color: #666;
  }
`;

const PatientInfo = styled.div`
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PatientLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--primary);
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
`;

const ImageContainer = styled.div`
  margin: 1rem 0;
  text-align: center;
`;

const PrescriptionImage = styled.img`
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  border: 1px solid #eee;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
`;

const ExpandedImageOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ExpandedImage = styled.img`
  max-width: 90%;
  max-height: 80vh;
  border-radius: 8px;
`;

const CloseButton = styled.button`
  background-color: transparent;
  color: white;
  border: none;
  font-size: 1.2rem;
  position: absolute;
  top: 20px;
  right: 20px;
  cursor: pointer;
`;

const MessageSection = styled.div`
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
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

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  min-height: 100px;
  margin-bottom: 1rem;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: var(--primary);
  }
`;

const StatusContainer = styled.div`
  margin-bottom: 1rem;
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

function PrescriptionRequestCard({ prescription, patientName, onStatusUpdate }) {
  const [showFullImage, setShowFullImage] = useState(false);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(prescription.status);
  const [statusNote, setStatusNote] = useState('');
  
  // Define all possible status options
  const statusOptions = [
    'Request Received',
    'Entered into System',
    'Pharmacist Check',
    'Prep & Packaging',
    'Billing',
    'Ready for Pickup',
    'Completed'
  ];
  
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const handleStatusUpdate = async () => {
    if (selectedStatus === prescription.status) {
      setIsEditingStatus(false);
      return;
    }

    if (window.confirm(`Are you sure you want to update this prescription status to "${selectedStatus}"?`)) {
      setIsSubmitting(true);
      try {
        await updatePrescriptionStatus(prescription.id, selectedStatus, statusNote);
        setIsEditingStatus(false);
        if (onStatusUpdate) onStatusUpdate();
      } catch (error) {
        console.error('Error updating prescription status:', error);
        alert('Failed to update prescription status');
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    setIsSubmitting(true);
    try {
      await addPharmacistMessage(prescription.id, message);
      setMessage('');
      setShowMessageForm(false);
      if (onStatusUpdate) onStatusUpdate();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Display patient info if provided (when shown in dashboard view)
  const displayName = patientName || prescription.forUserName;
  
  return (
    <Card status={prescription.status}>
      {patientName && (
        <PatientInfo>
          <PatientLink to={`/patient/${prescription.forUser}`}>
            <FaUser /> {displayName}
          </PatientLink>
        </PatientInfo>
      )}
      
      <Header>
        <Title>
          <FaPrescriptionBottleAlt /> {prescription.medicationName}
        </Title>
      </Header>
      
      {/* Status editor/display section */}
      <StatusContainer>
        {isEditingStatus ? (
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
            
            <TextArea
              placeholder="Add a note about this status change (optional)"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              style={{ marginBottom: '0.5rem', minHeight: '80px' }}
            />
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <ActionButton 
                primary 
                onClick={handleStatusUpdate}
                disabled={isSubmitting}
              >
                <FaCheckCircle /> Update Status
              </ActionButton>
              <ActionButton 
                onClick={() => setIsEditingStatus(false)}
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
            <StyledButton onClick={() => setIsEditingStatus(true)}>
              <FaEdit /> Edit Status
            </StyledButton>
          </div>
        )}
      </StatusContainer>
      
      <InfoItem>
        <span>Rx Number</span>
        <span>{prescription.rxNumber}</span>
      </InfoItem>
      
      <InfoItem>
        <span>Dosage</span>
        <span>{prescription.dosage}</span>
      </InfoItem>
      
      <InfoItem>
        <span>Instructions</span>
        <span>{prescription.instructions}</span>
      </InfoItem>
      
      <InfoItem>
        <span>Prescribed Date</span>
        <span>{formatDate(prescription.prescribedDate)}</span>
      </InfoItem>
      
      <InfoItem>
        <span>Type</span>
        <span>{prescription.type}</span>
      </InfoItem>
      
      {prescription.notes && (
        <InfoItem>
          <span>Notes</span>
          <span>{prescription.notes}</span>
        </InfoItem>
      )}
      
      {prescription.imageUrl && (
        <ImageContainer>
          <PrescriptionImage 
            src={prescription.imageUrl} 
            alt="Prescription"
            onClick={() => setShowFullImage(true)}
          />
        </ImageContainer>
      )}
      
      {showFullImage && (
        <ExpandedImageOverlay onClick={() => setShowFullImage(false)}>
          <CloseButton onClick={() => setShowFullImage(false)}>✕</CloseButton>
          <ExpandedImage src={prescription.imageUrl} alt="Prescription" onClick={(e) => e.stopPropagation()} />
        </ExpandedImageOverlay>
      )}
      
      <ActionButtons>
        <ActionButton 
          onClick={() => setShowMessageForm(!showMessageForm)}
          disabled={isSubmitting}
        >
          <FaCommentMedical /> {showMessageForm ? 'Cancel' : 'Message Patient'}
        </ActionButton>
      </ActionButtons>
      
      {showMessageForm && (
        <MessageSection>
          <TextArea
            placeholder="Type your message to the patient..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <ActionButton 
            primary 
            onClick={handleSendMessage}
            disabled={isSubmitting || !message.trim()}
          >
            Send Message
          </ActionButton>
        </MessageSection>
      )}
    </Card>
  );
}

export default PrescriptionRequestCard;