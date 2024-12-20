import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';

function LoggedInComponent() {
  const { logout } = useAuth();

  return (
    <div className="logged-in-container">
      <h1>환영합니다!</h1>
      <p>로그인에 성공하셨습니다.</p>
      <Link to="/" onClick={logout}>로그아웃</Link>
    </div>
  );
}

export default LoggedInComponent;