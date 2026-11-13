import React, { useEffect, useRef, useState } from 'react';
import { Bot, Send, X } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatWidgetProps {
  onClose?: () => void;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'สวัสดีครับ ChronoTrack Assistant ยินดีให้บริการ มีอะไรให้ผมช่วยเหลือไหมครับ?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.text }),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now() + 1}`,
          text: data.reply || 'ขออภัยครับ ระบบตอบกลับมีปัญหา',
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now() + 1}`,
          text: 'ขออภัยครับ ไม่สามารถเชื่อมต่อกับระบบหลังบ้านได้ในขณะนี้',
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      window.parent.postMessage('close-chat-widget', '*');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--bg-primary)',
        fontFamily: 'var(--font-sans)',
        color: 'var(--text-primary)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              backgroundColor: 'var(--accent-subtle)',
              color: 'var(--accent-primary)',
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
            }}
          >
            <Bot size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--fs-16)', fontWeight: 600 }}>ChronoTrack Assistant</h3>
            <p style={{ margin: 0, fontSize: 'var(--fs-12)', color: 'var(--text-muted)' }}>Workspace AI Help</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close assistant"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <X size={18} />
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
              gap: '8px',
              alignItems: 'flex-end',
            }}
          >
            {msg.sender === 'bot' && (
              <div
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  padding: '6px',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-secondary)',
                  flexShrink: 0,
                  display: 'flex',
                }}
              >
                <Bot size={14} />
              </div>
            )}
            <div
              style={{
                backgroundColor: msg.sender === 'user' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                color: msg.sender === 'user' ? 'var(--accent-contrast)' : 'var(--text-primary)',
                border: msg.sender === 'user' ? 'none' : '1px solid var(--border-color)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                maxWidth: '78%',
                fontSize: 'var(--fs-14)',
                lineHeight: 1.5,
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div style={{ fontSize: 'var(--fs-12)', color: 'var(--text-muted)' }}>Assistant is typing...</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div
        style={{
          padding: '12px 16px',
          backgroundColor: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          gap: '8px',
        }}
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
          placeholder="Ask ChronoTrack Assistant..."
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            outline: 'none',
            fontSize: 'var(--fs-14)',
          }}
        />
        <button
          type="button"
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isTyping}
          aria-label="Send message"
          style={{
            backgroundColor: inputValue.trim() && !isTyping ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
            color: inputValue.trim() && !isTyping ? 'var(--accent-contrast)' : 'var(--text-muted)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: inputValue.trim() && !isTyping ? 'pointer' : 'not-allowed',
          }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default ChatWidget;
