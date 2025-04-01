import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { getPatient, getPatientPrescriptions } from '../services/dataService';
import { FaArrowLeft, FaEnvelope, FaPrescriptionBottleAlt } from 'react-icons/fa';

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

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  margin: 1.5rem 0 1rem 0;
  color: var(--text);
`;

const PrescriptionCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  margin-bottom: 1rem;
  border-left: 4px solid var(--secondary);
`;

const PrescriptionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const PrescriptionTitle = styled.h3`
  font-size: 1.2rem;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text);
`;

const PrescriptionDate = styled.span`
  font-size: 0.9rem;
  color: #666;
`;

const MedicationList = styled.div`
  margin-top: 1rem;
`;

const MedicationItem = styled.div`
  padding: 0.8rem;
  background-color: var(--light-gray);
  border-radius: 4px;
  margin-bottom: 0.8rem;
  
  h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
  }
  
  p {
    margin: 0;
    font-size: 0.9rem;
    color: #666;
  }
`;

function PatientDetails() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const patientData = await getPatient(id);
        setPatient(patientData);
        
        const prescriptionsData = await getPatientPrescriptions(id);
        setPrescriptions(prescriptionsData);
      } catch (error) {
        console.error('Error loading patient data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

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
      
      <SectionTitle>Prescriptions</SectionTitle>
      
      {prescriptions.length === 0 ? (
        <div>No prescriptions found for this patient.</div>
      ) : (
        prescriptions.map(prescription => (
          <PrescriptionCard key={prescription.id}>
            <PrescriptionHeader>
              <PrescriptionTitle>
                <FaPrescriptionBottleAlt /> Prescription #{prescription.prescriptionNumber}
              </PrescriptionTitle>
              <PrescriptionDate>
                {formatDate(prescription.createdAt)}
              </PrescriptionDate>
            </PrescriptionHeader>
            
            <InfoItem>
              <span>Prescribed By</span>
              <span>{prescription.doctorName}</span>
            </InfoItem>
            
            <InfoItem>
              <span>Status</span>
              <span style={{ 
                color: prescription.status === 'Ready' ? 'var(--secondary)' : 
                      prescription.status === 'Pending' ? 'orange' : 'var(--text)'
              }}>
                {prescription.status}
              </span>
            </InfoItem>
            
            <InfoItem>
              <span>Notes</span>
              <span>{prescription.notes || 'No notes'}</span>
            </InfoItem>
            
            <MedicationList>
              <h4>Medications:</h4>
              {prescription.medications.map((med, index) => (
                <MedicationItem key={index}>
                  <h4>{med.name}</h4>
                  <p>{med.dosage} - {med.frequency}</p>
                  <p>{med.instructions}</p>
                </MedicationItem>
              ))}
            </MedicationList>
          </PrescriptionCard>
        ))
      )}
    </PageContainer>
  );
}

export default PatientDetails;