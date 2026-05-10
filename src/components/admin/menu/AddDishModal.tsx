import React, { useState, useEffect } from 'react';
import { MenuItem, categories } from '@/types/menu';
import { XIcon, ArrowLeftIcon, SearchIcon } from '../icons';

interface AddDishModalProps {
  onClose: () => void;
  onSave: (dish: MenuItem) => void;
  dishToEdit: MenuItem | null;
}

const AddDishModal: React.FC<AddDishModalProps> = ({ onClose, onSave, dishToEdit }) => {
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    price: undefined,
    calories: undefined,
    image: '',
    category: 'Tiffins',
    tags: [],
    available: true,
    prep_time: 15
  });

  const [tagInput, setTagInput] = useState('');
  const [dietaryFlags, setDietaryFlags] = useState({
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    isSpicy: false,
    isPopular: false
  });

  useEffect(() => {
    if (dishToEdit) {
      setFormData(dishToEdit);
      const tags = dishToEdit.tags || [];
      setDietaryFlags({
        isVegetarian: tags.includes('Vegetarian'),
        isVegan: tags.includes('Vegan'),
        isGlutenFree: tags.includes('Gluten Free'),
        isSpicy: tags.includes('Spicy'),
        isPopular: tags.includes('Popular'),
      });
      const otherTags = tags.filter(t => !['Vegetarian', 'Vegan', 'Gluten Free', 'Spicy', 'Popular'].includes(t));
      setTagInput(otherTags.join(', '));
    }
  }, [dishToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const toggleDietary = (key: keyof typeof dietaryFlags) => {
    setDietaryFlags(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    let finalTags = tagInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
    
    if(dietaryFlags.isVegetarian) finalTags.push('Vegetarian');
    if(dietaryFlags.isVegan) finalTags.push('Vegan');
    if(dietaryFlags.isGlutenFree) finalTags.push('Gluten Free');
    if(dietaryFlags.isSpicy) finalTags.push('Spicy');
    if(dietaryFlags.isPopular) finalTags.push('Popular');

    finalTags = [...new Set(finalTags)];

    const finalDish: MenuItem = {
      ...formData,
      tags: finalTags,
      id: dishToEdit ? dishToEdit.id : Date.now().toString(),
      price: Number(formData.price) || 0,
      calories: Number(formData.calories) || 0,
      prep_time: Number(formData.prep_time) || 15,
      available: formData.available !== false,
      name: formData.name || 'New Dish',
      description: formData.description || '',
      image: formData.image || 'https://via.placeholder.com/500x500?text=No+Image',
      category: formData.category || 'Tiffins'
    } as MenuItem;

    onSave(finalDish);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md animate-fade-in-up">
      <div className="glass-surface w-full max-w-5xl h-full md:h-auto max-h-[95vh] overflow-hidden rounded-3xl flex flex-col relative animate-scale-in shadow-2xl shadow-black/50 border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5 backdrop-blur-xl z-10">
          <button onClick={onClose} className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors group">
            <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
              <ArrowLeftIcon className="w-5 h-5" />
            </div>
            <span className="font-semibold">Back to Menu</span>
          </button>
          <h2 className="text-xl font-bold text-white tracking-wide">
            {dishToEdit ? 'Edit Dish' : 'Add New Dish'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors text-neutral-400 hover:text-white">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Visuals & Basic Info */}
            <div className="lg:col-span-5 space-y-6">
              {/* Image Preview */}
              <div className="aspect-square rounded-2xl overflow-hidden bg-black/40 border-2 border-dashed border-white/10 relative group transition-colors hover:border-amber-500/40">
                {formData.image ? (
                  <div className="relative w-full h-full">
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button 
                        onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                        className="px-4 py-2 bg-red-500/80 text-white rounded-lg font-bold text-sm hover:bg-red-500 transition-colors"
                      >
                        Remove Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-neutral-400 group-hover:text-amber-400 transition-colors">
                    <span className="text-4xl mb-3">🖼️</span>
                    <p className="text-sm font-bold">Paste Image URL</p>
                    <p className="text-xs opacity-60 mt-1">or drag and drop</p>
                  </div>
                )}
              </div>

              {/* Image URL Input */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2 block">Image Source URL</label>
                <div className="relative">
                  <input 
                    type="text" 
                    name="image"
                    value={formData.image}
                    onChange={handleChange}
                    placeholder="https://..." 
                    className="w-full bg-white/5 border border-white/10 focus:border-amber-500 rounded-xl p-3 pl-10 text-white placeholder-neutral-500/30 transition-all outline-none" 
                  />
                  <div className="absolute left-3 top-3 text-neutral-500">
                    <SearchIcon className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2 block">Dish Name</label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Spicy Paneer Wrap" 
                    className="w-full bg-white/5 border border-white/10 focus:border-amber-500 rounded-xl p-3 text-white placeholder-neutral-500/30 transition-all outline-none font-semibold text-lg" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2 block">Description</label>
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Describe the ingredients and taste..." 
                    className="w-full bg-white/5 border border-white/10 focus:border-amber-500 rounded-xl p-3 text-white placeholder-neutral-500/30 transition-all outline-none resize-none" 
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Details & Configuration */}
            <div className="lg:col-span-7 space-y-8">
              {/* Pricing & Category Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2 block">Price (₹)</label>
                  <input 
                    type="number" 
                    name="price"
                    value={formData.price || ''}
                    onChange={handleChange}
                    placeholder="0" 
                    className="w-full bg-white/5 border border-white/10 focus:border-amber-500 rounded-xl p-3 text-white placeholder-neutral-500/30 transition-all outline-none font-mono" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2 block">Calories (kcal)</label>
                  <input 
                    type="number" 
                    name="calories"
                    value={formData.calories || ''}
                    onChange={handleChange}
                    placeholder="0" 
                    className="w-full bg-white/5 border border-white/10 focus:border-amber-500 rounded-xl p-3 text-white placeholder-neutral-500/30 transition-all outline-none font-mono" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2 block">Prep Time (min)</label>
                  <input 
                    type="number" 
                    name="prep_time"
                    value={formData.prep_time || ''}
                    onChange={handleChange}
                    placeholder="15" 
                    className="w-full bg-white/5 border border-white/10 focus:border-amber-500 rounded-xl p-3 text-white placeholder-neutral-500/30 transition-all outline-none font-mono" 
                  />
                </div>
                <div className="col-span-2 md:col-span-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2 block">Category</label>
                  <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                    {categories.filter(c => c !== 'All').map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                        className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all border ${
                          formData.category === cat 
                          ? 'bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-500/20' 
                          : 'bg-white/5 text-neutral-400 border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dietary & Attributes */}
              <div className="glass-surface bg-white/5 rounded-2xl p-5 border border-white/10">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4 block">Dietary Attributes</label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { key: 'isVegetarian', label: 'Vegetarian', icon: '🥦', color: 'text-green-400' },
                    { key: 'isVegan', label: 'Vegan', icon: '🌱', color: 'text-green-300' },
                    { key: 'isGlutenFree', label: 'Gluten Free', icon: '🌾', color: 'text-amber-300' },
                    { key: 'isSpicy', label: 'Spicy', icon: '🌶️', color: 'text-red-400' },
                    { key: 'isPopular', label: 'Popular', icon: '🔥', color: 'text-orange-400' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggleDietary(item.key as keyof typeof dietaryFlags)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
                        dietaryFlags[item.key as keyof typeof dietaryFlags]
                        ? `bg-white/10 border-white/30 shadow-inner ${item.color}` 
                        : 'bg-transparent border-white/10 text-neutral-500 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span className="text-sm font-semibold">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags Input */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2 block">Additional Tags</label>
                <input 
                  type="text" 
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="e.g. Breakfast, Healthy, Snack (comma separated)" 
                  className="w-full bg-white/5 border border-white/10 focus:border-amber-500 rounded-xl p-3 text-white placeholder-neutral-500/30 transition-all outline-none" 
                />
                <p className="text-xs text-neutral-500 mt-2">
                  Current Tags: <span className="text-white">{formData.tags?.join(', ')}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/10 bg-white/5 backdrop-blur-xl flex justify-between items-center">
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-white">Available Now</label>
            <button 
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, available: !prev.available }))}
              className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${
                formData.available ? 'bg-green-500' : 'bg-neutral-600'
              }`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-300 ${
                formData.available ? 'left-7' : 'left-1'
              }`}></div>
            </button>
          </div>
          <div className="flex gap-4">
            <button 
              type="button"
              onClick={onClose} 
              className="px-6 py-3 rounded-xl text-sm font-bold text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={handleSave} 
              className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-amber-600 to-amber-700 shadow-lg shadow-amber-500/20 hover:opacity-90 transition-opacity"
            >
              {dishToEdit ? 'Update Dish' : 'Save Dish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddDishModal;
