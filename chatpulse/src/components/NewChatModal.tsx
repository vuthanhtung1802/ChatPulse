import React, { useState } from 'react';
import { X, Search, Check, Users, MessageSquare } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

import { userService } from '../services/user.service';

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose }) => {
  const { createConversation, createGroupConversation, currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch contacts matching searchTerm
  React.useEffect(() => {
    if (!isOpen) return;

    const fetchContacts = async () => {
      setIsLoading(true);
      try {
        const users = await userService.searchUsers(searchTerm);
        // Exclude self from contact list
        const filtered = users.filter((u: any) => u._id !== currentUser?.id);
        setContacts(filtered);
      } catch (err) {
        console.error('Failed to search users', err);
      } finally {
        setIsLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchContacts();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSelectContact = async (id: string) => {
    if (isGroupChat) {
      setSelectedContacts(prev =>
        prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
      );
    } else {
      try {
        await createConversation(id);
        onClose();
      } catch (err) {
        console.error('Failed to start conversation', err);
      }
    }
  };

  const handleCreateChat = async () => {
    if (isGroupChat) {
      if (!groupName.trim() || selectedContacts.length === 0) return;
      try {
        await createGroupConversation(groupName.trim(), selectedContacts);
        onClose();
      } catch (err) {
        console.error('Failed to start group conversation', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-surface-container-low border border-outline-variant rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-outline-variant/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <MessageSquare size={16} />
            </div>
            <h3 className="font-display font-bold text-base text-on-surface">Start new chat</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-outline-variant/40">
          <button
            onClick={() => setIsGroupChat(false)}
            className={`flex-1 py-3 text-center text-sm font-medium transition-colors cursor-pointer border-b-2 ${
              !isGroupChat 
                ? 'border-primary text-primary' 
                : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/30'
            }`}
          >
            Direct Message
          </button>
          <button
            onClick={() => setIsGroupChat(true)}
            className={`flex-1 py-3 text-center text-sm font-medium transition-colors cursor-pointer border-b-2 ${
              isGroupChat 
                ? 'border-primary text-primary' 
                : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/30'
            }`}
          >
            Group Channel
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          {isGroupChat && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant">Group Channel Name</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Design Sync, Marketing Campaign"
                className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm focus:outline-hidden focus:border-primary text-on-surface placeholder:text-on-surface-variant/50"
              />
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3.5 text-on-surface-variant/50" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search coworkers by name or role..."
              className="w-full pl-9 pr-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm focus:outline-hidden focus:border-primary text-on-surface placeholder:text-on-surface-variant/50"
            />
          </div>

          {/* Contacts list */}
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-on-surface-variant px-1 mb-2">Coworkers</h4>
            {isLoading ? (
              <div className="text-center py-6 text-sm text-on-surface-variant/60">
                Searching coworkers...
              </div>
            ) : contacts.length > 0 ? (
              contacts.map(contact => {
                const contactId = contact._id || contact.id;
                const isSelected = selectedContacts.includes(contactId);
                const avatarUrl = contact.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150';
                return (
                  <button
                    key={contactId}
                    onClick={() => handleSelectContact(contactId)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-container-high/60 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={avatarUrl}
                        alt={contact.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                      <div>
                        <div className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                          {contact.name}
                        </div>
                        <div className="text-xs text-on-surface-variant opacity-80">
                          {contact.email}
                        </div>
                      </div>
                    </div>

                    {isGroupChat && (
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'bg-primary border-primary text-on-primary' 
                          : 'border-outline text-transparent'
                      }`}>
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="text-center py-6 text-sm text-on-surface-variant/60">
                No coworkers found
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {isGroupChat && (
          <div className="p-4 border-t border-outline-variant/60 bg-surface-container-low/90 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-outline-variant text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateChat}
              disabled={!groupName.trim() || selectedContacts.length === 0}
              className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-on-primary text-sm font-medium hover:bg-primary-container hover:text-on-primary-container disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
            >
              Create Channel
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
