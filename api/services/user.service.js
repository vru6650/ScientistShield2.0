import User from '../models/user.model.js';

/**
 * Retrieves a user by ID.
 *
 * @param {string} userId - The user identifier.
 * @param {Object} [options]
 * @param {boolean} [options.excludePassword=false] - Exclude the password field from the result.
 * @returns {Promise<Object|null>} The user document or null if not found.
 */
export const getUserById = (userId, { excludePassword = false } = {}) => {
  const query = User.findById(userId);
  if (excludePassword) {
    query.select('-password');
  }
  return query;
};

/**
 * Updates a user's properties and saves the document.
 *
 * @param {string} userId - The user identifier.
 * @param {Object} updates - Fields to update.
 * @returns {Promise<Object|null>} The updated user document or null if not found.
 */
export const updateUserById = async (userId, updates) => {
  const userToUpdate = await User.findById(userId);
  if (!userToUpdate) {
    return null;
  }

  if (updates.username) {
    userToUpdate.username = updates.username;
  }
  if (updates.email) {
    userToUpdate.email = updates.email;
  }
  if (updates.password) {
    userToUpdate.password = updates.password;
  }
  if (updates.profilePicture) {
    userToUpdate.profilePicture = updates.profilePicture;
  }

  return await userToUpdate.save();
};

/**
 * Deletes a user by ID.
 *
 * @param {string} userId - The user identifier.
 * @returns {Promise<Object|null>} The result of the deletion operation.
 */
export const deleteUserById = (userId) => {
  return User.findByIdAndDelete(userId);
};

/**
 * Retrieves users with pagination and sorting.
 *
 * @param {number} startIndex - Number of records to skip.
 * @param {number} limit - Number of records to return.
 * @param {number} sortDirection - Sort direction (1 for asc, -1 for desc).
 * @returns {Promise<Array>} The list of users.
 */
export const findUsersWithPagination = (startIndex, limit, sortDirection) => {
  return User.find()
      .sort({ createdAt: sortDirection })
      .skip(startIndex)
      .limit(limit)
      .select('-password');
};

/**
 * Counts all users in the collection.
 *
 * @returns {Promise<number>} The number of users.
 */
export const countAllUsers = () => {
  return User.countDocuments();
};

/**
 * Counts users created after a specific date.
 *
 * @param {Date} date - The start date.
 * @returns {Promise<number>} The number of users created after the date.
 */
export const countUsersCreatedAfter = (date) => {
  return User.countDocuments({
    createdAt: { $gte: date },
  });
};
