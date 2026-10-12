import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getDocumentTypes,
  addDocumentType,
  updateDocumentType,
  deleteDocumentType,
} from '../../store/slices/documentTypeSlice';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
  FiFileText,
  FiLock,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const inputClass =
  'w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors';

const ManageDocumentTypes = () => {
  const dispatch = useDispatch();
  const { types, loading, mutating } = useSelector(
    (state) => state.documentTypes
  );

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    dispatch(getDocumentTypes());
  }, [dispatch]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;

    // Local duplicate guard (case-insensitive)
    const exists = types.some(
      (t) => t.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      toast.error('This type already exists');
      return;
    }

    try {
      await dispatch(addDocumentType(trimmed)).unwrap();
      setNewName('');
    } catch (_) {
      /* notification already shown */
    }
  };

  const startEdit = (type) => {
    setEditingId(type._id);
    setEditingName(type.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const saveEdit = async (id) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    try {
      await dispatch(updateDocumentType({ id, name: trimmed })).unwrap();
      cancelEdit();
    } catch (_) {
      /* notification already shown */
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete document type "${name}"?`)) return;
    setDeletingId(id);
    try {
      await dispatch(deleteDocumentType(id)).unwrap();
    } catch (_) {
      /* notification already shown */
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-5">
        <FiFileText className="text-blue-600" size={20} />
        <h2 className="text-lg font-bold text-slate-800">
          Manage Document Types
        </h2>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-5">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Add a new document type..."
          className={inputClass}
          maxLength={80}
        />
        <button
          type="submit"
          disabled={mutating || !newName.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <FiPlus size={16} />
          Add
        </button>
      </form>

      {/* List */}
      {loading && types.length === 0 ? (
        <div className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-3 text-sm text-slate-500">Loading types...</p>
        </div>
      ) : types.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">
          No document types yet. Add one above.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
          {types.map((type) => {
            const isEditing = editingId === type._id;
            const isDeleting = deletingId === type._id;

            return (
              <li
                key={type._id}
                className="flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50/60 transition-colors"
              >
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
                      autoFocus
                      maxLength={80}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(type._id);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => saveEdit(type._id)}
                      disabled={mutating || !editingName.trim()}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded-md disabled:opacity-50"
                      title="Save"
                    >
                      <FiCheck size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md"
                      title="Cancel"
                    >
                      <FiX size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-slate-800 truncate">
                      {type.name}
                      {type.isDefault && (
                        <span className="ml-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-slate-400">
                          <FiLock size={10} /> default
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => startEdit(type)}
                      className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md"
                      title="Edit"
                    >
                      <FiEdit2 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(type._id, type.name)}
                      disabled={type.isDefault || isDeleting}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-md disabled:opacity-30 disabled:cursor-not-allowed"
                      title={
                        type.isDefault
                          ? 'Default types cannot be deleted'
                          : 'Delete'
                      }
                    >
                      {isDeleting ? (
                        <svg
                          className="animate-spin"
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            opacity="0.25"
                          />
                          <path
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                      ) : (
                        <FiTrash2 size={15} />
                      )}
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ManageDocumentTypes;