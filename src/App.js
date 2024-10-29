import { useEffect, useState, useRef } from 'react';
import './App.css';
import './output.css';

function FictionChatClient({
  authToken,
  contentContainerClassName,
  chatServerUrl,
  chatWsUrl

}) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState([]);
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [wsStatus, setWsStatus] = useState('connecting');
  const reconnectAttemptsRef = useRef(0);
  const [wsError, setWsError] = useState('');

  const getRandomColor = () => {
    const colors = ['bg-red-200', 'bg-blue-200', 'bg-green-200', 'bg-yellow-200', 'bg-purple-200', 'bg-pink-200'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getToken = () => {
    if(authToken) {
      return authToken;
    }
    return localStorage.getItem('token');
  }
  const connectWebSocket = () => {
    const token = getToken();
    if (!token) {
      setError('Uh oh, it seems you are not authorized to be here! 🔒');
      setLoading(false);
      return;
    }else{
      console.log(chatWsUrl)
      setError('')
      
    }

    wsRef.current = new WebSocket(`${chatWsUrl}?token=${token}`);

    wsRef.current.onopen = () => {
      console.log('WebSocket Connected');
      setWsStatus('connected');
      setWsError('');
      reconnectAttemptsRef.current = 0;
    };

    wsRef.current.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
      const data = JSON.parse(event.data);
      if (data.content) {
        setMessages(prev => [...prev, {
          id: data.id,
          content: data.content,
          createdAt: data.created_at,
          sender: data.sender,
          isFromMe: false
        }]);

        
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsStatus('error');
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected');
      setWsStatus('disconnected');
      
      if (reconnectAttemptsRef.current < 5) {
        setTimeout(() => {
          reconnectAttemptsRef.current += 1;
          console.log(`Attempting to reconnect... (${reconnectAttemptsRef.current}/5)`);
          connectWebSocket();
        }, 2000);
      } else {
        setWsError('Messages may not update in real-time due to connection issues');
      }
    };
  };

  useEffect(() => {
    console.log("authtoken changed 22", authToken)
    console.log(chatServerUrl)
    fetchConversations();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [authToken]);

  const fetchConversations = async () => {
    try {
      const token = getToken();
      if (!token) return;

      console.log("fetching conversations")
      const response = await fetch(chatServerUrl + '?method=get-conversations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      // setLoading(false)
      setError('')
      setConversations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    

    
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation) return;

      try {
        const token = getToken();
        const response = await fetch(chatServerUrl + '?method=get-messages&conversationId=' + selectedConversation.id, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          method: 'POST',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }

        const data = await response.json();
        setMessages(data);
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };

    fetchMessages();
  }, [selectedConversation]);

  const fetchAvailableUsers = async () => {
    try {
      const token = getToken();
      const response = await fetch(chatServerUrl + '?method=get-available-users-to-chat', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch available users');
      }

      const data = await response.json();
      setAvailableUsers(data);
    } catch (err) {
      console.error('Error fetching available users:', err);
    }
  };

  const handleStartChat = async (user) => {
    const tempConversation = {
      id: 'temp-' + user.id,
      other_user: {
        id: user.id,
        fullname: user.fullname,
        profilePicture: user.profile_picture
      },
      last_message: null
    };

    setConversations(prev => [tempConversation, ...prev]);
    setSelectedConversation(tempConversation);
    setShowUserModal(false);
  };

  const sendMessage = async (content) => {
    if (!content.trim() || !selectedConversation) return;

    try {
      const token = getToken();
      const response = await fetch(chatServerUrl + '?method=send-message', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
          toId: selectedConversation.other_user.id,
          content: content
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Optimistically add message to UI
      const newMessage = {
        id: Date.now(), // temporary ID
        content: content,
        createdAt: new Date().toISOString(),
        sender: {
          id: JSON.parse(atob(token.split('.')[1])).id,
          fullname: 'Me'
        },
        isFromMe: true
      };
      setMessages(prev => [...prev, newMessage]);

    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const filteredUsers = availableUsers.filter(user =>
    user.fullname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading conversations...</div>;
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen w-full  ${contentContainerClassName} `}>
          <div className="text-6xl mb-4">🚫</div>
          <div className="text-xl text-zinc-500">{error}</div>
          <div className="text-8xl mt-4">🦊</div>
      </div>
    );
  }

  return (
    <div className={`flex h-full w-full ${contentContainerClassName} ` }>
      {/* Left sidebar - 25% width */}  
      <div className="w-1/4 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Chats</h1>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                wsStatus === 'connected' ? 'bg-green-500' :
                wsStatus === 'connecting' ? 'bg-yellow-500' :
                'bg-red-500'
              }`} />
              <button
                onClick={() => {
                  setShowUserModal(true);
                  fetchAvailableUsers();
                }}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation)}
              className={`flex items-center space-x-4 p-3 cursor-pointer transition-colors ${selectedConversation?.id === conversation.id ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
            >
              <div className="relative">
                {conversation.other_user?.profilePicture ? (
                  <img
                    src={conversation.other_user.profilePicture}
                    alt={conversation.other_user.fullname}
                    className="h-12 w-12 rounded-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`h-12 w-12 rounded-full ${getRandomColor()} flex items-center justify-center ${conversation.other_user?.profilePicture ? 'hidden' : ''}`}>
                  <span className="text-gray-600 text-lg">
                    {getInitials(conversation.other_user?.fullname)}
                  </span>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{conversation.other_user?.fullname}</h3>
                <p className="text-sm text-gray-500 truncate">
                  {conversation.last_message?.content || 'No messages yet'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right side - Messages */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b flex items-center space-x-3">
              {selectedConversation.other_user?.profilePicture ? (
                <>
                  <img
                    src={selectedConversation.other_user.profilePicture}
                    alt={selectedConversation.other_user.fullname}
                    className="h-10 w-10 rounded-full"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className={`h-10 w-10 rounded-full ${getRandomColor()} hidden items-center justify-center`}>
                    <span className="text-gray-600">
                      {getInitials(selectedConversation.other_user?.fullname)}
                    </span>
                  </div>
                </>
              ) : (
                <div className={`h-10 w-10 rounded-full ${getRandomColor()} flex items-center justify-center`}>
                  <span className="text-gray-600">
                    {getInitials(selectedConversation.other_user?.fullname)}
                  </span>
                </div>
              )}
              <h2 className="font-medium">{selectedConversation.other_user?.fullname}</h2>
            </div>

            {/* Messages container */}
            <div className="flex-1 p-4 overflow-y-auto">
              {messages.map((message) => (
                <div key={message.id} className="mb-4 flex gap-3">
                  {!message.isFromMe && (
                    <div className="flex-shrink-0">
                      {message.sender.profilePicture ? (
                        <>
                          <img
                            src={message.sender.profilePicture}
                            alt={message.sender.fullname}
                            className="h-8 w-8 rounded-full"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className={`h-8 w-8 rounded-full ${getRandomColor()} hidden items-center justify-center`}>
                            <span className="text-gray-600 text-sm">
                              {getInitials(message.sender.fullname)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className={`h-8 w-8 rounded-full ${getRandomColor()} flex items-center justify-center`}>
                          <span className="text-gray-600 text-sm">
                            {getInitials(message.sender.fullname)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className={`flex flex-col ${message.isFromMe ? 'items-end' : 'items-start'} flex-1`}>
                    <div
                      className={`rounded-2xl px-4 py-2 max-w-[75%] ${message.isFromMe
                          ? 'bg-zinc-900 text-zinc-50'
                          : 'bg-zinc-100 text-zinc-900'
                        }`}
                    >
                      {message.content}
                    </div>
                    <span className="text-xs text-zinc-400 mt-1">
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div className="p-4 border-t">
              <div className="flex flex-col">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(messageInput);
                        setMessageInput('');
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 p-2 border rounded-full focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => {
                      sendMessage(messageInput);
                      setMessageInput('');
                    }}
                    className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
                {wsError && (
                  <p className="text-xs text-red-500 mt-1">{wsError}</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a conversation or start a new chat
          </div>
        )}
      </div>

      {/* User selection modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Start New Chat</h2>
              <button onClick={() => setShowUserModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <input
              type="text"
              placeholder="Search users..."
              className="w-full p-2 border rounded-lg mb-4"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="max-h-96 overflow-y-auto">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleStartChat(user)}
                  className="flex items-center p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  {user.profile_picture ? (
                    <>
                      <img 
                        src={user.profile_picture} 
                        alt={user.fullname} 
                        className="w-10 h-10 rounded-full"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className={`w-10 h-10 rounded-full ${getRandomColor()} hidden items-center justify-center`}>
                        <span className="text-gray-600">{getInitials(user.fullname)}</span>
                      </div>
                    </>
                  ) : (
                    <div className={`w-10 h-10 rounded-full ${getRandomColor()} flex items-center justify-center`}>
                      <span className="text-gray-600">{getInitials(user.fullname)}</span>
                    </div>
                  )}
                  <span className='ml-2'>{user.fullname}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FictionChatClient;
