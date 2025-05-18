import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchPlaylists, createPlaylist } from '../store/slices/playlistsSlice';
import { FaPlus, FaPlay, FaList, FaEllipsisV } from 'react-icons/fa';

const PlaylistsPage = () => {
  const dispatch = useDispatch();
  const { playlists, loading } = useSelector((state) => state.playlists);
  const { user } = useSelector((state) => state.auth);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [filter, setFilter] = useState('all'); // all, my, favorites
  
  useEffect(() => {
    dispatch(fetchPlaylists({
      filter: filter !== 'all' ? filter : undefined
    }));
  }, [dispatch, filter]);
  
  const handleCreatePlaylist = (e) => {
    e.preventDefault();
    
    if (!newPlaylistName.trim()) return;
    
    dispatch(createPlaylist({
      name: newPlaylistName,
      description: newPlaylistDescription,
    })).then(() => {
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      setIsCreating(false);
    });
  };
  
  const handleCancelCreate = () => {
    setNewPlaylistName('');
    setNewPlaylistDescription('');
    setIsCreating(false);
  };
  
  const filteredPlaylists = playlists.filter(playlist => {
    if (filter === 'my') {
      return user && playlist.userId === user.id;
    } else if (filter === 'favorites') {
      return playlist.isFavorite;
    }
    return true;
  });

  return (
    <div className="playlists-page">
      <div className="playlists-header">
        <h1>Плейлисты</h1>
        
        <button 
          className="btn-primary create-playlist-btn"
          onClick={() => setIsCreating(true)}
        >
          <FaPlus /> Создать плейлист
        </button>
      </div>
      
      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Все плейлисты
        </button>
        <button 
          className={`filter-tab ${filter === 'my' ? 'active' : ''}`}
          onClick={() => setFilter('my')}
        >
          Мои плейлисты
        </button>
        <button 
          className={`filter-tab ${filter === 'favorites' ? 'active' : ''}`}
          onClick={() => setFilter('favorites')}
        >
          Избранное
        </button>
      </div>
      
      {isCreating && (
        <div className="create-playlist-form">
          <h2>Создать новый плейлист</h2>
          <form onSubmit={handleCreatePlaylist}>
            <div className="form-group">
              <label>Название</label>
              <input 
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Введите название плейлиста"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Описание (опционально)</label>
              <textarea 
                value={newPlaylistDescription}
                onChange={(e) => setNewPlaylistDescription(e.target.value)}
                placeholder="Добавьте описание"
                rows={3}
              />
            </div>
            
            <div className="form-buttons">
              <button type="button" className="btn-cancel" onClick={handleCancelCreate}>
                Отмена
              </button>
              <button type="submit" className="btn-primary">
                Создать
              </button>
            </div>
          </form>
        </div>
      )}
      
      {loading ? (
        <div className="loading">Загрузка плейлистов...</div>
      ) : filteredPlaylists.length > 0 ? (
        <div className="playlists-grid">
          {filteredPlaylists.map((playlist) => (
            <div key={playlist.id} className="playlist-card">
              <div className="playlist-image">
                {playlist.coverPath ? (
                  <img src={`${process.env.REACT_APP_API_URL || ''}${playlist.coverPath}`} alt={playlist.name} />
                ) : (
                  <div className="placeholder-cover">
                    <FaList size={32} />
                  </div>
                )}
                <Link to={`/playlists/${playlist.id}`} className="playlist-overlay">
                  <button className="play-button">
                    <FaPlay />
                  </button>
                </Link>
              </div>
              <div className="playlist-info">
                <Link to={`/playlists/${playlist.id}`} className="playlist-name">{playlist.name}</Link>
                <div className="playlist-meta">
                  <span>{playlist.trackCount} треков</span>
                  <span>•</span>
                  <span>{playlist.username || 'Пользователь'}</span>
                </div>
                {playlist.description && (
                  <div className="playlist-description">{playlist.description}</div>
                )}
              </div>
              <div className="playlist-actions">
                <button className="action-btn">
                  <FaEllipsisV />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-content">
          {filter === 'my' ? (
            <p>У вас пока нет плейлистов. Создайте свой первый плейлист!</p>
          ) : filter === 'favorites' ? (
            <p>У вас пока нет избранных плейлистов</p>
          ) : (
            <p>Плейлисты не найдены</p>
          )}
        </div>
      )}

      <style>{`
        .playlists-page {
          padding-bottom: 30px;
        }
        
        .playlists-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .filter-tabs {
          display: flex;
          margin-bottom: 20px;
          border-bottom: 1px solid #eee;
        }
        
        .filter-tab {
          padding: 10px 20px;
          background: none;
          border: none;
          cursor: pointer;
          font-weight: 500;
          color: #666;
          position: relative;
        }
        
        .filter-tab.active {
          color: #007bff;
        }
        
        .filter-tab.active:after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 100%;
          height: 2px;
          background: #007bff;
        }
        
        .create-playlist-form {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .create-playlist-form h2 {
          font-size: 1.5rem;
          margin-bottom: 15px;
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
        }
        
        .form-group input, 
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .form-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        
        .btn-cancel {
          padding: 8px 16px;
          background: none;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .create-playlist-btn {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .playlists-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
        }
        
        .playlist-card {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
        }
        
        .playlist-image {
          height: 150px;
          position: relative;
        }
        
        .playlist-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .placeholder-cover {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(45deg, #e0e0e0, #f5f5f5);
          color: #999;
        }
        
        .playlist-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s;
        }
        
        .playlist-image:hover .playlist-overlay {
          opacity: 1;
        }
        
        .play-button {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          transition: transform 0.2s;
        }
        
        .play-button:hover {
          transform: scale(1.1);
        }
        
        .playlist-info {
          padding: 15px;
          flex: 1;
        }
        
        .playlist-name {
          font-weight: 600;
          margin-bottom: 5px;
          display: block;
          color: inherit;
          text-decoration: none;
        }
        
        .playlist-meta {
          display: flex;
          color: #666;
          font-size: 0.8rem;
          margin-bottom: 8px;
          gap: 5px;
        }
        
        .playlist-description {
          font-size: 0.9rem;
          color: #333;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .playlist-actions {
          padding: 10px 15px;
          border-top: 1px solid #eee;
          display: flex;
          justify-content: flex-end;
        }
        
        .action-btn {
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          padding: 5px;
        }
        
        .no-content {
          text-align: center;
          padding: 50px;
          background: #f9f9f9;
          border-radius: 8px;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default PlaylistsPage; 