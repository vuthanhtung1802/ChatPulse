import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../ChatContext';
import { useAuth } from '../../auth/AuthContext';
import { ConversationList } from '../components/ConversationList';
import { ChatHeader } from '../components/ChatHeader';
import { ChatInput } from '../components/ChatInput';
import { MessageBubble } from '../components/MessageBubble';
import { CallOverlay } from '../components/CallOverlay';

export const Messages: React.FC = () => {
  const {
    conversations,
    messages,
    activeConversationId,
    setActiveConversationId,
    sendMessage,
    recallMessage,
    isTyping,
    sendTypingStatus,
  } = useChat();
  const { currentUser } = useAuth();

  const [activeCallType, setActiveCallType] = useState<'voice' | 'video' | null>(null);
  const [callDuration, setCallDuration] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeConv = conversations.find(c => c.id === activeConversationId) || conversations[0];
  const activeMessages = messages[activeConversationId] || [];

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

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

  return (
    <div className="flex-1 flex h-full bg-background overflow-hidden relative">

      <ConversationList
        conversations={conversations}
        activeConversationId={activeConversationId}
        isTyping={isTyping}
        onSelect={setActiveConversationId}
      />

      {/* RIGHT PANEL: Chat Workspace */}
      <section className="flex-1 flex flex-col h-full bg-surface-container-lowest overflow-hidden">

        {activeConv ? (
          <ChatHeader
            conversation={activeConv}
            isGroup={activeConv.isGroup}
            onStartCall={setActiveCallType}
          />
        ) : null}

        {/* Messages Screen Window */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4 bg-[radial-gradient(var(--color-surface-container),transparent_95%)]">
          {activeMessages.map((msg) => {
            const isSelf = msg.senderId === currentUser?.id;
            return (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isSelf={isSelf}
                isGroup={activeConv?.isGroup || false}
                onRecall={recallMessage}
              />
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {activeConv && (
          <ChatInput
            placeholder={`Write your message to ${activeConv.participantName}...`}
            onSendMessage={sendMessage}
            onTyping={sendTypingStatus}
          />
        )}

      </section>

      {/* MOCK CALL OVERLAY MODAL */}
      {activeCallType && activeConv && (
        <CallOverlay
          conversation={activeConv}
          callType={activeCallType}
          duration={callDuration}
          onEnd={() => setActiveCallType(null)}
        />
      )}

    </div>
  );
};