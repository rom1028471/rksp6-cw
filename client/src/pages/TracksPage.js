import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTracks } from '../store/slices/tracksSlice';
import { setCurrentTrack, setCurrentPlaylist, addToQueue } from '../store/slices/playerSlice';
import { FaPlay, FaEllipsisH, FaPlus, FaDownload, FaTrash, FaSearch } from 'react-icons/fa';

const TracksPage = () => {
  const dispatch = useDispatch();
  const { tracks, loading, pagination } = useSelector((state) => state.tracks);
  const { playlists } = useSelector((state) => state.playlists);
  const { user } = useSelector((state) => state.auth);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [showOptions, setShowOptions] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Фильтры
  const [filters, setFilters] = useState({
    genre: '',
    sort: 'newest'
  });

  useEffect(() => {
    loadTracks();
  }, [currentPage, filters]);

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    setSearchTimeout(
      setTimeout(() => {
        if (searchTerm) {
          setCurrentPage(1);
          loadTracks();
        }
      }, 500)
    );
    
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTerm]);

  const loadTracks = () => {
    const params = {
      page: currentPage,
      limit: 20,
      search: searchTerm,
      sort: filters.sort
    };
    
    if (filters.genre) {
      params.genre = filters.genre;
    }
    
    dispatch(fetchTracks(params));
  };

  const handlePlayTrack = (track) => {
    dispatch(setCurrentTrack(track));
  };

  const handleAddToQueue = (track) => {
    dispatch(addToQueue(track));
    setShowOptions(null);
  };

  const handleSortChange = (e) => {
    setFilters({
      ...filters,
      sort: e.target.value
    });
    setCurrentPage(1);
  };

  const handleGenreChange = (e) => {
    setFilters({
      ...filters,
      genre: e.target.value
    });
    setCurrentPage(1);
  };

  const handleOptionsClick = (trackId) => {
    setShowOptions(showOptions === trackId ? null : trackId);
  };

  const handlePageChange = (pageNum) => {
    setCurrentPage(pageNum);
  };

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      // Создаем временный плейлист из текущего набора треков
      const tempPlaylist = {
        id: 'temp',
        name: `${searchTerm ? `Поиск: ${searchTerm}` : 'Все треки'}`
      };
      
      dispatch(setCurrentPlaylist({
        playlist: tempPlaylist,
        tracks: [...tracks]
      }));
      
      // Начинаем воспроизведение с первого трека
      dispatch(setCurrentTrack(tracks[0]));
    }
  };

  // Формируем массив страниц для пагинации
  const getPaginationButtons = () => {
    const buttons = [];
    const totalPages = pagination.totalPages || 1;
    
    // Всегда показываем первую страницу
    buttons.push(1);
    
    if (currentPage > 3) {
      buttons.push('...');
    }
    
    // Текущая страница и одна до/после нее
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (buttons.indexOf(i) === -1) {
        buttons.push(i);
      }
    }
    
    if (currentPage < totalPages - 2) {
      buttons.push('...');
    }
    
    // Всегда показываем последнюю страницу, если страниц больше 1
    if (totalPages > 1) {
      buttons.push(totalPages);
    }
    
    return buttons;
  };

  return (
    <div className="tracks-page">
      <div className="tracks-header">
        <h1>Библиотека треков</h1>
        
        <button className="play-all-btn" onClick={handlePlayAll} disabled={tracks.length === 0}>
          <FaPlay /> Воспроизвести все
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Поиск треков..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              &times;
            </button>
          )}
        </div>
        
        <div className="filter-controls">
          <div className="filter-group">
            <label>Жанр:</label>
            <select value={filters.genre} onChange={handleGenreChange}>
              <option value="">Все жанры</option>
              <option value="rock">Рок</option>
              <option value="pop">Поп</option>
              <option value="electronic">Электронная</option>
              <option value="hip-hop">Хип-хоп</option>
              <option value="classical">Классическая</option>
              <option value="jazz">Джаз</option>
              <option value="other">Другое</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Сортировать по:</label>
            <select value={filters.sort} onChange={handleSortChange}>
              <option value="newest">Сначала новые</option>
              <option value="oldest">Сначала старые</option>
              <option value="popular">По популярности</option>
              <option value="title_asc">По названию (А-Я)</option>
              <option value="title_desc">По названию (Я-А)</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Загрузка треков...</div>
      ) : tracks.length > 0 ? (
        <>
          <ul className="tracks-list">
            {tracks.map((track) => (
              <li key={track.id} className="track-item">
                <div className="track-cover">
                  {track.coverPath ? (
                    <img src={`${process.env.REACT_APP_API_URL || ''}${track.coverPath}`} alt={track.title} />
                  ) : (
                    <div className="placeholder-cover"></div>
                  )}
                  <button 
                    className="track-play-btn"
                    onClick={() => handlePlayTrack(track)}
                  >
                    <FaPlay />
                  </button>
                </div>
                
                <div className="track-info">
                  <div className="track-title">{track.title}</div>
                  <div className="track-artist">{track.artist}</div>
                </div>
                
                <div className="track-duration">
                  {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                </div>
                
                <div className="track-options">
                  <button 
                    className="options-btn"
                    onClick={() => handleOptionsClick(track.id)}
                  >
                    <FaEllipsisH />
                  </button>
                  
                  {showOptions === track.id && (
                    <div className="options-menu">
                      <button onClick={() => handleAddToQueue(track)}>
                        <FaPlus /> Добавить в очередь
                      </button>
                      <button>
                        <FaDownload /> Скачать
                      </button>
                      {user && track.userId === user.id && (
                        <button className="delete-btn">
                          <FaTrash /> Удалить
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
          
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button 
                className="pagination-btn" 
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                &laquo;
              </button>
              
              {getPaginationButtons().map((page, index) => (
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
                ) : (
                  <button
                    key={page}
                    className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                )
              ))}
              
              <button 
                className="pagination-btn" 
                disabled={currentPage === pagination.totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                &raquo;
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="no-content">
          {searchTerm ? (
            <p>По запросу "{searchTerm}" ничего не найдено</p>
          ) : (
            <>
              <p>В библиотеке пока нет треков</p>
              {user && (
                <a href="/upload" className="btn btn-primary">
                  Загрузить треки
                </a>
              )}
            </>
          )}
        </div>
      )}

      <style jsx>{`
        .tracks-page {
          padding-bottom: 40px;
        }
        
        .tracks-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .tracks-header h1 {
          font-size: 1.8rem;
          margin: 0;
        }
        
        .play-all-btn {
          display: flex;
          align-items: center;
          background-color: #28a745;
        }
        
        .play-all-btn svg {
          margin-right: 8px;
        }
        
        .filters-bar {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          margin-bottom: 20px;
          gap: 15px;
        }
        
        .search-box {
          position: relative;
          flex: 1;
          min-width: 250px;
          display: flex;
          align-items: center;
          background: #f5f5f5;
          border-radius: 4px;
          overflow: hidden;
          padding: 0 15px;
        }
        
        .search-box svg {
          color: #666;
          margin-right: 10px;
        }
        
        .search-box input {
          flex: 1;
          border: none;
          background: transparent;
          padding: 12px 0;
          font-size: 1rem;
          outline: none;
        }
        
        .clear-search {
          background: none;
          border: none;
          color: #666;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0 5px;
        }
        
        .filter-controls {
          display: flex;
          gap: 15px;
        }
        
        .filter-group {
          display: flex;
          align-items: center;
        }
        
        .filter-group label {
          margin-right: 10px;
          white-space: nowrap;
        }
        
        .filter-group select {
          padding: 8px 30px 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          font-size: 0.9rem;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='4' viewBox='0 0 8 4'%3E%3Cpath fill='%23343a40' d='M0 0l4 4 4-4z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          cursor: pointer;
        }
        
        .tracks-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .track-item {
          display: flex;
          align-items: center;
          padding: 12px 15px;
          border-radius: 6px;
          background: white;
          margin-bottom: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: background-color 0.2s;
        }
        
        .track-item:hover {
          background-color: #f8f9fa;
        }
        
        .track-cover {
          width: 50px;
          height: 50px;
          border-radius: 4px;
          overflow: hidden;
          position: relative;
          margin-right: 15px;
          flex-shrink: 0;
        }
        
        .track-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .placeholder-cover {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #e0e0e0, #f5f5f5);
        }
        
        .track-play-btn {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.5);
          color: white;
          opacity: 0;
          border: none;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        
        .track-cover:hover .track-play-btn {
          opacity: 1;
        }
        
        .track-info {
          flex: 1;
          min-width: 0;
        }
        
        .track-title {
          font-weight: 600;
          margin-bottom: 3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .track-artist {
          color: #666;
          font-size: 0.9rem;
        }
        
        .track-duration {
          margin: 0 20px;
          color: #666;
          font-size: 0.9rem;
        }
        
        .track-options {
          position: relative;
        }
        
        .options-btn {
          background: none;
          border: none;
          color: #666;
          padding: 5px 10px;
          cursor: pointer;
          transition: color 0.2s;
        }
        
        .options-btn:hover {
          color: #333;
        }
        
        .options-menu {
          position: absolute;
          top: 100%;
          right: 0;
          min-width: 200px;
          background: white;
          border-radius: 4px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
          z-index: 10;
          overflow: hidden;
        }
        
        .options-menu button {
          display: flex;
          align-items: center;
          width: 100%;
          text-align: left;
          padding: 10px 15px;
          border: none;
          background: none;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .options-menu button svg {
          margin-right: 10px;
          font-size: 0.9rem;
        }
        
        .options-menu button:hover {
          background-color: #f8f9fa;
        }
        
        .options-menu .delete-btn {
          color: #dc3545;
        }
        
        .pagination {
          display: flex;
          justify-content: center;
          margin-top: 30px;
          gap: 5px;
        }
        
        .pagination-btn {
          min-width: 36px;
          height: 36px;
          border: 1px solid #dee2e6;
          background-color: white;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .pagination-btn:hover:not(:disabled) {
          background-color: #f8f9fa;
          border-color: #c6c7c8;
        }
        
        .pagination-btn.active {
          background-color: #007bff;
          border-color: #007bff;
          color: white;
        }
        
        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .pagination-ellipsis {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 36px;
          height: 36px;
          font-size: 0.9rem;
        }
        
        .no-content {
          text-align: center;
          padding: 50px 20px;
          background: #f9f9f9;
          border-radius: 6px;
        }
        
        .no-content p {
          margin-bottom: 20px;
          color: #666;
        }
        
        @media (max-width: 768px) {
          .filters-bar {
            flex-direction: column;
          }
          
          .filter-controls {
            width: 100%;
            flex-direction: column;
          }
          
          .track-item {
            flex-wrap: wrap;
          }
          
          .track-info {
            width: calc(100% - 65px);
            margin-right: 0;
          }
          
          .track-duration {
            margin-left: 65px;
            margin-top: 8px;
            margin-bottom: 0;
          }
          
          .track-options {
            margin-left: auto;
            margin-top: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default TracksPage; 