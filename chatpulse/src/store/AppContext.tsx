import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Conversation, Message, Post } from '../types';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'message' | 'system' | 'like' | 'mention';
  unread: boolean;
}

interface AppContextType {
  currentUser: User | null;
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  posts: Post[];
  notifications: NotificationItem[];
  theme: 'light' | 'dark';
  activeConversationId: string;
  isTyping: Record<string, boolean>;
  login: (email: string, name?: string) => Promise<boolean>;
  signup: (name: string, email: string) => Promise<boolean>;
  logout: () => void;
  toggleTheme: () => void;
  setActiveConversationId: (id: string) => void;
  sendMessage: (text: string, attachmentUrl?: string, attachmentType?: 'image' | 'video') => void;
  updateProfile: (updatedData: Partial<User>) => void;
  toggleLikePost: (postId: string) => void;
  createPost: (content: string, images?: string[]) => void;
  markNotificationsAsRead: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialUser: User = {
  id: 'alex-rivera',
  name: 'Alex Rivera',
  email: 'alex.rivera@chatpulse.io',
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBA6sX-vZWNmMhPYgRgl2Fpz8PnAA85-ZcCkFKuJutDZvUOp5kgcD-W-gYIYQjsT1q4P4m3LKaGRJsR1LjaaopsNYo5pUgHCGorg8y1oSD7wFe55nX60YLJcHxKtBJi-77EsLyAtOK0riY_wD_sQgEkVBlHYjuXCB1YicZPT0tIDFeV3BC86RvLO-7sJHP27d1ruSk4pmDP5miFLrQ4t_EeE-ymvCPKgbACEmgkwjX__B9gqVOObxw-oDPbKCI47o8iCEsVXLyNo7o',
  plan: 'Pro Plan',
  status: 'online',
  bio: 'Product Designer & Digital Nomad. I love building intuitive experiences and connecting with creative minds across the globe. Always up for a coffee chat or a hackathon! 🎨 💻',
  location: 'San Francisco, CA',
  joinDate: 'August 2022',
  website: 'alexrivera.design',
  interests: ['UX Research', 'Figma', 'Motion', 'Tailwind', 'Photography'],
  photoGallery: [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCUxHc_Lyr9eGAeOTBo-d9yI2idLD0L-f0Kw2A8RoZ4yf8esQWZyvo9Vd0Ccf62Yf0E_qXtdY_W6th1RSIQ7EECRiLHNGBNCK1eVV-BNEbV5DIKudOWsa41UsDonQxTNhQvuP5aKVJGW_89laz8hptvMOGSULdEteiUHaDGLv0HVNr0TKHpfP4mwGSCd72f-b7wq6YGXFYdD_5yCxkXQxs977dCQAx6SQLQu_czrO_n43ZWAyI8k0CJyVp-2aasQcsxYzNHaPInGFo',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAlR4u_vUd4ncjvfZmc9jvA8cWp7hRozs9vETTP0sgwQOUjq4bapBSvDIQYB6ZztWK-QgNgr_ODxmnBkSekG0wxFCVzF5yPUJXWOdIOrXhFwNyZ8aRKeXXNX0SuPyS0-zk3LAwgYRBE3a8UFr9x2uGlMjdkQU_UmK-m75VJgw5cKAmmmnvzw4rgU1zbbIp3BuF6lWVsZhS4RSHSOYpcYOA4ybaIgqmn75NUkbPweR0EEEz52mQG_xoiW_m8cSLTjiGQ3GjBdWf4Cww',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBXjSgfzqOENSb_pt-61tEwpQDCliKV59IuEd1NvTSgIYPZYRYegHgjTdccdHvOcQjRt2AhNeTeqxwtyKdNGkitiRu9DrvUq4ME15uM6UnlyZ6Ynqto2yi6LJ27NeU8qlz-Dgvz31BjyrYiFdN0VpkFJf-9fInKTJ2EkHRT3jpEIlkC7Hz8EY4y2piVi1TxlkslC0h_5_VqqCy-xvaAQAWg_bWYPiXQQURuTey1apE81m-HirKDeWf_94zTre_wKqqI1aUMhGJwfHs'
  ]
};

const initialConversations: Conversation[] = [
  {
    id: 'elena',
    participantName: 'Elena Vance',
    participantAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDt7EFtAsZPCycU-ePdnOLysMhbQRF_oMrKyyo8uwbiD6w3fS1oGU4WtmVqCe44eqgFwDVn-6pL_o1GtGfnpaf3Zph8ySHusHyHJEdFOjVi7qLzKI8leuIIex39B219txtgjJrxifI4jniKeIg8MJZIyBkDqlEgwwj_Arb2-HI0BJ1A-aizNCA_8ngNuIZR_VwU4mrSqLrf9ti9S6Wpv-RJVL1hC35S2PhpxHlFq24mTosLOLa5rtHVLCtlIPoS-iK8__WAu7c0TEE',
    participantStatus: 'online',
    lastMessageText: "I've sent the final designs for review!",
    lastMessageTime: '10:42 AM',
    lastMessageUnread: true
  },
  {
    id: 'marcus',
    participantName: 'Marcus Thorne',
    participantAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHaJs_RPltgdqmC61JbBAXsk61mQwwkune9oT7F7mQqcEC_aLK_iW99C7uk4LubMOJft66n8Jgsukv28ILEYn-g8CN9ZyJ0ZmXyquUz5uToIgGoY88K_A1t0XVugCNjFFtFxHW_B7oA6HR17qmSaEhGn4jB6c7__bdkzIKGu41kHBDES0EbA0DFb5bgXxEm3Kux2uFDzEnmUmhXbi7cIP5XJK-wlF_Dn1eOfZFlI-G5b_j_0PPOQJ_FRLu81F8e-jlUVIDVck8Gyc',
    participantStatus: 'offline',
    lastMessageText: "Let's reschedule the sync to Monday morning.",
    lastMessageTime: 'Yesterday',
    lastMessageUnread: false
  },
  {
    id: 'design-team',
    participantName: 'Design Team',
    participantAvatar: '',
    participantStatus: 'online',
    lastMessageText: 'Sarah: The new logo looks amazing on mobile!',
    lastMessageTime: 'Tue',
    lastMessageUnread: false,
    isGroup: true,
    groupInitials: 'DT'
  },
  {
    id: 'jordan',
    participantName: 'Jordan Smith',
    participantAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8A-lS1fFnvIj3W8ETIauA_VASFxM7EU7MYpcjyaKH9wMCXh9dBCLBGk_Ij3QWY-UqpW3zoT16iCnZPwQ58x98aSMiSYBOEhPDT8jzpjvbzC2YCxbcEspM8DFxvpMunCgwYO3GKEpu1GptHCD2Fp3pvCRDmbvi7ZCobq2XoTY3VaieNRqMf7f7GKFw3k0V-0Fyd_-Bkk4jZTkYdmITaTdiR75Hdk5YZs_ZfecYwMzjgyLFBvRrVR44fu8CnJ1rKs0WlmOtXphWpOs',
    participantStatus: 'online',
    lastMessageText: 'Are you coming to the meetup tonight?',
    lastMessageTime: 'Oct 12',
    lastMessageUnread: false
  }
];

const initialMessages: Record<string, Message[]> = {
  elena: [
    {
      id: 'm1',
      text: 'Hey Alex! I just finished the prototypes for the new dashboard. Would love to get your thoughts.',
      senderId: 'elena',
      senderName: 'Elena Vance',
      senderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAigpLKQvb7N3AdXYbrBAQdWrZhz27B_2_8ZfQQJ1aprk8gQ1s9Bj4wkXDWKgxlNk8jJIqNz3gAZRxYCFXGQV-BFHMDX8ehjJRYw4ogvWn8VwdDQNtYcKhHQUa_TBJO1ecefcDKf7IiXzTjH98Fo3bEQKz0kJszTjwxcJnQJ4Tc8F7-bsfuMLAfVwx5CmKmldQ7txG9PoMtTMAZLUEI3MuRf0OPSAKoJZhW3pHMm1BfBkSe67McvWBN7gR-A2GwnKZdlFqr9zjeTaM',
      timestamp: '10:30 AM'
    },
    {
      id: 'm2',
      text: "That was fast! Send them over whenever you're ready.",
      senderId: 'alex-rivera',
      senderName: 'Alex Rivera',
      senderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBA6sX-vZWNmMhPYgRgl2Fpz8PnAA85-ZcCkFKuJutDZvUOp5kgcD-W-gYIYQjsT1q4P4m3LKaGRJsR1LjaaopsNYo5pUgHCGorg8y1oSD7wFe55nX60YLJcHxKtBJi-77EsLyAtOK0riY_wD_sQgEkVBlHYjuXCB1YicZPT0tIDFeV3BC86RvLO-7sJHP27d1ruSk4pmDP5miFLrQ4t_EeE-ymvCPKgbACEmgkwjX__B9gqVOObxw-oDPbKCI47o8iCEsVXLyNo7o',
      timestamp: '10:32 AM',
      status: 'read'
    },
    {
      id: 'm3',
      text: 'I have some feedback from the client that we might need to integrate.',
      senderId: 'alex-rivera',
      senderName: 'Alex Rivera',
      senderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBA6sX-vZWNmMhPYgRgl2Fpz8PnAA85-ZcCkFKuJutDZvUOp5kgcD-W-gYIYQjsT1q4P4m3LKaGRJsR1LjaaopsNYo5pUgHCGorg8y1oSD7wFe55nX60YLJcHxKtBJi-77EsLyAtOK0riY_wD_sQgEkVBlHYjuXCB1YicZPT0tIDFeV3BC86RvLO-7sJHP27d1ruSk4pmDP5miFLrQ4t_EeE-ymvCPKgbACEmgkwjX__B9gqVOObxw-oDPbKCI47o8iCEsVXLyNo7o',
      timestamp: '10:32 AM',
      status: 'read'
    },
    {
      id: 'm4',
      text: "I've sent the final designs for review!",
      senderId: 'elena',
      senderName: 'Elena Vance',
      senderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAVJsLdGik7HKnHWois65TWTCqdINxX6V_aNFZEvOAenvOmWE7Jb60wyPFuTyw69dWTKeOzKYbfb1QCVFX5rro7I5NB3CcoW0o9raOSrMRvbMxKFIN9q_Lxji3OQNSXivdhT_KuE__lIZYQANxzeLlN74wHVUmF-0ux5VEbGL1gLT65RV9taeHmQiWjA-ZRryazx9AV6bjMvpW8k3vYM5GwZuciE1wt9nwCYq7Vrdyik8D1Z8Owka-8h_5d36-WUR500CQRHCP0Kik',
      timestamp: '10:42 AM',
      attachmentUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnYIVfCTrvlQXscXxkWOWBVt4KCWXsJ-ZnZP4NH5saJh8F__l_N0WqtrvPOg_G6STjYZn3b711v2nE_g8qFhtV-1jrXXA_HJy4XqIB9Gq_M4Gc9xKdIDIhhfrBa6dwc2YnkLRzDRGGeWWBdB0D0tzpQn2oPsJDMePGqr-U-rHUqI2K1wnEp5Mwztqf34eyzjXI2QWbws3_rvO9nMohrZ6dwwUtXptWEKumY9LBSOpygE4-ysn64sLlJdXmtkc0Ex0bbhsDzR7OfLw',
      attachmentType: 'image'
    }
  ],
  marcus: [
    {
      id: 'marcus_1',
      text: "Hey Alex, are you available for a brief sync later today?",
      senderId: 'marcus',
      senderName: 'Marcus Thorne',
      senderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHaJs_RPltgdqmC61JbBAXsk61mQwwkune9oT7F7mQqcEC_aLK_iW99C7uk4LubMOJft66n8Jgsukv28ILEYn-g8CN9ZyJ0ZmXyquUz5uToIgGoY88K_A1t0XVugCNjFFtFxHW_B7oA6HR17qmSaEhGn4jB6c7__bdkzIKGu41kHBDES0EbA0DFb5bgXxEm3Kux2uFDzEnmUmhXbi7cIP5XJK-wlF_Dn1eOfZFlI-G5b_j_0PPOQJ_FRLu81F8e-jlUVIDVck8Gyc',
      timestamp: 'Yesterday, 3:15 PM'
    },
    {
      id: 'marcus_2',
      text: "Let's reschedule the sync to Monday morning.",
      senderId: 'marcus',
      senderName: 'Marcus Thorne',
      senderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHaJs_RPltgdqmC61JbBAXsk61mQwwkune9oT7F7mQqcEC_aLK_iW99C7uk4LubMOJft66n8Jgsukv28ILEYn-g8CN9ZyJ0ZmXyquUz5uToIgGoY88K_A1t0XVugCNjFFtFxHW_B7oA6HR17qmSaEhGn4jB6c7__bdkzIKGu41kHBDES0EbA0DFb5bgXxEm3Kux2uFDzEnmUmhXbi7cIP5XJK-wlF_Dn1eOfZFlI-G5b_j_0PPOQJ_FRLu81F8e-jlUVIDVck8Gyc',
      timestamp: 'Yesterday, 4:20 PM'
    }
  ],
  jordan: [
    {
      id: 'jordan_1',
      text: "Hey, there's a design community meetup happening in the Mission district tonight.",
      senderId: 'jordan',
      senderName: 'Jordan Smith',
      senderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8A-lS1fFnvIj3W8ETIauA_VASFxM7EU7MYpcjyaKH9wMCXh9dBCLBGk_Ij3QWY-UqpW3zoT16iCnZPwQ58x98aSMiSYBOEhPDT8jzpjvbzC2YCxbcEspM8DFxvpMunCgwYO3GKEpu1GptHCD2Fp3pvCRDmbvi7ZCobq2XoTY3VaieNRqMf7f7GKFw3k0V-0Fyd_-Bkk4jZTkYdmITaTdiR75Hdk5YZs_ZfecYwMzjgyLFBvRrVR44fu8CnJ1rKs0WlmOtXphWpOs',
      timestamp: 'Oct 12, 1:12 PM'
    },
    {
      id: 'jordan_2',
      text: 'Are you coming to the meetup tonight?',
      senderId: 'jordan',
      senderName: 'Jordan Smith',
      senderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8A-lS1fFnvIj3W8ETIauA_VASFxM7EU7MYpcjyaKH9wMCXh9dBCLBGk_Ij3QWY-UqpW3zoT16iCnZPwQ58x98aSMiSYBOEhPDT8jzpjvbzC2YCxbcEspM8DFxvpMunCgwYO3GKEpu1GptHCD2Fp3pvCRDmbvi7ZCobq2XoTY3VaieNRqMf7f7GKFw3k0V-0Fyd_-Bkk4jZTkYdmITaTdiR75Hdk5YZs_ZfecYwMzjgyLFBvRrVR44fu8CnJ1rKs0WlmOtXphWpOs',
      timestamp: 'Oct 12, 3:45 PM'
    }
  ],
  'design-team': [
    {
      id: 'dt_1',
      text: "What do you think about the new color combinations?",
      senderId: 'marcus',
      senderName: 'Marcus Thorne',
      senderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHaJs_RPltgdqmC61JbBAXsk61mQwwkune9oT7F7mQqcEC_aLK_iW99C7uk4LubMOJft66n8Jgsukv28ILEYn-g8CN9ZyJ0ZmXyquUz5uToIgGoY88K_A1t0XVugCNjFFtFxHW_B7oA6HR17qmSaEhGn4jB6c7__bdkzIKGu41kHBDES0EbA0DFb5bgXxEm3Kux2uFDzEnmUmhXbi7cIP5XJK-wlF_Dn1eOfZFlI-G5b_j_0PPOQJ_FRLu81F8e-jlUVIDVck8Gyc',
      timestamp: 'Tue, 1:10 PM'
    },
    {
      id: 'dt_2',
      text: 'Sarah: The new logo looks amazing on mobile!',
      senderId: 'sarah-chen',
      senderName: 'Sarah Chen',
      senderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKK07WxjOfJoYrGXfV3-adymye2qfhbOaCN7X8ualM7dwKetVLupT4loCjTZjCft0ssVSjPD2YFVHyyNX9WYfP2JFpuEfmS2B2febjGIHLugCfq2_oaBYjDxEDFMPlur-0Ie6j5l6hqtCHqlFvLhpoBitbgyWPOrhSt9bi-Kn1GQhlwnrqaHf2Pexm4xLpFPSuUCyqmHdtyIOpeUvqmwIh1WrJ6adITgyuiTcWd4ljE6819Xa1p9OkpG1CaQBo504GjHd_P5y-D1s',
      timestamp: 'Tue, 1:40 PM'
    }
  ]
};

const initialPosts: Post[] = [
  {
    id: 'post_1',
    authorName: 'Sarah Chen',
    authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKK07WxjOfJoYrGXfV3-adymye2qfhbOaCN7X8ualM7dwKetVLupT4loCjTZjCft0ssVSjPD2YFVHyyNX9WYfP2JFpuEfmS2B2febjGIHLugCfq2_oaBYjDxEDFMPlur-0Ie6j5l6hqtCHqlFvLhpoBitbgyWPOrhSt9bi-Kn1GQhlwnrqaHf2Pexm4xLpFPSuUCyqmHdtyIOpeUvqmwIh1WrJ6adITgyuiTcWd4ljE6819Xa1p9OkpG1CaQBo504GjHd_P5y-D1s',
    content: "Just finished the new branding project for the tech startup! 🚀 The Electric Blue palette we chose really pops in the real-world assets. Can't wait to share the full case study.",
    timestamp: '2 hours ago',
    likes: 1240,
    commentsCount: 84,
    shares: 23,
    likedByMe: false,
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDHY7mJknbGSgUtgj-A_lNXktITHVJQguJB17L0oIl9BYtRplQzWldelWmhGO8iYN2rwCF8f7qMU8jg5JsV7W6BTNcSeVub5F7AFlRs943kZoCuCkbWrkVAvYgQ5VVHULapSG5kn0KXkGchG-ylsH8Oe8DjExJj75Xk5p_zf5O8BX0LByh60qHz7JtcrDwzwhmEa2No_7jgmpYPEzYQ9UHoWivAU4zz5Y7ykAJWLPRNzigfi1WY-pH_bf7J1ZOp49vPZG3QpuoAuRg',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCW3X6b0cUoFY5ZI7ke6rrqUQ2SNQnOpZVjTP4Ya-a1DdIEEGJGvdOe5Ro-H5OI4b0biJrogk7TUqnPaQ79MuRejJj-R_ftMVnd5TEAOPnQNpltk4qyTMuQ8gLE7HHVJbYSoxzOIw3IbCwZiN4US6BknoY5_NU6aKoycnc1V4MQtUg1xxYOU5Hn9dTyfcTpKQWkmQwwENCmUzjHghbH79YhYcQqsgBXvyTrqfF-YuviX4jZx1MULq-WUEBuqCh-_ijgpXZhaze8MKA',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBUm9CIvGrNJMciTqIjGLEm2x3K4koFBeL1dYwhQOsW6oV49_lthdYBj--Lsn6C-89lLg_QzWuJK5jMKItaHgsT_5TcChbbQh7Vq97cVT_bkHl9O8Uq4Y38KRezvWofSgdqFQ5-R1kE3KjTKdZ3PIx3o8AMlMeXbe9gRCGETCPp8VOfIPzNQCgR4qx395znpk_WLYDNyyY-MBdvXjvB9bWcDe6NJ_t3uzff083-SlDgUduoSzzwPzp-MOKIOZva8pivXTyG_Qngvog'
    ]
  }
];

