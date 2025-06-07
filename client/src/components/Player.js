import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  FaCloudDownloadAlt,
  FaCloudUploadAlt,
  FaSyncAlt,
  FaMusic,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { 
  setIsPlaying, 
  setCurrentTime, 
  playNextTrack,
  playPreviousTrack,
  toggleShuffle,
  toggleLoop,
  setQueue,
  setInitialTrack,
} from '../store/slices/playerSlice';
import { updatePlaybackPosition } from '../store/slices/playbackSlice';
import playbackSyncService from '../services/playbackSync.service';
import CacheManager from '../utils/CacheManager';
import styles from './Player.module.css';

/**
 * Компонент для воспроизведения аудио с использованием HLS
 */
const Player = () => {
  
  const dispatch = useDispatch();
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const progressBarRef = useRef(null);
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
    queue,
  } = useSelector((state) => state.player);
  const { user } = useSelector((state) => state.auth);
  const { deviceId, isOnline } = useSelector((state) => state.device);
  const hlsInstanceRef = useRef(null);
  const syncInterval = useRef(null);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const newCurrentTime = audio.currentTime;
    dispatch(setCurrentTime(newCurrentTime));

    // Вызов сервиса синхронизации был удален, так как сохранение 
    // происходит только при выходе или закрытии страницы.

  }, [dispatch]);

  // Вспомогательные функции, определенные до их использования в useEffect или JSX
  const checkCache = useCallback(async () => {
    if (!currentTrack) return;
    try {
      const cachedTrackData = await CacheManager.getTrack(currentTrack.id);
      setIsCached(!!cachedTrackData);
    } catch (err) {
      console.error('Ошибка при проверке кэша:', err);
      setIsCached(false);
    }
  }, [currentTrack]); // Зависимость от currentTrack

  const cacheTrack = useCallback(async () => {
    if (!currentTrack || isCached || isDownloading || !user) return;
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
    } catch (err) {
      console.error('Ошибка при кэшировании трека:', err);
    } finally {
      setIsDownloading(false);
    }
  }, [currentTrack, isCached, isDownloading, user]); // Зависимости для cacheTrack

  const getCoverPath = useCallback((coverPathProperty) => {
    if (!coverPathProperty) return '/default-cover.jpg';
    if (coverPathProperty.startsWith('http')) return coverPathProperty;
    const baseUrl = (process.env.REACT_APP_API_URL || '').replace(/\/api$/, '');
    return `${baseUrl}${coverPathProperty}`;
  }, []); // Нет зависимостей, если REACT_APP_API_URL не меняется

  // Вспомогательная функция для форматирования времени
  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) seconds = 0;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Проверяем, есть ли трек в кэше
  useEffect(() => {
    if (currentTrack && user) {
      checkCache();
    }
  }, [currentTrack, user, checkCache]);

  // Проверка доступности трека в офлайн-режиме (УПРОЩЕНО)
  useEffect(() => {
    const checkOfflineAvailability = async () => {
      if (!isOnline && currentTrack && !isCached && user) {
        const cachedTrack = await CacheManager.getTrack(currentTrack.id);
        if (!cachedTrack) {
          console.error('Трек недоступен в офлайн-режиме и не найден в кэше.');
          // Попытка найти любой другой кэшированный трек и воспроизвести его
          const allCachedTracks = await CacheManager.getAllTracks();
          if (allCachedTracks.length > 0) {
            const firstCachedTrackInfo = allCachedTracks[0];
            const firstCachedTrackData = await CacheManager.getTrack(firstCachedTrackInfo.id);
            if(firstCachedTrackData) {
              console.log('Воспроизведение первого доступного кэшированного трека');
              // Мы не можем просто диспатчить setCurrentTrack, нужно обновить всю очередь
              // Но для простоты пока просто выведем сообщение.
              // В будущем можно реализовать логику "оффлайн-очереди".
            }
          } else {
             dispatch(setIsPlaying(false)); // Останавливаем воспроизведение, если ничего нет
          }
        }
      }
    };
    
    if (user) {
      checkOfflineAvailability();
    }
  }, [isOnline, currentTrack, isCached, dispatch, user]);

  // Инициализация HLS плеера или воспроизведение из кэша
  useEffect(() => {
    const audio = audioRef.current;
    if (!currentTrack || !audio || !user) {
        if (hlsInstanceRef.current) {
            hlsInstanceRef.current.destroy();
            hlsInstanceRef.current = null;
        }
        if (audio && audio.src) {
            if (audio.src.startsWith('blob:')) URL.revokeObjectURL(audio.src);
            audio.src = null;
        }
        return;
    }

    if (hlsInstanceRef.current) {
      hlsInstanceRef.current.destroy();
      hlsInstanceRef.current = null;
    }
    if (audio.src && audio.src.startsWith('blob:')) {
        URL.revokeObjectURL(audio.src);
    }
    audio.src = null; 

    let streamUrl = currentTrack.stream_path || currentTrack.streamPath;
    console.log('[Player.js] Инициализация HLS. Начальный streamPath:', streamUrl);

    if (typeof streamUrl !== 'string' || streamUrl.trim() === '') {
      console.error('[Player.js] Ошибка: streamPath невалиден или отсутствует. Track:', currentTrack);
      return;
    }

    if (!streamUrl.startsWith('http')) {
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const baseUrl = apiBaseUrl.replace(/\/api$/, '');
      streamUrl = `${baseUrl}${streamUrl}`;
      console.log('[Player.js] Полный streamUrl после добавления baseUrl:', streamUrl);
    }

    if (Hls.isSupported()) {
      const newHls = new Hls({
        // debug: true, // Можно включить для очень подробного лога от hls.js
        // Попробуем увеличить таймауты, если проблема в сети
        // manifestLoadingTimeOut: 20000, // 20 секунд
        // levelLoadingTimeOut: 20000,
        // fragLoadingTimeOut: 30000,
      });
      hlsInstanceRef.current = newHls;
      newHls.loadSource(streamUrl);
      newHls.attachMedia(audio);

      newHls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        console.log('[Player.js] HLS Event: MANIFEST_PARSED. Уровни:', data.levels.length);
        // Логика автовоспроизведения здесь не нужна, так как управляется isPlaying
      });
      newHls.on(Hls.Events.MANIFEST_LOADED, (event, data) => {
        console.log('[Player.js] HLS Event: MANIFEST_LOADED. URL:', data.url);
      });
      newHls.on(Hls.Events.LEVEL_LOADED, (event, data) => {
        console.log('[Player.js] HLS Event: LEVEL_LOADED. details:', data.details);
      });
      newHls.on(Hls.Events.FRAG_LOADED, (event, data) => {
        console.log('[Player.js] HLS Event: FRAG_LOADED. frag:', data.frag.relurl, 'response size:', data.payload.byteLength);
      });
       newHls.on(Hls.Events.FRAG_PARSING_METADATA, (event, data) => {
        console.log('[Player.js] HLS Event: FRAG_PARSING_METADATA', data);
      });
      newHls.on(Hls.Events.ERROR, (event, data) => {
        console.error('[Player.js] HLS Error. Type:', data.type, 'Details:', data.details, 'Fatal:', data.fatal);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('Фатальная сетевая ошибка, пытаемся восстановиться...');
              newHls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('Фатальная ошибка медиа, пытаемся восстановиться...');
              newHls.recoverMediaError();
              break;
            default:
              console.error('Неустранимая ошибка HLS, уничтожаем экземпляр.');
              if (hlsInstanceRef.current) {
                  hlsInstanceRef.current.destroy();
                  hlsInstanceRef.current = null;
              }
              // Попытка перейти к следующему треку, если есть
              if (queue.length > 1) {
                  dispatch(playNextTrack());
              }
              break;
          }
        }
      });
    } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
      console.log('[Player.js] Используется нативная поддержка HLS (Safari).');
      audio.src = streamUrl;
    }
    
    // Определяем функции-обработчики событий заранее
    const handleAudioLoadedMetadata = () => {
      console.log('[Player.js] Event: loadedmetadata. Duration:', audioRef.current?.duration);
      if (audioRef.current && currentTime > 0) {
        console.log('[Player.js] Устанавливаем начальную позицию:', currentTime);
        // Задержка перед установкой начальной позиции для надежности
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.currentTime = currentTime;
            console.log('[Player.js] Начальная позиция установлена:', currentTime);
          }
        }, 500);
      }
    };
    const handleAudioCanPlay = () => console.log('[Player.js] Event: canplay');
    const handleAudioPlaying = () => console.log('[Player.js] Event: playing');
    const handleAudioWaiting = () => console.log('[Player.js] Event: waiting');
    const handleAudioStalled = () => console.log('[Player.js] Event: stalled');
    const handleAudioError = (e) => console.error('[Player.js] HTMLAudioElement Error:', e, audioRef.current?.error);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleTrackEnded);
    audio.addEventListener('loadedmetadata', handleAudioLoadedMetadata);
    audio.addEventListener('canplay', handleAudioCanPlay);
    audio.addEventListener('playing', () => dispatch(setIsPlaying(true)));
    audio.addEventListener('pause', () => dispatch(setIsPlaying(false)));
    audio.addEventListener('waiting', () => dispatch(setIsPlaying(false)));
    audio.addEventListener('stalled', () => console.error('[Player.js] Event: stalled - media data is not available.'));
    audio.addEventListener('error', (e) => {
      console.error('[Player.js] HTMLAudioElement Error:', e, audioRef.current?.error);
      dispatch(setIsPlaying(false));
    });

    const currentAudioElement = audioRef.current;

    return () => {
      console.log('[Player.js] Очистка HLS useEffect для трека:', currentTrack?.title);
      currentAudioElement?.removeEventListener('timeupdate', handleTimeUpdate);
      currentAudioElement?.removeEventListener('ended', handleTrackEnded);
      currentAudioElement?.removeEventListener('loadedmetadata', handleAudioLoadedMetadata);
      currentAudioElement?.removeEventListener('canplay', handleAudioCanPlay);
      currentAudioElement?.removeEventListener('playing', () => dispatch(setIsPlaying(true)));
      currentAudioElement?.removeEventListener('pause', () => dispatch(setIsPlaying(false)));
      currentAudioElement?.removeEventListener('waiting', () => dispatch(setIsPlaying(false)));
      currentAudioElement?.removeEventListener('stalled', () => console.error('[Player.js] Event: stalled - media data is not available.'));
      currentAudioElement?.removeEventListener('error', (e) => {
        console.error('[Player.js] HTMLAudioElement Error:', e, audioRef.current?.error);
        dispatch(setIsPlaying(false));
      });

      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
      if (currentAudioElement && currentAudioElement.src && currentAudioElement.src.startsWith('blob:')) { 
        URL.revokeObjectURL(currentAudioElement.src);
      }
    };
  }, [currentTrack, user?.id, dispatch]);

  // Загрузка последней позиции воспроизведения при монтировании
  useEffect(() => {
    // Запускаем только при первом монтировании и если пользователь авторизован
    if (user && deviceId && !currentTrack) {
      // Создаем ключ для текущей сессии пользователя
      const sessionKey = `last-user-${user.id}`;
      const lastLoadedUserKey = sessionStorage.getItem('current-playback-user');
      
      // Проверяем, загружали ли мы уже треки для этого пользователя
      if (lastLoadedUserKey === sessionKey) {
        console.log('[Player.js] Уже была попытка загрузки для этого пользователя, пропускаем');
        return;
      }
      
      console.log('[Player.js] Пытаемся загрузить последнюю позицию воспроизведения для пользователя:', user.id);
      
      // Запоминаем, что загружаем треки для текущего пользователя, ДО запроса
      sessionStorage.setItem('current-playback-user', sessionKey);
      
      playbackSyncService.getLastPosition()
        .then(data => {
          if (data && data.track) {
            console.log('[Player.js] Загружена последняя позиция для пользователя', user.id, ':', data);
            
            // Проверяем, принадлежит ли трек текущему пользователю или является публичным
            const trackUserId = data.track.user_id || data.track.userId;
            const isOwnerOrPublic = trackUserId === user.id || data.track.is_public;
            
            if (isOwnerOrPublic) {
              dispatch(setInitialTrack({
                track: data.track,
                position: data.position || 0
              }));
            } else {
              console.log('[Player.js] Трек не принадлежит текущему пользователю и не является публичным, не загружаем его');
            }
          } else {
            console.log('[Player.js] Нет сохраненной позиции воспроизведения для пользователя', user.id);
          }
        })
        .catch(err => {
          console.error('[Player.js] Ошибка при загрузке последней позиции:', err);
        });
    }

    // Настройка периодического сохранения позиции
    if (user && deviceId) {
      console.log('[Player.js] Запуск периодического сохранения позиции для пользователя', user.id);
      const stopSaving = playbackSyncService.startPeriodicSave();
      
      return () => {
        console.log('[Player.js] Остановка периодического сохранения позиции');
        if (stopSaving) stopSaving();
      };
    }
  }, [user?.id, deviceId, dispatch, currentTrack]);

  // Обработчик воспроизведения/паузы
  useEffect(() => {
    if (!audioRef.current || !user) return;

    if (isPlaying) {
      // Добавим проверку, готов ли трек к воспроизведению
      // readyState 3 (HAVE_FUTURE_DATA) или 4 (HAVE_ENOUGH_DATA) означает, что данных достаточно для начала воспроизведения.
      if (audioRef.current.readyState >= 3) { 
        audioRef.current.play().catch(err => console.error('Ошибка воспроизведения:', err));
      } else {
        // Если не готово, добавим слушателя, чтобы запустить play когда будет готово
        const playWhenReady = () => {
          if (isPlaying && audioRef.current && user) {
            audioRef.current.play().catch(err => console.error('Ошибка воспроизведения (когда готово):', err));
          }
          if (audioRef.current) { // Проверка на случай, если компонент размонтирован
            audioRef.current.removeEventListener('canplaythrough', playWhenReady);
            audioRef.current.removeEventListener('loadeddata', playWhenReady); 
          }
        };
        // Добавляем слушатели только если audioRef.current существует
        if (audioRef.current) {
            audioRef.current.addEventListener('canplaythrough', playWhenReady);
            audioRef.current.addEventListener('loadeddata', playWhenReady); 
        }
      }
    } else {
      audioRef.current.pause();
    }
    // currentTrack также важен, так как play/pause относится к конкретному треку.
  }, [isPlaying, currentTrack, user]); // Добавим currentTrack в зависимости

  // Обновление позиции воспроизведения
  const updateProgress = useCallback(() => {
    if (!audioRef.current || !progressRef.current || !user) return; 
    
    const newCurrentTime = audioRef.current.currentTime; 
    const duration = audioRef.current.duration || 0;
    
    dispatch(setCurrentTime(newCurrentTime));
    
    if (progressRef.current) {
      progressRef.current.style.width = duration ? `${(newCurrentTime / duration) * 100}%` : '0%';
    }
    
    // Синхронизируем с сервером только если пользователь авторизован
    if (isOnline && user && currentTrack && deviceId && Math.floor(newCurrentTime) % 5 === 0 && Math.floor(newCurrentTime) !== Math.floor(currentTime)) {
      console.log('[Player.js] Попытка отправки updatePlaybackPosition. User:', user, 'Токен в localStorage:', localStorage.getItem('token'));
      dispatch(updatePlaybackPosition({
        userId: user.id,
        trackId: currentTrack.id,
        deviceId,
        position: Math.floor(newCurrentTime),
        isPlaying
      }));
    }
  }, [dispatch, isOnline, user, currentTrack, deviceId, isPlaying, currentTime]);

  // Обработчик завершения трека
  const handleTrackEnded = () => {
    if (!user) return;
    if (isLooped && !queue) {
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
    if (!audioRef.current || !progressBarRef.current) return;
    
    const progressBar = progressBarRef.current;
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

  const coverArt = currentTrack ? getCoverPath(currentTrack.cover_path || currentTrack.coverPath) : '/default-cover.jpg';

  // Логика отображения
  if (!user) {
    // Если пользователь не авторизован, показываем сообщение о необходимости авторизации
    return (
      <div className={styles.playerContainer}>
        <div className={styles.authRequiredMessageContainer}>
          <p>Пожалуйста, <Link to="/login">войдите</Link> или <Link to="/register">зарегистрируйтесь</Link>, чтобы слушать музыку.</p>
        </div>
      </div>
    );
  }

  if (user && currentTrack) {
    // Пользователь авторизован и есть трек, показываем полный плеер
    return (
      <div className={styles.playerContainer}>
        <audio 
          ref={audioRef}
          onTimeUpdate={updateProgress}
          onEnded={handleTrackEnded}
        />
        
        {/* Левая часть: информация о треке */}
        <div className={styles.trackInfo}>
          <img src={coverArt} alt={currentTrack?.title || 'Cover'} className={styles.coverArt} />
          <div>
            <div className={styles.title}>{currentTrack?.title || 'Трек не выбран'}</div>
            <div className={styles.artist}>{currentTrack?.artist || '-'}</div>
          </div>
        </div>

        {/* Центральная часть: управление и прогресс */}
        <div className={styles.playerControls}>
          <div className={styles.controlButtons}>
            <button 
              className={`${styles.controlButton} ${isShuffled ? styles.active : ''}`}
              onClick={handleToggleShuffle}
              title={isShuffled ? 'Отключить перемешивание' : 'Включить перемешивание'}
            >
              <FaRandom />
            </button>
            <button className={styles.controlButton} onClick={handlePrevious} title="Предыдущий трек">
              <FaStepBackward />
            </button>
            <button 
              className={`${styles.controlButton} ${styles.playPause}`}
              onClick={togglePlay} 
              title={isPlaying ? 'Пауза' : 'Воспроизвести'}
            >
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
            <button className={styles.controlButton} onClick={handleNext} title="Следующий трек">
              <FaStepForward />
            </button>
            <button 
              className={`${styles.controlButton} ${isLooped ? styles.active : ''}`}
              onClick={handleToggleLoop}
              title={isLooped ? 'Отключить повтор' : 'Включить повтор'}
            >
              <FaRedoAlt />
            </button>
          </div>
          <div className={styles.progressBarContainer}>
            <span className={styles.time}>{formatTime(currentTime)}</span>
            <div 
              className={styles.progressBar}
              ref={progressBarRef} 
              onClick={handleProgressClick}
            >
              <div ref={progressRef} className={styles.progress}></div>
            </div>
            <span className={styles.time}>{formatTime(audioRef.current?.duration)}</span>
          </div>
        </div>

        {/* Правая часть: громкость и доп. действия */}
        <div className={styles.rightControls}>
          <div className={styles.volumeControls}>
            <button className={styles.controlButton} onClick={toggleMute} title={isMuted ? 'Включить звук' : 'Выключить звук'}>
              {isMuted || volume === 0 ? <FaVolumeMute /> : <FaVolumeUp />}
            </button>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={isMuted ? 0 : volume} 
              onChange={handleVolumeChange} 
              className={styles.volumeSlider}
            />
          </div>
        </div>
      </div>
    );
  } else {
    // Пользователь авторизован, но нет трека - показываем пустой плеер
    return (
      <div className={styles.playerContainer}>
        <div className={styles.trackInfo}>
          <div className={styles.coverArtPlaceholder}>
            <FaMusic size={32} />
          </div>
          <div>
            <div className={styles.title}>Трек не выбран</div>
            <div className={styles.artist}>Выберите трек для воспроизведения</div>
          </div>
        </div>

        <div className={styles.playerControls}>
          <div className={styles.controlButtons}>
            <button 
              className={styles.controlButton}
              disabled
              title="Перемешать"
            >
              <FaRandom />
            </button>
            <button className={styles.controlButton} disabled title="Предыдущий трек">
              <FaStepBackward />
            </button>
            <button 
              className={`${styles.controlButton} ${styles.playPause}`}
              disabled
              title="Воспроизвести"
            >
              <FaPlay />
            </button>
            <button className={styles.controlButton} disabled title="Следующий трек">
              <FaStepForward />
            </button>
            <button 
              className={styles.controlButton}
              disabled
              title="Повторять"
            >
              <FaRedoAlt />
            </button>
          </div>
          <div className={styles.progressBarContainer}>
            <span className={styles.time}>0:00</span>
            <div className={styles.progressBar}>
              <div className={styles.progress} style={{width: '0%'}}></div>
            </div>
            <span className={styles.time}>0:00</span>
          </div>
        </div>

        <div className={styles.rightControls}>
          <div className={styles.volumeControls}>
            <button className={styles.controlButton} disabled title="Громкость">
              <FaVolumeUp />
            </button>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={volume} 
              disabled
              className={styles.volumeSlider}
            />
          </div>
        </div>
      </div>
    );
  }
};

export default Player; 