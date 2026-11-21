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

export async function createChat(_userId: string): Promise<ChatSummary> {
  throw new Error('Chat API integration is pending');
}

export async function getChats(
  _userId: string,
  _page = 1,
  _limit = 10,
): Promise<ChatSummary[]> {
  throw new Error('Chat API integration is pending');
}

export async function createMessage(
  _chatId: string,
  _userId: string,
  _content: string,
): Promise<ChatMessage> {
  throw new Error('Chat API integration is pending');
}

export async function getMessages(
  _chatId: string,
  _page = 1,
  _limit = 10,
): Promise<ChatMessage[]> {
  throw new Error('Chat API integration is pending');
}
