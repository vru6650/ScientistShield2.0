import { Alert, Button, FileInput, Select, TextInput, Spinner, Modal } from 'flowbite-react';
// REMOVE ReactQuill imports
// import ReactQuill from 'react-quill';
// import 'react-quill/dist/quill.snow.css';

// ADD TiptapEditor import
import TiptapEditor from '../components/TiptapEditor';
import '../Tiptap.css'; // Don't forget to import the styles

import { useReducer, useEffect, useState } from 'react';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useNavigate } from 'react-router-dom';
import { HiOutlineExclamationCircle } from 'react-icons/hi';
import { useCloudinaryUpload } from '../hooks/useCloudinaryUpload';

// ... (keep all your existing constants, initialState, and reducer logic, it doesn't need to change)
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


export default function CreatePost() {
  // ... (keep all your existing hooks and functions: useReducer, useState, useCloudinaryUpload, useEffects, handlers, etc.)
  const [state, dispatch] = useReducer(postReducer, initialState);
  const [showModal, setShowModal] = useState(false);
  const { upload, progress: uploadProgress, error: uploadError, isUploading } = useCloudinaryUpload();
  const navigate = useNavigate();

  // ... useEffects for draft ...
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

  // ... handleRestoreDraft, handleDismissDraft, generateSlug, handleChange, handleFileChange, handleSubmit ...
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
      return dispatch({ type: 'PUBLISH_ERROR', payload: 'Title is required.' });
    }
    dispatch({ type: 'PUBLISH_START' });
    try {
      const res = await fetch('/api/post/create', {
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


  return (
      <div className='p-3 max-w-3xl mx-auto min-h-screen'>
        <h1 className='text-center text-3xl my-7 font-semibold'>Create a Post</h1>
        <form className='flex flex-col gap-6' onSubmit={handleSubmit}>
          {/* ... (keep the TextInput, Select, and FileInput sections unchanged) ... */}
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

          <div className='flex flex-col gap-4'>
            <FileInput
                helperText='Upload an image or video (Images: max 2MB, Videos: max 50MB).'
                type='file'
                accept='image/*,video/*'
                onChange={handleFileChange}
                disabled={isUploading}
            />
            {isUploading && (
                <div className='w-full flex justify-center'>
                  <div className='w-20 h-20'>
                    <CircularProgressbar value={uploadProgress} text={`${uploadProgress}%`} />
                  </div>
                </div>
            )}
            {uploadError && <Alert color='failure'>{uploadError}</Alert>}
            {state.formData.mediaUrl && (
                <div className='border-4 border-teal-500 border-dotted p-3'>
                  {state.formData.mediaType === 'image' ? (
                      <img src={state.formData.mediaUrl} alt='Uploaded preview' className='w-full h-auto object-contain' />
                  ) : (
                      <video src={state.formData.mediaUrl} controls className='w-full h-auto' />
                  )}
                </div>
            )}
          </div>

          {/* === REPLACE REACTQUILL WITH TIPTAPEDITOR === */}
          <TiptapEditor
              content={state.formData.content}
              onChange={(newContent) => dispatch({ type: 'FIELD_CHANGE', payload: { content: newContent } })}
              placeholder="Write something amazing..."
          />
          {/* =========================================== */}

          <Button type='submit' gradientDuoTone='purpleToPink' disabled={state.loading || isUploading}>
            {state.loading ? (<><Spinner size='sm' /><span className='pl-3'>Publishing...</span></>) : 'Publish'}
          </Button>
          {state.publishError && <Alert className='mt-5' color='failure'>{state.publishError}</Alert>}
        </form>

        {/* ... (keep the Modal for drafts unchanged) ... */}
        <Modal show={showModal} size="md" onClose={handleDismissDraft} popup>
          <Modal.Header />
          <Modal.Body>
            <div className="text-center">
              <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
              <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                We found an unsaved draft. Do you want to restore it?
              </h3>
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