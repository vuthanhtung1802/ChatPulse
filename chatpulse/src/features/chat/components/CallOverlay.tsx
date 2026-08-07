import React from 'react';
import { Phone, PhoneOff, Sparkles, UserCheck, Video } from 'lucide-react';
import { Conversation } from '../../../types/types';

interface CallOverlayProps {
  conversation: Conversation;
  callType: 'voice' | 'video';
  duration: number;
  onEnd: () => void;
}

const formatDuration = (sec: number) => {
  const mins = Math.floor(sec / 60);
  const secs = sec % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const CallOverlay: React.FC<CallOverlayProps> = ({
  conversation,
  callType,
  duration,
  onEnd,
}) => (
  <div className="fixed inset-0 bg-neutral-900/95 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6 animate-in fade-in duration-300">
    <div className="text-center space-y-6 max-w-sm w-full">
      <div className="relative mx-auto w-24 h-24">
        <img
          src={conversation.participantAvatar}
          alt={conversation.participantName}
          referrerPolicy="no-referrer"
          className="w-24 h-24 rounded-2xl object-cover ring-4 ring-primary animate-pulse"
        />
        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-4 border-neutral-900">
          {callType === 'video' ? (
            <Video size={12} className="text-white" />
          ) : (
            <Phone size={12} className="text-white" />
          )}
        </div>
      </div>

      <div>
        <h3 className="text-white font-display font-bold text-xl">
          {conversation.participantName}
        </h3>
        <p className="text-primary-container text-xs font-semibold uppercase tracking-widest mt-1.5 animate-pulse">
          {callType === 'video' ? 'VIDEO CALL ACTIVE' : 'VOICE CALL ACTIVE'}
        </p>
        <p className="text-white/60 font-mono text-sm mt-3">
          {formatDuration(duration)}
        </p>
      </div>

      {callType === 'video' && (
        <div className="w-full h-44 rounded-2xl bg-neutral-800 border border-neutral-700 overflow-hidden relative shadow-2xl flex items-center justify-center text-neutral-500 text-xs">
          <div className="absolute bottom-2 right-2 w-14 h-20 rounded-lg bg-neutral-700 border border-neutral-600 overflow-hidden shadow-md flex items-center justify-center">
            <UserCheck size={14} className="text-neutral-400" />
          </div>
          <div className="text-center space-y-1.5 p-4">
            <Sparkles size={20} className="mx-auto text-primary animate-bounce" />
            <span className="font-sans font-medium text-[11px] text-white/80">
              Rendering video layout sync...
            </span>
          </div>
        </div>
      )}

      <div className="flex justify-center pt-4">
        <button
          onClick={onEnd}
          className="p-4 bg-error text-on-error rounded-full hover:scale-105 transition-transform cursor-pointer shadow-lg shadow-error/20 flex items-center justify-center"
          title="Disconnect Call"
        >
          <PhoneOff size={22} />
        </button>
      </div>
    </div>
  </div>
);