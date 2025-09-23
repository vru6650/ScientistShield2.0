import { errorHandler } from '../utils/error.js';
import {
  countAllUsers,
  countUsersCreatedAfter,
  deleteUserById,
  findUsersWithPagination,
  getUserById,
  updateUserById,
} from '../services/user.service.js';

export const test = (req, res) => {
  res.json({ message: 'API is working!' });
};

// --- Upgraded updateUser Function ---
export const updateUser = async (req, res, next) => {
  if (req.user.id !== req.params.userId) {
    return next(errorHandler(403, 'You are not allowed to update this user'));
  }

  try {
    const updatedUser = await updateUserById(req.params.userId, req.body);
    if (!updatedUser) {
      return next(errorHandler(404, 'User not found'));
    }

    const { password, ...rest } = updatedUser._doc;
    res.status(200).json(rest);
  } catch (error) {
    // Mongoose validation errors will be caught here
    next(error);
  }
};

// --- deleteUser Function (already good) ---
export const deleteUser = async (req, res, next) => {
  if (!req.user.isAdmin && req.user.id !== req.params.userId) {
    return next(errorHandler(403, 'You are not allowed to delete this user'));
  }
  try {
    await deleteUserById(req.params.userId);
    res.status(200).json('User has been deleted');
  } catch (error) {
    next(error);
  }
};

// --- signout Function (already good) ---
export const signout = (req, res, next) => {
  try {
    res
        .clearCookie('access_token')
        .status(200)
        .json('User has been signed out');
  } catch (error) {
    next(error);
  }
};

// --- Upgraded getUsers Function ---
export const getUsers = async (req, res, next) => {
  if (!req.user.isAdmin) {
    return next(errorHandler(403, 'You are not allowed to see all users'));
  }
  try {
    const startIndex = parseInt(req.query.startIndex) || 0;
    const limit = parseInt(req.query.limit) || 9;
    const sortDirection = req.query.sort === 'asc' ? 1 : -1;

    const users = await findUsersWithPagination(startIndex, limit, sortDirection);

    const totalUsers = await countAllUsers();

    const now = new Date();
    const oneMonthAgo = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        now.getDate()
    );
    const lastMonthUsers = await countUsersCreatedAfter(oneMonthAgo);

    res.status(200).json({
      users, // The password is already excluded
      totalUsers,
      lastMonthUsers,
    });
  } catch (error) {
    next(error);
  }
};

// --- Upgraded getUser Function ---
export const getUser = async (req, res, next) => {
  try {
    const user = await getUserById(req.params.userId, { excludePassword: true });
    if (!user) {
      return next(errorHandler(404, 'User not found'));
    }
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};