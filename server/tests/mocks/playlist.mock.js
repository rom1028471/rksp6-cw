const { mockTracks } = require('./track.mock');

const mockPlaylists = [
  {
    id: 1,
    name: 'Test Playlist 1',
    description: 'This is a test playlist',
    cover_path: '/uploads/covers/playlist-1.jpg',
    is_public: true,
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    tracks: [mockTracks[0], mockTracks[1]],
    toJSON: function() {
      return {
        id: this.id,
        name: this.name,
        description: this.description,
        cover_path: this.cover_path,
        is_public: this.is_public,
        userId: this.userId,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        tracks: this.tracks ? this.tracks.map(track => track.toJSON ? track.toJSON() : track) : []
      };
    }
  },
  {
    id: 2,
    name: 'Private Playlist',
    description: 'This is a private playlist',
    cover_path: '/uploads/covers/playlist-2.jpg',
    is_public: false,
    userId: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    tracks: [mockTracks[2]],
    toJSON: function() {
      return {
        id: this.id,
        name: this.name,
        description: this.description,
        cover_path: this.cover_path,
        is_public: this.is_public,
        userId: this.userId,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        tracks: this.tracks ? this.tracks.map(track => track.toJSON ? track.toJSON() : track) : []
      };
    }
  },
  {
    id: 3,
    name: 'Empty Playlist',
    description: 'This playlist has no tracks',
    cover_path: null,
    is_public: true,
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    tracks: [],
    toJSON: function() {
      return {
        id: this.id,
        name: this.name,
        description: this.description,
        cover_path: this.cover_path,
        is_public: this.is_public,
        userId: this.userId,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        tracks: []
      };
    }
  }
];

module.exports = {
  mockPlaylists
}; 