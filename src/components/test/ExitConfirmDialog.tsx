import { AlertTriangle } from 'lucide-react';
import Modal from '../Modal';
import { useExitConfirmStore } from '../../stores/useExitConfirmStore';

export default function ExitConfirmDialog() {
  const isOpen = useExitConfirmStore(state => state.isOpen);
  const onConfirm = useExitConfirmStore(state => state.onConfirm);
  const onCancel = useExitConfirmStore(state => state.onCancel);
  const closeDialog = useExitConfirmStore(state => state.closeDialog);

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    closeDialog();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    closeDialog();
  };

  return (
    <Modal open={isOpen} onClose={handleCancel}>
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-yellow-600" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-heading">
            Вы уверены, что хотите выйти?
          </h3>
          <p className="text-sm text-ink/70 leading-relaxed">
            Если вы покинете страницу сейчас, все ваши ответы не сохранятся. Вы сможете начать тест заново позже.
          </p>
        </div>

        <div className="flex gap-3 w-full pt-2">
          <button
            onClick={handleCancel}
            className="btn btn-ghost flex-1"
          >
            Отмена
          </button>
          <button
            onClick={handleConfirm}
            className="btn btn-primary flex-1"
          >
            Выйти
          </button>
        </div>
      </div>
    </Modal>
  );
}

