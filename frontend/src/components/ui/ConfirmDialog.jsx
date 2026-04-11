import Modal from './Modal';
import { Trash2 } from 'lucide-react';

export default function ConfirmDialog({ open, onClose, onConfirm, title = 'Confirm Delete', message = 'Are you sure you want to delete this? This action cannot be undone.', loading = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex gap-3 mb-5">
        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
          <Trash2 size={18} className="text-red-500" />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{message}</p>
      </div>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-secondary text-sm py-1.5">Cancel</button>
        <button onClick={onConfirm} disabled={loading} className="btn-danger text-sm py-1.5">
          {loading ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </Modal>
  );
}
