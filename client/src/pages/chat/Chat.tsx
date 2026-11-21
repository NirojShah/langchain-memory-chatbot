import React, { type FormEvent, useEffect, useState } from 'react';
import ChatList, {
  type ChatListItem,
} from '../../components/chat-list/ChatList';
import {
  createChat,
  createMessage,
  getChats,
  getMessages,
  type ChatMessage as ApiChatMessage,
} from '../../services/chatService';
import './chat.css';

const Chat: React.FC = () => {
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string>();
  const [messages, setMessages] = useState<ApiChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const getUserId = (): string => {
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
  };

  useEffect(() => {
    const loadChats = async (): Promise<void> => {
      const userId = getUserId();
      if (!userId) {
        setError('Please sign in to view your chats');
        setIsLoading(false);
        return;
      }

      try {
        const loadedChats = await getChats(userId);
        setChats(loadedChats);
        if (loadedChats.length > 0) {
          setSelectedChatId(loadedChats[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load chats');
      } finally {
        setIsLoading(false);
      }
    };

    void loadChats();
  }, []);

  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      return;
    }

    const loadMessages = async (): Promise<void> => {
      try {
        const loadedMessages = await getMessages(selectedChatId);
        setMessages(loadedMessages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load messages');
      }
    };

    void loadMessages();
  }, [selectedChatId]);

  const handleCreateChat = async (): Promise<void> => {
    const userId = getUserId();
    if (!userId) {
      setError('Please sign in to create a chat');
      return;
    }

    try {
      const chat = await createChat(userId);
      setChats((currentChats) => [chat, ...currentChats]);
      setSelectedChatId(chat.id);
      setMessages([]);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create chat');
    }
  };

  const handleSelectChat = (chat: ChatListItem): void => {
    setSelectedChatId(chat.id);
    setError('');
  };

  const handleSendMessage = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    const content = message.trim();

    if (!content || !selectedChatId) {
      return;
    }

    const userId = getUserId();
    if (!userId) {
      setError('Please sign in to send messages');
      return;
    }

    setIsSending(true);
    setError('');
    setMessage('');

    try {
      const sentMessage = await createMessage(selectedChatId, userId, content);
      setMessages((currentMessages) => [...currentMessages, sentMessage]);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send message');
      setMessage(content);
    } finally {
      setIsSending(false);
    }
  };

  const handleMessageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    setMessage(event.target.value);
  };

  const selectedChat = chats.find((chat) => chat.id === selectedChatId);

  if (isLoading) {
    return (
      <main className="chat-container">
        <section className="chat-empty-workspace">
          <span className="chat-welcome-icon">✦</span>
          <h1>Loading conversations...</h1>
        </section>
      </main>
    );
  }

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
            onClick={() => void handleCreateChat()}
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

            {error && <p className="chat-error" role="alert">{error}</p>}

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

            <form className="chat-composer" onSubmit={(event) => void handleSendMessage(event)}>
              <input
                type="text"
                value={message}
                onChange={handleMessageChange}
                placeholder="Message Memory Chat..."
                aria-label="Message"
              />
              <button type="submit" disabled={!message.trim() || isSending}>
                <span aria-hidden="true">→</span>
                <span className="chat-send-label">
                  {isSending ? 'Sending...' : 'Send'}
                </span>
              </button>
            </form>
          </>
        ) : (
          <div className="chat-empty-workspace">
            {error && <p className="chat-error" role="alert">{error}</p>}
            <span className="chat-welcome-icon">✦</span>
            <h1>Your conversations</h1>
            <p>Create a chat to start a new conversation.</p>
            <button type="button" onClick={() => void handleCreateChat()}>
              Start a new chat
            </button>
          </div>
        )}
      </section>
    </main>
  );
};

export default Chat;

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
