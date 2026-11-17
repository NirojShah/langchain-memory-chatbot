import React from 'react';
import './chat-list.css';

export interface ChatListItem {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
}

interface ChatListProps {
  chats: ChatListItem[];
  selectedChatId?: string;
  onSelectChat: (chat: ChatListItem) => void;
}

const ChatList: React.FC<ChatListProps> = ({
  chats,
  selectedChatId,
  onSelectChat,
}) => (
  <section className="chat-list" aria-labelledby="chat-list-title">
    <header className="chat-list-header">
      <h2 id="chat-list-title">Your conversations</h2>
      <span className="chat-list-count">{chats.length}</span>
    </header>

    {chats.length === 0 ? (
      <p className="chat-list-empty">Your conversations will appear here.</p>
    ) : (
      <ul className="chat-list-items">
        {chats.map((chat) => {
          const isSelected = chat.id === selectedChatId;

          return (
            <li key={chat.id}>
              <button
                type="button"
                className={`chat-list-item${isSelected ? ' is-selected' : ''}`}
                aria-pressed={isSelected}
                onClick={() => onSelectChat(chat)}
              >
                <span className="chat-list-item-content">
                  <span className="chat-list-item-title">{chat.title}</span>
                  <span className="chat-list-item-preview">{chat.preview}</span>
                </span>
                <span className="chat-list-item-time">{chat.updatedAt}</span>
              </button>
            </li>
          );
        })}
      </ul>
    )}
  </section>
);

export default ChatList;
