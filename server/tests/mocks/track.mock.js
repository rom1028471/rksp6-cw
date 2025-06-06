const mockTracks = [
  {
    id: 1,
    title: 'Test Track 1',
    artist: 'Test Artist',
    genre: 'Rock',
    description: 'This is a test track',
    duration: 180, // 3 minutes
    file_path: '/uploads/tracks/test-track-1.mp3',
    stream_path: '/streams/test-track-1',
    cover_path: '/uploads/covers/test-track-1.jpg',
    play_count: 10,
    is_public: true,
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    toJSON: function() {
      return {
        id: this.id,
        title: this.title,
        artist: this.artist,
        genre: this.genre,
        description: this.description,
        duration: this.duration,
        file_path: this.file_path,
        stream_path: this.stream_path,
        cover_path: this.cover_path,
        play_count: this.play_count,
        is_public: this.is_public,
        userId: this.userId,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      };
    }
  },
  {
    id: 2,
    title: 'Test Track 2',
    artist: 'Another Artist',
    genre: 'Pop',
    description: 'Another test track',
    duration: 240, // 4 minutes
    file_path: '/uploads/tracks/test-track-2.mp3',
    stream_path: '/streams/test-track-2',
    cover_path: '/uploads/covers/test-track-2.jpg',
    play_count: 5,
    is_public: true,
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    toJSON: function() {
      return {
        id: this.id,
        title: this.title,
        artist: this.artist,
        genre: this.genre,
        description: this.description,
        duration: this.duration,
        file_path: this.file_path,
        stream_path: this.stream_path,
        cover_path: this.cover_path,
        play_count: this.play_count,
        is_public: this.is_public,
        userId: this.userId,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      };
    }
  },
  {
    id: 3,
    title: 'Private Track',
    artist: 'Secret Artist',
    genre: 'Electronic',
    description: 'This is a private track',
    duration: 300, // 5 minutes
    file_path: '/uploads/tracks/private-track.mp3',
    stream_path: '/streams/private-track',
    cover_path: '/uploads/covers/private-track.jpg',
    play_count: 2,
    is_public: false,
    userId: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    toJSON: function() {
      return {
        id: this.id,
        title: this.title,
        artist: this.artist,
        genre: this.genre,
        description: this.description,
        duration: this.duration,
        file_path: this.file_path,
        stream_path: this.stream_path,
        cover_path: this.cover_path,
        play_count: this.play_count,
        is_public: this.is_public,
        userId: this.userId,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      };
    }
  }
];

module.exports = {
  mockTracks
}; 