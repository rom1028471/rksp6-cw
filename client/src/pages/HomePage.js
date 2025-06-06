import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchTracks } from '../store/slices/tracksSlice';
import { setQueue } from '../store/slices/playerSlice';
import { FaPlay, FaHeadphones, FaMusic } from 'react-icons/fa';
import styles from './HomePage.module.css';

const HomePage = () => {
  const dispatch = useDispatch();
  const { tracks, loading: tracksLoading } = useSelector((state) => state.tracks);
  const { user } = useSelector((state) => state.auth);
  const baseApiUrl = (process.env.REACT_APP_API_URL || '').replace(/\/api$/, '');

  useEffect(() => {
    // Загружаем последние 10 треков
    dispatch(fetchTracks({ limit: 10 }));
  }, [dispatch]);

  const handlePlayTrack = (track) => {
    // Устанавливаем очередь воспроизведения из всех загруженных на странице треков,
    // начиная с выбранного
    dispatch(setQueue({ track, tracks }));
  };

  return (
    <div className={styles['home-page']}>
      <section className={styles['welcome-section']}>
        <div className={styles['welcome-content']}>
          <FaHeadphones size={48} className={styles['welcome-icon']} />
          <h1>Добро пожаловать в Аудио Стриминг</h1>
          <p>Слушайте любимую музыку в любом месте с синхронизацией между устройствами</p>
        </div>
      </section>

      <section className={styles['latest-tracks']}>
        <div className={styles['section-header']}>
          <h2><FaMusic /> Последние треки</h2>
          <Link to="/tracks" className={styles['view-all']}>Смотреть все</Link>
        </div>

        {tracksLoading ? (
          <div className={styles.loading}>Загрузка треков...</div>
        ) : tracks.length > 0 ? (
          <div className={styles['tracks-grid']}>
            {tracks.map((track) => (
              <div key={track.id} className={styles['track-card']}>
                <div className={styles['track-image']}>
                  {track.cover_path ? (
                    <img src={`${baseApiUrl}${track.cover_path}`} alt={track.title} />
                  ) : (
                    <div className={styles['placeholder-cover']}>
                      <FaMusic size={32} />
                    </div>
                  )}
                  <button 
                    className={styles['play-button']}
                    onClick={() => handlePlayTrack(track)}
                  >
                    <FaPlay />
                  </button>
                </div>
                <div className={styles['track-info']}>
                  <div className={styles['track-title']}>{track.title}</div>
                  <div className={styles['track-artist']}>{track.user.username}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles['no-content']}>
            <p>Пока нет доступных треков</p>
            {user && (
              <Link to="/upload" className="btn btn-primary">
                Загрузить треки
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage; 