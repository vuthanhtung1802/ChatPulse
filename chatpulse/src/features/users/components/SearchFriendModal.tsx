import React, { useState } from 'react';
import { X, Search, UserPlus } from 'lucide-react';
import { useChat } from '../../chat/ChatContext';
import { useAuth } from '../../auth/AuthContext';
import { userService } from '../services/user.service';

interface SearchFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchFriendModal: React.FC<SearchFriendModalProps> = ({ isOpen, onClose }) => {
  const { createConversation } = useChat();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setUsers([]);
      setSearchTerm('');
      return;
    }
    if (!searchTerm.trim()) {
      setUsers([]);
      setIsLoading(false);
      return;
    }

    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const data = await userService.searchUsers(searchTerm);
        const filtered = (data.users || data).filter((u: any) => u._id !== currentUser?.id);
        setUsers(filtered);
      } catch (err) {
        console.error('Failed to search users', err);
      } finally {
        setIsLoading(false);
      }
    };

    const delayDebounce = setTimeout(fetchUsers, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSelectUser = async (id: string) => {
    try {
      await createConversation(id);
      onClose();
    } catch (err) {
      console.error('Failed to start conversation', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-surface-container-low border border-outline-variant rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-outline-variant/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <UserPlus size={16} />
            </div>
            <h3 className="font-display font-bold text-base text-on-surface">Search Friend</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3.5 text-on-surface-variant/50" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users by name..."
              className="w-full pl-9 pr-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm focus:outline-hidden focus:border-primary text-on-surface placeholder:text-on-surface-variant/50"
            />
          </div>

          {/* Users list */}
          <div className="space-y-1">
            {isLoading ? (
              <div className="text-center py-6 text-sm text-on-surface-variant/60">
                Searching users...
              </div>
            ) : users.length > 0 ? (
              users.map(user => {
                const userId = user._id || user.id;
                const avatarUrl = user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150';
                return (
                  <button
                    key={userId}
                    onClick={() => handleSelectUser(userId)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-container-high/60 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={avatarUrl}
                        alt={user.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                      <div>
                        <div className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                          {user.name}
                        </div>
                        <div className="text-xs text-on-surface-variant opacity-80">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : searchTerm ? (
              <div className="text-center py-6 text-sm text-on-surface-variant/60">
                No users found
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-on-surface-variant/60">
                Type a name to search
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
