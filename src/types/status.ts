export interface StatusReply {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
}

export interface StatusItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  mediaUrl: string;
  title?: string;
  caption?: string;
  privacy?: 'contacts' | 'everyone';
  timestamp: string;
  expiresAt: string;
  replies: StatusReply[];
}
