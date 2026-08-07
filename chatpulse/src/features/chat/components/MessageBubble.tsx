import React from 'react';
import { CheckCheck, Trash } from 'lucide-react';
import { Message } from '../../../types/types';

interface MessageBubbleProps {
  msg: Message;
  isSelf: boolean;
  isGroup: boolean;
  onRecall: (messageId: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  msg,
  isSelf,
  isGroup,
  onRecall,
}) => (
  <div
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
      {isGroup && !isSelf && (
        <span className="text-[10px] font-bold text-on-surface-variant px-1">
          {msg.senderName}
        </span>
      )}

      <div className="relative group/msg max-w-full">
        <div
          className={`p-3.5 rounded-2xl relative shadow-xs leading-relaxed text-sm ${
            isSelf
              ? 'bg-primary text-on-primary rounded-br-xs'
              : 'bg-surface-container-low text-on-surface rounded-bl-xs border border-outline-variant/30'
          }`}
        >
          {msg.text && <p className="font-sans font-medium">{msg.text}</p>}

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

          <div
            className={`flex items-center justify-end gap-1 text-[9px] mt-1.5 opacity-70 ${
              isSelf ? 'text-on-primary/80' : 'text-on-surface-variant/80'
            }`}
          >
            <span>{msg.timestamp}</span>
            {isSelf && (
              <CheckCheck
                size={11}
                className={
                  msg.status === 'read' ? 'text-secondary' : 'text-on-primary/60'
                }
              />
            )}
          </div>
        </div>

        {isSelf && !msg.isRecalled && (
          <button
            onClick={() => onRecall(msg.id)}
            className="absolute top-1/2 -translate-y-1/2 -left-8 opacity-0 group-hover/msg:opacity-100 p-1 text-on-surface-variant hover:text-error transition-all duration-150 cursor-pointer"
            title="Recall Message"
          >
            <Trash size={13} />
          </button>
        )}
      </div>
    </div>
  </div>
);