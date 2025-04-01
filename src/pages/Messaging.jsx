import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../services/AuthContext';
import { useConversations } from '../services/ConversationContext';
import { 
  getConversationMessages, 
  sendMessage, 
  createConversation,
  getPatient,
  subscribeToMessages
} from '../services/dataService';
import { FaArrowLeft, FaPaperPlane, FaUser, FaComments } from 'react-icons/fa';

const PageContainer = styled.div`
  height: calc(100vh - 64px);
  display: flex;
`;

const Sidebar = styled.div`
  width: 300px;
  background-color: white;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
`;

const SidebarHeader = styled.div`
  padding: 1.2rem;
  border-bottom: 1px solid var(--border);
`;

const SidebarTitle = styled.h2`
  font-size: 1.2rem;
  margin: 0;
  color: var(--text);
`;

const ConversationList = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ConversationItem = styled.div`
  padding: 1rem;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  background-color: ${props => props.active ? 'var(--light-gray)' : 'white'};
  
  &:hover {
    background-color: var(--light-gray);
  }
`;

const ConversationName = styled.div`
  font-weight: 500;
  margin-bottom: 0.2rem;
`;

const LastMessage = styled.div`
  font-size: 0.8rem;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ChatContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--background);
`;

const ChatHeader = styled.div`
  padding: 1rem;
  background-color: white;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const PatientInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
`;

const PatientAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const PatientName = styled.div`
  font-weight: 500;
`;

const ViewDetailsLink = styled(Link)`
  font-size: 0.9rem;
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const MessageBubble = styled.div`
  max-width: 70%;
  padding: 0.8rem 1rem;
  border-radius: 8px;
  background-color: ${props => props.sent ? 'var(--primary)' : 'white'};
  color: ${props => props.sent ? 'white' : 'var(--text)'};
  align-self: ${props => props.sent ? 'flex-end' : 'flex-start'};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const MessageTime = styled.div`
  font-size: 0.7rem;
  text-align: right;
  margin-top: 0.3rem;
  opacity: 0.8;
`;

const InputContainer = styled.div`
  padding: 1rem;
  background-color: white;
  border-top: 1px solid var(--border);
  display: flex;
  gap: 0.8rem;
`;

const MessageInput = styled.input`
  flex: 1;
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 0.8rem 1rem;
  font-size: 0.9rem;
  outline: none;
  
  &:focus {
    border-color: var(--primary);
  }
`;

const SendButton = styled.button`
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #666;
`;

