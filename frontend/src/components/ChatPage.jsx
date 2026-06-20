import React, { useState, useEffect, useRef, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, MessageSquare, Tag, User, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Client } from '@stomp/stompjs';
import PageTransition from './PageTransition';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../lib/apiClient';
import CustomLoader from './CustomLoader';
import { toast } from 'sonner';

export default function ChatPage({ embedded = false }) {
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
      <div className="bg-white/50 backdrop-blur-xl border border-white/60 p-8 rounded-[2rem] text-center max-w-sm mx-auto">
        <p className="text-gray-800 font-bold mb-4 font-sans">Please sign in to access your chats</p>
      </div>
    );
  }

  const activeHeaderName = activeConv
    ? (user.id === activeConv.customerId ? activeConv.vendorBusinessName : activeConv.customerName)
    : '';

  const chatBody = (
    <div className={`w-full bg-white/60 backdrop-blur-xl border border-slate-200/60 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.03)] flex overflow-hidden relative z-10 ${embedded ? 'h-[500px]' : 'max-w-5xl h-[80vh]'}`}>
      {/* Left pane: Conversations List */}
      <div className="w-1/3 border-r border-slate-200/60 flex flex-col h-full bg-slate-50/30">
        <div className="p-4 border-b border-slate-200/60 text-left">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Conversations</h2>
          <form onSubmit={handleSearchQuery} className="flex gap-2 mb-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="flex-grow px-3 py-1.5 bg-white border border-gray-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-xs font-semibold text-gray-800"
            />
            <button
              type="submit"
              disabled={searching}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
            >
              Search
            </button>
          </form>
          
          {/* Search results list */}
          {searching ? (
            <div className="mt-2 space-y-2 animate-pulse">
              <div className="w-2/3 h-3 bg-slate-200 rounded" />
              <div className="w-1/2 h-3 bg-slate-200 rounded" />
            </div>
          ) : searchResults.length > 0 && (
            <div className="mt-2 space-y-2 max-h-36 overflow-y-auto">
              <div className="flex justify-between items-center text-[9px] text-indigo-600 font-bold uppercase tracking-wider">
                <span>Results</span>
                <button onClick={() => setSearchResults([])} className="text-red-500">Clear</button>
              </div>
              {searchResults.map((result, idx) => (
                <div key={idx} className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-[11px]">
                  <span className="truncate flex-1 font-bold">{result.name}</span>
                  <button onClick={() => handleStartSearchChat(result)} className="text-indigo-600 font-bold">Chat</button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingConv ? (
            <div className="space-y-2 p-1 animate-pulse">
              <div className="h-12 bg-slate-200 rounded-xl" />
              <div className="h-12 bg-slate-200 rounded-xl" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              No active chats
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = activeConv?.id === conv.id;
              const displayName = user.id === conv.customerId ? conv.vendorBusinessName : conv.customerName;

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  className={`p-3 rounded-xl cursor-pointer transition-all border text-left ${
                    isActive 
                      ? 'bg-white text-gray-900 shadow-sm border-slate-200 font-bold' 
                      : 'border-transparent hover:bg-slate-100/50 text-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-start mb-0.5">
                    <h4 className="font-bold text-xs truncate flex-1">{displayName}</h4>
                    {conv.lastMessageTime && (
                      <span className="text-[9px] text-gray-400 ml-1">
                        {new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-[8px] bg-slate-100 text-slate-500 rounded px-1 truncate">
                      {conv.serviceName}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 truncate">
                    {conv.lastMessage || 'Start conversation...'}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right pane: Chat Messages */}
      <div className="flex-grow flex flex-col h-full bg-white/20">
        {activeConv ? (
          <>
            <div className="p-4 border-b border-slate-200/60 flex items-center gap-2 bg-slate-50/50 text-left">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${getAvatarGradient(activeHeaderName)} flex items-center justify-center text-white text-xs font-bold`}>
                {activeHeaderName?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-xs">{activeHeaderName}</h3>
                <p className="text-[9px] text-slate-500">{activeConv.serviceName}</p>
              </div>
            </div>

            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMsgs ? (
                <div className="text-center py-10"><Loader2 className="animate-spin text-slate-300 mx-auto" /></div>
              ) : (
                messages.map((msg) => {
                  const isOwnMessage = Number(msg.senderId) === Number(user.id);
                  return (
                    <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3 py-2 shadow-sm text-xs text-left ${
                        isOwnMessage ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none border border-slate-200/60'
                      }`}>
                        <p className="leading-relaxed break-words">{msg.content}</p>
                        <span className={`text-[8px] block text-right mt-1 ${isOwnMessage ? 'text-white/60' : 'text-gray-400'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200/60 bg-white/30 flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none text-xs"
              />
              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition"
              >
                <Send size={12} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6 text-center">
            <MessageSquare className="opacity-30 mb-2 text-indigo-500" size={32} />
            <h4 className="font-bold text-slate-700 text-sm mb-0.5">No chat selected</h4>
            <p className="text-[11px]">Select a conversation to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );

  if (embedded) {
    return chatBody;
  }

  return (
    <PageTransition className="min-h-screen bg-gradient-to-b from-[#CBE4F9] to-[#E3F2FC] pt-28 pb-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans flex items-center justify-center">
      <div className="absolute inset-0 bg-noise pointer-events-none z-0"></div>
      {chatBody}
    </PageTransition>
  );
}
