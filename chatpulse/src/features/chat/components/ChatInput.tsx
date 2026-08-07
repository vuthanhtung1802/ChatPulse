import React from 'react';
import { Image as ImageIcon, Paperclip, Send } from 'lucide-react';
import { userService } from '../../users/services/user.service';

interface ChatInputProps {
  placeholder: string;
  onSendMessage: (text: string, attachmentUrl?: string, attachmentType?: 'image' | 'video') => void;
  onTyping?: (isTyping: boolean) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  placeholder,
  onSendMessage,
  onTyping,
}) => {
  const [inputText, setInputText] = React.useState('');
  const [showAttachmentMenu, setShowAttachmentMenu] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
    if (onTyping) onTyping(false);
  };

  const handleSendAttachment = (type: 'image' | 'file') => {
    setShowAttachmentMenu(false);
    if (type === 'image') {
      fileInputRef.current?.click();
    } else {
      onSendMessage('Shared document checklist.pdf', undefined, undefined);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await userService.uploadFile(file);
      onSendMessage('Gửi một ảnh đính kèm', res.url, 'image');
    } catch (err) {
      console.error('Failed to upload image', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputText(value);
    if (onTyping) onTyping(value.trim().length > 0);
  };

  return (
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

      <form onSubmit={handleSubmit} className="flex items-center gap-3">
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
          onChange={handleChange}
          placeholder={placeholder}
          className="flex-1 px-4 py-3 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm focus:outline-hidden focus:border-primary text-on-surface placeholder:text-on-surface-variant/40"
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
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
  );
};