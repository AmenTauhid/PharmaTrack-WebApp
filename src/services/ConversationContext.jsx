import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { 
  getUserConversations, 
  getPatient,
  subscribeToConversations
} from './dataService';

const ConversationContext = createContext();

export function useConversations() {
  return useContext(ConversationContext);
}

export function ConversationProvider({ children }) {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const unsubscribeRef = useRef(null);

  // Function to load patient names for conversations
  const loadPatientNamesForConversations = async (conversationsData) => {
    if (!conversationsData || conversationsData.length === 0) return conversationsData;
    
    console.log("Loading patient names for conversations:", conversationsData);
    
    // Create a copy of conversations that we can modify
    const updatedConversations = [...conversationsData];
    
    // Process each conversation to add patient names
    for (let i = 0; i < updatedConversations.length; i++) {
      const conversation = updatedConversations[i];
      
      // Skip if already has patientName
      if (conversation.patientName) continue;
      
      // Find the patient participant (not the current user)
      const patientId = conversation.participants.find(
        p => p !== currentUser?.uid
      );
      
      if (patientId) {
        try {
          // Get the patient details
          const patientData = await getPatient(patientId);
          if (patientData) {
            updatedConversations[i] = {
              ...conversation,
              patientName: `${patientData.firstName} ${patientData.lastName}`
            };
          }
        } catch (error) {
          console.error(`Error loading patient name for conversation ${conversation.id}:`, error);
        }
      }
    }
    
    return updatedConversations;
  };

  // Add a new conversation to the list
  const addOrUpdateConversation = (newConversation) => {
    setConversations(prev => {
      const exists = prev.some(c => c.id === newConversation.id);
      if (exists) {
        return prev.map(c => c.id === newConversation.id ? {...c, ...newConversation} : c);
      } else {
        return [newConversation, ...prev];
      }
    });
  };

  // Update an existing conversation
  const updateConversation = (conversationId, updates) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId ? { ...conv, ...updates } : conv
      )
    );
  };

  // Set up real-time subscriptions to conversations
  useEffect(() => {
    const setupConversations = async () => {
      // Clear subscription when user changes
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      if (!currentUser) {
        setConversations([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("Loading conversations for user:", currentUser.uid);
        
        // Initial load
        const conversationsData = await getUserConversations(currentUser.uid);
        const conversationsWithNames = await loadPatientNamesForConversations(conversationsData);
        setConversations(conversationsWithNames);
        
        // Set up real-time subscription
        unsubscribeRef.current = subscribeToConversations(
          currentUser.uid,
          async (updatedConversations) => {
            console.log("Real-time update: received conversations:", updatedConversations.length);
            
            // Merge with existing conversations to preserve patient names
            const mergedConversations = updatedConversations.map(newConv => {
              const existingConv = conversations.find(c => c.id === newConv.id);
              return existingConv 
                ? { ...newConv, patientName: existingConv.patientName || newConv.patientName }
                : newConv;
            });
            
            // Load patient names for any new conversations
            const withPatientNames = await loadPatientNamesForConversations(mergedConversations);
            setConversations(withPatientNames);
          }
        );
      } catch (error) {
        console.error("Error setting up conversations:", error);
      } finally {
        setLoading(false);
      }
    };

    setupConversations();

    // Clean up on unmount
    return () => {
      if (unsubscribeRef.current) {
        console.log("Cleaning up conversation subscription");
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [currentUser?.uid]);

  const value = {
    conversations,
    loading,
    addOrUpdateConversation,
    updateConversation
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}