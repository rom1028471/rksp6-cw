import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { FaPlay, FaSearch, FaEllipsisH, FaTrash, FaDownload } from 'react-icons/fa';
import { fetchTracks, resetTracks, deleteTrack } from '../store/slices/tracksSlice';
import { setQueue } from '../store/slices/playerSlice';
import trackService from '../services/trackService';
import styles from './TracksPage.module.css';

// Новый компонент для безопасной загрузки обложек
const CoverImage = ({ src, alt, fallbackSrc }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    if (!hasError) {
      setImgSrc(fallbackSrc);
      setHasError(true);
    }
  };

  return <img src={imgSrc} alt={alt} onError={handleError} />;
};

const TracksPage = () => {
  const dispatch = useDispatch();
  const { tracks, loading, error, hasMore, page } = useSelector((state) => state.tracks);
  const { user } = useSelector((state) => state.auth);

  const [searchTerm, setSearchTerm] = useState('');
  const [genre, setGenre] = useState('');
  const [sort, setSort] = useState('newest');
  const [filter, setFilter] = useState('');
  
  const [showOptions, setShowOptions] = useState(null);
  
  const searchTimeoutRef = useRef(null);
  const isInitialMount = useRef(true);
  const baseApiUrl = (process.env.REACT_APP_API_URL || '').replace(/\/api$/, '');

  const staticGenres = [
    { value: 'rock', label: 'Рок' },
    { value: 'pop', label: 'Поп' },
    { value: 'electronic', label: 'Электронная' },
    { value: 'hip-hop', label: 'Хип-хоп' },
    { value: 'classical', label: 'Классическая' },
    { value: 'jazz', label: 'Джаз' },
    { value: 'other', label: 'Другое' },
  ];

  // Обработчик изменения фильтра "Только мои"
  const handleFilterChange = (event) => {
    const isChecked = event.target.checked;
    const newFilter = isChecked ? 'my' : '';
    console.log(`Изменен фильтр "Только мои": ${isChecked ? 'включен' : 'выключен'}`);
    setFilter(newFilter);
  };

  const getRequestParams = useCallback(() => {
    let params = { 
      search: searchTerm, 
      genre,
      sort 
    };
    
    // Добавляем параметр filter только если выбран фильтр "только мои"
    if (filter === 'my') {
      params.filter = 'my';
      console.log('Применен фильтр "Только мои треки"');
    }
    
    console.log('Итоговые параметры запроса:', params);
    return params;
  }, [searchTerm, filter, genre, sort]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      console.log('Первичная загрузка треков');
      dispatch(fetchTracks({ page: 1, ...getRequestParams() }));
      return;
    }

    console.log('Обновление фильтров, применяем:', { 
      search: searchTerm, 
      filter, 
      genre, 
      sort 
    });

    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      dispatch(resetTracks());
      dispatch(fetchTracks({ page: 1, ...getRequestParams() }));
    }, 500);

  }, [dispatch, getRequestParams]);

  const handlePlayTrack = (trackToPlay) => {
    dispatch(setQueue({ tracks, track: trackToPlay }));
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      dispatch(fetchTracks({ page: page + 1, ...getRequestParams() }));
    }
  };

  const handleDeleteTrack = async (trackId) => {
    if (window.confirm('Вы действительно хотите удалить этот трек?')) {
      try {
        const resultAction = await dispatch(deleteTrack(trackId));
        
        if (deleteTrack.fulfilled.match(resultAction)) {
          setShowOptions(null);
          // Обновляем список с текущими фильтрами
          dispatch(resetTracks());
          dispatch(fetchTracks({ page: 1, ...getRequestParams() }));
        } else {
          console.error('Ошибка при удалении трека:', resultAction.error);
          alert(`Не удалось удалить трек: ${resultAction.payload || 'Нет доступа к ресурсу'}`);
        }
      } catch (error) {
        console.error('Ошибка при удалении трека:', error);
        alert('Не удалось удалить трек.');
      }
    }
  };

  const handleDownloadTrack = (track) => {
    // trackService не нужен для скачивания, если есть прямой путь
    const fileUrl = `${baseApiUrl}${track.file_path}`;
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = `${track.artist} - ${track.title}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowOptions(null);
  };

  return (
    <div className={styles['tracks-page-container']}>
      <header className={styles['tracks-header']}>
        <h1>Библиотека</h1>
        <div className={styles.controls}>
          <div className={styles['search-box']}>
            <FaSearch className={styles['search-icon']} />
            <input
              type="text"
              placeholder="Поиск по названию или исполнителю..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className={styles['filter-controls']}>
        <div className={styles['filter-group']}>
          <label>Жанр:</label>
          <select value={genre} onChange={(e) => setGenre(e.target.value)}>
            <option value="">Все жанры</option>
            {staticGenres.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </div>
        
        <div className={styles['filter-group']}>
          <label>Сортировать по:</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Сначала новые</option>
            <option value="oldest">Сначала старые</option>
            <option value="popular">По популярности</option>
            <option value="title_asc">По названию (А-Я)</option>
            <option value="title_desc">По названию (Я-А)</option>
          </select>
        </div>

        {user && (
          <div className={styles['filter-group']}>
            <label className={styles['checkbox-label']}>
              <input
                type="checkbox"
                checked={filter === 'my'}
                onChange={handleFilterChange}
              />
              Только мои
            </label>
          </div>
        )}
      </div>

      {loading && page === 1 && <div className={styles.message}>Загрузка...</div>}
      {error && <div className={`${styles.message} ${styles.error}`}>Ошибка загрузки треков: {error}</div>}
      {!loading && tracks.length === 0 && <div className={styles.message}>Треки не найдены.</div>}

      <table className={styles['tracks-table']}>
        <thead>
          <tr>
            <th className={styles['cover-col']}></th>
            <th>Название</th>
            <th>Исполнитель</th>
            <th>Жанр</th>
            <th>Автор</th>
            <th className={styles['actions-col']}></th>
          </tr>
        </thead>
        <tbody>
          {tracks.map((track) => (
            <tr key={track.id} className={styles['track-row']}>
              <td className={styles['cover-col']}>
                <div className={styles['track-cover']}>
                  <CoverImage
                    src={track.cover_path && track.cover_path.trim().length > 0 ? `${baseApiUrl}${track.cover_path}` : '/default-cover.jpg'}
                    alt={track.title}
                    fallbackSrc="/default-cover.jpg"
                  />
                  <button className={styles['play-btn']} onClick={() => handlePlayTrack(track)}>
                    <FaPlay />
                  </button>
                </div>
              </td>
              <td>{track.title}</td>
              <td>{track.artist}</td>
              <td>{track.genre || '-'}</td>
              <td>
                <Link to={`/profile/${track.user.id}`} className={styles['author-link']}>
                  {track.user.username}
                </Link>
              </td>
              <td className={styles['actions-col']}>
                <div className={styles['track-actions']}>
                  <button className={styles['options-btn']} onClick={() => setShowOptions(showOptions === track.id ? null : track.id)}>
                    <FaEllipsisH />
                  </button>
                  {showOptions === track.id && (
                    <div className={styles['options-menu']}>
                      <button onClick={() => handleDownloadTrack(track)}><FaDownload /> Скачать</button>
                      {user && user.id === track.user_id && (
                        <button className={`${styles.delete} delete`} onClick={() => handleDeleteTrack(track.id)}><FaTrash /> Удалить</button>
                      )}
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {hasMore && !loading && (
        <button onClick={handleLoadMore} disabled={loading} className={styles['load-more-btn']}>
          {loading ? 'Загрузка...' : 'Загрузить еще'}
        </button>
      )}
    </div>
  );
};

export default TracksPage;