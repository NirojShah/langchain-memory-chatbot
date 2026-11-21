import React, { type FormEvent, useState } from 'react';
import ChatList, {
  type ChatListItem,
} from '../../components/chat-list/ChatList';
import './chat.css';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const Chat: React.FC = () => {
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');

  const handleCreateChat = (): void => {
    const chatId = `chat-${Date.now()}`;
    const chat: ChatListItem = {
      id: chatId,
      title: 'New conversation',
      preview: 'Start a new message',
      updatedAt: 'Now',
    };

    setChats((currentChats) => [chat, ...currentChats]);
    setSelectedChatId(chatId);
    setMessages([]);
  };

  const handleSelectChat = (chat: ChatListItem): void => {
    setSelectedChatId(chat.id);
  };

  const handleMessageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    setMessage(event.target.value);
  };

  const handleSendMessage = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const content = message.trim();

    if (!content) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `message-${Date.now()}`,
      role: 'user',
      content,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setMessage('');

    if (selectedChatId) {
      setChats((currentChats) =>
        currentChats.map((chat) =>
          chat.id === selectedChatId
            ? {
                ...chat,
                title: chat.title === 'New conversation' ? content : chat.title,
                preview: content,
                updatedAt: 'Now',
              }
            : chat,
        ),
      );
    }
  };

  const selectedChat = chats.find((chat) => chat.id === selectedChatId);

  return (
    <main className="chat-container">
      <aside className="chat-sidebar">
        <header className="chat-sidebar-header">
          <a className="chat-brand" href="/" aria-label="Memory Chat home">
            <span className="chat-brand-icon">✦</span>
            <span>Memory Chat</span>
          </a>
          <button
            type="button"
            className="chat-new-button"
            onClick={handleCreateChat}
          >
            <span aria-hidden="true">+</span>
            New chat
          </button>
        </header>

        <ChatList
          chats={chats}
          selectedChatId={selectedChatId}
          onSelectChat={handleSelectChat}
        />

        <button type="button" className="chat-profile">
          <span className="chat-profile-avatar">M</span>
          <span className="chat-profile-copy">
            <strong>My Account</strong>
            <small>Personal workspace</small>
          </span>
        </button>
      </aside>

      <section className="chat-workspace">
        {selectedChat ? (
          <>
            <header className="chat-workspace-header">
              <div>
                <span className="chat-status-dot" aria-hidden="true" />
                <h1>{selectedChat.title}</h1>
              </div>
              <button type="button" className="chat-more-button" aria-label="Chat options">
                ⋯
              </button>
            </header>

            <div className="chat-messages" aria-live="polite">
              {messages.length === 0 ? (
                <div className="chat-welcome">
                  <span className="chat-welcome-icon">✦</span>
                  <h2>How can I help you today?</h2>
                  <p>Start a conversation and your ideas stay close at hand.</p>
                </div>
              ) : (
                messages.map((chatMessage) => (
                  <article
                    key={chatMessage.id}
                    className={`chat-message chat-message-${chatMessage.role}`}
                  >
                    {chatMessage.content}
                  </article>
                ))
              )}
            </div>

            <form className="chat-composer" onSubmit={handleSendMessage}>
              <input
                type="text"
                value={message}
                onChange={handleMessageChange}
                placeholder="Message Memory Chat..."
                aria-label="Message"
              />
              <button type="submit" disabled={!message.trim()}>
                <span aria-hidden="true">→</span>
                <span className="chat-send-label">Send</span>
              </button>
            </form>
          </>
        ) : (
          <div className="chat-empty-workspace">
            <span className="chat-welcome-icon">✦</span>
            <h1>Your conversations</h1>
            <p>Create a chat to start a new conversation.</p>
            <button type="button" onClick={handleCreateChat}>
              Start a new chat
            </button>
          </div>
        )}
      </section>
    </main>
  );
};

export default Chat;
