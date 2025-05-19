import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { FaSync, FaInfoCircle, FaTimes } from 'react-icons/fa';
import apiClient from '../services/apiClient';
import './PlayerControlPanel.css';

/**
 * Компонент панели управления синхронизацией воспроизведения между устройствами
 */
const PlayerControlPanel = () => {
  const { user } = useSelector((state) => state.auth);
  const { deviceId } = useSelector((state) => state.device);
  
  const [showPanel, setShowPanel] = useState(false);
  const [activeSessions, setActiveSessions] = useState([]);
  const [syncStatus, setSyncStatus] = useState({ syncing: false, error: null });
  const [selectedDevice, setSelectedDevice] = useState(null);
  
  // Загрузка активных сессий воспроизведения
  const loadActiveSessions = async () => {
    try {
      const response = await apiClient.get('/playback/active-sessions');
      setActiveSessions(response.data);
    } catch (error) {
      console.error('Ошибка при загрузке активных сессий:', error);
    }
  };
  
  // Показать панель
  const handleShowPanel = () => {
    setShowPanel(true);
    loadActiveSessions();
  };
  
  // Синхронизация с выбранным устройством
  const syncWithDevice = async (targetDeviceId) => {
    if (!deviceId || !targetDeviceId || !user) return;
    
    setSyncStatus({ syncing: true, error: null });
    
    try {
      await apiClient.post('/playback/sync', {
        sourceDeviceId: targetDeviceId,
        targetDeviceId: deviceId,
      });
      
      setSyncStatus({ syncing: false, error: null });
      setShowPanel(false);
      
      // Обновление страницы для применения изменений
      window.location.reload();
    } catch (error) {
      console.error('Ошибка при синхронизации с устройством:', error);
      setSyncStatus({ 
        syncing: false, 
        error: error.response?.data?.message || 'Ошибка синхронизации' 
      });
    }
  };
  
  if (!user || !deviceId) {
    return null;
  }
  
  return (
    <div className="player-control-panel">
      {!showPanel ? (
        <button 
          className="sync-button" 
          onClick={handleShowPanel}
          title="Синхронизация воспроизведения"
        >
          <FaSync />
        </button>
      ) : (
        <div className="sync-panel">
          <div className="sync-panel-header">
            <h3>Синхронизация воспроизведения</h3>
            <button className="close-button" onClick={() => setShowPanel(false)}>
              <FaTimes />
            </button>
          </div>
          
          <div className="sync-panel-content">
            {activeSessions.length === 0 ? (
              <div className="no-sessions">
                <p>Нет активных сессий воспроизведения на других устройствах</p>
              </div>
            ) : (
              <div className="sessions-list">
                <p className="info-text">
                  <FaInfoCircle /> Выберите устройство для синхронизации воспроизведения
                </p>
                
                {activeSessions
                  .filter(session => session.position.deviceId !== deviceId)
                  .map(session => (
                    <div 
                      key={session.position.deviceId} 
                      className={`session-item ${selectedDevice === session.position.deviceId ? 'selected' : ''}`}
                      onClick={() => setSelectedDevice(session.position.deviceId)}
                    >
                      <div className="session-info">
                        <div className="device-name">{session.device.deviceName}</div>
                        <div className="track-info">
                          {session.position.Track.title} - {session.position.Track.artist}
                        </div>
                      </div>
                      <div className="session-actions">
                        <button 
                          className="sync-action-button"
                          onClick={() => syncWithDevice(session.position.deviceId)}
                          disabled={syncStatus.syncing}
                        >
                          <FaSync /> Синхронизировать
                        </button>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
            
            {syncStatus.error && (
              <div className="sync-error">
                {syncStatus.error}
              </div>
            )}
          </div>
          
          <div className="sync-panel-footer">
            <button 
              className="primary-button"
              onClick={() => setShowPanel(false)}
              disabled={syncStatus.syncing}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerControlPanel; 