function Messaging() {
  const location = useLocation();
  const { currentUser } = useAuth();
  const { conversations, loading: conversationsLoading, addOrUpdateConversation } = useConversations();
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const unsubscribeMessagesRef = useRef(null);

  // Get patientId from URL if it exists
  const searchParams = new URLSearchParams(location.search);
  const patientIdFromUrl = searchParams.get('patientId');

  useEffect(() => {
    // Set loading state based on conversations loading state
    setLoading(conversationsLoading);
    
    // Select conversation based on URL or default to first conversation
    if (!selectedConversation) {
      if (patientIdFromUrl) {
        // If patientId is in URL, find or prepare for new conversation
        const existingConversation = conversations.find(conv => 
          conv.participants && conv.participants.includes(patientIdFromUrl)
        );
        
        if (existingConversation) {
          console.log("Found existing conversation with patient from URL:", existingConversation);
          setSelectedConversation(existingConversation);
          loadMessages(existingConversation.id);
          loadPatientDetails(patientIdFromUrl);
        } else {
          // Load patient details for potential new conversation
          console.log("No existing conversation with patient from URL, loading patient details");
          loadPatientDetails(patientIdFromUrl);
        }
      } else if (conversations.length > 0) {
        // Select first conversation by default
        console.log("Selecting first conversation by default:", conversations[0]);
        setSelectedConversation(conversations[0]);
        
        // Find patient participant
        const otherParticipant = conversations[0].participants.find(
          p => p !== currentUser?.uid
        );
        
        if (otherParticipant) {
          loadMessages(conversations[0].id);
          loadPatientDetails(otherParticipant);
        }
      }
    }
    
    // Cleanup message subscription on unmount
    return () => {
      console.log("Cleaning up message subscription");
      if (unsubscribeMessagesRef.current) {
        unsubscribeMessagesRef.current();
        unsubscribeMessagesRef.current = null;
      }
    };
  }, [conversations, conversationsLoading, currentUser?.uid, patientIdFromUrl, selectedConversation]);

  const loadMessages = (conversationId) => {
    try {
      // Clean up previous subscription if any
      if (unsubscribeMessagesRef.current) {
        unsubscribeMessagesRef.current();
      }
      
      // Subscribe to real-time updates
      unsubscribeMessagesRef.current = subscribeToMessages(conversationId, (messagesData) => {
        console.log("Received messages from subscription:", messagesData);
        setMessages(messagesData);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      });
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadPatientDetails = async (patientId) => {
    try {
      const patientData = await getPatient(patientId);
      setPatientDetails(patientData);
    } catch (error) {
      console.error('Error loading patient details:', error);
    }
  };

  const handleSelectConversation = (conversation) => {
    console.log("Selecting conversation:", conversation);
    
    setSelectedConversation(conversation);
    
    // Find the participant that is not the current user
    const otherParticipant = conversation.participants.find(
      p => p !== currentUser.uid
    );
    
    if (!otherParticipant) {
      console.error("Could not find other participant in conversation:", conversation);
    } else {
      console.log(`Loading details for participant: ${otherParticipant}`);
      loadPatientDetails(otherParticipant);
    }
    
    // Load messages for this conversation
    console.log(`Loading messages for conversation: ${conversation.id}`);
    loadMessages(conversation.id);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    console.log("Sending message:", newMessage);
    console.log("Selected conversation:", selectedConversation);
    
    try {
      if (selectedConversation) {
        // Send to existing conversation
        console.log(`Sending to existing conversation ${selectedConversation.id}`);
        await sendMessage(selectedConversation.id, currentUser.uid, newMessage);
        
        // Update the conversation in the context with latest message
        const updatedConv = {
          ...selectedConversation,
          lastMessage: newMessage,
          lastMessageTime: new Date()
        };
        
        // Update conversation in context
        addOrUpdateConversation(updatedConv);
        
        // Set this as selected conversation
        setSelectedConversation(updatedConv);
        
        // Temporary workaround - manually add message to state
        const tempMessage = {
          id: `temp-${Date.now()}`,
          sender: currentUser.uid,
          text: newMessage,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, tempMessage]);
        
        setNewMessage('');
        
        // Fallback to manual reload in case subscription isn't working
        setTimeout(() => {
          getConversationMessages(selectedConversation.id).then(messagesData => {
            console.log("Manual reload messages:", messagesData);
            setMessages(messagesData);
          });
        }, 500);
      } else if (patientIdFromUrl) {
        // Create new conversation if we have a patient ID from URL
        console.log(`Creating new conversation with patient ${patientIdFromUrl}`);
        
        // Make sure we have patient details
        if (!patientDetails) {
          console.log("Loading patient details before creating conversation");
          await loadPatientDetails(patientIdFromUrl);
        }
        
        const conversationId = await createConversation(
          currentUser.uid, 
          patientIdFromUrl,
          newMessage
        );
        
        console.log(`New conversation created with ID: ${conversationId}`);
        
        // Send the first message
        await sendMessage(conversationId, currentUser.uid, newMessage);
        
        // Temporary workaround - manually add message to state
        const tempMessage = {
          id: `temp-${Date.now()}`,
          sender: currentUser.uid,
          text: newMessage,
          timestamp: new Date()
        };
        
        // Create new conversation object
        const newConv = {
          id: conversationId,
          participants: [currentUser.uid, patientIdFromUrl],
          lastMessage: newMessage,
          lastMessageTime: new Date(),
          patientName: patientDetails ? `${patientDetails.firstName} ${patientDetails.lastName}` : 'Patient'
        };
        
        // Add to conversations in context
        console.log("Adding new conversation to context:", newConv);
        addOrUpdateConversation(newConv);
        
        // Set as selected conversation
        setSelectedConversation(newConv);
        
        // Set messages directly
        setMessages([tempMessage]);
        
        setNewMessage('');
        
        // Set up messages subscription for the new conversation
        loadMessages(conversationId);
        
        // Fallback to manual reload in case subscription isn't working
        setTimeout(() => {
          getConversationMessages(conversationId).then(messagesData => {
            console.log("Manual reload messages for new conversation:", messagesData);
            setMessages(messagesData);
          });
        }, 500);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    console.log("Formatting timestamp:", timestamp);
    
    // Handle case where timestamp might be null, undefined, or not have toDate method
    try {
      // Handle Firestore Timestamp objects
      if (timestamp && typeof timestamp === 'object' && timestamp.toDate) {
        return timestamp.toDate().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit'
        });
      } 
      // Handle Firebase server timestamp placeholders 
      else if (timestamp && timestamp.seconds && timestamp.nanoseconds) {
        const date = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit'
        });
      }
      // Handle string timestamps
      else if (typeof timestamp === 'string') {
        return timestamp;
      } 
      // Handle date objects
      else if (timestamp instanceof Date) {
        return timestamp.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit'
        });
      }
      // If it's some other format, try to create a date
      else {
        return new Date(timestamp).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit'
        });
      }
    } catch (error) {
      console.error('Error formatting timestamp:', error, typeof timestamp);
      return 'Just now';
    }
  };

  // Show loading state if either conversations or messages are loading
  if ((loading || conversationsLoading) && !conversations.length) {
    return <div className="page-loading">Loading conversations...</div>;
  }

  return (
    <PageContainer>
      <Sidebar>
        <SidebarHeader>
          <SidebarTitle>Messages ({conversations.length})</SidebarTitle>
        </SidebarHeader>
        <ConversationList>
          {conversations.length === 0 ? (
            <div style={{ padding: '1rem' }}>No conversations yet</div>
          ) : (
            conversations.map(conversation => {
              console.log("Rendering conversation:", conversation);
              
              // Skip invalid conversations
              if (!conversation || !conversation.id) {
                console.warn("Invalid conversation in list:", conversation);
                return null;
              }
              
              // Check if this is the active conversation
              const isActive = selectedConversation?.id === conversation.id;
              console.log(`Conversation ${conversation.id} active: ${isActive}`);
              
              return (
                <ConversationItem 
                  key={conversation.id} 
                  active={isActive}
                  onClick={() => handleSelectConversation(conversation)}
                >
                  <ConversationName>
                    {conversation.patientName || 'Patient'}
                  </ConversationName>
                  <LastMessage>
                    {conversation.lastMessage || 'No messages yet'}
                    {conversation.lastMessageTime && 
                     ` - ${formatTime(conversation.lastMessageTime)}`}
                  </LastMessage>
                </ConversationItem>
              );
            }).filter(Boolean)
          )}
        </ConversationList>
      </Sidebar>
      
      <ChatContainer>
        {selectedConversation || patientIdFromUrl ? (
          <>
            <ChatHeader>
              <PatientInfo>
                <PatientAvatar>
                  <FaUser />
                </PatientAvatar>
                <div>
                  <PatientName>
                    {patientDetails ? 
                      `${patientDetails.firstName} ${patientDetails.lastName}` : 
                      'Patient'}
                  </PatientName>
                  {patientDetails && (
                    <ViewDetailsLink to={`/patient/${patientDetails.id}`}>
                      View patient details
                    </ViewDetailsLink>
                  )}
                </div>
              </PatientInfo>
              <Link to="/">
                <FaArrowLeft /> Back
              </Link>
            </ChatHeader>
            
            <MessagesContainer>
              {messages.length === 0 ? (
                <div style={{ alignSelf: 'center', padding: '2rem' }}>
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map(message => {
                  console.log("Rendering message:", message);
                  console.log("Current user:", currentUser?.uid);
                  console.log("Is sent by current user?", message.sender === currentUser?.uid);
                  
                  // Make sure message has the required fields
                  if (!message.text) {
                    console.warn("Message missing text:", message);
                    return null;
                  }
                  
                  return (
                    <MessageBubble 
                      key={message.id || `temp-${Date.now()}-${Math.random()}`} 
                      sent={message.sender === currentUser?.uid}
                    >
                      {message.text}
                      <MessageTime>
                        {formatTime(message.timestamp)}
                      </MessageTime>
                    </MessageBubble>
                  );
                }).filter(msg => msg !== null)
              )}
              <div ref={messagesEndRef} />
            </MessagesContainer>
            
            <InputContainer>
              <MessageInput 
                placeholder="Type a message..." 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <SendButton onClick={handleSendMessage}>
                <FaPaperPlane />
              </SendButton>
            </InputContainer>
          </>
        ) : (
          <EmptyState>
            <FaComments size={40} style={{ marginBottom: '1rem' }} />
            <p>Select a conversation or start a new one</p>
          </EmptyState>
        )}
      </ChatContainer>
    </PageContainer>
  );
}

export default Messaging;