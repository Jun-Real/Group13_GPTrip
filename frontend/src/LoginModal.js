import React, { useState } from 'react';
import './LoginModal.css';
import { useAuth } from './AuthContext';
import RegisterModal from './RegisterModal';

function LoginModal({ onClose }) {
  const [rememberMe, setRememberMe] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      console.log('Attempting to login...');
      const response = await fetch('https://crispy-adventure-wr74x4pxpwr7cg56v-8000.app.github.dev/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        mode: 'cors',
        credentials: 'include',
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      const data = await response.json();
    
      if (response.ok) {
        console.log('Login successful:', data);
        if (data.userId) {
          login(data.userId);
          console.log('User ID set:', data.userId);
        } else {
          console.error('Login response missing userId');
          setError('로그인 응답에 사용자 ID가 없습니다.');
        }
        onClose();
      } else {
        console.error('Login failed:', data);
        setError(data.detail || '로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('서버 연결에 실패했습니다. 나중에 다시 시도해주세요.');
    }
  };

  const handleShowRegister = () => {
    setShowRegisterModal(true);
  };

  const handleCloseRegister = () => {
    setShowRegisterModal(false);
  };


  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-container">
        <button className="close-button" onClick={onClose}>×</button>
        <div className="modal-content">
          <form onSubmit={handleLogin}>
            {error && <div className="error-message">{error}</div>}
            <input
              type="text"
              placeholder="아이디를 입력해 주세요."
              className="login-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="비밀번호를 입력해 주세요."
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="login-button">
              로그인
            </button>

            <div className="login-options">
              <div className="remember-me">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>로그인 상태 유지</span>
                </label>
              </div>
              <div className="auth-links">
                <a href="#" onClick={(e) => e.preventDefault()}>아이디 찾기</a>
                <span className="separator">|</span>
                <a href="#" onClick={(e) => e.preventDefault()}>비밀번호 찾기</a>
                <span className="separator">|</span>
                <a href="#" onClick={(e) => {
                  e.preventDefault();
                  handleShowRegister();
                }}>회원가입</a>
              </div>
            </div>

            <div className="divider">
              <span>다른 방법으로 로그인하기</span>
            </div>

            <div className="social-login">
              <div className="social-button">
                <img src="/google-icon.png" alt="Google" className="social-icon" />
                <span></span>
              </div>
              <div className="social-button">
                <img src="/kakao-icon.png" alt="Kakao" className="social-icon" />
                <span></span>
              </div>
              <div className="social-button">
                <img src="/naver-icon.png" alt="Naver" className="social-icon" />
                <span></span>
              </div>
            </div>
          </form>
        </div>
      </div>
      {showRegisterModal && <RegisterModal onClose={handleCloseRegister} />}
    </>
  );
}

export default LoginModal;

