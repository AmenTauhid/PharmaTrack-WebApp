import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { getAllPendingPrescriptionRequests, getPatient } from '../services/dataService';
import { FaSearch, FaFilter, FaPrescriptionBottleAlt, FaUser } from 'react-icons/fa';
import PrescriptionRequestCard from '../components/PrescriptionRequestCard';

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

const FilterControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const FilterLabel = styled.span`
  font-weight: 500;
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

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  
  svg {
    font-size: 2rem;
    color: var(--primary);
    margin-bottom: 0.8rem;
  }
  
  h3 {
    font-size: 1.8rem;
    margin: 0;
    color: var(--text);
  }
  
  p {
    margin: 0.5rem 0 0 0;
    color: #666;
    font-size: 0.9rem;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  background-color: white;
  border-radius: 8px;
  
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

const RequestList = styled.div`
  margin-top: 1.5rem;
`;

const RequestGroupHeader = styled.h2`
  font-size: 1.2rem;
  color: var(--text);
  margin: 1.5rem 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

function PrescriptionRequestsDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [patientDetailsMap, setPatientDetailsMap] = useState({});

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const requestsData = await getAllPendingPrescriptionRequests();
        setRequests(requestsData);
        
        // Create a map of patient IDs to load patient details
        const patientIds = [...new Set(requestsData.map(req => req.forUser))];
        const patientDetailsObj = {};
        
        for (const patientId of patientIds) {
          const patientData = await getPatient(patientId);
          if (patientData) {
            patientDetailsObj[patientId] = patientData;
          }
        }
        
        setPatientDetailsMap(patientDetailsObj);
      } catch (error) {
        console.error('Error loading prescription requests:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
      const requestsData = await getAllPendingPrescriptionRequests();
      setRequests(requestsData);
    } catch (error) {
      console.error('Error refreshing prescription requests:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageContainer>Loading prescription requests...</PageContainer>;
  }

  // Filter requests based on search query and status filter
  const filteredRequests = requests.filter(req => {
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    
    // Check if we have patient details for search
    const patientDetails = patientDetailsMap[req.forUser];
    let matchesSearch = true;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const patientName = patientDetails 
        ? `${patientDetails.firstName} ${patientDetails.lastName}`.toLowerCase() 
        : '';
      const medicationName = req.medicationName.toLowerCase();
      const rxNumber = req.rxNumber.toLowerCase();
      
      matchesSearch = patientName.includes(query) || 
                      medicationName.includes(query) || 
                      rxNumber.includes(query);
    }
    
    return matchesStatus && matchesSearch;
  });

  // Group requests by status for better organization
  const requestsByStatus = {
    requestReceived: filteredRequests.filter(req => req.status === 'requestReceived'),
    entered: filteredRequests.filter(req => req.status === 'entered'),
    pharmacistCheck: filteredRequests.filter(req => req.status === 'pharmacistCheck'),
    prepPackaging: filteredRequests.filter(req => req.status === 'prepPackaging'),
    billing: filteredRequests.filter(req => req.status === 'billing'),
    readyForPickup: filteredRequests.filter(req => req.status === 'readyForPickup')
  };

  // Calculate statistics
  const totalRequests = requests.length;
  const newRequests = requests.filter(req => req.status === 'requestReceived').length;
  const urgentRequests = requests.filter(req => req.status === 'pharmacistCheck').length;
  const readyForPickup = requests.filter(req => req.status === 'readyForPickup').length;

  // Map status to a readable format
  const getStatusLabel = (status) => {
    switch(status) {
      case 'requestReceived': return 'New Requests';
      case 'entered': return 'Entered into System';
      case 'pharmacistCheck': return 'Awaiting Pharmacist Review';
      case 'prepPackaging': return 'In Preparation';
      case 'billing': return 'In Billing';
      case 'readyForPickup': return 'Ready for Pickup';
      default: return status;
    }
  };

  return (
    <PageContainer>
      <PageHeader>
        <Title>Prescription Requests</Title>
        <SearchBar>
          <FaSearch color="var(--text)" />
          <input 
            type="text" 
            placeholder="Search by patient, medication..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchBar>
      </PageHeader>
      
      <StatsContainer>
        <StatCard>
          <FaPrescriptionBottleAlt />
          <h3>{totalRequests}</h3>
          <p>Total Active Requests</p>
        </StatCard>
        <StatCard>
          <FaPrescriptionBottleAlt />
          <h3>{newRequests}</h3>
          <p>New Requests</p>
        </StatCard>
        <StatCard>
          <FaPrescriptionBottleAlt />
          <h3>{urgentRequests}</h3>
          <p>Awaiting Review</p>
        </StatCard>
        <StatCard>
          <FaPrescriptionBottleAlt />
          <h3>{readyForPickup}</h3>
          <p>Ready for Pickup</p>
        </StatCard>
      </StatsContainer>
      
      <FilterControls>
        <FilterGroup>
          <FilterLabel>
            <FaFilter /> Filter by Status:
          </FilterLabel>
          <FilterDropdown 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="requestReceived">New Requests</option>
            <option value="entered">Entered into System</option>
            <option value="pharmacistCheck">Awaiting Pharmacist Review</option>
            <option value="prepPackaging">In Preparation</option>
            <option value="billing">In Billing</option>
            <option value="readyForPickup">Ready for Pickup</option>
          </FilterDropdown>
        </FilterGroup>
        
        <button onClick={refreshData}>
          Refresh Data
        </button>
      </FilterControls>
      
      {filteredRequests.length === 0 ? (
        <EmptyState>
          <FaPrescriptionBottleAlt />
          <h3>No prescription requests found</h3>
          <p>There are no prescription requests matching your search criteria.</p>
        </EmptyState>
      ) : (
        <RequestList>
          {/* Display each status group that has requests */}
          {Object.entries(requestsByStatus).map(([status, statusRequests]) => {
            if (statusRequests.length === 0) return null;
            
            return (
              <div key={status}>
                <RequestGroupHeader>
                  <FaPrescriptionBottleAlt /> {getStatusLabel(status)} ({statusRequests.length})
                </RequestGroupHeader>
                
                {statusRequests.map(request => (
                  <div key={request.id} style={{ marginBottom: '1rem' }}>
                    <PrescriptionRequestCard 
                      prescription={request}
                      patientName={
                        patientDetailsMap[request.forUser] 
                          ? `${patientDetailsMap[request.forUser].firstName} ${patientDetailsMap[request.forUser].lastName}`
                          : request.forUserName
                      }
                      onStatusUpdate={refreshData}
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </RequestList>
      )}
    </PageContainer>
  );
}

export default PrescriptionRequestsDashboard;