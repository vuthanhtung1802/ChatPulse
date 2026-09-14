import React from "react";
import {
  CheckCheck,
  LoaderCircle,
  RefreshCw,
  Reply,
  SmilePlus,
  Trash,
} from "lucide-react";
import { Message } from "../../../types/types";

interface MessageBubbleProps {
  msg: Message;
  isSelf: boolean;
  isGroup: boolean;
  onRecall: (messageId: string) => void;
  onRetry: (messageId: string) => void;
  onReply: (message: Message) => void;
  onReact: (messageId: string, emoji: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  msg,
  isSelf,
  isGroup,
  onRecall,
  onRetry,
  onReply,
  onReact,
}) => (
  <div
    className={`flex gap-3 max-w-[80%] ${
      isSelf ? "ml-auto flex-row-reverse" : "mr-auto"
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
              ? "bg-primary text-on-primary rounded-br-xs"
              : "bg-surface-container-low text-on-surface rounded-bl-xs border border-outline-variant/30"
          }`}
        >
          {msg.replyTo && (
            <div
              className={`mb-2 rounded-lg border-l-2 px-2 py-1 text-[11px] ${isSelf ? "bg-white/10 border-white/60" : "bg-surface-container-high border-primary"}`}
            >
              <strong>{msg.replyTo.senderName}</strong>
              <p className="truncate opacity-75">
                {msg.replyTo.text || "Tệp đính kèm"}
              </p>
            </div>
          )}
          {msg.text && <p className="font-sans font-medium">{msg.text}</p>}

          {msg.attachmentUrl && msg.attachmentType === "image" && (
            <div className="mt-2 rounded-xl overflow-hidden border border-outline-variant/40 max-w-sm">
              <img
                src={msg.attachmentUrl}
                alt="Attachment File"
                referrerPolicy="no-referrer"
                className="w-full object-cover max-h-56 cursor-pointer hover:scale-102 transition-transform duration-300"
                onClick={() => window.open(msg.attachmentUrl, "_blank")}
              />
            </div>
          )}

          <div
            className={`flex items-center justify-end gap-1 text-[9px] mt-1.5 opacity-70 ${
              isSelf ? "text-on-primary/80" : "text-on-surface-variant/80"
            }`}
          >
            <span>{msg.timestamp}</span>
            {isSelf &&
              (msg.status === "sending" ? (
                <LoaderCircle size={11} className="animate-spin" />
              ) : msg.status === "failed" ? (
                <button
                  type="button"
                  onClick={() => onRetry(msg.id)}
                  className="flex items-center gap-1 text-error-container"
                  title="Thử gửi lại"
                >
                  <RefreshCw size={11} /> Gửi lại
                </button>
              ) : (
                <CheckCheck
                  size={11}
                  className={
                    msg.status === "read"
                      ? "text-secondary"
                      : "text-on-primary/60"
                  }
                />
              ))}
          </div>
        </div>

        {!!msg.reactions?.length && (
          <div className="mt-1 flex flex-wrap gap-1">
            {Object.entries(
              msg.reactions.reduce<Record<string, number>>(
                (counts, reaction) => {
                  counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1;
                  return counts;
                },
                {},
              ),
            ).map(([emoji, count]) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onReact(msg.id, emoji)}
                className="rounded-full border border-outline-variant bg-surface-container-lowest px-2 py-0.5 text-[11px]"
              >
                {emoji} {count}
              </button>
            ))}
          </div>
        )}

        {!msg.isRecalled && !msg.id.startsWith("temp-") && (
          <div className="absolute -top-7 right-0 hidden group-hover/msg:flex items-center gap-1 rounded-full border border-outline-variant bg-surface-container-lowest px-1 shadow-sm">
            <button
              type="button"
              onClick={() => onReply(msg)}
              className="p-1"
              title="Trả lời"
            >
              <Reply size={13} />
            </button>
            <div className="group/reactions relative">
              <button type="button" className="p-1" title="Thả cảm xúc">
                <SmilePlus size={13} />
              </button>
              <div className="absolute bottom-full right-0 hidden group-hover/reactions:flex rounded-full border border-outline-variant bg-surface-container-lowest p-1 shadow-lg">
                {["👍", "❤️", "😂", "😮", "😢", "🎉"].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => onReact(msg.id, emoji)}
                    className="p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

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
