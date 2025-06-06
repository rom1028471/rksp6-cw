const mockUsers = [
  {
    id: 1,
    username: 'testuser1',
    email: 'testuser1@example.com',
    role: 'user',
    password: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
    avatar_path: null,
    lastActive: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    toJSON: function() {
      return {
        id: this.id,
        username: this.username,
        email: this.email,
        role: this.role,
        avatar_path: this.avatar_path,
        lastActive: this.lastActive,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      };
    },
    validatePassword: jest.fn().mockImplementation((password) => {
      return password === 'password123';
    })
  },
  {
    id: 2,
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    password: '$2a$10$abcdefghijklmnopqrstuvwxyz7890',
    avatar_path: '/uploads/avatars/admin.jpg',
    lastActive: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    toJSON: function() {
      return {
        id: this.id,
        username: this.username,
        email: this.email,
        role: this.role,
        avatar_path: this.avatar_path,
        lastActive: this.lastActive,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      };
    },
    validatePassword: jest.fn().mockImplementation((password) => {
      return password === 'admin123';
    })
  }
];

module.exports = {
  mockUsers
}; 