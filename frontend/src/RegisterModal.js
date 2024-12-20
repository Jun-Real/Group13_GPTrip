import React, { useState } from 'react';
import './RegisterModal.css';

function RegisterModal({ onClose }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!username || !password || !confirmPassword) {
      setError('모든 필드를 입력해주세요.');
      return;
    }
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    try {
      console.log('Attempting to register...');
      const response = await fetch('https://crispy-adventure-wr74x4pxpwr7cg56v-8000.app.github.dev/register', {
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
        console.log('Registration successful:', data);
        onClose();
      } else {
        console.error('Registration failed:', data);
        setError(data.detail || '회원가입에 실패했습니다.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('서버 연결에 실패했습니다. 나중에 다시 시도해주세요.');
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-container">
        <button className="close-button" onClick={onClose}>×</button>
        <div className="modal-content">
          <h2 className="modal-title">회원가입</h2>
          <form onSubmit={handleRegister}>
            {error && <div className="error-message">{error}</div>}
            <input
              type="text"
              placeholder="아이디를 입력해 주세요."
              className="register-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="비밀번호를 입력해 주세요."
              className="register-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="비밀번호를 다시 입력해 주세요."
              className="register-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button type="submit" className="register-button">
              회원가입
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default RegisterModal;

