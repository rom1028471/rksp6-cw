import React, { useEffect } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { checkAuth } from './store/slices/authSlice';

// Импорт страниц
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import PlaylistsPage from './pages/PlaylistsPage';
import PlaylistDetailsPage from './pages/PlaylistDetailsPage';
import TracksPage from './pages/TracksPage';
import ProfilePage from './pages/ProfilePage';
import UploadPage from './pages/UploadPage';

// Импорт компонентов
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

const App = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  if (loading) {
    return <div className="loading-screen">Загрузка...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
      <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" />} />
      
      <Route path="/" element={<Layout />}>
        <Route index element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="playlists" element={<PrivateRoute><PlaylistsPage /></PrivateRoute>} />
        <Route path="playlists/:id" element={<PrivateRoute><PlaylistDetailsPage /></PrivateRoute>} />
        <Route path="tracks" element={<PrivateRoute><TracksPage /></PrivateRoute>} />
        <Route path="upload" element={<PrivateRoute><UploadPage /></PrivateRoute>} />
        <Route path="profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
      </Route>

      <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
    </Routes>
  );
};

export default App; 