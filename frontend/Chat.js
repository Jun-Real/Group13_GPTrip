import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import './Chat.css';

function Chat({ closeChat }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);
  const messageEndRef = useRef(null);

  useEffect(() => {
    const savedMessages = JSON.parse(localStorage.getItem('chatMessages')) || [];
    setMessages(savedMessages);
  }, []);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ text: '무엇을 도와드릴까요?', sender: 'gpt' }]);
    } else {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey && !loading) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [loading]);

  const handleSendMessage = useCallback(async () => {
    if (input.trim()) {
      const newMessage = { text: input, sender: 'user' };
      setMessages(prevMessages => [...prevMessages, newMessage]);
      setInput('');
      setLoading(true);

      try {
        const response = await axios.post('http://localhost:8000/chat', { message: input });
        setMessages(prevMessages => [
          ...prevMessages,
          { text: response.data.response, sender: 'gpt' },
        ]);
      } catch (error) {
        console.error('Error in sending message:', error);
        setMessages(prevMessages => [
          ...prevMessages,
          { text: '죄송합니다. 다시 시도해 주세요.', sender: 'gpt' },
        ]);
      } finally {
        setLoading(false);
      }
    }
  }, [input]);

  const clearChatHistory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem('chatMessages');
  }, []);

  return (
    <div ref={chatRef} className="chatContainer">
      <div className="chatHeader">
        <h2>Chat</h2>
        <button onClick={closeChat} className="closeButton">✖</button>
      </div>

      <div className="messageContainer">
        {messages.map((msg, index) => (
          <div key={index} className={msg.sender === 'user' ? 'userMessage' : 'gptMessage'}>
            <p>{msg.text}</p>
          </div>
        ))}
        {loading && (
          <div className="typingIndicator">
            GPT is typing...
          </div>
        )}
        <div ref={messageEndRef} />
      </div>

      <div className="inputContainer">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요"
          className="inputField"
          rows="1"
        />
        <button 
          onClick={handleSendMessage} 
          disabled={loading} 
          className="sendButton"
        >
          <span className="sendIcon">↑</span>
        </button>
      </div>

      <button onClick={clearChatHistory} className="clearButton">
        채팅 기록 초기화
      </button>
    </div>
  );
}

export default Chat;

