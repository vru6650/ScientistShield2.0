import { Alert, Button, Label, Spinner, TextInput } from 'flowbite-react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';

import {
  signInStart,
  signInSuccess,
  signInFailure,
} from '../redux/user/userSlice';
import { signInUser } from '../services/authService';
import OAuth from '../components/OAuth';
import MatrixEffect from '../components/MatrixEffect.jsx'; // Corrected: Default import

// Validation schema using Zod
const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export default function SignIn() {
  const { loading, error: errorMessage } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signInSchema),
  });

  const handleFormSubmit = async (formData) => {
    try {
      dispatch(signInStart());
      const data = await signInUser(formData);
      dispatch(signInSuccess(data));
      navigate('/');
    } catch (error) {
      dispatch(signInFailure(error.message));
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
              This is a demo project. You can sign in with your email and password
              or with Google.
            </p>
          </div>

          {/* Right Side */}
          <div className='flex-1'>
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Welcome Back</h2>
            <form
                className='flex flex-col gap-4'
                onSubmit={handleSubmit(handleFormSubmit)}
            >
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
                    <p className='text-red-400 text-sm mt-1'>
                      {errors.email.message}
                    </p>
                )}
              </div>
              <div>
                <Label value='Your password' className="text-gray-200" />
                <TextInput
                    type='password'
                    placeholder='**********'
                    id='password'
                    {...register('password')}
                    className="mt-1"
                />
                {errors.password && (
                    <p className='text-red-400 text-sm mt-1'>
                      {errors.password.message}
                    </p>
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
                    'Sign In'
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
              <span>Don't have an account?</span>
              <Link to='/sign-up' className='text-blue-400 hover:underline'>
                Sign Up
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