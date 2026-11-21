import {
  createNewChat,
  getMyChats,
  createNewMessage,
  getMessages as getChatMessages,
} from './api';

export interface ChatSummary {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ApiChat {
  _id?: string;
  id?: string;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiMessage {
  _id?: string;
  id?: string;
  content: string;
  sender?: string;
  userId?: string;
  createdAt?: string;
}

function formatChatTime(value?: string): string {
  if (!value) {
    return 'Now';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Now'
    : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getCurrentUserId(): string {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) {
    return '';
  }

  try {
    const user = JSON.parse(storedUser) as { id?: string; _id?: string };
    return user.id || user._id || '';
  } catch {
    return '';
  }
}

export async function createChat(userId: string): Promise<ChatSummary> {
  const chat = await createNewChat(userId) as ApiChat;
  const id = chat._id || chat.id;

  if (!id) {
    throw new Error('The chat response did not include an id');
  }

  return {
    id,
    title: chat.title || 'New conversation',
    preview: 'Start a new message',
    updatedAt: formatChatTime(chat.updatedAt || chat.createdAt),
  };
}

export async function getChats(
  userId: string,
  page = 1,
  limit = 10,
): Promise<ChatSummary[]> {
  const chats = await getMyChats(userId, page, limit) as ApiChat[];

  return chats.map((chat, index) => {
    const id = chat._id || chat.id;
    if (!id) {
      throw new Error(`Chat at index ${index} did not include an id`);
    }

    return {
      id,
      title: chat.title || `Conversation ${index + 1}`,
      preview: 'Continue your conversation',
      updatedAt: formatChatTime(chat.updatedAt || chat.createdAt),
    };
  });
}

export async function createMessage(
  chatId: string,
  userId: string,
  content: string,
): Promise<ChatMessage> {
  const message = await createNewMessage(chatId, userId, content) as ApiMessage;
  const id = message._id || message.id;

  if (!id) {
    throw new Error('The message response did not include an id');
  }

  return {
    id,
    role: 'user',
    content: message.content,
  };
}

export async function getMessages(
  chatId: string,
  page = 1,
  limit = 10,
): Promise<ChatMessage[]> {
  const userId = getCurrentUserId();
  const messages = await getChatMessages(chatId, page, limit) as ApiMessage[];

  return messages
    .map((message) => {
      const id = message._id || message.id;
      if (!id) {
        throw new Error('A message response did not include an id');
      }

      return {
        id,
        role:
          message.sender === userId ||
          (!message.sender && message.userId === userId)
            ? ('user' as const)
            : ('assistant' as const),
        content: message.content,
      };
    })
    .reverse();
}
