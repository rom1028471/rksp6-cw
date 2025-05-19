import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile, fetchUserDevices } from '../store/slices/authSlice';
import { FaUser, FaLaptop, FaMobile, FaTablet, FaDesktop, FaTrash } from 'react-icons/fa';

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
      
      dispatch(updateUserProfile({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      }))
        .unwrap()
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
          setFormError(err.message || 'Ошибка при изменении пароля');
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

  if (loading) {
    return <div className="loading">Загрузка данных...</div>;
  }

  if (!user) {
    return <div className="error">Пользователь не найден</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            <div className="avatar-placeholder">
              <FaUser size={48} />
            </div>
          </div>
          <div className="profile-title">
            <h1>{user.username}</h1>
            <p>{user.email}</p>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {formError && <div className="error-message">{formError}</div>}
        {formSuccess && <div className="success-message">{formSuccess}</div>}

        <div className="profile-card">
          <div className="card-header">
            <h2>Личная информация</h2>
            {formMode === 'view' ? (
              <div className="header-actions">
                <button 
                  className="btn-edit"
                  onClick={() => setFormMode('edit')}
                >
                  Редактировать
                </button>
                <button 
                  className="btn-password"
                  onClick={() => setFormMode('password')}
                >
                  Изменить пароль
                </button>
              </div>
            ) : (
              <button 
                className="btn-cancel"
                onClick={handleCancelEdit}
              >
                Отмена
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            {formMode === 'edit' && (
              <>
                <div className="form-group">
                  <label>Имя пользователя</label>
                  <input 
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
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
                <div className="form-actions">
                  <button type="submit" className="btn-primary">Сохранить</button>
                </div>
              </>
            )}

            {formMode === 'password' && (
              <>
                <div className="form-group">
                  <label>Текущий пароль</label>
                  <input 
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Новый пароль</label>
                  <input 
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Подтвердите пароль</label>
                  <input 
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary">Изменить пароль</button>
                </div>
              </>
            )}

            {formMode === 'view' && (
              <div className="profile-info">
                <div className="info-group">
                  <span className="label">Имя пользователя:</span>
                  <span className="value">{user.username}</span>
                </div>
                <div className="info-group">
                  <span className="label">Email:</span>
                  <span className="value">{user.email}</span>
                </div>
                <div className="info-group">
                  <span className="label">Роль:</span>
                  <span className="value">{user.role === 'admin' ? 'Администратор' : 'Пользователь'}</span>
                </div>
                <div className="info-group">
                  <span className="label">Дата регистрации:</span>
                  <span className="value">{new Date(user.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="profile-card">
          <div className="card-header">
            <h2>Активные устройства</h2>
          </div>
          
          {localDevices && localDevices.length > 0 ? (
            <div className="devices-list">
              {localDevices.map(device => (
                <div key={device.id} className="device-item">
                  <div className="device-icon">
                    {getDeviceIcon(device.deviceType)}
                  </div>
                  <div className="device-info">
                    <div className="device-name">
                      {device.deviceName}
                      {device.isCurrentDevice && <span className="current-badge">Текущее</span>}
                    </div>
                    <div className="device-meta">
                      <span>Последняя активность: {formatLastActive(device.lastActive)}</span>
                    </div>
                  </div>
                  <button className="device-disconnect" title="Отключить устройство">
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-devices">
              <p>Нет активных устройств</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .profile-page {
          padding-bottom: 40px;
        }
        
        .profile-container {
          max-width: 800px;
          margin: 0 auto;
        }
        
        .profile-header {
          display: flex;
          align-items: center;
          margin-bottom: 30px;
        }
        
        .profile-avatar {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          overflow: hidden;
          margin-right: 30px;
          flex-shrink: 0;
        }
        
        .avatar-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(45deg, #e0e0e0, #f5f5f5);
          color: #999;
        }
        
        .profile-title h1 {
          margin: 0 0 8px 0;
          font-size: 2rem;
        }
        
        .profile-title p {
          margin: 0;
          color: #666;
        }
        
        .profile-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin-bottom: 30px;
        }
        
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }
        
        .card-header h2 {
          margin: 0;
          font-size: 1.5rem;
        }
        
        .header-actions {
          display: flex;
          gap: 10px;
        }
        
        .btn-edit, .btn-password, .btn-cancel {
          background: none;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-edit:hover, .btn-password:hover {
          background: #f5f5f5;
        }
        
        .form-group {
          padding: 20px;
          border-bottom: 1px solid #eee;
        }
        
        .form-group:last-child {
          border-bottom: none;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
        }
        
        .form-group input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .form-group input:disabled {
          background: #f9f9f9;
        }
        
        .form-group small {
          display: block;
          color: #999;
          margin-top: 5px;
        }
        
        .form-actions {
          padding: 20px;
          display: flex;
          justify-content: flex-end;
        }
        
        .btn-primary {
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 10px 20px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .btn-primary:hover {
          background: #0069d9;
        }
        
        .profile-info {
          padding: 20px;
        }
        
        .info-group {
          display: flex;
          margin-bottom: 15px;
        }
        
        .info-group:last-child {
          margin-bottom: 0;
        }
        
        .label {
          min-width: 150px;
          color: #666;
        }
        
        .value {
          font-weight: 500;
        }
        
        .devices-list {
          padding: 0;
        }
        
        .device-item {
          display: flex;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }
        
        .device-item:last-child {
          border-bottom: none;
        }
        
        .device-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f5f5;
          border-radius: 50%;
          margin-right: 20px;
          color: #666;
        }
        
        .device-info {
          flex: 1;
        }
        
        .device-name {
          font-weight: 500;
          margin-bottom: 5px;
          display: flex;
          align-items: center;
        }
        
        .current-badge {
          font-size: 0.7rem;
          padding: 2px 6px;
          background: #4CAF50;
          color: white;
          border-radius: 20px;
          margin-left: 10px;
          font-weight: 400;
        }
        
        .device-meta {
          font-size: 0.9rem;
          color: #666;
        }
        
        .device-disconnect {
          background: none;
          border: none;
          color: #dc3545;
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          transition: background-color 0.2s;
        }
        
        .device-disconnect:hover {
          background: #f8d7da;
        }
        
        .no-devices {
          padding: 20px;
          text-align: center;
          color: #666;
        }
        
        .loading {
          display: flex;
          justify-content: center;
          padding: 40px;
        }
        
        .error, .error-message {
          background: #f8d7da;
          color: #721c24;
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 20px;
        }
        
        .success-message {
          background: #d4edda;
          color: #155724;
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 20px;
        }
        
        @media (max-width: 768px) {
          .profile-header {
            flex-direction: column;
            text-align: center;
          }
          
          .profile-avatar {
            margin-right: 0;
            margin-bottom: 20px;
          }
          
          .info-group {
            flex-direction: column;
          }
          
          .label {
            margin-bottom: 5px;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfilePage; 