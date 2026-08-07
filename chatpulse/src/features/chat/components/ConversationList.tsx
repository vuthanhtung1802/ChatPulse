import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Conversation } from '../../../types/types';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string;
  isTyping: Record<string, boolean>;
  onSelect: (id: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  isTyping,
  onSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = conversations.filter(
    (c) =>
      c.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessageText.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <section className="w-80 border-r border-outline-variant/60 bg-surface-container-low flex flex-col h-full select-none shrink-0">
      <div className="p-4 border-b border-outline-variant/50 space-y-3 bg-surface-container-low/90">
        <h3 className="font-display font-bold text-base text-on-surface">
          Conversations
        </h3>
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-2.5 text-on-surface-variant/50"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats or messages..."
            className="w-full pl-9 pr-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded-full text-xs focus:outline-hidden focus:border-primary text-on-surface placeholder:text-on-surface-variant/40"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.length > 0 ? (
          filtered.map((conv) => {
            const isSelected = conv.id === activeConversationId;
            const hasUnread = conv.lastMessageUnread && !isSelected;
            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
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
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 rounded-full ${
                          isSelected
                            ? 'border-primary-container'
                            : 'border-surface-container-low'
                        } ${
                          conv.participantStatus === 'online'
                            ? 'bg-secondary'
                            : 'bg-outline'
                        }`}
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-semibold truncate ${
                          isSelected
                            ? 'text-on-primary-container font-extrabold'
                            : 'text-on-surface'
                        }`}
                      >
                        {conv.participantName}
                      </span>
                      <span className="text-[10px] text-on-surface-variant/75 ml-2">
                        {conv.lastMessageTime}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <p
                        className={`text-xs truncate ${
                          hasUnread ? 'text-on-surface font-semibold' : 'opacity-80'
                        } ${
                          isTyping[conv.id]
                            ? 'text-secondary font-medium animate-pulse'
                            : ''
                        }`}
                      >
                        {isTyping[conv.id] ? 'Đang nhập...' : conv.lastMessageText}
                      </p>

                      {hasUnread && (
                        <span className="w-2.5 h-2.5 rounded-full bg-error animate-pulse shrink-0 ml-1" />
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
  );
};