import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { loginUser, clearError } from '../store/slices/authSlice';
import { FaHeadphones, FaUser, FaLock, FaExclamationTriangle } from 'react-icons/fa';

const LoginPage = () => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const { deviceId, deviceName, deviceType } = useSelector((state) => state.device);
  
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });

  // Очистка ошибок при монтировании компонента
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await dispatch(loginUser({
        ...credentials,
        deviceId,
        deviceName,
        deviceType
      })).unwrap();
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <FaHeadphones size={40} />
          <h1>Вход в аккаунт</h1>
        </div>
        
        {error && (
          <div className="alert alert-danger">
            <FaExclamationTriangle style={{ marginRight: '8px' }} />
            {error}
          </div>
        )}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">
              <FaUser /> Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-control"
              placeholder="Введите email"
              value={credentials.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">
              <FaLock /> Пароль
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-control"
              placeholder="Введите пароль"
              value={credentials.password}
              onChange={handleChange}
              required
            />
          </div>
          
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>
            Нет аккаунта?{' '}
            <Link to="/register">Зарегистрироваться</Link>
          </p>
        </div>
      </div>
      
      <style>{`
        .auth-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background-color: #f8f9fa;
        }
        
        .auth-container {
          width: 100%;
          max-width: 400px;
          padding: 30px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
        }
        
        .auth-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 30px;
          color: #007bff;
        }
        
        .auth-header h1 {
          margin-top: 15px;
          font-size: 24px;
          text-align: center;
          color: #343a40;
        }
        
        .auth-form {
          margin-bottom: 20px;
        }
        
        .auth-footer {
          text-align: center;
          margin-top: 20px;
          font-size: 14px;
        }
        
        .btn-primary {
          margin-top: 20px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-group label {
          display: flex;
          align-items: center;
          margin-bottom: 5px;
          font-weight: 500;
        }
        
        .form-group label svg {
          margin-right: 8px;
          color: #007bff;
        }
        
        .form-control {
          height: 45px;
          padding: 10px 15px;
          border-radius: 4px;
          border: 1px solid #ced4da;
        }
        
        .w-100 {
          width: 100%;
        }
        
        .alert-danger {
          display: flex;
          align-items: center;
          background-color: #f8d7da;
          color: #721c24;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 20px;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default LoginPage; 