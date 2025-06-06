import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { performLogout } from '../store/slices/authSlice';
import playbackSyncService from '../services/playbackSync.service';
import {
  FaMusic,
  FaHeadphones,
  FaSignOutAlt,
  FaUpload,
  FaUser,
  FaSignInAlt,
  FaUserPlus,
} from 'react-icons/fa';
import styles from './Navbar.module.css';

/**
 * Компонент навигации по приложению
 */
const Navbar = () => {
  const user = useSelector((state) => state.auth.user);
  const deviceId = useSelector((state) => state.device.deviceId);
  const currentTrack = useSelector((state) => state.player.currentTrack);
  const currentTime = useSelector((state) => state.player.currentTime);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    console.log('Инициирован выход из аккаунта');
    
    try {
      // Вызываем performLogout, который уже выполнит сохранение позиции
      await dispatch(performLogout()).unwrap();
      console.log('Выход выполнен успешно');
      navigate('/login');
    } catch (error) {
      console.error('Ошибка при выходе из аккаунта:', error);
      // В любом случае перенаправляем на страницу логина
      navigate('/login');
    }
  };

  return (
    <nav className={styles.navbar}>
      <div className={`container ${styles.navbarContent}`}>
        <Link to="/" className={styles.navbarBrand}>
          <FaHeadphones size={24} />
          <span>Аудио Стриминг</span>
        </Link>

        <div className={styles.navbarNav}>
          <NavLink to="/" className={styles.navItem} end>
            <FaMusic /> <span>Главная</span>
          </NavLink>
          <NavLink to="/tracks" className={styles.navItem}>
            <FaMusic /> <span>Треки</span>
          </NavLink>
          {user && (
            <NavLink to="/upload" className={styles.navItem}>
              <FaUpload /> <span>Загрузить</span>
            </NavLink>
          )}
        </div>

        <div className={styles.navbarUser}>
          {user ? (
            <>
              <NavLink to="/profile" className={styles.userAvatar}>
                {user.avatar_path ? (
                  <img
                    src={`${(
                      process.env.REACT_APP_API_URL || ''
                    ).replace(/\/api$/, '')}${user.avatar_path}`}
                    alt={user.username}
                  />
                ) : (
                  <FaUser />
                )}
                <span>{user.username}</span>
              </NavLink>
              <button className={styles.logoutBtn} onClick={handleLogout}>
                <FaSignOutAlt />
                <span>Выход</span>
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={styles.navItem}>
                <FaSignInAlt /> <span>Вход</span>
              </NavLink>
              <NavLink to="/register" className={styles.navItem}>
                <FaUserPlus /> <span>Регистрация</span>
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 