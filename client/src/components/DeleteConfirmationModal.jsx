import { HiOutlineExclamationCircle } from 'react-icons/hi';
import Button from './ui/Button';
import Modal from './ui/Modal';

export default function DeleteConfirmationModal({ isOpen, onClose, onConfirm }) {
    const titleId = 'delete-confirm-title';
    return (
        <Modal isOpen={isOpen} onClose={onClose} titleId={titleId} ariaLabel="Delete confirmation">
            <div className="text-center">
                <HiOutlineExclamationCircle className="mx-auto mb-space-md h-14 w-14 text-gray-400 dark:text-gray-200" aria-hidden />
                <h3 id={titleId} className="mb-space-md text-lg font-normal text-gray-500 dark:text-gray-400">
                    Are you sure you want to delete this comment?
                </h3>
                <div className="flex justify-center gap-space-md">
                    <Button variant="danger" onClick={onConfirm} autoFocus>
                        {"Yes, I'm sure"}
                    </Button>
                    <Button variant="secondary" onClick={onClose}>
                        No, cancel
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
