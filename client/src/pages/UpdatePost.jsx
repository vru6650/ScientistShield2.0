import { Alert, Button, FileInput, Select, TextInput, Progress, Spinner } from 'flowbite-react';
import TiptapEditor from '../components/TiptapEditor';
import '../Tiptap.css';

import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useCloudinaryUpload } from '../hooks/useCloudinaryUpload';
import { getPost, updatePost } from '../services/postService';

const generateSlug = (title) => {
  if (!title) return '';
  return title
      .toLowerCase()
      .trim()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');
};

export default function UpdatePost() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({});
  const [file, setFile] = useState(null);
  const debounceTimeout = useRef(null);

  const { isUploading, error: uploadError, progress, upload, cancelUpload } = useCloudinaryUpload();

  const { data: initialPost, isLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => getPost(postId),
    enabled: !!postId,
  });

  useEffect(() => {
    if (initialPost) {
      setFormData(initialPost);
    }
  }, [initialPost]);

  const updateMutation = useMutation({
    mutationFn: (variables) => updatePost({ ...variables, formData }),
    onSuccess: (data) => navigate(`/post/${data.slug}`),
  });

  const handleUploadMedia = async () => {
    if (!file) return;
    try {
      const options = {
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'],
        maxSizeMB: 10
      };
      const downloadURL = await upload(file, options);
      const type = file.type.startsWith('image/') ? 'image' : 'video';
      setFormData({ ...formData, mediaUrl: downloadURL, mediaType: type });
    } catch (err) {
      console.error("Upload failed or was canceled:", err.message);
    }
  };

  const handleContentChange = (content) => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setFormData((prev) => ({ ...prev, content }));
    }, 500);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    updateMutation.mutate({
      postId: formData._id,
      userId: formData.userId
    });
  };

  if (isLoading) {
    return (
        <div className='flex justify-center items-center min-h-screen'>
          <Spinner size='xl' />
        </div>
    );
  }

  return (
      <div className='p-3 max-w-3xl mx-auto min-h-screen'>
        <h1 className='text-center text-3xl my-7 font-semibold'>Update post</h1>
        <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
          <div className='flex flex-col gap-4 sm:flex-row justify-between'>
            <TextInput
                type='text'
                placeholder='Title'
                required
                id='title'
                className='flex-1'
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value, slug: generateSlug(e.target.value) })}
            />
            <Select value={formData.category || 'uncategorized'} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
              <option value='uncategorized'>Select a category</option>
              <option value='javascript'>JavaScript</option>
              <option value='reactjs'>React.js</option>
              <option value='nextjs'>Next.js</option>
            </Select>
          </div>
          <div className='flex flex-col gap-3 border-4 border-teal-500 border-dotted p-3'>
            <div className='flex gap-4 items-center justify-between'>
              <FileInput type='file' accept='image/*,video/*' onChange={(e) => setFile(e.target.files[0])} disabled={isUploading} />
              <Button type='button' gradientDuoTone='purpleToBlue' size='sm' outline onClick={handleUploadMedia} disabled={isUploading || !file}>
                {isUploading ? 'Uploading...' : 'Upload Media'}
              </Button>
            </div>
            {isUploading && (
                <div className="flex items-center gap-2">
                  <Progress progress={progress} className="flex-grow" color="teal" />
                  <Button size="xs" color="gray" onClick={cancelUpload}>Cancel</Button>
                </div>
            )}
          </div>

          {uploadError && <Alert color='failure'>{uploadError}</Alert>}

          {formData.mediaUrl && !isUploading && (
              formData.mediaType === 'image' ? (
                  <img src={formData.mediaUrl} alt='upload preview' className='w-full h-72 object-cover' />
              ) : (
                  <video src={formData.mediaUrl} controls className='w-full h-72 object-cover' />
              )
          )}

          <TiptapEditor
              content={formData.content || ''}
              onChange={handleContentChange}
              placeholder='Write something amazing...'
          />

          <Button type='submit' gradientDuoTone='purpleToPink' disabled={updateMutation.isPending || isUploading}>
            {updateMutation.isPending ? 'Updating...' : 'Update post'}
          </Button>
          {updateMutation.isError && (
              <Alert className='mt-5' color='failure'>{updateMutation.error.message}</Alert>
          )}
        </form>
      </div>
  );
}