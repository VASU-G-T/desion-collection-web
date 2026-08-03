import React, { useState, useEffect } from 'react';
import { ImageItem, Category } from '../types';
import { Edit3, Save, X, Shirt, Sparkles, Tag, Layers, Cpu } from 'lucide-react';

interface EditImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: ImageItem | null;
  onSave: (updated: ImageItem) => Promise<void>;
}

const CATEGORIES: Category[] = [
  'Typography & Quotes',
  'Vintage & Retro',
  'Streetwear & Urban',
  'Anime & Manga',
  'Cyberpunk & Sci-Fi',
  'Minimalist Graphics',
  'Gym & Fitness',
  'Nature & Wildlife',
  'Gaming & Pop Culture',
  'Abstract & Pattern'
];

export const EditImageModal: React.FC<EditImageModalProps> = ({
  isOpen,
  onClose,
  image,
  onSave
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Typography & Quotes');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [method, setMethod] = useState('');
  const [placement, setPlacement] = useState('');
  const [suggestedColor, setSuggestedColor] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (image) {
      setTitle(image.title || '');
      setCategory(image.category || 'Typography & Quotes');
      setAuthor(image.author || '');
      setDescription(image.description || '');
      setTags((image.tags || []).join(', '));
      setMethod(image.printSpec?.method || 'DTG (Direct to Garment)');
      setPlacement(image.printSpec?.placement || 'Front Chest Graphic');
      setSuggestedColor(image.printSpec?.suggestedTshirtColor || 'Black / White / Charcoal');
    }
  }, [image]);

  if (!isOpen || !image) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      const updatedItem: ImageItem = {
        ...image,
        title: title.trim(),
        category,
        author: author.trim() || 'Apparel Designer',
        description: description.trim(),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        printSpec: {
          ...image.printSpec,
          method: method.trim(),
          placement: placement.trim(),
          suggestedTshirtColor: suggestedColor.trim()
        }
      };

      await onSave(updatedItem);
      onClose();
    } catch (err) {
      console.error('Failed to update image details', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative max-w-2xl w-full bg-slate-900 border-2 border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.2)] space-y-6 text-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                EDIT ARTWORK DETAILS
              </span>
              <h3 className="text-lg font-extrabold text-white tracking-tight mt-0.5">
                Modify Collection Record
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
          
          <div className="flex items-center gap-4 bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <img src={image.url} alt={image.title} className="w-16 h-16 object-cover rounded-xl border border-slate-700 flex-shrink-0" />
            <div className="text-xs space-y-1 font-mono">
              <p className="text-slate-300 font-bold">ID: <span className="text-cyan-400">{image.id}</span></p>
              <p className="text-slate-400">File Size: {image.fileSize}</p>
              <p className="text-slate-400">Uploaded: {new Date(image.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-1.5">
                Artwork Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-1.5">
                Collection Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-medium"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-1.5">
                Designer / Author
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-1.5">
                Tags (Comma Separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-1.5">
              Artwork Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Print Specifications */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-purple-500/30 space-y-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <Shirt className="w-3.5 h-3.5 text-purple-400" />
              <span>T-Shirt Print Specifications</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Print Method</label>
                <input
                  type="text"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  placeholder="DTG, Screen Print..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Print Placement</label>
                <input
                  type="text"
                  value={placement}
                  onChange={(e) => setPlacement(e.target.value)}
                  placeholder="Front Chest, Back..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Suggested Fabric Colors</label>
                <input
                  type="text"
                  value={suggestedColor}
                  onChange={(e) => setSuggestedColor(e.target.value)}
                  placeholder="Black, Charcoal..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-amber-400 hover:from-cyan-300 hover:to-amber-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Artwork Changes</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
