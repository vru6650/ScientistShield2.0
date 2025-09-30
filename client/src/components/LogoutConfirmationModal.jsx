// client/src/components/LogoutConfirmationModal.jsx
import { Modal, Button } from 'flowbite-react';

export default function LogoutConfirmationModal({ show, onClose, onConfirm, processing = false }) {
  return (
      <Modal show={show} onClose={processing ? () => {} : onClose} popup size='md'>
        <Modal.Header />
        <Modal.Body>
          <div className='text-center'>
            <h3 className='mb-5 text-lg font-normal text-gray-500 dark:text-gray-400'>
              Are you sure you want to sign out?
            </h3>
            <div className='flex justify-center gap-4'>
              <Button color='failure' onClick={onConfirm} isProcessing={processing} disabled={processing}>
                Yes, sign out
              </Button>
              <Button color='gray' onClick={onClose} disabled={processing}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
  );
}
