import React from 'react';
import { TimeSlot } from '@/types/slot';

interface SlotCardProps {
  slot: TimeSlot;
  onEdit?: (slot: TimeSlot) => void;
  onDelete?: (id: string) => void;
}

const SlotCard: React.FC<SlotCardProps> = ({ slot, onEdit, onDelete }) => {
  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-gray-900">
            {slot.time}
          </h3>
          <p className="text-sm text-gray-500">
            Status: {slot.status}
          </p>
          <p className="text-sm text-gray-500">
            Fill: {slot.fill}%
          </p>
        </div>
        <div className="flex space-x-2">
          {onEdit && (
            <button
              onClick={() => onEdit(slot)}
              className="p-1 text-blue-600 hover:text-blue-800"
              aria-label="Edit slot"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
          )}
          {onDelete && slot._id && (
            <button
              onClick={() => onDelete(slot._id as string)}
              className="p-1 text-red-600 hover:text-red-800"
              aria-label="Delete slot"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SlotCard;

