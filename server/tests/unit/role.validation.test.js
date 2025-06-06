const jwt = require('jsonwebtoken');
const config = require('../../src/config');
const { roleMiddleware, ownerMiddleware, checkAuth } = require('../../src/middleware/auth.middleware');
const { User, Track } = require('../../src/models');

// Mock express response
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Auth Middleware Role Validation', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      params: {}
    };
    res = mockResponse();
    next = jest.fn();
  });

  describe('checkAuth Middleware', () => {
    test('should return 401 when no authorization header is provided', () => {
      const middleware = checkAuth();
      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Требуется авторизация'
      }));
    });

    test('should return 401 when token format is invalid', () => {
      req.headers.authorization = 'InvalidFormat token123';
      const middleware = checkAuth();
      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 401 when token is expired', () => {
      // Create an expired token
      const token = jwt.sign(
        { userId: 1, role: 'user' }, 
        config.jwt.secret, 
        { expiresIn: '-1s' }
      );
      
      req.headers.authorization = `Bearer ${token}`;
      const middleware = checkAuth();
      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should proceed when auth is optional and no token provided', () => {
      const middleware = checkAuth({ required: false });
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    test('should set user data from valid token', () => {
      const userData = { userId: 1, role: 'user' };
      const token = jwt.sign(userData, config.jwt.secret);
      
      req.headers.authorization = `Bearer ${token}`;
      const middleware = checkAuth();
      middleware(req, res, next);
      
      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe(userData.userId);
      expect(req.user.role).toBe(userData.role);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('roleMiddleware', () => {
    test('should return 403 when user role is not in allowed roles', () => {
      req.user = { role: 'user' };
      const middleware = roleMiddleware(['admin']);
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Нет доступа'
      }));
    });

    test('should return 403 when user object is missing', () => {
      const middleware = roleMiddleware(['user', 'admin']);
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('should proceed when user role is in allowed roles', () => {
      req.user = { role: 'admin' };
      const middleware = roleMiddleware(['user', 'admin']);
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
  });

  describe('ownerMiddleware', () => {
    beforeEach(() => {
      // Mock Track.findByPk to return a track
      Track.findByPk = jest.fn().mockImplementation((id) => {
        if (id === '1') {
          return Promise.resolve({
            id: 1,
            userId: 1,
            toJSON: () => ({ id: 1, userId: 1 })
          });
        } else if (id === '2') {
          return Promise.resolve({
            id: 2,
            user_id: 2,  // different field name
            toJSON: () => ({ id: 2, user_id: 2 })
          });
        } else {
          return Promise.resolve(null);
        }
      });
    });

    test('should return 401 when user is not authenticated', async () => {
      req.params.id = '1';
      const middleware = ownerMiddleware(Track);
      await middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 404 when resource does not exist', async () => {
      req.params.id = '999';
      req.user = { userId: 1, role: 'user' };
      const middleware = ownerMiddleware(Track);
      await middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('should return 403 when user is not the owner', async () => {
      req.params.id = '1';
      req.user = { userId: 2, role: 'user' };
      const middleware = ownerMiddleware(Track);
      await middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('should proceed when user is the owner (using userId field)', async () => {
      req.params.id = '1';
      req.user = { userId: 1, role: 'user' };
      const middleware = ownerMiddleware(Track);
      await middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    test('should proceed when user is the owner (using user_id field)', async () => {
      req.params.id = '2';
      req.user = { userId: 2, role: 'user' };
      const middleware = ownerMiddleware(Track);
      await middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    test('should proceed when user is admin regardless of ownership', async () => {
      req.params.id = '1';
      req.user = { userId: 999, role: 'admin' };
      const middleware = ownerMiddleware(Track);
      await middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
  });
}); 