export interface Comment {
  _id: string;
  post: string;
  author: {
    _id: string;
    name: string;
    avatar: string;
  };
  content: string;
  createdAt: string;
  updatedAt: string;
}

