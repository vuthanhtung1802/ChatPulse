import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { Message, Conversation } from '../types';
import { 
  Search, 
  Phone, 
  Video, 
  MoreVertical, 
  Send, 
  Paperclip, 
  Smile, 
  Image as ImageIcon,
  Check,
  CheckCheck,
  ArrowLeft,
  X,
  Sparkles,
  PhoneOff,
  UserCheck
} from 'lucide-react';

export const Messages: React.FC = () => {
  const { 
    conversations, 
    messages, 
    activeConversationId, 
    setActiveConversationId, 
    sendMessage, 
    isTyping, 
    currentUser 
  } = useApp();

  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [activeCallType, setActiveCallType] = useState<'voice' | 'video' | null>(null);
  const [callDuration, setCallDuration] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeConv = conversations.find(c => c.id === activeConversationId) || conversations[0];
  const activeMessages = messages[activeConversationId] || [];

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages, isTyping]);

  // Handle mock call duration
  useEffect(() => {
    if (activeCallType) {
      setCallDuration(0);
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [activeCallType]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText.trim());
    setInputText('');
  };

  const handleSendAttachment = (type: 'image' | 'file') => {
    setShowAttachmentMenu(false);
    if (type === 'image') {
      sendMessage(
        "Attached a prototype reference mockup", 
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCnYIVfCTrvlQXscXxkWOWBVt4KCWXsJ-ZnZP4NH5saJh8F__l_N0WqtrvPOg_G6STjYZn3b711v2nE_g8qFhtV-1jrXXA_HJy4XqIB9Gq_M4Gc9xKdIDIhhfrBa6dwc2YnkLRzDRGGeWWBdB0D0tzpQn2oPsJDMePGqr-U-rHUqI2K1wnEp5Mwztqf34eyzjXI2QWbws3_rvO9nMohrZ6dwwUtXptWEKumY9LBSOpygE4-ysn64sLlJdXmtkc0Ex0bbhsDzR7OfLw",
        "image"
      );
    } else {
      sendMessage("Shared document checklist.pdf");
    }
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredConversations = conversations.filter(c => 
    c.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessageText.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex h-full bg-background overflow-hidden relative">
      
      {/* LEFT PANEL: Chat List */}
      <section className="w-80 border-r border-outline-variant/60 bg-surface-container-low flex flex-col h-full select-none shrink-0">
        
        {/* Search header */}
        <div className="p-4 border-b border-outline-variant/50 space-y-3 bg-surface-container-low/90">
          <h3 className="font-display font-bold text-base text-on-surface">Conversations</h3>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-2.5 text-on-surface-variant/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats or messages..."
              className="w-full pl-9 pr-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded-full text-xs focus:outline-hidden focus:border-primary text-on-surface placeholder:text-on-surface-variant/40"
            />
          </div>
        </div>

        {/* Chats queue */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              const isSelected = conv.id === activeConversationId;
              const hasUnread = conv.lastMessageUnread && !isSelected;
              const typing = isTyping[conv.id];

              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left cursor-pointer group ${
                    isSelected 
                      ? 'bg-primary-container text-on-primary-container shadow-xs' 
                      : 'hover:bg-surface-container-high/70 text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative shrink-0">
                      {conv.isGroup ? (
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-primary/80 to-tertiary flex items-center justify-center text-white font-bold text-sm shadow-xs">
                          {conv.groupInitials}
                        </div>
                      ) : (
                        <img
                          src={conv.participantAvatar}
                          alt={conv.participantName}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-xl object-cover ring-2 ring-primary/5"
                        />
                      )}
                      
                      {!conv.isGroup && (
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 rounded-full ${
                          isSelected ? 'border-primary-container' : 'border-surface-container-low'
                        } ${
                          conv.participantStatus === 'online' ? 'bg-secondary' : 'bg-outline'
                        }`} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-semibold truncate ${
                          isSelected ? 'text-on-primary-container font-extrabold' : 'text-on-surface'
                        }`}>
                          {conv.participantName}
                        </span>
                        <span className="text-[10px] text-on-surface-variant/75 ml-2">
                          {conv.lastMessageTime}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-1">
                        <p className={`text-xs truncate ${
                          hasUnread ? 'text-on-surface font-semibold' : 'opacity-80'
                        } ${typing ? 'text-secondary font-medium animate-pulse' : ''}`}>
                          {typing ? 'typing status...' : conv.lastMessageText}
                        </p>
                        
                        {hasUnread && (
                          <span className="w-2.5 h-2.5 rounded-full bg-error animate-pulse shrink-0 ml-1"></span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="text-center py-8 text-xs text-on-surface-variant/70">
              No conversations found
            </div>
          )}
        </div>
      </section>

      {/* RIGHT PANEL: Chat Workspace */}
      <section className="flex-1 flex flex-col h-full bg-surface-container-lowest overflow-hidden">
        
        {/* Chat Workspace Header */}
        {activeConv ? (
          <header className="h-16 border-b border-outline-variant/60 bg-surface-container-lowest flex items-center justify-between px-5 shrink-0 z-10">
            <div className="flex items-center gap-3">
              <div className="relative">
                {activeConv.isGroup ? (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary/80 to-tertiary flex items-center justify-center text-white font-bold text-sm">
                    {activeConv.groupInitials}
                  </div>
                ) : (
                  <img
                    src={activeConv.participantAvatar}
                    alt={activeConv.participantName}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-primary/5"
                  />
                )}
                
                {!activeConv.isGroup && (
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-surface-container-lowest rounded-full ${
                    activeConv.participantStatus === 'online' ? 'bg-secondary' : 'bg-outline'
                  }`} />
                )}
              </div>
              
              <div>
                <h3 className="font-display font-bold text-sm text-on-surface flex items-center gap-1.5">
                  {activeConv.participantName}
                </h3>
                <p className="text-[10px] text-on-surface-variant font-medium flex items-center gap-1 uppercase tracking-wide opacity-80">
                  {activeConv.isGroup ? 'Group Channel' : activeConv.participantStatus === 'online' ? 'Active Now' : 'Offline'}
                </p>
              </div>
            </div>

            {/* Header Call / Detail Options */}
            <div className="flex items-center gap-1.5">
              {!activeConv.isGroup && (
                <>
                  <button 
                    onClick={() => setActiveCallType('voice')}
                    className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-xl transition-colors cursor-pointer"
                    title="Start Voice Call"
                  >
                    <Phone size={17} />
                  </button>
                  <button 
                    onClick={() => setActiveCallType('video')}
                    className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-xl transition-colors cursor-pointer"
                    title="Start Video Call"
                  >
                    <Video size={17} />
                  </button>
                </>
              )}
              <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-colors cursor-pointer">
                <MoreVertical size={17} />
              </button>
            </div>
          </header>
        ) : null}

        {/* Messages Screen Window */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4 bg-[radial-gradient(var(--color-surface-container),transparent_95%)]">
          {activeMessages.map((msg, index) => {
            const isSelf = msg.senderId === currentUser?.id;
            return (
              <div 
                key={msg.id}
                className={`flex gap-3 max-w-[80%] ${
                  isSelf ? 'ml-auto flex-row-reverse' : 'mr-auto'
                } animate-in fade-in slide-in-from-bottom-1 duration-200`}
              >
                {!isSelf && (
                  <img
                    src={msg.senderAvatar}
                    alt={msg.senderName}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-lg object-cover self-end mb-1 ring-2 ring-primary/5"
                  />
                )}
                
                <div className="space-y-1">
                  {activeConv.isGroup && !isSelf && (
                    <span className="text-[10px] font-bold text-on-surface-variant px-1">
                      {msg.senderName}
                    </span>
                  )}
                  
                  <div className={`p-3.5 rounded-2xl relative shadow-xs leading-relaxed text-sm ${
                    isSelf 
                      ? 'bg-primary text-on-primary rounded-br-xs' 
                      : 'bg-surface-container-low text-on-surface rounded-bl-xs border border-outline-variant/30'
                  }`}>
                    
                    {/* Plain Text Message */}
                    {msg.text && <p className="font-sans font-medium">{msg.text}</p>}

                    {/* High Fidelity image attachments (e.g. proto designs) */}
                    {msg.attachmentUrl && msg.attachmentType === 'image' && (
                      <div className="mt-2 rounded-xl overflow-hidden border border-outline-variant/40 max-w-sm">
                        <img 
                          src={msg.attachmentUrl} 
                          alt="Attachment File" 
                          referrerPolicy="no-referrer"
                          className="w-full object-cover max-h-56 cursor-pointer hover:scale-102 transition-transform duration-300"
                          onClick={() => window.open(msg.attachmentUrl, '_blank')}
                        />
                      </div>
                    )}

                    {/* Micro-indicators */}
                    <div className={`flex items-center justify-end gap-1 text-[9px] mt-1.5 opacity-70 ${
                      isSelf ? 'text-on-primary/80' : 'text-on-surface-variant/80'
                    }`}>
                      <span>{msg.timestamp}</span>
                      {isSelf && (
                        <CheckCheck size={11} className="text-secondary" />
                      )}
                    </div>

                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {activeConv && isTyping[activeConv.id] && (
            <div className="flex gap-3 max-w-[80%] mr-auto items-center animate-in fade-in duration-150">
              <img
                src={activeConv.participantAvatar}
                alt={activeConv.participantName}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-lg object-cover ring-2 ring-primary/5"
              />
              <div className="bg-surface-container-low text-on-surface p-3 px-4 rounded-2xl rounded-bl-xs border border-outline-variant/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce duration-1000"></span>
                <span className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce duration-1000 delay-150"></span>
                <span className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce duration-1000 delay-300"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Panel */}
        <div className="p-4 border-t border-outline-variant/50 bg-surface-container-lowest shrink-0 z-10 relative">
          
          {showAttachmentMenu && (
            <div className="absolute bottom-full left-4 mb-2 bg-surface-container-lowest border border-outline-variant rounded-2xl p-2.5 shadow-xl w-44 z-20 flex flex-col space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <button
                onClick={() => handleSendAttachment('image')}
                className="w-full text-left p-2 hover:bg-surface-container-high rounded-xl text-xs font-semibold text-on-surface flex items-center gap-2.5 cursor-pointer"
              >
                <ImageIcon size={15} className="text-primary" />
                <span>Upload Design Image</span>
              </button>
              <button
                onClick={() => handleSendAttachment('file')}
                className="w-full text-left p-2 hover:bg-surface-container-high rounded-xl text-xs font-semibold text-on-surface flex items-center gap-2.5 cursor-pointer"
              >
                <Paperclip size={15} className="text-secondary" />
                <span>Attach Files (.pdf)</span>
              </button>
            </div>
          )}

          <form onSubmit={handleSend} className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              className="p-2.5 bg-surface-container-low hover:bg-surface-container-high rounded-xl text-on-surface-variant hover:text-on-surface border border-outline-variant/20 transition-colors cursor-pointer shrink-0"
              title="Add Attachment"
            >
              <Paperclip size={17} />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Write your message to ${activeConv?.participantName || 'coworker'}...`}
              className="flex-1 px-4 py-3 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm focus:outline-hidden focus:border-primary text-on-surface placeholder:text-on-surface-variant/40"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-3 bg-primary text-on-primary rounded-xl hover:bg-primary-container hover:text-on-primary-container disabled:opacity-50 disabled:pointer-events-none shadow-sm shadow-primary/25 transition-all cursor-pointer shrink-0"
            >
              <Send size={16} />
            </button>
          </form>
        </div>

      </section>

      {/* MOCK CALL OVERLAY MODAL */}
      {activeCallType && (
        <div className="fixed inset-0 bg-neutral-900/95 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6 animate-in fade-in duration-300">
          <div className="text-center space-y-6 max-w-sm w-full">
            
            {/* Call State Logo */}
            <div className="relative mx-auto w-24 h-24">
              <img
                src={activeConv?.participantAvatar}
                alt={activeConv?.participantName}
                referrerPolicy="no-referrer"
                className="w-24 h-24 rounded-2xl object-cover ring-4 ring-primary animate-pulse"
              />
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-4 border-neutral-900">
                {activeCallType === 'video' ? <Video size={12} className="text-white" /> : <Phone size={12} className="text-white" />}
              </div>
            </div>

            {/* Caller metadata */}
            <div>
              <h3 className="text-white font-display font-bold text-xl">{activeConv?.participantName}</h3>
              <p className="text-primary-container text-xs font-semibold uppercase tracking-widest mt-1.5 animate-pulse">
                {activeCallType === 'video' ? 'VIDEO CALL ACTIVE' : 'VOICE CALL ACTIVE'}
              </p>
              <p className="text-white/60 font-mono text-sm mt-3">{formatDuration(callDuration)}</p>
            </div>

            {/* Active Video Screen (only if call type is video) */}
            {activeCallType === 'video' && (
              <div className="w-full h-44 rounded-2xl bg-neutral-800 border border-neutral-700 overflow-hidden relative shadow-2xl flex items-center justify-center text-neutral-500 text-xs">
                {/* Mirror self view */}
                <div className="absolute bottom-2 right-2 w-14 h-20 rounded-lg bg-neutral-700 border border-neutral-600 overflow-hidden shadow-md flex items-center justify-center">
                  <UserCheck size={14} className="text-neutral-400" />
                </div>
                <div className="text-center space-y-1.5 p-4">
                  <Sparkles size={20} className="mx-auto text-primary animate-bounce" />
                  <span className="font-sans font-medium text-[11px] text-white/80">Rendering video layout sync...</span>
                </div>
              </div>
            )}

            {/* End Call controls */}
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setActiveCallType(null)}
                className="p-4 bg-error text-on-error rounded-full hover:scale-105 transition-transform cursor-pointer shadow-lg shadow-error/20 flex items-center justify-center"
                title="Disconnect Call"
              >
                <PhoneOff size={22} />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
