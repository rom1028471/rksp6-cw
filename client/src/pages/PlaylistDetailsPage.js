import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchPlaylistById } from '../store/slices/playlistsSlice';
import { setCurrentTrack, setCurrentPlaylist } from '../store/slices/playerSlice';
import { FaPlay, FaPause, FaEllipsisH } from 'react-icons/fa';

const PlaylistDetailsPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentPlaylist, loading } = useSelector((state) => state.playlists);
  const { currentTrack, isPlaying } = useSelector((state) => state.player);
  const [showOptions, setShowOptions] = useState(null);
  
  useEffect(() => {
    if (id) {
      dispatch(fetchPlaylistById(id));
    }
  }, [dispatch, id]);
  
  const handlePlayPlaylist = () => {
    if (currentPlaylist && currentPlaylist.tracks && currentPlaylist.tracks.length > 0) {
      dispatch(setCurrentPlaylist({
        playlist: {
          id: currentPlaylist.id,
          name: currentPlaylist.name
        },
        tracks: currentPlaylist.tracks
      }));
      dispatch(setCurrentTrack(currentPlaylist.tracks[0]));
    }
  };
  
  const handlePlayTrack = (track) => {
    if (currentPlaylist) {
      dispatch(setCurrentPlaylist({
        playlist: {
          id: currentPlaylist.id,
          name: currentPlaylist.name
        },
        tracks: currentPlaylist.tracks
      }));
    }
    dispatch(setCurrentTrack(track));
  };
  
  const handleToggleOptions = (trackId) => {
    setShowOptions(showOptions === trackId ? null : trackId);
  };

  if (loading) {
    return <div className="loading">Загрузка плейлиста...</div>;
  }

  if (!currentPlaylist) {
    return <div className="error">Плейлист не найден</div>;
  }

  return (
    <div className="playlist-details-page">
      <div className="playlist-header">
        <div className="playlist-cover">
          {currentPlaylist.coverPath ? (
            <img src={`${process.env.REACT_APP_API_URL || ''}${currentPlaylist.coverPath}`} alt={currentPlaylist.name} />
          ) : (
            <div className="placeholder-cover"></div>
          )}
        </div>
        
        <div className="playlist-info">
          <div className="playlist-type">Плейлист</div>
          <h1 className="playlist-name">{currentPlaylist.name}</h1>
          
          {currentPlaylist.description && (
            <div className="playlist-description">{currentPlaylist.description}</div>
          )}
          
          <div className="playlist-meta">
            <span className="user-name">{currentPlaylist.userName || 'Пользователь'}</span>
            <span className="separator">•</span>
            <span className="tracks-count">{currentPlaylist.tracks ? currentPlaylist.tracks.length : 0} треков</span>
            {currentPlaylist.totalDuration && (
              <>
                <span className="separator">•</span>
                <span className="duration">
                  {Math.floor(currentPlaylist.totalDuration / 60)} мин {currentPlaylist.totalDuration % 60} сек
                </span>
              </>
            )}
          </div>
          
          <div className="playlist-actions">
            <button 
              className="btn-play"
              onClick={handlePlayPlaylist}
              disabled={!currentPlaylist.tracks || currentPlaylist.tracks.length === 0}
            >
              {(isPlaying && currentTrack && currentPlaylist.tracks && 
                currentPlaylist.tracks.some(track => track.id === currentTrack.id)) ? (
                <FaPause />
              ) : (
                <FaPlay />
              )}
              {(isPlaying && currentTrack && currentPlaylist.tracks && 
                currentPlaylist.tracks.some(track => track.id === currentTrack.id)) ? 'Пауза' : 'Воспроизвести'}
            </button>
          </div>
        </div>
      </div>

      {currentPlaylist.tracks && currentPlaylist.tracks.length > 0 ? (
        <div className="playlist-tracks">
          <table className="tracks-table">
            <thead>
              <tr>
                <th className="track-number">#</th>
                <th className="track-info">Название</th>
                <th className="track-duration">Длительность</th>
                <th className="track-actions"></th>
              </tr>
            </thead>
            <tbody>
              {currentPlaylist.tracks.map((track, index) => (
                <tr 
                  key={track.id} 
                  className={`track-row ${currentTrack && currentTrack.id === track.id ? 'active' : ''}`}
                  onClick={() => handlePlayTrack(track)}
                >
                  <td className="track-number">
                    <span className="number">{index + 1}</span>
                    <button className="play-btn">
                      {currentTrack && currentTrack.id === track.id && isPlaying ? <FaPause /> : <FaPlay />}
                    </button>
                  </td>
                  <td className="track-info">
                    <div className="track-title">{track.title}</div>
                    <div className="track-artist">{track.artist}</div>
                  </td>
                  <td className="track-duration">
                    {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                  </td>
                  <td className="track-actions">
                    <button 
                      className="options-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleOptions(track.id);
                      }}
                    >
                      <FaEllipsisH />
                    </button>
                    
                    {showOptions === track.id && (
                      <div className="options-menu">
                        <button>Добавить в плейлист</button>
                        <button>Скачать</button>
                        <button>Поделиться</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-tracks">
          <p>В этом плейлисте пока нет треков</p>
        </div>
      )}

      <style>{`
        .playlist-details-page {
          padding-bottom: 40px;
        }
        
        .playlist-header {
          display: flex;
          gap: 30px;
          margin-bottom: 30px;
        }
        
        .playlist-cover {
          width: 250px;
          height: 250px;
          flex-shrink: 0;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }
        
        .playlist-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .placeholder-cover {
          width: 100%;
          height: 100%;
          background: linear-gradient(45deg, #e0e0e0, #f5f5f5);
        }
        
        .playlist-info {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .playlist-type {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }
        
        .playlist-name {
          font-size: 2.5rem;
          margin-bottom: 15px;
        }
        
        .playlist-description {
          font-size: 1rem;
          color: #666;
          margin-bottom: 15px;
        }
        
        .playlist-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          font-size: 0.9rem;
        }
        
        .separator {
          color: #999;
        }
        
        .playlist-actions {
          margin-top: 10px;
        }
        
        .btn-play {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        
        .btn-play:hover {
          background: #0069d9;
        }
        
        .btn-play:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        
        .tracks-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        
        .tracks-table thead {
          border-bottom: 1px solid #eee;
        }
        
        .tracks-table th {
          text-align: left;
          padding: 10px;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #999;
          font-weight: normal;
        }
        
        .track-row {
          border-bottom: 1px solid #eee;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .track-row:hover {
          background-color: #f8f9fa;
        }
        
        .track-row.active {
          background-color: #e8f0fe;
        }
        
        .track-row td {
          padding: 12px 10px;
        }
        
        .track-number {
          width: 50px;
          position: relative;
        }
        
        .track-number .number {
          display: block;
        }
        
        .track-number .play-btn {
          display: none;
          position: absolute;
          top: 50%;
          left: 10px;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          padding: 0;
        }
        
        .track-row:hover .number {
          display: none;
        }
        
        .track-row:hover .play-btn {
          display: block;
        }
        
        .track-row.active .number {
          display: none;
        }
        
        .track-row.active .play-btn {
          display: block;
          color: #007bff;
        }
        
        .track-title {
          font-weight: 500;
          margin-bottom: 3px;
        }
        
        .track-artist {
          font-size: 0.9rem;
          color: #666;
        }
        
        .track-duration {
          width: 80px;
          color: #666;
        }
        
        .track-actions {
          width: 50px;
          position: relative;
        }
        
        .options-btn {
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          padding: 5px;
          opacity: 0;
          transition: opacity 0.2s;
        }
        
        .track-row:hover .options-btn {
          opacity: 1;
        }
        
        .options-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border-radius: 4px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          z-index: 10;
          min-width: 180px;
        }
        
        .options-menu button {
          display: block;
          width: 100%;
          text-align: left;
          padding: 10px 15px;
          border: none;
          background: none;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .options-menu button:hover {
          background-color: #f8f9fa;
        }
        
        .no-tracks {
          padding: 40px;
          text-align: center;
          color: #666;
          background: #f9f9f9;
          border-radius: 6px;
        }
        
        @media (max-width: 768px) {
          .playlist-header {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          
          .playlist-cover {
            width: 200px;
            height: 200px;
          }
          
          .track-number {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default PlaylistDetailsPage; 