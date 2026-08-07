import React from 'react';
import { MoreVertical, Phone, Video } from 'lucide-react';
import { Conversation } from '../../../types/types';

interface ChatHeaderProps {
  conversation: Conversation;
  isGroup: boolean;
  onStartCall: (type: 'voice' | 'video') => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  isGroup,
  onStartCall,
}) => (
  <header className="h-16 border-b border-outline-variant/60 bg-surface-container-lowest flex items-center justify-between px-5 shrink-0 z-10">
    <div className="flex items-center gap-3">
      <div className="relative">
        {conversation.isGroup ? (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary/80 to-tertiary flex items-center justify-center text-white font-bold text-sm">
            {conversation.groupInitials}
          </div>
        ) : (
          <img
            src={conversation.participantAvatar}
            alt={conversation.participantName}
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-xl object-cover ring-2 ring-primary/5"
          />
        )}

        {!conversation.isGroup && (
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-surface-container-lowest rounded-full ${
              conversation.participantStatus === 'online'
                ? 'bg-secondary'
                : 'bg-outline'
            }`}
          />
        )}
      </div>

      <div>
        <h3 className="font-display font-bold text-sm text-on-surface flex items-center gap-1.5">
          {conversation.participantName}
        </h3>
        <p className="text-[10px] text-on-surface-variant font-medium flex items-center gap-1 uppercase tracking-wide opacity-80">
          {conversation.isGroup
            ? 'Group Channel'
            : conversation.participantStatus === 'online'
              ? 'Active Now'
              : 'Offline'}
        </p>
      </div>
    </div>

    <div className="flex items-center gap-1.5">
      {!conversation.isGroup && (
        <>
          <button
            onClick={() => onStartCall('voice')}
            className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-xl transition-colors cursor-pointer"
            title="Start Voice Call"
          >
            <Phone size={17} />
          </button>
          <button
            onClick={() => onStartCall('video')}
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
);