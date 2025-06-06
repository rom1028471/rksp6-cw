import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile, fetchUserDevices } from '../store/slices/authSlice';
import { FaUser, FaLaptop, FaMobile, FaTablet, FaDesktop, FaTrash } from 'react-icons/fa';
import styles from './ProfilePage.module.css';
import apiClient from '../services/apiClient';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user, devices, loading, error, lastDevicesRequestTime } = useSelector((state) => state.auth);
  const devicesRequestRef = useRef(false);
  const initialRenderRef = useRef(true);
  
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
  const [localDevices, setLocalDevices] = useState([]);
  
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
  
  // Отдельный эффект для загрузки устройств - выполняется только один раз
  useEffect(() => {
    // Используем localDevices, если уже есть данные из редьюсера
    if (devices && devices.length > 0) {
      setLocalDevices(devices);
      return;
    }
    
    // Запрашиваем устройства только один раз при первом рендере
    if (initialRenderRef.current && user && !devicesRequestRef.current) {
      initialRenderRef.current = false;
      
      const now = Date.now();
      const shouldFetchDevices = 
        (!devices || devices.length === 0) && 
        (!lastDevicesRequestTime || (now - lastDevicesRequestTime > 300000)); // 5 минут
      
      if (shouldFetchDevices) {
        console.log('Загружаем устройства пользователя');
        devicesRequestRef.current = true;
        
        // Запрос с большей задержкой, чтобы дать время другим компонентам загрузиться
        setTimeout(() => {
          dispatch(fetchUserDevices())
            .then((result) => {
              if (result.payload) {
                setLocalDevices(result.payload);
              }
            })
            .catch((err) => {
              console.error('Ошибка загрузки устройств:', err);
              // Установим пустой массив, чтобы не пытаться повторно загрузить
              setLocalDevices([]);
            })
            .finally(() => {
              devicesRequestRef.current = false;
            });
        }, 1000);
      }
    }
  }, [user, devices, dispatch, lastDevicesRequestTime]);

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
    const deviceTypeLower = deviceType.toLowerCase();
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
  
  // Форматируем дату последней активности
  const formatLastActive = (dateString) => {
    if (!dateString) return 'Неизвестно';
    
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Добавляем функцию для отключения устройства
  const handleDisconnectDevice = async (device) => {
    try {
      const deviceId = device.device_id || device.deviceId;
      console.log(`Отключение устройства:`, device);
      
      if (!deviceId) {
        console.error('Отсутствует ID устройства:', device);
        setFormError('Неверный ID устройства');
        return;
      }
      
      await apiClient.post(`/playback/disconnect`, { deviceId });
      
      // После успешного отключения, обновляем список устройств
      if (user) {
        dispatch(fetchUserDevices());
      }
      
      setFormSuccess('Устройство успешно отключено');
      setTimeout(() => setFormSuccess(null), 3000);
    } catch (error) {
      console.error('Ошибка при отключении устройства:', error);
      setFormError(error.response?.data?.message || 'Ошибка при отключении устройства');
      setTimeout(() => setFormError(null), 3000);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Загрузка данных...</div>;
  }

  if (!user) {
    return <div className={styles.error}>Пользователь не найден</div>;
  }

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
          
          {localDevices && localDevices.length > 0 ? (
            <div className={styles.devicesList}>
              {localDevices.map(device => (
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
                      <span>Последняя активность: {formatLastActive(device.lastActive)}</span>
                    </div>
                  </div>
                  <button className={styles.deviceDisconnect} title="Отключить устройство" onClick={() => handleDisconnectDevice(device)}>
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.noDevices}>
              <p>Нет активных устройств</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 