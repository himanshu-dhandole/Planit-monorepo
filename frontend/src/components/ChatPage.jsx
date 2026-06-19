import React, { useState, useEffect, useRef, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, MessageSquare, Tag, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { Client } from '@stomp/stompjs';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../lib/apiClient';
import CustomLoader from './CustomLoader';
import { toast } from 'sonner';

export default function ChatPage() {
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialConvId = searchParams.get('id');
  const initialMsg = searchParams.get('msg');

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const stompClientRef = useRef(null);
  const subscriptionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, [user]);

  // Handle active conversation and WebSocket connection
  useEffect(() => {
    if (!user) return;

    // Connect WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const brokerURL = `${protocol}//${window.location.host}/ws`;

    const client = new Client({
      brokerURL: brokerURL,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => console.log('[STOMP Debug]', str),
    });

    client.onConnect = () => {
      console.log('Connected to WebSocket');
      stompClientRef.current = client;

      // Send initial message if present
      if (initialConvId && initialMsg) {
        sendMessagePayload(client, Number(initialConvId), initialMsg);
        
        // Clear query parameters
        setSearchParams({});
      }

      // If there is an active conversation, subscribe to it
      if (activeConv) {
        subscribeToConversation(client, activeConv.id);
      }
    };

    client.onDisconnect = () => {
      console.log('Disconnected from WebSocket');
      stompClientRef.current = null;
    };

    client.onStompError = (frame) => {
      console.error('STOMP Error:', frame);
      toast.error('Real-time chat error occurred');
    };

    client.activate();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      client.deactivate();
    };
  }, [user, activeConv?.id]);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (activeConv) {
      fetchMessages(activeConv.id);
    }
  }, [activeConv?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    if (!user) return;
    try {
      const res = await apiClient.get('/api/chat/conversations');
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      setConversations(data);

      if (initialConvId && initialConvId !== 'undefined' && !isNaN(Number(initialConvId))) {
        const matching = data.find(c => c.id === Number(initialConvId));
        if (matching) {
          setActiveConv(matching);
        } else {
          // If conversation is newly created and not yet in the list, fetch details
          const detailRes = await apiClient.get(`/api/chat/conversations`);
          const detailData = Array.isArray(detailRes.data?.data) ? detailRes.data.data : [];
          setConversations(detailData);
          const active = detailData.find(c => c.id === Number(initialConvId));
          if (active) setActiveConv(active);
        }
      } else if (data.length > 0 && !activeConv) {
        setActiveConv(data[0]);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoadingConv(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    setLoadingMsgs(true);
    try {
      const res = await apiClient.get(`/api/chat/conversations/${conversationId}/messages`);
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      setMessages(data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoadingMsgs(false);
    }
  };

  const subscribeToConversation = (client, conversationId) => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    const dest = `/topic/messages/${conversationId}`;
    console.log('Subscribing to:', dest);
    subscriptionRef.current = client.subscribe(dest, (message) => {
      const newMsg = JSON.parse(message.body);
      setMessages((prev) => {
        // Prevent duplicate append
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    });
  };

  const sendMessagePayload = (client, convId, text) => {
    if (!client || !client.connected) {
      console.warn('STOMP client not connected, message not sent');
      return;
    }

    const payload = {
      conversationId: convId,
      senderId: user.id,
      content: text
    };

    client.publish({
      destination: '/app/chat.sendMessage',
      body: JSON.stringify(payload)
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConv) return;

    if (stompClientRef.current && stompClientRef.current.connected) {
      sendMessagePayload(stompClientRef.current, activeConv.id, messageInput.trim());
      setMessageInput('');
    } else {
      toast.error('Connecting to server... Please try again in a moment');
    }
  };

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const handleSearchQuery = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await apiClient.get(`/api/chat/search?query=${encodeURIComponent(searchQuery.trim())}`);
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      setSearchResults(data);
      if (data.length === 0) {
        toast.info("No matching vendors, services, or customers found");
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleStartSearchChat = async (result) => {
    if (!result) return;
    try {
      const payload = {};
      if (result.type === 'VENDOR') {
        payload.vendorId = result.id;
        if (result.serviceId) {
          payload.serviceId = result.serviceId;
        }
      } else {
        payload.customerId = result.id;
      }
      const res = await apiClient.post('/api/chat/conversations', payload);
      const newConv = res.data?.data;
      
      if (newConv) {
        setConversations(prev => {
          if (!Array.isArray(prev)) return [newConv];
          if (prev.some(c => c.id === newConv.id)) return prev;
          return [newConv, ...prev];
        });
        setActiveConv(newConv);
      }
      setSearchQuery('');
      setSearchResults([]);
      toast.success("Conversation started!");
    } catch (err) {
      toast.error("Failed to start conversation");
    }
  };

  const getAvatarGradient = (name) => {
    const colors = [
      'from-indigo-500 to-purple-600',
      'from-blue-500 to-indigo-600',
      'from-purple-500 to-pink-600',
      'from-teal-400 to-emerald-600',
      'from-rose-500 to-orange-600',
    ];
    if (!name) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const filteredConversations = conversations.filter(conv => {
    const displayName = user.id === conv.customerId ? conv.vendorBusinessName : conv.customerName;
    const serviceName = conv.serviceName || '';
    const lastMessage = conv.lastMessage || '';
    const q = searchQuery.toLowerCase();
    return (
      displayName?.toLowerCase().includes(q) ||
      serviceName?.toLowerCase().includes(q) ||
      lastMessage?.toLowerCase().includes(q)
    );
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#CBE4F9] to-[#E3F2FC] flex items-center justify-center p-4">
        <div className="bg-white/50 backdrop-blur-xl border border-white/60 p-8 rounded-[2rem] text-center max-w-sm">
          <p className="text-gray-800 font-bold mb-4 font-sans">Please sign in to access your chats</p>
        </div>
      </div>
    );
  }

  // Active header display name
  const activeHeaderName = activeConv
    ? (user.id === activeConv.customerId ? activeConv.vendorBusinessName : activeConv.customerName)
    : '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#CBE4F9] to-[#E3F2FC] pt-28 pb-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans flex items-center justify-center">
      <div className="absolute inset-0 bg-noise pointer-events-none z-0"></div>
      
      <div className="w-full max-w-5xl h-[80vh] bg-white/40 backdrop-blur-xl border border-white/50 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.06)] flex overflow-hidden relative z-10">
        
        {/* Left pane: Conversations List */}
        <div className="w-1/3 border-r border-white/40 flex flex-col h-full bg-white/20">
          <div className="p-6 border-b border-white/40">
            <h2 className="text-xl font-bold text-gray-900 font-serif mb-3">Conversations</h2>
            <form onSubmit={handleSearchQuery} className="flex gap-2 mb-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, services, number..."
                className="flex-grow px-3 py-2 bg-white/70 border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-xs font-semibold text-gray-800 placeholder-gray-400"
              />
              <button
                type="submit"
                disabled={searching}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 shadow-sm"
              >
                {searching ? '...' : 'Search'}
              </button>
            </form>
            
            {/* Search results list */}
            {searchResults.length > 0 && (
              <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
                <div className="flex justify-between items-center text-[10px] text-indigo-600 font-bold uppercase tracking-wider px-1">
                  <span>Search Results</span>
                  <button 
                    onClick={() => setSearchResults([])} 
                    className="hover:text-red-500 transition text-[9px] uppercase font-bold"
                  >
                    Clear
                  </button>
                </div>
                {searchResults.map((result, idx) => (
                  <div 
                    key={`${result.type}-${result.id}-${result.serviceId || idx}`}
                    className="p-3 bg-white/95 hover:bg-white border border-white/60 shadow-sm rounded-xl flex items-center justify-between text-xs transition duration-150"
                  >
                    <div className="overflow-hidden mr-2">
                      <p className="font-bold text-gray-900 truncate">{result.name}</p>
                      <p className="text-[10px] text-gray-400 font-semibold truncate">
                        {result.type} • {result.phoneNumber}
                      </p>
                      {result.serviceName && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-bold rounded">
                          Service: {result.serviceName}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleStartSearchChat(result)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-xl transition-all shadow-sm hover:shadow shrink-0"
                    >
                      Chat
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loadingConv ? (
              <div className="flex justify-center py-10"><CustomLoader /></div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-20 text-gray-400 text-sm">
                <MessageSquare className="mx-auto mb-2 opacity-40" size={32} />
                No active conversations
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = activeConv?.id === conv.id;
                const displayName = user.id === conv.customerId ? conv.vendorBusinessName : conv.customerName;

                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConv(conv)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 border ${
                      isActive 
                        ? 'bg-white text-gray-900 shadow-md border-white/80 scale-[1.01]' 
                        : 'border-transparent hover:bg-white/30 text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-sm truncate flex-1">{displayName}</h4>
                      {conv.lastMessageTime && (
                        <span className="text-[10px] text-gray-400 ml-2 font-semibold">
                          {new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-bold">
                        <Tag size={10} />
                        {conv.serviceName}
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 truncate font-medium">
                      {conv.lastMessage || 'Start a conversation...'}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right pane: Chat Messages view */}
        <div className="flex-1 flex flex-col h-full bg-white/10">
          {activeConv ? (
            <>
              {/* Active conversation details header */}
              <div className="p-6 border-b border-white/40 flex items-center justify-between bg-white/10">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${getAvatarGradient(activeHeaderName)} flex items-center justify-center text-white text-sm font-bold shadow-sm`}>
                    {activeHeaderName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">
                      {activeHeaderName}
                    </h3>
                    <p className="text-[11px] font-semibold text-gray-500">
                      Service: {activeConv.serviceName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Message Thread list */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                {loadingMsgs ? (
                  <div className="flex justify-center py-10"><CustomLoader /></div>
                ) : (
                  messages.map((msg) => {
                    const isOwnMessage = Number(msg.senderId) === Number(user.id);
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-md ${
                            isOwnMessage
                              ? 'bg-gradient-to-tr from-indigo-600 to-blue-500 text-white rounded-br-none'
                              : 'bg-white text-gray-800 rounded-bl-none border border-white/50 shadow-sm'
                          }`}
                        >
                          {!isOwnMessage && (
                            <p className="text-[10px] font-bold text-indigo-500 mb-0.5">
                              {msg.senderName}
                            </p>
                          )}
                          <p className="text-sm font-medium leading-relaxed break-words">{msg.content}</p>
                          <span className={`text-[9px] block text-right mt-1 font-semibold ${isOwnMessage ? 'text-white/70' : 'text-gray-400'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message sending form input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-white/40 bg-white/20 flex gap-3">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 bg-white border border-gray-200/60 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm placeholder-gray-400 font-medium shadow-sm"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="p-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center shrink-0"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
              <MessageSquare className="opacity-30 mb-3 text-indigo-500" size={48} />
              <h3 className="font-bold text-gray-700 text-lg mb-1 font-serif">No chat selected</h3>
              <p className="text-sm">Select a conversation from the sidebar to start messaging.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
