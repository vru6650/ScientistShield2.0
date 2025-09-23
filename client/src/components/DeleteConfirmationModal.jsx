import { HiOutlineExclamationCircle } from 'react-icons/hi';
import Button from './ui/Button';
import Modal from './ui/Modal';

export default function DeleteConfirmationModal({ isOpen, onClose, onConfirm }) {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="text-center">
                <HiOutlineExclamationCircle className="mx-auto mb-space-md h-14 w-14 text-gray-400 dark:text-gray-200" />
                <h3 className="mb-space-md text-lg font-normal text-gray-500 dark:text-gray-400">
                    Are you sure you want to delete this comment?
                </h3>
                <div className="flex justify-center gap-space-md">
                    <Button variant="danger" onClick={onConfirm}>
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