import { Alert, Button, FileInput, Select, TextInput, Spinner, Modal, Progress } from 'flowbite-react';
import TiptapEditor from '../components/TiptapEditor';
import '../Tiptap.css';
import { useReducer, useEffect, useState } from 'react';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useNavigate } from 'react-router-dom';
import { HiOutlineExclamationCircle } from 'react-icons/hi';
import { useCloudinaryUpload } from '../hooks/useCloudinaryUpload';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'dompurify';
import parse from 'html-react-parser';
import { apiFetch } from '../utils/apiFetch';

const DRAFT_KEY = 'postDraft';

const initialState = {
  formData: { title: '', category: 'uncategorized', slug: '', mediaUrl: null, mediaType: null, content: '' },
  publishError: null,
  loading: false,
};

function postReducer(state, action) {
  switch (action.type) {
    case 'FIELD_CHANGE':
      return { ...state, formData: { ...state.formData, ...action.payload } };
    case 'MEDIA_UPLOAD_SUCCESS':
      return { ...state, formData: { ...state.formData, mediaUrl: action.payload.url, mediaType: action.payload.type } };
    case 'PUBLISH_START':
      return { ...state, loading: true, publishError: null };
    case 'PUBLISH_SUCCESS':
      return { ...initialState, formData: { ...initialState.formData } };
    case 'PUBLISH_ERROR':
      return { ...state, loading: false, publishError: action.payload };
    case 'LOAD_DRAFT':
      return { ...state, formData: action.payload };
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

// --- NEW: Full Post Preview Component ---
const FullPostPreview = ({ post }) => {
  const sanitizedContent = DOMPurify.sanitize(post.content || '');

  return (
      <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 max-h-[70vh] overflow-y-auto bg-white dark:bg-gray-800 shadow-inner">
        <main className='p-3 flex flex-col max-w-4xl mx-auto'>
          <h1 className='text-3xl mt-4 p-3 text-center font-serif mx-auto lg:text-4xl'>{post.title || 'Untitled Post'}</h1>
          <div className='flex justify-center mt-5'>
            <Button color='gray' pill size='xs'>{post.category || 'uncategorized'}</Button>
          </div>
          {post.mediaUrl && (
              <div className='mt-10 p-3 max-h-[600px] w-full flex justify-center'>
                {post.mediaType === 'video' ?
                    <video src={post.mediaUrl} controls className='w-full object-contain rounded-lg shadow-lg' /> :
                    <img src={post.mediaUrl} alt={post.title} className='w-full object-contain rounded-lg shadow-lg' />
                }
              </div>
          )}
          <div className='p-3 max-w-2xl mx-auto w-full post-content tiptap'>
            {parse(sanitizedContent)}
          </div>
        </main>
      </div>
  );
};


export default function CreatePost() {
  const [state, dispatch] = useReducer(postReducer, initialState);
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const { upload, progress: uploadProgress, error: uploadError, isUploading } = useCloudinaryUpload();
  const navigate = useNavigate();

  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      const draftData = JSON.parse(savedDraft);
      if (draftData.title || draftData.content?.replace(/<(.|\n)*?>/g, '').trim().length > 0) {
        setShowModal(true);
      }
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (state.formData.title || state.formData.content) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(state.formData));
      }
    }, 2000);
    return () => clearTimeout(handler);
  }, [state.formData]);

  const handleRestoreDraft = () => {
    const savedDraft = JSON.parse(localStorage.getItem(DRAFT_KEY));
    dispatch({ type: 'LOAD_DRAFT', payload: savedDraft });
    setShowModal(false);
  };

  const handleDismissDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setShowModal(false);
  };

  const generateSlug = (title = '') =>
      title.toLowerCase().trim().replace(/[\s\W-]+/g, '-').replace(/^-+|-+$/g, '');

  const handleChange = (e) => {
    const { id, value } = e.target;
    const payload = { [id]: value };
    if (id === 'title') {
      payload.slug = generateSlug(value);
    }
    dispatch({ type: 'FIELD_CHANGE', payload });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
    const config = mediaType === 'image'
        ? { allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], maxSizeMB: 2 }
        : { allowedTypes: ['video/mp4', 'video/webm', 'video/quicktime'], maxSizeMB: 50 };
    try {
      const url = await upload(file, config);
      dispatch({ type: 'MEDIA_UPLOAD_SUCCESS', payload: { url, type: mediaType } });
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!state.formData.title.trim()) {
      setCurrentStep(2); // Go back to details step if title is missing
      return dispatch({ type: 'PUBLISH_ERROR', payload: 'A title is required before publishing.' });
    }
    if (!state.formData.content.trim()) {
      setCurrentStep(1); // Go back to content step if content is missing
      return dispatch({ type: 'PUBLISH_ERROR', payload: 'Post content cannot be empty.'});
    }
    dispatch({ type: 'PUBLISH_START' });
    try {
      const res = await apiFetch('/api/post/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.formData),
      });
      const data = await res.json();
      if (!res.ok) {
        return dispatch({ type: 'PUBLISH_ERROR', payload: data.message });
      }
      dispatch({ type: 'PUBLISH_SUCCESS' });
      localStorage.removeItem(DRAFT_KEY);
      navigate(`/post/${data.slug}`);
    } catch (error) {
      dispatch({ type: 'PUBLISH_ERROR', payload: 'An unexpected error occurred.' });
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 200 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -200 },
  };

  return (
      <div className='p-3 max-w-4xl mx-auto min-h-screen'>
        <h1 className='text-center text-3xl my-7 font-semibold'>Create a Post</h1>
        <div className="mb-8">
          <Progress progress={((currentStep - 1) / 2) * 100} color="indigo" size="lg" />
        </div>

        <form className='flex flex-col gap-6' onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
                <motion.div key="step1" variants={stepVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.3 }}>
                  <h2 className="text-xl font-semibold mb-4">Step 1: Content & Media</h2>
                  <div className="flex flex-col gap-4">
                    <TiptapEditor
                        content={state.formData.content}
                        onChange={(newContent) => dispatch({ type: 'FIELD_CHANGE', payload: { content: newContent } })}
                        placeholder="Write something amazing..."
                    />
                    <FileInput
                        helperText='Upload an image or video (Images: max 2MB, Videos: max 50MB).'
                        type='file'
                        accept='image/*,video/*'
                        onChange={handleFileChange}
                        disabled={isUploading}
                    />
                    {isUploading && <div className='w-20 h-20 mx-auto'><CircularProgressbar value={uploadProgress} text={`${uploadProgress}%`} /></div>}
                    {uploadError && <Alert color='failure'>{uploadError}</Alert>}
                    {state.formData.mediaUrl && <div className='border-4 border-teal-500 border-dotted p-3'>{state.formData.mediaType === 'image' ? <img src={state.formData.mediaUrl} alt='Uploaded preview' className='w-full h-auto object-contain' /> : <video src={state.formData.mediaUrl} controls className='w-full h-auto' />}</div>}
                  </div>
                </motion.div>
            )}

            {currentStep === 2 && (
                <motion.div key="step2" variants={stepVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.3 }}>
                  <h2 className="text-xl font-semibold mb-4">Step 2: Details & Category</h2>
                  <div className='flex flex-col gap-4'>
                    <TextInput id='title' type='text' placeholder='Title' required onChange={handleChange} value={state.formData.title} />
                    <TextInput id='slug' type='text' placeholder='post-slug' value={state.formData.slug} onChange={handleChange} />
                    <Select id='category' onChange={handleChange} value={state.formData.category}>
                      <option value='uncategorized'>Select a category</option>
                      <option value='javascript'>JavaScript</option>
                      <option value='reactjs'>React.js</option>
                      <option value='nextjs'>Next.js</option>
                      <option value='technology'>Technology</option>
                    </Select>
                  </div>
                </motion.div>
            )}

            {currentStep === 3 && (
                <motion.div key="step3" variants={stepVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.3 }}>
                  <h2 className="text-xl font-semibold mb-4">Step 3: Review & Publish</h2>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">This is a live preview of how your post will appear to readers. If you're happy with it, click Publish!</p>
                  <FullPostPreview post={{...state.formData, createdAt: new Date().toISOString() }} />
                </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between mt-6">
            {currentStep > 1 && <Button outline gradientDuoTone="purpleToBlue" onClick={() => setCurrentStep(currentStep - 1)}>Previous</Button>}
            {currentStep < 3 && <Button gradientDuoTone="purpleToBlue" onClick={() => setCurrentStep(currentStep + 1)} className="ml-auto">Next</Button>}
            {currentStep === 3 && <Button type='submit' gradientDuoTone='purpleToPink' disabled={state.loading || isUploading} className="ml-auto">{state.loading ? (<><Spinner size='sm' /><span className='pl-3'>Publishing...</span></>) : 'Publish'}</Button>}
          </div>

          {state.publishError && <Alert className='mt-5' color='failure'>{state.publishError}</Alert>}
        </form>

        <Modal show={showModal} size="md" onClose={handleDismissDraft} popup>
          <Modal.Header />
          <Modal.Body>
            <div className="text-center">
              <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
              <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">We found an unsaved draft. Do you want to restore it?</h3>
              <div className="flex justify-center gap-4">
                <Button color="success" onClick={handleRestoreDraft}>Yes, restore it</Button>
                <Button color="gray" onClick={handleDismissDraft}>No, start fresh</Button>
              </div>
            </div>
          </Modal.Body>
        </Modal>
      </div>
  );
}
