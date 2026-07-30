
export interface Post {
  _id: string;
  author: {
    _id: string;
    name: string;
    avatar: string;
  };
  content: string;
  images: string[];
  likes: string[];
  hiddenBy?: string[];
  savedBy?: string[];
  createdAt: string;
  updatedAt: string;
  mood?: string;
  likedByMe?: boolean;
  savedByMe?: boolean;
  commentsCount?: number;
  shares?: number;
}