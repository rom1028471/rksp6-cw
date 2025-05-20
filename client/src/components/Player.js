import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Hls from 'hls.js';
import { 
  FaPlay, 
  FaPause, 
  FaStepForward, 
  FaStepBackward, 
  FaVolumeUp, 
  FaVolumeMute,
  FaRandom,
  FaRedoAlt,
  FaDownload,
  FaCloudDownloadAlt,
  FaCloudUploadAlt,
  FaList
} from 'react-icons/fa';
import { 
  setIsPlaying, 
  setCurrentTime, 
  setCurrentTrack,
  playNextTrack,
  playPreviousTrack,
  toggleShuffle,
  toggleLoop
} from '../store/slices/playerSlice';
import { updatePlaybackPosition } from '../store/slices/playbackSlice';
import CacheManager from '../utils/CacheManager';
import PlayerControlPanel from './PlayerControlPanel';

/**
 * Компонент для воспроизведения аудио с использованием HLS
 */
const Player = () => {
  const dispatch = useDispatch();
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { 
    currentTrack, 
    isPlaying, 
    currentTime,
    isShuffled,
    isLooped,
    currentPlaylist,
    playlistTracks
  } = useSelector((state) => state.player);
  const { user } = useSelector((state) => state.auth);
  const { deviceId, isOnline } = useSelector((state) => state.device);

  // Проверяем, есть ли трек в кэше
  useEffect(() => {
    if (currentTrack) {
      checkCache();
    }
  }, [currentTrack]);

  // Проверка доступности трека в офлайн-режиме
  useEffect(() => {
    const checkOfflineAvailability = async () => {
      if (!isOnline && currentTrack && !isCached) {
        // Если нет соединения и трек не кэширован, проверяем в кэше
        const cachedTrack = await CacheManager.getTrack(currentTrack.id);
        
        if (!cachedTrack) {
          // Если трека нет в кэше и нет соединения, отображаем сообщение
          console.error('Трек недоступен в офлайн-режиме');
          // Можно добавить сообщение для пользователя или подменить на локальный трек
          
          // Находим доступный кэшированный трек, если текущий недоступен
          if (currentPlaylist && playlistTracks.length > 0) {
            const allCachedTracks = await CacheManager.getAllTracks();
            
            if (allCachedTracks.length > 0) {
              // Найти первый доступный трек из текущего плейлиста
              const cachedTrackIds = allCachedTracks.map(item => item.id);
              const availableTrack = playlistTracks.find(track => cachedTrackIds.includes(track.id));
              
              if (availableTrack) {
                console.log('Воспроизведение доступного кэшированного трека');
                dispatch(setCurrentTrack(availableTrack));
              }
            }
          }
        }
      }
    };
    
    checkOfflineAvailability();
  }, [isOnline, currentTrack, isCached]);

  // Проверка кэша
  const checkCache = async () => {
    if (!currentTrack) return;
    
    try {
      const cachedTrack = await CacheManager.getTrack(currentTrack.id);
      setIsCached(!!cachedTrack);
    } catch (err) {
      console.error('Ошибка при проверке кэша:', err);
      setIsCached(false);
    }
  };

  // Загрузка трека в кэш с прогрессом
  const cacheTrack = async () => {
    if (!currentTrack || isCached || isDownloading) return;
    
    try {
      setIsDownloading(true);
      
      // Показываем прогресс загрузки
      let progress = 0;
      const progressStep = 10; // Шаг обновления прогресса (в %)
      const progressInterval = setInterval(() => {
        progress += progressStep;
        if (progress >= 100) {
          clearInterval(progressInterval);
        }
        // Здесь можно обновлять индикатор прогресса в UI
      }, 500);
      
      // Загружаем аудио файл
      const response = await fetch(currentTrack.streamPath);
      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      const reader = response.body.getReader();
      const chunks = [];
      let receivedLength = 0;
      
      // Считываем данные по частям
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        chunks.push(value);
        receivedLength += value.length;
        
        // Обновляем прогресс, если известен общий размер
        if (total) {
          progress = Math.round((receivedLength / total) * 100);
          // Здесь можно обновлять индикатор прогресса в UI
        }
      }
      
      // Собираем все чанки в один ArrayBuffer
      const allChunks = new Uint8Array(receivedLength);
      let position = 0;
      for (const chunk of chunks) {
        allChunks.set(chunk, position);
        position += chunk.length;
      }
      
      clearInterval(progressInterval);
      
      // Сохраняем в кэш
      await CacheManager.cacheTrack(currentTrack, allChunks.buffer);
      
      setIsCached(true);
      setIsDownloading(false);
    } catch (err) {
      console.error('Ошибка при кэшировании трека:', err);
      setIsDownloading(false);
    }
  };

  // Инициализация HLS плеера или воспроизведение из кэша
  useEffect(() => {
    let hls = null;

    async function setupAudio() {
      if (!currentTrack || !audioRef.current) return;

      const audio = audioRef.current;
      
      try {
        // Сначала проверяем кэш
        const cachedTrack = await CacheManager.getTrack(currentTrack.id);
        
        if (cachedTrack && (!isOnline || !cachedTrack.isStreamOnly)) {
          // Воспроизводим из кэша
          setIsCached(true);
          const blob = new Blob([cachedTrack.audioData]);
          const url = URL.createObjectURL(blob);
          audio.src = url;
          
          if (isPlaying) {
            audio.play().catch(err => console.error('Ошибка воспроизведения из кэша:', err));
          }
        } else {
          // Воспроизводим онлайн через HLS
          setIsCached(false);
          
          // Проверяем наличие полного пути к потоку
          let streamUrl = currentTrack.streamPath;
          // Если путь не начинается с http или https, добавляем базовый URL API
          if (streamUrl && !streamUrl.startsWith('http')) {
            const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
            // Убираем /api из базового URL если путь к потоку не часть API
            const baseUrl = apiBaseUrl.replace(/\/api$/, '');
            streamUrl = `${baseUrl}${streamUrl}`;
          }
          
          if (Hls.isSupported() && isOnline) {
            hls = new Hls();
            hls.loadSource(streamUrl);
            hls.attachMedia(audio);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              if (isPlaying) audio.play().catch(err => console.error('Ошибка воспроизведения:', err));
            });
            
            // Обработка ошибок
            hls.on(Hls.Events.ERROR, (event, data) => {
              console.error('HLS ошибка:', data);
              if (data.fatal) {
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    hls.startLoad();
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    hls.recoverMediaError();
                    break;
                  default:
                    // Невосстановимая ошибка
                    hls.destroy();
                    break;
                }
              }
            });
          } 
          // Если браузер поддерживает HLS нативно (Safari)
          else if (audio.canPlayType('application/vnd.apple.mpegurl') && isOnline) {
            audio.src = streamUrl;
          }
          // Офлайн и нет кэша - ничего не делаем
          else if (!isOnline) {
            console.error('Трек не доступен в офлайн-режиме и нет соединения с интернетом');
          }
        }
      } catch (err) {
        console.error('Ошибка при настройке аудио:', err);
      }

      // Установить начальную позицию, если есть
      if (currentTime > 0) {
        audio.currentTime = currentTime;
      }
    }
    
    setupAudio();

    // Очистка при размонтировании
    return () => {
      if (hls) {
        hls.destroy();
      }
      
      // Освобождаем URL, если он был создан
      if (audioRef.current && audioRef.current.src.startsWith('blob:')) {
        URL.revokeObjectURL(audioRef.current.src);
      }
    };
  }, [currentTrack, isPlaying, isOnline]);

  // Обработчик воспроизведения/паузы
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.play().catch(err => console.error('Ошибка воспроизведения:', err));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Обновление позиции воспроизведения
  const updateProgress = () => {
    if (!audioRef.current) return;
    
    const currentTime = audioRef.current.currentTime;
    const duration = audioRef.current.duration || 0;
    
    // Обновляем прогресс в Redux
    dispatch(setCurrentTime(currentTime));
    
    // Обновляем визуальный прогресс
    if (progressRef.current) {
      progressRef.current.style.width = `${(currentTime / duration) * 100}%`;
    }
    
    // Синхронизируем позицию воспроизведения с сервером (каждые 5 секунд)
    if (isOnline && currentTime % 5 < 1 && user && currentTrack) {
      dispatch(updatePlaybackPosition({
        userId: user.id,
        trackId: currentTrack.id,
        deviceId,
        position: Math.floor(currentTime),
        isPlaying
      }));
    }
  };

  // Обработчик завершения трека
  const handleTrackEnded = () => {
    if (isLooped && !currentPlaylist) {
      // Повторяем текущий трек
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else {
      // Переходим к следующему треку
      dispatch(playNextTrack());
    }
  };

  // Обработчик клика по прогресс-бару
  const handleProgressClick = (e) => {
    if (!audioRef.current || !progressRef.current.parentNode) return;
    
    const progressBar = progressRef.current.parentNode;
    const rect = progressBar.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const width = rect.width;
    const percent = offsetX / width;
    const duration = audioRef.current.duration || 0;
    
    audioRef.current.currentTime = percent * duration;
    dispatch(setCurrentTime(percent * duration));
  };

  // Обработчик изменения громкости
  const handleVolumeChange = (e) => {
    const value = parseFloat(e.target.value);
    setVolume(value);
    setIsMuted(value === 0);
    
    if (audioRef.current) {
      audioRef.current.volume = value;
    }
  };

  // Обработчик включения/выключения звука
  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume || 0.7;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  // Обработчики управления воспроизведением
  const togglePlay = () => dispatch(setIsPlaying(!isPlaying));
  const handleNext = () => dispatch(playNextTrack());
  const handlePrevious = () => dispatch(playPreviousTrack());
  const handleToggleShuffle = () => dispatch(toggleShuffle());
  const handleToggleLoop = () => dispatch(toggleLoop());
  const handleDownloadTrack = () => cacheTrack();

  // Форматирование времени
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!currentTrack) return null;

  return (
    <div className="player">
      <audio 
        ref={audioRef}
        onTimeUpdate={updateProgress}
        onEnded={handleTrackEnded}
      />
      <div className="player-left">
        <div className="player-track-info">
          <img src={currentTrack.coverPath || '/default-cover.jpg'} alt={currentTrack.title} className="track-cover" />
          <div className="track-details">
            <div className="track-title">{currentTrack.title}</div>
            <div className="track-artist">{currentTrack.artist}</div>
          </div>
        </div>
      </div>
      
      <div className="player-center">
        <div className="player-controls">
          <div className="control-buttons">
            <button className={`control-button shuffle ${isShuffled ? 'active' : ''}`} onClick={handleToggleShuffle}>
              <FaRandom />
            </button>
            <button className="control-button" onClick={handlePrevious}>
              <FaStepBackward />
            </button>
            <button className="control-button play-pause" onClick={togglePlay}>
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
            <button className="control-button" onClick={handleNext}>
              <FaStepForward />
            </button>
            <button className={`control-button repeat ${isLooped ? 'active' : ''}`} onClick={handleToggleLoop}>
              <FaRedoAlt />
            </button>
          </div>
        </div>
        <div className="progress-bar">
          <span className="time">{formatTime(currentTime)}</span>
          <div className="progress-bar-inner" onClick={handleProgressClick}>
            <div ref={progressRef} className="progress"></div>
          </div>
          <span className="time">{formatTime(audioRef.current?.duration || 0)}</span>
        </div>
      </div>
      
      <div className="player-right">
        <div className="volume-controls">
          <div className="volume-control">
            <button className="control-button" onClick={toggleMute}>
              {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="volume-slider"
            />
          </div>
        </div>
        <div className="player-actions">
          <button className="action-button" onClick={handleDownloadTrack} title="Скачать для офлайн прослушивания">
            {isDownloading ? <FaCloudDownloadAlt className="downloading" /> : 
             isCached ? <FaDownload /> : 
             !isOnline ? <FaCloudUploadAlt /> : <FaCloudDownloadAlt />}
          </button>
          <PlayerControlPanel />
        </div>
      </div>
    </div>
  );
};

export default Player; 