import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../services/AuthContext';
import { 
  getUserConversations, 
  getConversationMessages, 
  sendMessage, 
  createConversation,
  getPatient
} from '../services/dataService';
import { FaArrowLeft, FaPaperPlane, FaUser } from 'react-icons/fa';

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
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Get patientId from URL if it exists
  const searchParams = new URLSearchParams(location.search);
  const patientIdFromUrl = searchParams.get('patientId');

  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        if (currentUser) {
          const conversationsData = await getUserConversations(currentUser.uid);
          setConversations(conversationsData);
          
          // If patientId is in URL and we don't have a conversation with this patient,
          // we'll create one when the user sends the first message
          if (patientIdFromUrl) {
            const existingConversation = conversationsData.find(conv => 
              conv.participants.includes(patientIdFromUrl)
            );
            
            if (existingConversation) {
              setSelectedConversation(existingConversation);
              loadMessages(existingConversation.id);
              loadPatientDetails(patientIdFromUrl);
            } else {
              // Load patient details for new conversation
              loadPatientDetails(patientIdFromUrl);
            }
          } else if (conversationsData.length > 0) {
            // Select first conversation by default if no patientId in URL
            setSelectedConversation(conversationsData[0]);
            
            // Find the participant that is not the current user
            const otherParticipant = conversationsData[0].participants.find(
              p => p !== currentUser.uid
            );
            
            loadMessages(conversationsData[0].id);
            loadPatientDetails(otherParticipant);
          }
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadConversations();
  }, [currentUser, patientIdFromUrl]);

  const loadMessages = async (conversationId) => {
    try {
      const messagesData = await getConversationMessages(conversationId);
      setMessages(messagesData);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
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
    setSelectedConversation(conversation);
    
    // Find the participant that is not the current user
    const otherParticipant = conversation.participants.find(
      p => p !== currentUser.uid
    );
    
    loadMessages(conversation.id);
    loadPatientDetails(otherParticipant);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      if (selectedConversation) {
        // Send to existing conversation
        await sendMessage(selectedConversation.id, currentUser.uid, newMessage);
        setNewMessage('');
        
        // Reload messages to show the new message
        loadMessages(selectedConversation.id);
      } else if (patientIdFromUrl) {
        // Create new conversation if we have a patient ID from URL
        const conversationId = await createConversation(
          currentUser.uid, 
          patientIdFromUrl,
          newMessage
        );
        
        // Send the first message
        await sendMessage(conversationId, currentUser.uid, newMessage);
        setNewMessage('');
        
        // Reload conversations and select the new one
        const conversationsData = await getUserConversations(currentUser.uid);
        setConversations(conversationsData);
        
        const newConversation = conversationsData.find(c => c.id === conversationId);
        if (newConversation) {
          setSelectedConversation(newConversation);
          loadMessages(newConversation.id);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    // Handle case where timestamp might be null, undefined, or not have toDate method
    try {
      // Make sure timestamp is an object before accessing toDate
      if (timestamp && typeof timestamp === 'object' && timestamp.toDate) {
        return timestamp.toDate().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit'
        });
      } else if (typeof timestamp === 'string') {
        // Handle string timestamps
        return timestamp;
      } else {
        // If it's some other format, try to create a date
        return new Date(timestamp).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit'
        });
      }
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'Invalid time';
    }
  };

  if (loading && !conversations.length) {
    return <div>Loading messages...</div>;
  }

  return (
    <PageContainer>
      <Sidebar>
        <SidebarHeader>
          <SidebarTitle>Messages</SidebarTitle>
        </SidebarHeader>
        <ConversationList>
          {conversations.length === 0 ? (
            <div style={{ padding: '1rem' }}>No conversations yet</div>
          ) : (
            conversations.map(conversation => (
              <ConversationItem 
                key={conversation.id} 
                active={selectedConversation?.id === conversation.id}
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
            ))
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
                messages.map(message => (
                  <MessageBubble 
                    key={message.id} 
                    sent={message.sender === currentUser.uid}
                  >
                    {message.text}
                    <MessageTime>
                      {formatTime(message.timestamp)}
                    </MessageTime>
                  </MessageBubble>
                ))
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