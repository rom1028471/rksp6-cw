import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { uploadTrack } from '../store/slices/tracksSlice';
import { FaUpload, FaMusic, FaImage, FaTrash } from 'react-icons/fa';

const UploadPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.tracks);
  
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [genre, setGenre] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [audioName, setAudioName] = useState('');
  
  const [formError, setFormError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const handleAudioSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Проверка типа файла (аудио)
    if (!file.type.startsWith('audio/')) {
      setFormError('Пожалуйста, выберите аудио файл.');
      return;
    }
    
    setAudioFile(file);
    setAudioName(file.name);
    // Попытаемся извлечь название и исполнителя из имени файла
    const nameParts = file.name.replace(/\.[^/.]+$/, '').split('-');
    if (nameParts.length >= 2) {
      if (!artist) setArtist(nameParts[0].trim());
      if (!title) setTitle(nameParts[1].trim());
    } else {
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
    setFormError('');
  };
  
  const handleCoverSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Проверка типа файла (изображение)
    if (!file.type.startsWith('image/')) {
      setFormError('Пожалуйста, выберите файл изображения для обложки.');
      return;
    }
    
    setCoverFile(file);
    
    // Создаем превью
    const reader = new FileReader();
    reader.onload = (e) => {
      setCoverPreview(e.target.result);
    };
    reader.readAsDataURL(file);
    setFormError('');
  };
  
  const handleRemoveCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    // Проверка обязательных полей
    if (!title || !artist || !genre || !audioFile) {
      setFormError('Пожалуйста, заполните все обязательные поля и выберите аудио файл.');
      return;
    }
    
    // Создаем объект данных формы
    const formData = new FormData();
    formData.append('title', title);
    formData.append('artist', artist);
    formData.append('genre', genre);
    formData.append('description', description);
    formData.append('isPublic', isPublic.toString()); // Убедимся, что отправляем строку
    formData.append('audio', audioFile);
    
    if (coverFile) {
      formData.append('cover', coverFile);
    }
    
    // Логируем FormData перед отправкой
    console.log('Подготовлена FormData для отправки:');
    for (let [key, value] of formData.entries()) {
      if (key === 'audio' || key === 'cover') {
        console.log(key, value.name, value.type, value.size);
      } else {
        console.log(key, value);
      }
    }
    
    try {
      console.log('Начинаем загрузку трека...');
      await dispatch(uploadTrack({
        formData,
        onProgress: (progress) => {
          console.log(`Прогресс загрузки: ${progress}%`);
          setUploadProgress(progress);
        }
      })).unwrap();
      
      console.log('Трек успешно загружен');
      // Перенаправляем на страницу треков после успешной загрузки
      navigate('/tracks');
    } catch (err) {
      console.error('Ошибка при загрузке трека:', err);
      setFormError(err.message || 'Ошибка при загрузке трека. Пожалуйста, попробуйте снова.');
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-container">
        <div className="upload-header">
          <h1>Загрузить трек</h1>
        </div>
        
        {formError && <div className="error-message">{formError}</div>}
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="upload-grid">
            <div className="upload-info">
              <div className="form-group">
                <label>Название трека *</label>
                <input 
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Введите название трека"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Исполнитель *</label>
                <input 
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="Введите имя исполнителя"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Жанр *</label>
                <select 
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  required
                >
                  <option value="">Выберите жанр</option>
                  <option value="rock">Рок</option>
                  <option value="pop">Поп</option>
                  <option value="electronic">Электронная</option>
                  <option value="hip-hop">Хип-хоп</option>
                  <option value="classical">Классическая</option>
                  <option value="jazz">Джаз</option>
                  <option value="other">Другое</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Описание (опционально)</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Добавьте описание трека"
                  rows={4}
                />
              </div>
              
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                  />
                  <span>Публичный трек</span>
                </label>
                <small>Публичные треки доступны всем пользователям</small>
              </div>
            </div>
            
            <div className="upload-media">
              <div className="audio-upload-container">
                <div className="form-group">
                  <label>Аудио файл *</label>
                  <div className="file-upload">
                    <input 
                      type="file"
                      id="audio-file"
                      accept="audio/*"
                      onChange={handleAudioSelect}
                      className="file-input"
                      required
                    />
                    <label htmlFor="audio-file" className="file-label">
                      <FaMusic className="file-icon" />
                      <span>Выбрать аудио файл</span>
                    </label>
                  </div>
                  {audioName && (
                    <div className="selected-file">
                      <FaMusic className="file-type-icon" />
                      <span>{audioName}</span>
                    </div>
                  )}
                  <small>Поддерживаемые форматы: MP3, WAV, FLAC (до 50MB)</small>
                </div>
                
                <div className="form-group">
                  <label>Обложка (опционально)</label>
                  <div className="cover-upload">
                    {coverPreview ? (
                      <div className="cover-preview">
                        <img src={coverPreview} alt="Предпросмотр обложки" />
                        <button 
                          type="button"
                          onClick={handleRemoveCover}
                          className="remove-cover-btn"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ) : (
                      <div className="file-upload">
                        <input 
                          type="file"
                          id="cover-file"
                          accept="image/*"
                          onChange={handleCoverSelect}
                          className="file-input"
                        />
                        <label htmlFor="cover-file" className="file-label">
                          <FaImage className="file-icon" />
                          <span>Выбрать изображение</span>
                        </label>
                      </div>
                    )}
                  </div>
                  <small>Рекомендуемый размер: 500 x 500 пикселей, формат JPG или PNG</small>
                </div>
              </div>
            </div>
          </div>
          
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div 
                  className="progress-bar-fill"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <div className="progress-text">{uploadProgress}%</div>
            </div>
          )}
          
          <div className="form-actions">
            <button 
              type="button" 
              className="btn-cancel"
              onClick={() => navigate('/tracks')}
            >
              Отмена
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>Загрузка...</>
              ) : (
                <>
                  <FaUpload /> Загрузить трек
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .upload-page {
          padding-bottom: 40px;
        }
        
        .upload-container {
          max-width: 1000px;
          margin: 0 auto;
        }
        
        .upload-header {
          margin-bottom: 30px;
        }
        
        .upload-header h1 {
          margin: 0;
        }
        
        .error-message {
          background: #f8d7da;
          color: #721c24;
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 20px;
        }
        
        .upload-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
        }
        
        .upload-info,
        .upload-media {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 20px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-group:last-child {
          margin-bottom: 0;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .form-group textarea {
          resize: vertical;
        }
        
        .form-group small {
          display: block;
          color: #999;
          margin-top: 5px;
          font-size: 0.8rem;
        }
        
        .checkbox-group {
          margin-top: 30px;
        }
        
        .checkbox-label {
          display: flex;
          align-items: center;
          cursor: pointer;
          margin-bottom: 8px;
        }
        
        .checkbox-label input {
          margin-right: 10px;
          width: auto;
        }
        
        .file-upload {
          position: relative;
        }
        
        .file-input {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }
        
        .file-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 30px;
          border: 2px dashed #ddd;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .file-label:hover {
          border-color: #aaa;
        }
        
        .file-icon {
          font-size: 2rem;
          margin-bottom: 10px;
          color: #666;
        }
        
        .selected-file {
          display: flex;
          align-items: center;
          margin-top: 15px;
          padding: 10px;
          background: #f5f5f5;
          border-radius: 4px;
        }
        
        .file-type-icon {
          margin-right: 10px;
          color: #666;
        }
        
        .cover-preview {
          position: relative;
          width: 100%;
          height: 200px;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .cover-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .remove-cover-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          color: #dc3545;
        }
        
        .upload-progress {
          margin-bottom: 20px;
        }
        
        .progress-bar {
          height: 8px;
          background: #eee;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 5px;
        }
        
        .progress-bar-fill {
          height: 100%;
          background: #007bff;
          transition: width 0.2s;
        }
        
        .progress-text {
          text-align: right;
          font-size: 0.9rem;
          color: #666;
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 15px;
        }
        
        .btn-cancel {
          padding: 10px 20px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: none;
          cursor: pointer;
        }
        
        .btn-primary {
          padding: 10px 20px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .btn-primary:hover {
          background: #0069d9;
        }
        
        .btn-primary:disabled {
          background: #74b1f9;
          cursor: not-allowed;
        }
        
        @media (max-width: 768px) {
          .upload-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default UploadPage; 