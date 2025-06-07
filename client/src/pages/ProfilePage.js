import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile, fetchUserDevices } from '../store/slices/authSlice';
import { FaUser, FaLaptop, FaMobile, FaTablet, FaDesktop, FaTrash } from 'react-icons/fa';
import styles from './ProfilePage.module.css';
import apiClient from '../services/apiClient';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user, devices, loading, error } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [formMode, setFormMode] = useState('view'); // view, edit, password
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [hasLoadedDevices, setHasLoadedDevices] = useState(false);
  
  // Инициализация формы только при первом рендере или изменении пользователя
  useEffect(() => {
    if (user) {
      setFormData(prevData => ({
        ...prevData,
        username: user.username,
        email: user.email,
      }));
    }
  }, [user]);
  
  // Загружаем устройства только один раз при монтировании компонента
  useEffect(() => {
    // Используем локальный флаг для однократной загрузки
    if (user?.id && !hasLoadedDevices) {
      setHasLoadedDevices(true);
      
      // Небольшая задержка для предотвращения множественных запросов
      const timer = setTimeout(() => {
        dispatch(fetchUserDevices());
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [user?.id, hasLoadedDevices, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    
    if (formMode === 'edit') {
      // Обновление профиля
      if (!formData.username.trim()) {
        return setFormError('Имя пользователя не может быть пустым');
      }
      
      dispatch(updateUserProfile({
        username: formData.username,
        email: formData.email,
      }))
        .unwrap()
        .then(() => {
          setFormSuccess('Профиль успешно обновлен');
          setFormMode('view');
        })
        .catch((err) => {
          setFormError(err.message || 'Ошибка при обновлении профиля');
        });
    } else if (formMode === 'password') {
      // Изменение пароля
      if (!formData.currentPassword) {
        return setFormError('Введите текущий пароль');
      }
      
      if (formData.newPassword.length < 6) {
        return setFormError('Новый пароль должен содержать не менее 6 символов');
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        return setFormError('Пароли не совпадают');
      }
      
      // Используем правильный путь для смены пароля
      apiClient.put(`/users/${user.id}/password`, {
        oldPassword: formData.currentPassword,
        newPassword: formData.newPassword
      })
        .then(() => {
          setFormSuccess('Пароль успешно изменен');
          setFormMode('view');
          setFormData({
            ...formData,
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
        })
        .catch((err) => {
          setFormError(err.response?.data?.message || 'Ошибка при изменении пароля');
        });
    }
  };

  const handleCancelEdit = () => {
    setFormMode('view');
    setFormData({
      ...formData,
      username: user.username,
      email: user.email,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setFormError(null);
    setFormSuccess(null);
  };

  const getDeviceIcon = (deviceType) => {
    const deviceTypeLower = deviceType?.toLowerCase() || '';
    if (deviceTypeLower.includes('mobile') || deviceTypeLower.includes('phone')) {
      return <FaMobile />;
    } else if (deviceTypeLower.includes('tablet')) {
      return <FaTablet />;
    } else if (deviceTypeLower.includes('desktop')) {
      return <FaDesktop />;
    } else {
      return <FaLaptop />;
    }
  };
  
  // Форматируем дату в удобочитаемый вид
  const formatDate = (dateString) => {
    if (!dateString) return 'Неизвестно';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Неверный формат даты';
      
      // Проверка на дату из будущего
      const now = new Date();
      if (date > now) {
        return 'Только что';
      }
      
      return date.toLocaleString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Ошибка при форматировании даты:', error);
      return 'Ошибка форматирования';
    }
  };
  
  // Получаем актуальную информацию о времени активности устройства
  const getDeviceActivityInfo = (device) => {
    // Проверяем даты на корректность
    const isValidDate = (date) => {
      if (!date) return false;
      const parsedDate = new Date(date);
      const now = new Date();
      // Если дата из будущего или невалидная, считаем её некорректной
      return !isNaN(parsedDate.getTime()) && parsedDate <= now;
    };

    const now = new Date();
    
    // Если устройство текущее, показываем "Сейчас в сети"
    if (device.isCurrentDevice) {
      return "Сейчас в сети";
    }
    
    // Проверяем lastActive
    if (isValidDate(device.lastActive)) {
      return `Последний вход: ${formatDate(device.lastActive)}`;
    } 
    // Если lastActive отсутствует или некорректно, проверяем дату создания
    else if (isValidDate(device.createdAt)) {
      return `Зарегистрировано: ${formatDate(device.createdAt)}`;
    }
    // Если у устройства нет корректных дат, считаем что оно было создано сейчас
    else {
      return 'Зарегистрировано только что';
    }
  };

  if (loading && !devices?.length) {
    return <div className={styles.loading}>Загрузка данных...</div>;
  }

  if (!user) {
    return <div className={styles.error}>Пользователь не найден</div>;
  }

  // Мемоизируем список устройств для предотвращения лишних рендеров
  const devicesList = devices?.length > 0 ? (
    <div className={styles.devicesList}>
      {devices.map(device => (
        <div key={device.id} className={styles.deviceItem}>
          <div className={styles.deviceIcon}>
            {getDeviceIcon(device.deviceType)}
          </div>
          <div className={styles.deviceInfo}>
            <div className={styles.deviceName}>
              {device.deviceName}
              {device.isCurrentDevice && <span className={styles.currentBadge}>Текущее</span>}
            </div>
            <div className={styles.deviceMeta}>
              <span>Дата регистрации: {formatDate(user.createdAt)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className={styles.noDevices}>
      <p>Нет активных устройств</p>
    </div>
  );

  return (
    <div className={styles.profilePage}>
      <div className={styles.profileContainer}>
        <div className={styles.profileHeader}>
          <div className={styles.profileAvatar}>
            <div className={styles.avatarPlaceholder}>
              <FaUser size={48} />
            </div>
          </div>
          <div className={styles.profileTitle}>
            <h1>{user.username}</h1>
            <p>{user.email}</p>
          </div>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}
        {formError && <div className={styles.errorMessage}>{formError}</div>}
        {formSuccess && <div className={styles.successMessage}>{formSuccess}</div>}

        <div className={styles.profileCard}>
          <div className={styles.cardHeader}>
            <h2>Личная информация</h2>
            {formMode === 'view' ? (
              <div className={styles.headerActions}>
                <button 
                  className={styles.btnEdit}
                  onClick={() => setFormMode('edit')}
                >
                  Редактировать
                </button>
                <button 
                  className={styles.btnPassword}
                  onClick={() => setFormMode('password')}
                >
                  Изменить пароль
                </button>
              </div>
            ) : (
              <button 
                className={styles.btnCancel}
                onClick={handleCancelEdit}
              >
                Отмена
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            {formMode === 'edit' && (
              <>
                <div className={styles.formGroup}>
                  <label>Имя пользователя</label>
                  <input 
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input 
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled
                  />
                  <small>Email нельзя изменить</small>
                </div>
                <div className={styles.formActions}>
                  <button type="submit" className={styles.btnPrimary}>Сохранить</button>
                </div>
              </>
            )}

            {formMode === 'password' && (
              <>
                <div className={styles.formGroup}>
                  <label>Текущий пароль</label>
                  <input 
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Новый пароль</label>
                  <input 
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Подтвердите пароль</label>
                  <input 
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
                <div className={styles.formActions}>
                  <button type="submit" className={styles.btnPrimary}>Изменить пароль</button>
                </div>
              </>
            )}

            {formMode === 'view' && (
              <div className={styles.profileInfo}>
                <div className={styles.infoGroup}>
                  <span className={styles.label}>Имя пользователя:</span>
                  <span className={styles.value}>{user.username}</span>
                </div>
                <div className={styles.infoGroup}>
                  <span className={styles.label}>Email:</span>
                  <span className={styles.value}>{user.email}</span>
                </div>
                <div className={styles.infoGroup}>
                  <span className={styles.label}>Роль:</span>
                  <span className={styles.value}>{user.role === 'admin' ? 'Администратор' : 'Пользователь'}</span>
                </div>
                <div className={styles.infoGroup}>
                  <span className={styles.label}>Дата регистрации:</span>
                  <span className={styles.value}>{new Date(user.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className={styles.profileCard}>
          <div className={styles.cardHeader}>
            <h2>Активные устройства</h2>
          </div>
          
          {devicesList}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 