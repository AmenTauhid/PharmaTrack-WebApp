import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { getPatients } from '../services/dataService';
import { FaSearch, FaEnvelope } from 'react-icons/fa';

const PageContainer = styled.div`
  padding: 2rem;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 1.8rem;
  color: var(--text);
  margin: 0;
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  background-color: white;
  border-radius: 4px;
  border: 1px solid var(--border);
  padding: 0.5rem 1rem;
  width: 300px;
  
  input {
    border: none;
    margin: 0;
    padding: 0;
    margin-left: 0.5rem;
    width: 100%;
    outline: none;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const PatientCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateY(-4px);
  }
`;

const PatientName = styled.h2`
  font-size: 1.2rem;
  margin: 0 0 0.5rem 0;
  color: var(--primary);
`;

const PatientInfo = styled.div`
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: var(--text);
`;

const InfoItem = styled.div`
  margin-bottom: 0.5rem;
  
  span:first-child {
    font-weight: 500;
    display: inline-block;
    width: 100px;
  }
`;

const ActionLinks = styled.div`
  display: flex;
  margin-top: 1rem;
  gap: 1rem;
`;

const ActionLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--primary);
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: var(--light-gray);
  }
`;

function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const data = await getPatients();
        setPatients(data);
      } catch (error) {
        console.error('Error loading patients:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, []);

  const filteredPatients = patients.filter(patient => {
    const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return <PageContainer>Loading patients...</PageContainer>;
  }

  // Format date values including Firestore timestamps
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
      <PageHeader>
        <Title>Patients</Title>
        <SearchBar>
          <FaSearch color="var(--text)" />
          <input 
            type="text" 
            placeholder="Search patients..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchBar>
      </PageHeader>
      
      {filteredPatients.length === 0 ? (
        <div>No patients found. Please try a different search.</div>
      ) : (
        <Grid>
          {filteredPatients.map(patient => (
            <PatientCard key={patient.id}>
              <PatientName>{patient.firstName} {patient.lastName}</PatientName>
              <PatientInfo>
                <InfoItem>
                  <span>ID:</span> <span>{patient.id}</span>
                </InfoItem>
                <InfoItem>
                  <span>Phone:</span> <span>{patient.phone}</span>
                </InfoItem>
                <InfoItem>
                  <span>Date of Birth:</span> <span>{formatValue(patient.dateOfBirth)}</span>
                </InfoItem>
              </PatientInfo>
              <ActionLinks>
                <ActionLink to={`/patient/${patient.id}`}>View details</ActionLink>
                <ActionLink to={`/messages?patientId=${patient.id}`}>
                  <FaEnvelope /> Message
                </ActionLink>
              </ActionLinks>
            </PatientCard>
          ))}
        </Grid>
      )}
    </PageContainer>
  );
}

export default Dashboard;