const initialNotifications: NotificationItem[] = [
  {
    id: 'n1',
    title: 'New Message from Elena Vance',
    description: "Sent an attachment: 'I've sent the final designs for review!'",
    time: '10:42 AM',
    type: 'message',
    unread: true
  },
  {
    id: 'n2',
    title: 'Sarah Chen tagged you',
    description: 'Sarah tagged you in a new post about branding design.',
    time: '2 hours ago',
    type: 'mention',
    unread: true
  },
  {
    id: 'n3',
    title: 'Your post was liked',
    description: 'Marcus Thorne and 15 others liked your profile picture.',
    time: 'Yesterday',
    type: 'like',
    unread: false
  },
  {
    id: 'n4',
    title: 'System Update',
    description: 'Welcome to ChatPulse. Your Pro Plan features are fully active.',
    time: 'Oct 10',
    type: 'system',
    unread: false
  }
];

const mockReplies: Record<string, string[]> = {
  elena: [
    "I'm glad you liked it! I put a lot of work into the typography and spacing.",
    "Sure! Let me compile the full assets folder and upload it to our Drive.",
    "Awesome. Looking forward to your structured feedback so we can iterate on it.",
    "Perfect! Let's do a brief visual sync tomorrow at 10 AM, does that work for you?"
  ],
  marcus: [
    "Sounds great. I will send over the calendar invite shortly.",
    "No worries, let's connect next week when you have more bandwidth.",
    "Agreed. Let's make sure the client's comments are fully integrated first."
  ],
  jordan: [
    "Yes, it starts around 7 PM. I'll reserve a spot for you!",
    "Great! See you there. I will look out for you near the entrance.",
    "Alright, catch you next time then! I will send over any cool summaries."
  ],
  'design-team': [
    "Sarah: I agree, the dark mode contrasts look extremely crisp.",
    "Marcus: Perfect, let's commit the branch so we can review the live build.",
    "Jordan: Agreed. I will sync the latest Figma file with the main component library."
  ]
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('chatpulse_user');
    return saved ? JSON.parse(saved) : initialUser;
  });

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('chatpulse_conversations');
    return saved ? JSON.parse(saved) : initialConversations;
  });

  const [messages, setMessages] = useState<Record<string, Message[]>>(() => {
    const saved = localStorage.getItem('chatpulse_messages');
    return saved ? JSON.parse(saved) : initialMessages;
  });

  const [posts, setPosts] = useState<Post[]>(() => {
    const saved = localStorage.getItem('chatpulse_posts');
    return saved ? JSON.parse(saved) : initialPosts;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('chatpulse_notifications');
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('chatpulse_theme');
    return (saved as 'light' | 'dark') || 'dark';
  });

  const [activeConversationId, setActiveConversationId] = useState<string>('elena');
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});

  // Apply theme class to <html> element
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('chatpulse_theme', theme);
  }, [theme]);

  // Sync state to local storage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('chatpulse_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('chatpulse_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('chatpulse_conversations', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem('chatpulse_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('chatpulse_posts', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('chatpulse_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const login = async (email: string, name?: string): Promise<boolean> => {
    // Basic verification - simulate server latency
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const userToLogin: User = {
      ...initialUser,
      email,
      name: name || email.split('@')[0].replace('.', ' ')
    };
    setCurrentUser(userToLogin);
    return true;
  };

  const signup = async (name: string, email: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const newUser: User = {
      ...initialUser,
      id: `user-${Date.now()}`,
      name,
      email,
    };
    setCurrentUser(newUser);
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('chatpulse_user');
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const sendMessage = (text: string, attachmentUrl?: string, attachmentType?: 'image' | 'video') => {
    if (!currentUser) return;

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      text,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      timestamp: timeString,
      status: 'sent',
      attachmentUrl,
      attachmentType
    };

    // Update messages
    setMessages((prev) => {
      const currentList = prev[activeConversationId] || [];
      return {
        ...prev,
        [activeConversationId]: [...currentList, newMessage]
      };
    });

    // Update conversation last message & unread state
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === activeConversationId) {
          return {
            ...conv,
            lastMessageText: text || 'Sent an attachment',
            lastMessageTime: timeString
          };
        }
        return conv;
      })
    );

    // Simulate auto-reply from contact after 1.5s
    const activeConv = conversations.find((c) => c.id === activeConversationId);
    if (!activeConv || activeConv.isGroup) {
      // Group reply simulation
      setTimeout(() => {
        setIsTyping((prev) => ({ ...prev, [activeConversationId]: true }));
        setTimeout(() => {
          setIsTyping((prev) => ({ ...prev, [activeConversationId]: false }));
          const teamReplies = mockReplies['design-team'];
          const randomReply = teamReplies[Math.floor(Math.random() * teamReplies.length)];
          const replyTimeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const groupReplyMsg: Message = {
            id: `msg-${Date.now() + 1}`,
            text: randomReply,
            senderId: 'sarah-chen',
            senderName: 'Sarah Chen',
            senderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKK07WxjOfJoYrGXfV3-adymye2qfhbOaCN7X8ualM7dwKetVLupT4loCjTZjCft0ssVSjPD2YFVHyyNX9WYfP2JFpuEfmS2B2febjGIHLugCfq2_oaBYjDxEDFMPlur-0Ie6j5l6hqtCHqlFvLhpoBitbgyWPOrhSt9bi-Kn1GQhlwnrqaHf2Pexm4xLpFPSuUCyqmHdtyIOpeUvqmwIh1WrJ6adITgyuiTcWd4ljE6819Xa1p9OkpG1CaQBo504GjHd_P5y-D1s',
            timestamp: replyTimeString
          };
          setMessages((prev) => ({
            ...prev,
            [activeConversationId]: [...(prev[activeConversationId] || []), groupReplyMsg]
          }));
          setConversations((prev) =>
            prev.map((c) => (c.id === activeConversationId ? { ...c, lastMessageText: randomReply, lastMessageTime: replyTimeString } : c))
          );
        }, 1500);
      }, 1000);
      return;
    }

    setTimeout(() => {
      setIsTyping((prev) => ({ ...prev, [activeConversationId]: true }));

      setTimeout(() => {
        setIsTyping((prev) => ({ ...prev, [activeConversationId]: false }));

        const replies = mockReplies[activeConversationId] || [
          "Got it! Let's touch base on this later.",
          "Perfect, I am on it right now.",
          "Excellent, let's keep going!"
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        const replyTimeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const replyMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          text: randomReply,
          senderId: activeConversationId,
          senderName: activeConv.participantName,
          senderAvatar: activeConv.participantAvatar,
          timestamp: replyTimeString
        };

        setMessages((prev) => {
          const currentList = prev[activeConversationId] || [];
          return {
            ...prev,
            [activeConversationId]: [...currentList, replyMessage]
          };
        });

        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id === activeConversationId) {
              return {
                ...conv,
                lastMessageText: randomReply,
                lastMessageTime: replyTimeString,
                lastMessageUnread: true
              };
            }
            return conv;
          })
        );

        // Add a fresh notification for incoming message
        const newNotif: NotificationItem = {
          id: `notif-${Date.now()}`,
          title: `New Message from ${activeConv.participantName}`,
          description: randomReply,
          time: replyTimeString,
          type: 'message',
          unread: true
        };
        setNotifications((prev) => [newNotif, ...prev]);

      }, 1500);
    }, 1000);
  };

  const updateProfile = (updatedData: Partial<User>) => {
    setCurrentUser((prev) => (prev ? { ...prev, ...updatedData } : null));
  };

  const toggleLikePost = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const isLiked = post.likedByMe;
          return {
            ...post,
            likes: isLiked ? post.likes - 1 : post.likes + 1,
            likedByMe: !isLiked
          };
        }
        return post;
      })
    );
  };

  const createPost = (content: string, images?: string[]) => {
    if (!currentUser) return;
    const newPost: Post = {
      id: `post-${Date.now()}`,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      content,
      timestamp: 'Just now',
      likes: 0,
      commentsCount: 0,
      shares: 0,
      likedByMe: false,
      images: images || []
    };
    setPosts((prev) => [newPost, ...prev]);
  };

  const markNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        conversations,
        messages,
        posts,
        notifications,
        theme,
        activeConversationId,
        isTyping,
        login,
        signup,
        logout,
        toggleTheme,
        setActiveConversationId,
        sendMessage,
        updateProfile,
        toggleLikePost,
        createPost,
        markNotificationsAsRead
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
