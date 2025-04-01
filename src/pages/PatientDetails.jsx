import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { 
  getPatient, 
  getPatientPrescriptions, 
  getPatientPrescriptionRequests 
} from '../services/dataService';
import { FaArrowLeft, FaEnvelope, FaPrescriptionBottleAlt, FaFilter } from 'react-icons/fa';
import PrescriptionRequestCard from '../components/PrescriptionRequestCard';

const PageContainer = styled.div`
  padding: 2rem;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  font-weight: 500;
`;

const DetailsCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const FlexHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const PatientName = styled.h1`
  font-size: 1.8rem;
  margin: 0;
  color: var(--text);
`;

const MessageButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background-color: var(--primary);
  color: white;
  border-radius: 4px;
  font-weight: 500;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 0.9;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
`;

const InfoSection = styled.div`
  h2 {
    font-size: 1.2rem;
    margin: 0 0 1rem 0;
    color: var(--primary);
  }
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

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  margin: 0;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FilterDropdown = styled.select`
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid var(--border);
  background-color: white;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: var(--primary);
  }
`;

const TabsContainer = styled.div`
  display: flex;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--border);
`;

const Tab = styled.button`
  padding: 0.8rem 1.2rem;
  background-color: ${props => props.active ? 'white' : 'transparent'};
  border: none;
  border-bottom: 3px solid ${props => props.active ? 'var(--primary)' : 'transparent'};
  font-weight: ${props => props.active ? '600' : '400'};
  color: ${props => props.active ? 'var(--primary)' : 'var(--text)'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.active ? 'white' : '#f9f9f9'};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  margin-top: 1rem;
  
  svg {
    font-size: 3rem;
    color: var(--border);
    margin-bottom: 1rem;
  }
  
  h3 {
    margin: 0 0 0.5rem 0;
    color: var(--text);
  }
  
  p {
    color: #666;
  }
`;

function PatientDetails() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionRequests, setPrescriptionRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' or 'history'
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        const patientData = await getPatient(id);
        setPatient(patientData);
        
        // Load both completed prescriptions and pending requests
        const prescriptionsData = await getPatientPrescriptions(id);
        setPrescriptions(prescriptionsData);
        
        const requestsData = await getPatientPrescriptionRequests(id);
        setPrescriptionRequests(requestsData);
      } catch (error) {
        console.error('Error loading patient data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const refreshPrescriptionData = async () => {
    try {
      const requestsData = await getPatientPrescriptionRequests(id);
      setPrescriptionRequests(requestsData);
      
      const prescriptionsData = await getPatientPrescriptions(id);
      setPrescriptions(prescriptionsData);
    } catch (error) {
      console.error('Error refreshing prescription data:', error);
    }
  };

  if (loading) {
    return <PageContainer>Loading patient data...</PageContainer>;
  }

  if (!patient) {
    return <PageContainer>Patient not found</PageContainer>;
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Format any value that might be a Firestore timestamp
  const formatValue = (value) => {
    if (!value) return 'N/A';
    // Check if it's a Firestore timestamp (has toDate method)
    if (value && value.toDate && typeof value.toDate === 'function') {
      return value.toDate().toLocaleDateString('en-US');
    }
    // If it's already a string (like patient dateOfBirth), return as is
    return value;
  };

  // Filter prescription requests based on status
  const filteredRequests = statusFilter === 'all' 
    ? prescriptionRequests
    : prescriptionRequests.filter(req => req.status === statusFilter);

  // Get active/pending prescriptions vs completed ones
  const activePrescriptions = prescriptionRequests.filter(p => p.status !== 'completed');
  const completedPrescriptions = prescriptionRequests.filter(p => p.status === 'completed');

  return (
    <PageContainer>
      <BackLink to="/">
        <FaArrowLeft /> Back to patients
      </BackLink>
      
      <DetailsCard>
        <FlexHeader>
          <PatientName>{patient.firstName} {patient.lastName}</PatientName>
          <MessageButton to={`/messages?patientId=${patient.id}`}>
            <FaEnvelope /> Message Patient
          </MessageButton>
        </FlexHeader>
        
        <Grid>
          <InfoSection>
            <h2>Personal Information</h2>
            <InfoItem>
              <span>Date of Birth</span>
              <span>{formatValue(patient.dateOfBirth)}</span>
            </InfoItem>
            <InfoItem>
              <span>Phone</span>
              <span>{patient.phone}</span>
            </InfoItem>
            <InfoItem>
              <span>Email</span>
              <span>{patient.email}</span>
            </InfoItem>
          </InfoSection>
          
          <InfoSection>
            <h2>Medical Information</h2>
            <InfoItem>
              <span>Medical ID</span>
              <span>{patient.medicalId || 'N/A'}</span>
            </InfoItem>
            <InfoItem>
              <span>Primary Doctor</span>
              <span>{patient.primaryDoctor || 'N/A'}</span>
            </InfoItem>
            <InfoItem>
              <span>Allergies</span>
              <span>{patient.allergies ? patient.allergies.join(', ') : 'None'}</span>
            </InfoItem>
          </InfoSection>
        </Grid>
      </DetailsCard>
      
      <TabsContainer>
        <Tab 
          active={activeTab === 'requests'} 
          onClick={() => setActiveTab('requests')}
        >
          Active Requests ({activePrescriptions.length})
        </Tab>
        <Tab 
          active={activeTab === 'history'} 
          onClick={() => setActiveTab('history')}
        >
          Prescription History ({completedPrescriptions.length})
        </Tab>
      </TabsContainer>
      
      {activeTab === 'requests' && (
        <>
          <SectionHeader>
            <SectionTitle>
              <FaPrescriptionBottleAlt /> Prescription Requests
            </SectionTitle>
            
            <div>
              <FilterDropdown 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="requestReceived">Request Received</option>
                <option value="entered">Entered into System</option>
                <option value="pharmacistCheck">Pharmacist Check</option>
                <option value="prepPackaging">Prep & Packaging</option>
                <option value="billing">Billing</option>
                <option value="readyForPickup">Ready for Pickup</option>
              </FilterDropdown>
            </div>
          </SectionHeader>
          
          {filteredRequests.length === 0 ? (
            <EmptyState>
              <FaPrescriptionBottleAlt />
              <h3>No active prescription requests</h3>
              <p>This patient doesn't have any active prescription requests matching your filter.</p>
            </EmptyState>
          ) : (
            filteredRequests
              .filter(p => p.status !== 'completed')
              .map(prescription => (
                <PrescriptionRequestCard 
                  key={prescription.id}
                  prescription={prescription}
                  onStatusUpdate={refreshPrescriptionData}
                />
              ))
          )}
        </>
      )}
      
      {activeTab === 'history' && (
        <>
          <SectionTitle>Prescription History</SectionTitle>
          
          {completedPrescriptions.length === 0 ? (
            <EmptyState>
              <FaPrescriptionBottleAlt />
              <h3>No prescription history</h3>
              <p>This patient doesn't have any completed prescriptions in their history.</p>
            </EmptyState>
          ) : (
            completedPrescriptions.map(prescription => (
              <PrescriptionRequestCard 
                key={prescription.id}
                prescription={prescription}
                onStatusUpdate={refreshPrescriptionData}
              />
            ))
          )}
        </>
      )}
    </PageContainer>
  );
}

export default PatientDetails;