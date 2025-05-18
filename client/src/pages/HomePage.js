import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchTracks } from '../store/slices/tracksSlice';
import { fetchPlaylists } from '../store/slices/playlistsSlice';
import { setCurrentTrack } from '../store/slices/playerSlice';
import { FaPlay, FaHeadphones, FaMusic, FaList } from 'react-icons/fa';

const HomePage = () => {
  const dispatch = useDispatch();
  const { tracks, loading: tracksLoading } = useSelector((state) => state.tracks);
  const { playlists, loading: playlistsLoading } = useSelector((state) => state.playlists);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Загружаем последние 10 треков
    dispatch(fetchTracks({ limit: 10 }));
    
    // Загружаем последние 6 плейлистов
    dispatch(fetchPlaylists({ limit: 6 }));
  }, [dispatch]);

  const handlePlayTrack = (track) => {
    dispatch(setCurrentTrack(track));
  };

  return (
    <div className="home-page">
      <section className="welcome-section">
        <div className="welcome-content">
          <FaHeadphones size={48} className="welcome-icon" />
          <h1>Добро пожаловать в Аудио Стриминг</h1>
          <p>Слушайте любимую музыку в любом месте с синхронизацией между устройствами</p>
        </div>
      </section>

      <section className="latest-tracks">
        <div className="section-header">
          <h2><FaMusic /> Последние треки</h2>
          <Link to="/tracks" className="view-all">Смотреть все</Link>
        </div>

        {tracksLoading ? (
          <div className="loading">Загрузка треков...</div>
        ) : tracks.length > 0 ? (
          <div className="tracks-grid">
            {tracks.map((track) => (
              <div key={track.id} className="track-card">
                <div className="track-image">
                  {track.coverPath ? (
                    <img src={`${process.env.REACT_APP_API_URL || ''}${track.coverPath}`} alt={track.title} />
                  ) : (
                    <div className="placeholder-cover">
                      <FaMusic size={32} />
                    </div>
                  )}
                  <button 
                    className="play-button"
                    onClick={() => handlePlayTrack(track)}
                  >
                    <FaPlay />
                  </button>
                </div>
                <div className="track-info">
                  <div className="track-title">{track.title}</div>
                  <div className="track-artist">{track.artist}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-content">
            <p>Пока нет доступных треков</p>
            {user && (
              <Link to="/upload" className="btn btn-primary">
                Загрузить треки
              </Link>
            )}
          </div>
        )}
      </section>

      <section className="latest-playlists">
        <div className="section-header">
          <h2><FaList /> Плейлисты</h2>
          <Link to="/playlists" className="view-all">Смотреть все</Link>
        </div>

        {playlistsLoading ? (
          <div className="loading">Загрузка плейлистов...</div>
        ) : playlists.length > 0 ? (
          <div className="playlists-grid">
            {playlists.map((playlist) => (
              <Link to={`/playlists/${playlist.id}`} key={playlist.id} className="playlist-card">
                <div className="playlist-image">
                  {playlist.coverPath ? (
                    <img src={`${process.env.REACT_APP_API_URL || ''}${playlist.coverPath}`} alt={playlist.name} />
                  ) : (
                    <div className="placeholder-cover">
                      <FaList size={32} />
                    </div>
                  )}
                </div>
                <div className="playlist-info">
                  <div className="playlist-name">{playlist.name}</div>
                  <div className="playlist-tracks">{playlist.trackCount} треков</div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="no-content">
            <p>Пока нет доступных плейлистов</p>
            {user && (
              <Link to="/playlists/create" className="btn btn-primary">
                Создать плейлист
              </Link>
            )}
          </div>
        )}
      </section>

      <style jsx>{`
        .home-page {
          padding-bottom: 30px;
        }
        
        .welcome-section {
          background: linear-gradient(45deg, #4b6cb7, #182848);
          color: white;
          padding: 60px 0;
          margin-bottom: 30px;
          border-radius: 8px;
          text-align: center;
        }
        
        .welcome-content {
          max-width: 800px;
          margin: 0 auto;
        }
        
        .welcome-icon {
          margin-bottom: 20px;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        .welcome-content h1 {
          font-size: 2.5rem;
          margin-bottom: 15px;
        }
        
        .welcome-content p {
          font-size: 1.2rem;
          opacity: 0.9;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .section-header h2 {
          display: flex;
          align-items: center;
          font-size: 1.5rem;
        }
        
        .section-header h2 svg {
          margin-right: 10px;
        }
        
        .view-all {
          color: #007bff;
          font-weight: 500;
        }
        
        .latest-tracks,
        .latest-playlists {
          margin-bottom: 40px;
        }
        
        .tracks-grid,
        .playlists-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 20px;
        }
        
        .track-card,
        .playlist-card {
          background: white;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s, box-shadow 0.2s;
          display: block;
          color: inherit;
          text-decoration: none;
        }
        
        .track-card:hover,
        .playlist-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        
        .track-image,
        .playlist-image {
          height: 180px;
          position: relative;
          overflow: hidden;
        }
        
        .track-image img,
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
        
        .play-button {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0);
          background: rgba(0, 0, 0, 0.6);
          color: white;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          transition: transform 0.2s;
        }
        
        .track-image:hover .play-button {
          transform: translate(-50%, -50%) scale(1);
        }
        
        .track-info,
        .playlist-info {
          padding: 15px;
        }
        
        .track-title,
        .playlist-name {
          font-weight: 600;
          margin-bottom: 5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .track-artist,
        .playlist-tracks {
          color: #666;
          font-size: 0.9rem;
        }
        
        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
        }
        
        .no-content {
          text-align: center;
          padding: 40px;
          background: #f9f9f9;
          border-radius: 6px;
        }
        
        .no-content p {
          margin-bottom: 15px;
          color: #666;
        }
        
        @media (max-width: 768px) {
          .welcome-content h1 {
            font-size: 1.8rem;
          }
          
          .welcome-content p {
            font-size: 1rem;
          }
          
          .tracks-grid,
          .playlists-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 15px;
          }
          
          .track-image,
          .playlist-image {
            height: 140px;
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage; 