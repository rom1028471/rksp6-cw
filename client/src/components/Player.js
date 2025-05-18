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
  FaRedoAlt
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

/**
 * Компонент для воспроизведения аудио с использованием HLS
 */
const Player = () => {
  const dispatch = useDispatch();
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
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
  const { deviceId } = useSelector((state) => state.device);

  // Инициализация HLS плеера
  useEffect(() => {
    let hls = null;

    if (currentTrack && audioRef.current) {
      const audio = audioRef.current;
      
      // Если есть Hls.js и браузер поддерживает MSE
      if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(currentTrack.streamPath);
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
      else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
        audio.src = currentTrack.streamPath;
      }

      // Установить начальную позицию, если есть
      if (currentTime > 0) {
        audio.currentTime = currentTime;
      }
    }

    // Очистка при размонтировании
    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [currentTrack, isPlaying]);

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
    if (currentTime % 5 < 1 && user && currentTrack) {
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

  // Форматирование времени
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!currentTrack) return null;

  return (
    <div className="player">
      <div className="container">
        <div className="player-inner">
          <div className="player-track">
            {currentTrack.coverPath && (
              <img 
                src={`${process.env.REACT_APP_API_URL || ''}${currentTrack.coverPath}`} 
                alt={currentTrack.title} 
                className="player-cover"
              />
            )}
            <div className="player-track-info">
              <div className="player-track-title">{currentTrack.title}</div>
              <div className="player-track-artist">{currentTrack.artist}</div>
            </div>
          </div>

          <div className="player-controls-container">
            <div className="player-controls">
              <button onClick={handleToggleShuffle} className={isShuffled ? 'active' : ''}>
                <FaRandom />
              </button>
              <button onClick={handlePrevious}>
                <FaStepBackward />
              </button>
              <button onClick={togglePlay} className="play-btn">
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>
              <button onClick={handleNext}>
                <FaStepForward />
              </button>
              <button onClick={handleToggleLoop} className={isLooped ? 'active' : ''}>
                <FaRedoAlt />
              </button>
            </div>

            <div className="player-time">
              <span>{formatTime(currentTime)}</span>
              <div className="progress-bar" onClick={handleProgressClick}>
                <div ref={progressRef} className="progress"></div>
              </div>
              <span>{formatTime(currentTrack.duration || 0)}</span>
            </div>
          </div>

          <div className="player-volume">
            <button onClick={toggleMute}>
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

        <audio
          ref={audioRef}
          onTimeUpdate={updateProgress}
          onEnded={handleTrackEnded}
          onError={(e) => console.error('Ошибка аудио:', e)}
        />
      </div>

      <style jsx>{`
        .player-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .player-track {
          display: flex;
          align-items: center;
          width: 25%;
        }
        
        .player-cover {
          width: 60px;
          height: 60px;
          border-radius: 4px;
          margin-right: 15px;
          object-fit: cover;
        }
        
        .player-track-title {
          font-weight: bold;
          margin-bottom: 5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 200px;
        }
        
        .player-track-artist {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
        }
        
        .player-controls-container {
          width: 50%;
          text-align: center;
        }
        
        .player-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
        }
        
        .player-controls button {
          background: none;
          border: none;
          color: white;
          font-size: 16px;
          margin: 0 10px;
          cursor: pointer;
          padding: 5px;
        }
        
        .player-controls button.play-btn {
          font-size: 24px;
        }
        
        .player-controls button.active {
          color: #007bff;
        }
        
        .player-time {
          display: flex;
          align-items: center;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.8rem;
        }
        
        .progress-bar {
          height: 5px;
          background-color: #555;
          flex: 1;
          margin: 0 10px;
          position: relative;
          cursor: pointer;
          border-radius: 2px;
        }
        
        .progress {
          height: 100%;
          background-color: #007bff;
          width: 0;
          border-radius: 2px;
        }
        
        .player-volume {
          display: flex;
          align-items: center;
          width: 25%;
          justify-content: flex-end;
        }
        
        .player-volume button {
          background: none;
          border: none;
          color: white;
          margin-right: 10px;
          cursor: pointer;
          padding: 5px;
        }
        
        .volume-slider {
          width: 80px;
          height: 4px;
          cursor: pointer;
        }
        
        @media (max-width: 768px) {
          .player-inner {
            flex-direction: column;
            padding: 10px 0;
          }
          
          .player-track {
            width: 100%;
            margin-bottom: 10px;
          }
          
          .player-controls-container {
            width: 100%;
            margin-bottom: 10px;
          }
          
          .player-volume {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default Player; 