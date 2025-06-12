import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const AuthPage = () => {
  const [currentForm, setCurrentForm] = useState('login'); // 'login' or 'register'

  const switchToLogin = () => setCurrentForm('login');
  const switchToRegister = () => setCurrentForm('register');

  return (
    <div>
      {currentForm === 'login' ? (
        <LoginForm onSwitchToRegister={switchToRegister} />
      ) : (
        <RegisterForm onSwitchToLogin={switchToLogin} />
      )}
    </div>
  );
};

export default AuthPage; 