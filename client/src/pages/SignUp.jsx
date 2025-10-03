import { Alert, Button, Label, Spinner, TextInput } from 'flowbite-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';

import { signUpUser } from '../services/authService';
import OAuth from '../components/OAuth';
import MatrixEffect from '../components/MatrixEffect.jsx'; // Corrected: Default import

// Validation schema using Zod
const signUpSchema = z.object({
  username: z
      .string()
      .min(3, 'Username must be at least 3 characters long.')
      .max(20, 'Username must be no more than 20 characters long.')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores.'),
  email: z.string().email('Please enter a valid email address.'),
  password: z
      .string()
      .min(8, 'Password must be at least 8 characters long.')
      .regex(/[a-zA-Z]/, 'Password must contain at least one letter.')
      .regex(/[0-9]/, 'Password must contain at least one number.'),
  confirmPassword: z.string(),
})
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    });

export default function SignUp() {
  const [errorMessage, setErrorMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signUpSchema),
  });

  const handleFormSubmit = async (formData) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await signUpUser(formData);
      navigate('/sign-in');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className='min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gray-900'>
        <MatrixEffect />
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className='w-full max-w-4xl mx-auto bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-gray-200/20 grid md:grid-cols-2 gap-8'
        >
          {/* Left Side */}
          <div className='flex-1 flex flex-col justify-center text-white'>
            <Link to='/' className='font-bold text-4xl'>
            <span className='px-2 py-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg text-white'>
              Sahand's
            </span>
              Blog
            </Link>
            <p className='text-sm mt-5 text-gray-300'>
              Join our community of developers and start your learning journey today.
            </p>
          </div>

          {/* Right Side */}
          <div className='flex-1'>
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Create Your Account</h2>
            <form
                className='flex flex-col gap-4'
                onSubmit={handleSubmit(handleFormSubmit)}
                noValidate
            >
              <div>
                <Label value='Your username' className="text-gray-200" />
                <TextInput
                    type='text'
                    placeholder='Username'
                    id='username'
                    {...register('username')}
                    className="mt-1"
                />
                {errors.username && (
                    <p className='text-red-400 text-sm mt-1'>{errors.username.message}</p>
                )}
              </div>
              <div>
                <Label value='Your email' className="text-gray-200" />
                <TextInput
                    type='email'
                    placeholder='name@company.com'
                    id='email'
                    {...register('email')}
                    className="mt-1"
                />
                {errors.email && (
                    <p className='text-red-400 text-sm mt-1'>{errors.email.message}</p>
                )}
              </div>
              <div>
                <Label value='Your password' className="text-gray-200" />
                <TextInput
                    type='password'
                    placeholder='Password'
                    id='password'
                    {...register('password')}
                    className="mt-1"
                />
                {errors.password && (
                    <p className='text-red-400 text-sm mt-1'>{errors.password.message}</p>
                )}
              </div>
              <div>
                <Label value='Confirm your password' className="text-gray-200" />
                <TextInput
                    type='password'
                    placeholder='Confirm Password'
                    id='confirmPassword'
                    {...register('confirmPassword')}
                    className="mt-1"
                />
                {errors.confirmPassword && (
                    <p className='text-red-400 text-sm mt-1'>{errors.confirmPassword.message}</p>
                )}
              </div>
              <Button
                  gradientDuoTone='purpleToPink'
                  type='submit'
                  disabled={loading}
                  className="mt-4"
              >
                {loading ? (
                    <>
                      <Spinner size='sm' />
                      <span className='pl-3'>Loading...</span>
                    </>
                ) : (
                    'Sign Up'
                )}
              </Button>
              <div className="flex items-center my-4">
                <hr className="flex-grow border-gray-600" />
                <span className="mx-4 text-gray-400">or</span>
                <hr className="flex-grow border-gray-600" />
              </div>
              <OAuth />
            </form>
            <div className='flex gap-2 text-sm mt-5 justify-center text-gray-300'>
              <span>Have an account?</span>
              <Link to='/sign-in' className='text-blue-400 hover:underline'>
                Sign In
              </Link>
            </div>
            {errorMessage && (
                <Alert className='mt-5' color='failure'>
                  {errorMessage}
                </Alert>
            )}
          </div>
        </motion.div>
      </div>
  );
}