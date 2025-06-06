import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { uploadTrack } from '../store/slices/tracksSlice';
import { FaUpload, FaMusic, FaImage, FaTrash } from 'react-icons/fa';
import styles from './UploadPage.module.css'; // Import CSS module

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
    <div className={styles.uploadPage}>
      <div className={styles.uploadContainer}>
        <div className={styles.uploadHeader}>
          <h1>Загрузить трек</h1>
        </div>
        
        {formError && <div className="error-message">{formError}</div>}
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className={styles.uploadGrid}>
            <div className={styles.uploadInfo}>
              <div className={styles.formGroup}>
                <label>Название трека *</label>
                <input 
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Введите название трека"
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Исполнитель *</label>
                <input 
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="Введите имя исполнителя"
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
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
              
              <div className={styles.formGroup}>
                <label>Описание (опционально)</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Добавьте описание трека"
                  rows={4}
                />
              </div>
              
              <div className={`${styles.formGroup} ${styles.checkboxGroup}`}>
                <label className={styles.checkboxLabel}>
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
            
            <div className={styles.uploadMedia}>
              <div className={styles.audioUploadContainer}>
                <div className={styles.formGroup}>
                  <label>Аудио файл *</label>
                  <div className={styles.fileUpload}>
                    <input 
                      type="file"
                      id="audio-file"
                      accept="audio/*"
                      onChange={handleAudioSelect}
                      className={styles.fileInput}
                      required
                    />
                    <label htmlFor="audio-file" className={styles.fileLabel}>
                      <FaMusic className={styles.fileIcon} />
                      <span>Выбрать аудио файл</span>
                    </label>
                  </div>
                  {audioName && (
                    <div className={styles.selectedFile}>
                      <FaMusic className={styles.fileTypeIcon} />
                      <span>{audioName}</span>
                    </div>
                  )}
                  <small>Поддерживаемые форматы: MP3, WAV, FLAC (до 50MB)</small>
                </div>
                
                <div className={styles.formGroup}>
                  <label>Обложка (опционально)</label>
                  <div className={styles.coverUpload}>
                    {coverPreview ? (
                      <div className={styles.coverPreview}>
                        <img src={coverPreview} alt="Предпросмотр обложки" />
                        <button 
                          type="button"
                          onClick={handleRemoveCover}
                          className={styles.btnCancel}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ) : (
                      <div className={styles.fileUpload}>
                        <input 
                          type="file"
                          id="cover-file"
                          accept="image/*"
                          onChange={handleCoverSelect}
                          className={styles.fileInput}
                        />
                        <label htmlFor="cover-file" className={styles.fileLabel}>
                          <FaImage className={styles.fileIcon} />
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
            <div className={styles.uploadProgress}>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressBarFill}
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <div className={styles.progressText}>{uploadProgress}%</div>
            </div>
          )}
          
          <div className={styles.formActions}>
            <button 
              type="button" 
              className={styles.btnCancel}
              onClick={() => navigate('/tracks')}
            >
              Отмена
            </button>
            <button 
              type="submit" 
              className={styles.btnPrimary}
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
    </div>
  );
};

export default UploadPage; 