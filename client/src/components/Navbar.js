import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../store/slices/authSlice';
import { FaMusic, FaHeadphones, FaSignOutAlt, FaUpload, FaUser } from 'react-icons/fa';

/**
 * Компонент навигации по приложению
 */
const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            <FaHeadphones size={24} />
            <span>Аудио Стриминг</span>
          </Link>
          
          <div className="navbar-nav">
            <NavLink to="/" className="nav-item" end>
              <FaMusic /> Главная
            </NavLink>
            <NavLink to="/tracks" className="nav-item">
              <FaMusic /> Треки
            </NavLink>
            <NavLink to="/playlists" className="nav-item">
              <FaMusic /> Плейлисты
            </NavLink>
            <NavLink to="/upload" className="nav-item">
              <FaUpload /> Загрузить
            </NavLink>
          </div>
          
          <div className="navbar-user">
            <NavLink to="/profile" className="user-avatar">
              {user?.avatar ? (
                <img src={`${process.env.REACT_APP_API_URL || ''}${user.avatar}`} alt={user.username} />
              ) : (
                <FaUser />
              )}
              <span>{user?.username}</span>
            </NavLink>
            <button className="logout-btn" onClick={handleLogout}>
              <FaSignOutAlt />
              <span>Выход</span>
            </button>
          </div>
        </div>
      </div>
      
      <style>{`
        .navbar {
          background-color: #343a40;
          color: white;
          padding: 10px 0;
          margin-bottom: 20px;
        }
        
        .navbar-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .navbar-brand {
          display: flex;
          align-items: center;
          color: white;
          font-size: 1.5rem;
          font-weight: bold;
        }
        
        .navbar-brand span {
          margin-left: 10px;
        }
        
        .navbar-nav {
          display: flex;
        }
        
        .nav-item {
          color: rgba(255, 255, 255, 0.8);
          margin: 0 15px;
          display: flex;
          align-items: center;
        }
        
        .nav-item svg {
          margin-right: 5px;
        }
        
        .nav-item:hover,
        .nav-item.active {
          color: white;
        }
        
        .navbar-user {
          display: flex;
          align-items: center;
        }
        
        .user-avatar {
          display: flex;
          align-items: center;
          color: white;
          margin-right: 15px;
        }
        
        .user-avatar img {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
          margin-right: 10px;
        }
        
        .logout-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          cursor: pointer;
          padding: 5px;
        }
        
        .logout-btn:hover {
          color: white;
          background: none;
        }
        
        .logout-btn svg {
          margin-right: 5px;
        }
        
        @media (max-width: 768px) {
          .navbar-content {
            flex-direction: column;
          }
          
          .navbar-nav {
            margin: 10px 0;
            width: 100%;
            justify-content: space-around;
          }
          
          .navbar-user {
            width: 100%;
            justify-content: space-between;
          }
          
          .nav-item span,
          .logout-btn span {
            display: none;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar; 