import User from '../models/user.model.js';

/**
 * Creates and persists a new user document.
 *
 * @param {Object} userData - Data used to create the user.
 * @returns {Promise<Object>} The saved user document.
 */
export const createUser = async (userData) => {
  const newUser = new User(userData);
  return await newUser.save();
};

/**
 * Finds a user by email address.
 *
 * @param {string} email - The email to search for.
 * @returns {Promise<Object|null>} The matching user document or null.
 */
export const findUserByEmail = (email) => {
  return User.findOne({ email });
};
