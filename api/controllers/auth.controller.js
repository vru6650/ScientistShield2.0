import bcryptjs from 'bcryptjs';
import { errorHandler } from '../utils/error.js';
import jwt from 'jsonwebtoken';
import { createUser, findUserByEmail } from '../services/auth.service.js';

/**
 * Signs a JWT for the provided payload using the application's secret.
 * Throws an error when the secret is missing so it can be handled by the
 * route's error middleware.
 *
 * @param {object} payload - Data to embed within the token.
 * @returns {string} Signed JSON Web Token.
 */
const signToken = (payload) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Using the same error handler ensures consistent error responses
    throw errorHandler(500, 'JWT secret is missing');
  }
  return jwt.sign(payload, secret);
};

export const signup = async (req, res, next) => {
  const { username, email, password } = req.body;

  if (
      !username ||
      !email ||
      !password ||
      username === '' ||
      email === '' ||
      password === ''
  ) {
    return next(errorHandler(400, 'All fields are required'));
  }

  try {
    const hashedPassword = await bcryptjs.hash(password, 10);
    await createUser({
      username,
      email,
      password: hashedPassword,
    });
    res.json('Signup successful');
  } catch (error) {
    next(error);
  }
};

export const signin = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password || email === '' || password === '') {
    return next(errorHandler(400, 'All fields are required'));
  }

  try {
    const validUser = await findUserByEmail(email);
    if (!validUser) {
      return next(errorHandler(404, 'User not found'));
    }
    const validPassword = await bcryptjs.compare(password, validUser.password);
    if (!validPassword) {
      return next(errorHandler(400, 'Invalid password'));
    }
    const token = signToken({ id: validUser._id, isAdmin: validUser.isAdmin });

    const { password: pass, ...rest } = validUser._doc;

    res
        .status(200)
        .cookie('access_token', token, {
          httpOnly: true,
        })
        .json(rest);
  } catch (error) {
    next(error);
  }
};

export const google = async (req, res, next) => {
  const { email, name, googlePhotoUrl } = req.body;
  try {
    const user = await findUserByEmail(email);
    if (user) {
      const token = signToken({ id: user._id, isAdmin: user.isAdmin });
      const { password, ...rest } = user._doc;
      return res
          .status(200)
          .cookie('access_token', token, {
            httpOnly: true,
          })
          .json(rest);
    }

    const generatedPassword =
        Math.random().toString(36).slice(-8) +
        Math.random().toString(36).slice(-8);
    const hashedPassword = await bcryptjs.hash(generatedPassword, 10);
    const newUser = await createUser({
      username:
          name.toLowerCase().split(' ').join('') +
          Math.random().toString(9).slice(-4),
      email,
      password: hashedPassword,
      profilePicture: googlePhotoUrl,
    });
    const token = signToken({ id: newUser._id, isAdmin: newUser.isAdmin });
    const { password, ...rest } = newUser._doc;
    res
        .status(200)
        .cookie('access_token', token, {
          httpOnly: true,
        })
        .json(rest);
  } catch (error) {
    next(error);
  }
};
