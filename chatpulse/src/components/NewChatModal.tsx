import React, { useState } from 'react';
import { X, Search, Check, Users, MessageSquare } from 'lucide-react';
import { useApp } from '../store/AppContext';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose }) => {
  const { conversations, setActiveConversationId, conversations: existingConvs } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  if (!isOpen) return null;

  const availableContacts = [
    { id: 'elena', name: 'Elena Vance', role: 'UI/UX Designer', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDt7EFtAsZPCycU-ePdnOLysMhbQRF_oMrKyyo8uwbiD6w3fS1oGU4WtmVqCe44eqgFwDVn-6pL_o1GtGfnpaf3Zph8ySHusHyHJEdFOjVi7qLzKI8leuIIex39B219txtgjJrxifI4jniKeIg8MJZIyBkDqlEgwwj_Arb2-HI0BJ1A-aizNCA_8ngNuIZR_VwU4mrSqLrf9ti9S6Wpv-RJVL1hC35S2PhpxHlFq24mTosLOLa5rtHVLCtlIPoS-iK8__WAu7c0TEE' },
    { id: 'marcus', name: 'Marcus Thorne', role: 'Product Manager', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHaJs_RPltgdqmC61JbBAXsk61mQwwkune9oT7F7mQqcEC_aLK_iW99C7uk4LubMOJft66n8Jgsukv28ILEYn-g8CN9ZyJ0ZmXyquUz5uToIgGoY88K_A1t0XVugCNjFFtFxHW_B7oA6HR17qmSaEhGn4jB6c7__bdkzIKGu41kHBDES0EbA0DFb5bgXxEm3Kux2uFDzEnmUmhXbi7cIP5XJK-wlF_Dn1eOfZFlI-G5b_j_0PPOQJ_FRLu81F8e-jlUVIDVck8Gyc' },
    { id: 'jordan', name: 'Jordan Smith', role: 'Full Stack Engineer', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8A-lS1fFnvIj3W8ETIauA_VASFxM7EU7MYpcjyaKH9wMCXh9dBCLBGk_Ij3QWY-UqpW3zoT16iCnZPwQ58x98aSMiSYBOEhPDT8jzpjvbzC2YCxbcEspM8DFxvpMunCgwYO3GKEpu1GptHCD2Fp3pvCRDmbvi7ZCobq2XoTY3VaieNRqMf7f7GKFw3k0V-0Fyd_-Bkk4jZTkYdmITaTdiR75Hdk5YZs_ZfecYwMzjgyLFBvRrVR44fu8CnJ1rKs0WlmOtXphWpOs' },
    { id: 'sarah-chen', name: 'Sarah Chen', role: 'Lead Brand Strategist', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKK07WxjOfJoYrGXfV3-adymye2qfhbOaCN7X8ualM7dwKetVLupT4loCjTZjCft0ssVSjPD2YFVHyyNX9WYfP2JFpuEfmS2B2febjGIHLugCfq2_oaBYjDxEDFMPlur-0Ie6j5l6hqtCHqlFvLhpoBitbgyWPOrhSt9bi-Kn1GQhlwnrqaHf2Pexm4xLpFPSuUCyqmHdtyIOpeUvqmwIh1WrJ6adITgyuiTcWd4ljE6819Xa1p9OkpG1CaQBo504GjHd_P5y-D1s' },
  ];

  const filteredContacts = availableContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectContact = (id: string) => {
    if (isGroupChat) {
      setSelectedContacts(prev =>
        prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
      );
    } else {
      // Find or switch to single conversation
      setActiveConversationId(id);
      onClose();
    }
  };

  const handleCreateChat = () => {
    if (isGroupChat) {
      if (!groupName.trim()) return;
      // In a real app we'd add to conversation list, but we can simulate switching
      setActiveConversationId('design-team'); // switch to the existing mock design-team group chat
      onClose();
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
            {filteredContacts.length > 0 ? (
              filteredContacts.map(contact => {
                const isSelected = selectedContacts.includes(contact.id);
                return (
                  <button
                    key={contact.id}
                    onClick={() => handleSelectContact(contact.id)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-container-high/60 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={contact.avatar}
                        alt={contact.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                      <div>
                        <div className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                          {contact.name}
                        </div>
                        <div className="text-xs text-on-surface-variant opacity-80">
                          {contact.role}
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
