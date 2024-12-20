import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Home.css';
import LoginModal from './LoginModal';
import { useAuth } from './AuthContext';
import Chat from './Chat';

function Home() {
  const [text, setText] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const fullText = '일본여행,  GPTrip 에서!';
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let index = 0;
    const intervalId = setInterval(() => {
      setText(fullText.slice(0, index));
      index++;
      if (index > fullText.length) {
        clearInterval(intervalId);
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, []);

  const handleLoginClick = () => {
    if (isLoggedIn) {
      navigate("/travelers-input-selection");
    } else {
      setShowLogin(true);
    }
  };

  const handleChatClick = () => {
    setShowChat(!showChat);
  };

  return (
    <div className="home">
      <div 
        className="background-image"
        style={{
          backgroundImage: `url("/japan_main.png")`
        }}
      >
        <div className="overlay" />
      </div>

      <nav className="navbar">
        <div className="nav-content">
          <Link to="/" className="logo"></Link>
          <div className="nav-links">
            <button onClick={handleChatClick} className="nav-link">
              {showChat ? '챗봇 닫기' : '챗봇 열기'}
            </button>
            {isLoggedIn ? (
  <Link to="/my-plan" className="nav-link">내 계획</Link>
) : (
  <button onClick={() => setShowLogin(true)} className="nav-link">내 계획</button>
)}
            {isLoggedIn ? (
              <button onClick={logout} className="nav-link">로그아웃</button>
            ) : (
              <button onClick={handleLoginClick} className="nav-link">로그인</button>
            )}
          </div>
        </div>
      </nav>

      <div className="hero-content">
        <h1 className="hero-title">
          {text}
          <span className="cursor">|</span>
        </h1>
        <p className="hero-subtitle">
          AI를 이용하여 더 스마트한<br />
          일본 여행을 계획해보세요!
        </p>
        <button className="cta-button" onClick={handleLoginClick}>
          {isLoggedIn ? '여행 계획 만들기' : '로그인하고 계획 만들기'}
        </button>
      </div>

      {showChat && (
        <div className="chat-container">
          <Chat closeChat={() => setShowChat(false)} />
        </div>
      )}

      {showLogin && (
        <LoginModal onClose={() => setShowLogin(false)} />
      )}
    </div>
  );
}

export default Home;

