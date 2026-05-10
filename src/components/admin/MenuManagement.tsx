import React, { useState, useMemo, useEffect } from 'react';
import { MenuItem, categories } from '@/data/menu';
import { toast } from 'sonner';
import { useWebSocket as useSocket } from '@/context/WebSocketContext';
import { VegIcon, NonVegIcon, SpicyIcon, SearchIcon, FilterIcon, PlusIcon, ArrowLeftIcon, XIcon, UploadIcon } from './icons';

const CategoryIcon: React.FC<{ tags: string[], category: string }> = ({ tags, category }) => {
    const isVeg = tags.includes('Vegetarian') || tags.includes('Veg') || category === 'Juices' || category === 'Drinks';
    const isNonVeg = tags.includes('Non-Veg') || tags.includes('Egg');
    const isSpicy = tags.includes('Spicy');

    return (
        <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
            {isVeg && <VegIcon title="Veg" className="w-3 h-3" />}
            {isNonVeg && <NonVegIcon title="Non-Veg" className="w-3 h-3" />}
            {isSpicy && <SpicyIcon title="Spicy" className="w-3 h-3" />}
            <span className="text-[10px] font-bold text-white/90 tracking-wide uppercase">
                {isVeg ? 'Veg' : isNonVeg ? 'Non-Veg' : 'Other'}
            </span>
        </div>
    );
};

interface DishCardProps {
    dish: MenuItem;
    index: number;
    onEdit: (dish: MenuItem) => void;
    onDelete: (dishId: string, dishName: string) => void;
}

const DishCard: React.FC<DishCardProps> = ({ dish, index, onEdit, onDelete }) => {
    const isOutOfStock = !dish.available;

    return (
        <div
            className="group relative h-[320px] rounded-3xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16, 1, 0.3, 1)] hover:shadow-[0 0 25px rgba(255, 81, 47, 0.4)]/50 hover:-translate-y-2"
            style={{
                opacity: 0,
                animation: `fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards ${index * 0.05}s`
            }}
        >
            {/* Background Image with Zoom Effect */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl">
                <img
                    src={dish.image}
                    alt={dish.name}
                    loading="lazy"
                    className={`w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16, 1, 0.3, 1)] group-hover:scale-110 ${isOutOfStock ? 'grayscale opacity-60' : ''}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/50 to-transparent opacity-90 group-hover:opacity-80 transition-opacity duration-500"></div>
            </div>

            {/* Floating Price Tag */}
            <div className="absolute top-4 right-4 z-10">
                <div className="bg-[rgba(20,20,20,0.6)]
  backdrop-blur-[24px] [-webkit-backdrop-filter:blur(24px)]
  border border-[rgba(255,255,255,0.08)]
  shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] px-3 py-1.5 rounded-xl flex flex-col items-center border border-white/10 shadow-lg group-hover:bg-[#FF512F] transition-colors duration-300">
                    <span className="text-sm font-bold text-white">₹{dish.price}</span>
                </div>
            </div>

            {/* Top Left Dietary Badges */}
            <div className="absolute top-4 left-4 z-10 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 ease-out delay-100">
                <CategoryIcon tags={dish.tags} category={dish.category} />
            </div>

            {/* Status Indicator (Always Visible if Out of Stock) */}
            {isOutOfStock && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                    <div className="bg-[#FF3D00] text-white px-4 py-2 rounded-full font-bold text-xs tracking-widest uppercase border border-[#FF3D00] shadow-xl backdrop-blur-sm transform -rotate-12">
                        Out of Stock
                    </div>
                </div>
            )}

            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-5 z-10 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                <div className="mb-1">
                    <div className="flex gap-2 flex-wrap mb-2">
                        {dish.tags.slice(0, 2).map((tag: string) => (
                            <span key={tag} className="text-[9px] uppercase tracking-wider font-bold text-white bg-[#F09819] px-2 py-0.5 rounded border border-[#F09819]">
                                {tag}
                            </span>
                        ))}
                    </div>
                    <h3 className="text-xl font-bold text-white leading-tight mb-1 drop-shadow-md group-hover:text-[#FF512F] transition-colors duration-300">{dish.name}</h3>
                    <p className="text-xs text-[#9ca3af] line-clamp-2 group-hover:text-white/90 transition-colors duration-300">{dish.description}</p>
                </div>

                {/* Hover Actions Slide Up */}
                <div className="h-0 group-hover:h-12 overflow-hidden transition-all duration-500 ease-[(cubic-bezier(0.16, 1, 0.3, 1)] opacity-0 group-hover:opacity-100 mt-0 group-hover:mt-3">
                    <div className="flex gap-2 pt-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(dish); }}
                            className="flex-1 bg-[#FF512F] text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wide shadow-lg shadow-[#FF512F]/30 hover:bg-white hover:text-[#FF512F] transition-all duration-300"
                        >
                            Edit Dish
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(dish.id, dish.name); }}
                            className="bg-[#FF3D00]/20 text-[#FF3D00] p-2 rounded-lg hover:bg-[#FF3D00] hover:text-white transition-all duration-300"
                            title="Delete Dish"
                        >
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Skeleton Component ---
const DishSkeleton: React.FC = () => {
    return (
        <div className="relative h-[320px] rounded-3xl overflow-hidden bg-white/5 border border-white/10 animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

            <div className="absolute top-4 right-4 w-12 h-8 rounded-xl bg-white/10"></div>

            <div className="absolute bottom-0 left-0 right-0 p-5 space-y-3">
                <div className="flex gap-2">
                    <div className="w-16 h-4 rounded bg-white/10"></div>
                    <div className="w-16 h-4 rounded bg-white/10"></div>
                </div>
                <div className="w-3/4 h-6 rounded bg-white/10"></div>
                <div className="space-y-2">
                    <div className="w-full h-3 rounded bg-white/5"></div>
                    <div className="w-5/6 h-3 rounded bg-white/5"></div>
                </div>
            </div>

            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        </div>
    );
};

// --- Add/Edit Dish Modal Component ---

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
        category: categories[1], // Default to Tiffins
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
            // Filter out flags from remaining tags for the input display
            const otherTags = tags.filter(t => !['Vegetarian', 'Vegan', 'Gluten Free', 'Spicy', 'Popular'].includes(t));
            setTagInput(otherTags.join(', '));
        }
    }, [dishToEdit]);

    // Handle basic inputs
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    // Handle dietary toggles
    const toggleDietary = (key: keyof typeof dietaryFlags) => {
        setDietaryFlags(prev => {
            const updated = { ...prev, [key]: !prev[key] };
            return updated;
        });
    };

    const handleSave = () => {
        // Construct final tags array
        let finalTags = tagInput.split(',').map(t => t.trim()).filter(t => t.length > 0);

        if (dietaryFlags.isVegetarian) finalTags.push('Vegetarian');
        if (dietaryFlags.isVegan) finalTags.push('Vegan');
        if (dietaryFlags.isGlutenFree) finalTags.push('Gluten Free');
        if (dietaryFlags.isSpicy) finalTags.push('Spicy');
        if (dietaryFlags.isPopular) finalTags.push('Popular');

        // Deduplicate tags
        finalTags = [...new Set(finalTags)];

        const finalDish: MenuItem = {
            ...formData,
            tags: finalTags,
            id: dishToEdit ? dishToEdit.id : Date.now().toString(), // Preserve ID if editing, else generate new
        } as MenuItem;

        onSave(finalDish);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md animate-fade-in-up">
            <div className="bg-[rgba(20,20,20,0.6)]
  backdrop-blur-[24px] [-webkit-backdrop-filter:blur(24px)]
  border border-[rgba(255,255,255,0.08)]
  shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] w-full max-w-5xl h-full md:h-auto max-h-[95vh] overflow-hidden rounded-3xl flex flex-col relative animate-scale-in shadow-2xl shadow-black/50 border border-white/10 relative z-[10000]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5 backdrop-blur-xl z-10">
                    <button onClick={onClose} className="flex items-center gap-2 text-[#FF3D00] hover:text-white transition-colors group">
                        <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                            <ArrowLeftIcon className="w-5 h-5" />
                        </div>
                        <span className="font-semibold">Back to Menu</span>
                    </button>
                    <h2 className="text-xl font-bold text-white tracking-wide">{dishToEdit ? 'Edit Dish' : 'Add New Dish'}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors text-[#9ca3af] hover:text-white">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* Left Column: Visuals & Basic Info */}
                        <div className="lg:col-span-5 space-y-6">
                            {/* Image Preview */}
                            <div className="aspect-square rounded-2xl overflow-hidden bg-black/40 border-2 border-dashed border-white/10 relative group transition-colors hover:border-[#FF512F]/40">
                                {formData.image ? (
                                    <div className="relative w-full h-full">
                                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <button
                                                onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                                                className="px-4 py-2 bg-[#FF3D00]/80 text-white rounded-lg font-bold text-sm hover:bg-[#FF3D00] transition-colors"
                                            >
                                                Remove Image
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-[#9ca3af] group-hover:text-[#FF512F] transition-colors">
                                        <UploadIcon className="w-12 h-12 mb-3 opacity-50" />
                                        <p className="text-sm font-bold">Paste Image URL</p>
                                        <p className="text-xs opacity-60 mt-1">or drag and drop</p>
                                    </div>
                                )}
                            </div>

                            {/* Image URL Input */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-[#9ca3af] mb-2 block">Image Source URL</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="image"
                                        value={formData.image}
                                        onChange={handleChange}
                                        placeholder="https://..."
                                        className="w-full bg-white/5 border border-white/10 focus:border-[#FF512F] rounded-xl p-3 pl-10 text-white placeholder-[#9ca3af]/30 transition-all outline-none"
                                    />
                                    <div className="absolute left-3 top-3 text-[#9ca3af]">
                                        <SearchIcon className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>

                            {/* Basic Info */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-[#9ca3af] mb-2 block">Dish Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="e.g. Spicy Paneer Wrap"
                                        className="w-full bg-white/5 border border-white/10 focus:border-[#FF512F] rounded-xl p-3 text-white placeholder-[#9ca3af]/30 transition-all outline-none font-semibold text-lg"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-[#9ca3af] mb-2 block">Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder="Describe the ingredients and taste..."
                                        className="w-full bg-white/5 border border-white/10 focus:border-[#FF512F] rounded-xl p-3 text-white placeholder-[#9ca3af]/30 transition-all outline-none resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Details & Configuration */}
                        <div className="lg:col-span-7 space-y-8">

                            {/* Pricing & Category Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-[#9ca3af] mb-2 block">Price (₹)</label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price || ''}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className="w-full bg-white/5 border border-white/10 focus:border-[#FF512F] rounded-xl p-3 text-white placeholder-[#9ca3af]/30 transition-all outline-none font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-[#9ca3af] mb-2 block">Calories (kcal)</label>
                                    <input
                                        type="number"
                                        name="calories"
                                        value={formData.calories || ''}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className="w-full bg-white/5 border border-white/10 focus:border-[#FF512F] rounded-xl p-3 text-white placeholder-[#FF9800]/30 transition-all outline-none font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-[#9ca3af] mb-2 block">Prep Time (min)</label>
                                    <input
                                        type="number"
                                        name="prep_time"
                                        value={formData.prep_time || ''}
                                        onChange={handleChange}
                                        placeholder="15"
                                        className="w-full bg-white/5 border border-white/10 focus:border-[#FF512F] rounded-xl p-3 text-white placeholder-[#9ca3af]/30 transition-all outline-none font-mono"
                                    />
                                </div>
                                <div className="col-span-2 md:col-span-3">
                                    <label className="text-xs font-bold uppercase tracking-wider text-[#9ca3af] mb-2 block">Category</label>
                                    <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                                        {categories.filter(c => c !== 'All').map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                                                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all border ${formData.category === cat
                                                        ? 'bg-[#FF512F] text-white border-[#FF512F] shadow-lg shadow-[#FF512F]/20'
                                                        : 'bg-white/5 text-[#9ca3af] border-white/10 hover:bg-white/10 hover:text-white'
                                                    }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Dietary & Attributes */}
                            <div className="bg-[rgba(20,20,20,0.6)]
  backdrop-blur-[24px] [-webkit-backdrop-filter:blur(24px)]
  border border-[rgba(255,255,255,0.08)]
  shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] bg-white/5 rounded-2xl p-5 border border-white/10">
                                <label className="text-xs font-bold uppercase tracking-wider text-[#FF9800] mb-4 block">Dietary Attributes</label>
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
                                            onClick={() => toggleDietary(item.key as keyof typeof dietaryFlags)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 ${dietaryFlags[item.key as keyof typeof dietaryFlags]
                                                    ? `bg-white/10 border-white/30 shadow-inner ${item.color}`
                                                    : 'bg-transparent border-white/10 text-[#9ca3af] opacity-60 hover:opacity-100'
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
                                <label className="text-xs font-bold uppercase tracking-wider text-[#9ca3af] mb-2 block">Additional Tags</label>
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    placeholder="e.g. Breakfast, Healthy, Snack (comma separated)"
                                    className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl p-3 text-white placeholder-neutral/30 transition-all outline-none"
                                />
                                <p className="text-xs text-[#9ca3af] mt-2">Current Tags: <span className="text-white">{formData.tags?.join(', ')}</span></p>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-white/10 bg-white/5 backdrop-blur-xl flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-semibold text-white">Available Now</label>
                        <button
                            onClick={() => setFormData(prev => ({ ...prev, available: !prev.available }))}
                            className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${formData.available ? 'bg-success' : 'bg-neutral/30'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-300 ${formData.available ? 'left-7' : 'left-1'}`}></div>
                        </button>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-6 py-3 rounded-xl text-sm font-bold text-white hover:bg-white/10 transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleSave} className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#FF512F] to-[#F09819] shadow-[0 0 25px rgba(255, 81, 47, 0.4)] hover:scale-105 transition-transform">
                            {dishToEdit ? 'Update Dish' : 'Save Dish'}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}

// --- Main Component ---

const MenuManagement: React.FC = () => {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingDish, setEditingDish] = useState<MenuItem | null>(null);
    const { socket } = useSocket();

    // Fetch menu items from API
    const fetchMenuItems = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('Fetching menu items from /api/menu?adminView=true...');

            const response = await fetch('/api/menu?adminView=true');
            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('Fetched menu items:', data);

            if (!data || !Array.isArray(data.data)) {
                console.error('Unexpected data format:', data);
                throw new Error('Invalid data format received from API');
            }

            setItems(data.data);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.error('Error in fetchMenuItems:', errorMessage, error);
            setError(`Failed to load menu items: ${errorMessage}`);
            toast.error('Failed to load menu items');
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    // Load items on component mount
    useEffect(() => {
        fetchMenuItems();
    }, []);

    // Listen for real-time menu updates
    useEffect(() => {
        if (!socket) return;

        const handleMenuUpdate = (event: string, data: MenuItem) => {
            console.log(`Received menu ${event} event:`, data);

            switch (event) {
                case 'created':
                    setItems(prev => [...prev, data]);
                    // Don&apos;t show toast here as It&apos;s already shown in the admin panel
                    break;
                case 'updated':
                    setItems(prev => prev.map(item => item.id === data.id ? data : item));
                    break;
                case 'deleted':
                    setItems(prev => prev.filter(item => item.id !== data.id));
                    break;
            }
        };

        // Set up event listeners
        socket.on('menu:created', (data: MenuItem) => handleMenuUpdate('created', data));
        socket.on('menu:updated', (data: MenuItem) => handleMenuUpdate('updated', data));
        socket.on('menu:deleted', (data: MenuItem) => handleMenuUpdate('deleted', data));

        // Clean up
        return () => {
            socket.off('menu:created');
            socket.off('menu:updated');
            socket.off('menu:deleted');
        };
    }, [socket]);

    // Debug: Log available categories when items change
    useEffect(() => {
        if (items && items.length > 0) {
            const uniqueCategories = [...new Set(items.map(item => item.category).filter(Boolean))];
            console.log('Available categories in data:', uniqueCategories);
            console.log('Current active category:', activeCategory);
        }
    }, [items, activeCategory]);

    const filteredItems = useMemo(() => {
        if (!Array.isArray(items)) {
            console.warn('Items is not an array:', items);
            return [];
        }

        let result = [...items];

        if (activeCategory && activeCategory !== 'All') {
            result = result.filter(item =>
                item?.category?.trim().toLowerCase() === activeCategory.trim().toLowerCase()
            );
            console.log(`Filtered by category '${activeCategory}':`, result);
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase().trim();
            if (q) {
                result = result.filter(item =>
                    (item.name?.toLowerCase().includes(q)) ||
                    (item.description?.toLowerCase().includes(q)) ||
                    (Array.isArray(item.tags) && item.tags.some(tag =>
                        typeof tag === 'string' && tag.toLowerCase().includes(q)
                    ))
                );
            }
        }

        console.log('Final filtered items:', result);
        return result;
    }, [activeCategory, searchQuery, items]);

    const inStockCount = (Array.isArray(filteredItems) ? filteredItems : []).filter(i => i.available).length;

    const handleSaveDish = async (dish: MenuItem) => {
        try {
            const isUpdate = !!dish.id && items.some(item => item.id === dish.id);

            console.log('Saving dish:', { isUpdate, dish });

            const url = isUpdate ? '/api/menu' : '/api/menu';
            const method = isUpdate ? 'PUT' : 'POST';

            // Ensure we have all required fields with defaults
            const dishToSave = {
                ...dish,
                name: dish.name || 'Unnamed Item',
                price: dish.price || 0,
                category: dish.category || 'Uncategorized',
                available: dish.available !== undefined ? dish.available : true,
                tags: Array.isArray(dish.tags) ? dish.tags : [],
                image: dish.image || '/images/placeholder-food.jpg',
                description: dish.description || '',
                calories: dish.calories || 0,
                isVegetarian: dish.isVegetarian || false,
                isVegan: dish.isVegan || false,
                isGlutenFree: dish.isGlutenFree || false,
                isDairyFree: dish.isDairyFree || false,
                isPopular: dish.isPopular || false,
            };

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dishToSave),
            });

            const responseData = await response.text();

            if (!response.ok) {
                console.error('Error response:', response.status, response.statusText, responseData);
                throw new Error(`Failed to ${isUpdate ? 'update' : 'add'} menu item: ${response.status} ${response.statusText}`);
            }

            let savedItem;
            try {
                savedItem = JSON.parse(responseData);
            } catch (e) {
                console.error('Failed to parse response:', e);
                throw new Error('Invalid response from server');
            }

            console.log('Saved item:', savedItem);

            // Send notification to customers about new menu item
            if (!isUpdate) {
                try {
                    await fetch('/api/notifications/menu/update', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            action: 'add',
                            itemName: savedItem.name,
                            category: savedItem.category,
                            message: `New delicious ${savedItem.name} is now available in ${savedItem.category}!`
                        }),
                    });
                    console.log('Notification sent to customers for new item:', savedItem.name);
                } catch (notificationError) {
                    console.error('Failed to send notification:', notificationError);
                    // Don&apos;t fail the whole operation if notification fails
                }
            }

            // Update local state
            if (isUpdate) {
                setItems(prevItems => prevItems.map(item => item.id === savedItem.id ? savedItem : item));
                toast.success('Item updated successfully!');
            } else {
                setItems(prevItems => [...prevItems, savedItem]);
                toast.success(`Item "${savedItem.name}" added successfully!`);
            }

            setIsAddModalOpen(false);
            setEditingDish(null);
        } catch (error) {
            console.error('Error saving dish:', error);
            toast.error(`Failed to ${dish.id ? 'update' : 'add'} menu item: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handleDeleteDish = async (dishId: string, dishName: string) => {
        if (!confirm(`Are you sure you want to delete "${dishName}"?`)) return;

        try {
            const response = await fetch(`/api/menu?id=${dishId}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete menu item');

            // Send notification to customers about item removal
            try {
                await fetch('/api/notifications/menu/update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'remove',
                        itemName: dishName,
                        message: `${dishName} has been temporarily removed from our menu`
                    }),
                });
                console.log('Notification sent to customers for item removal:', dishName);
            } catch (notificationError) {
                console.error('Failed to send removal notification:', notificationError);
                // Don&apos;t fail the whole operation if notification fails
            }

            // Update local state
            setItems(prevItems => prevItems.filter(item => item.id !== dishId));
            toast.success(`Item "${dishName}" deleted successfully!`);
        } catch (error) {
            console.error('Error deleting dish:', error);
            toast.error('Failed to delete menu item');
        }
    };

    const handleEditClick = (dish: MenuItem) => {
        setEditingDish(dish);
        setIsAddModalOpen(true);
    };

    const handleAddClick = () => {
        setEditingDish(null);
        setIsAddModalOpen(true);
    }

    return (
        <div className="h-full flex flex-col relative">
            {isAddModalOpen && (
                <AddDishModal
                    onClose={() => setIsAddModalOpen(false)}
                    onSave={handleSaveDish}
                    dishToEdit={editingDish}
                />
            )}

            {/* Premium Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 gap-6 relative z-20">
                <div>
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FF512F] via-[#F09819] to-[#FFD700] animate-gradient-x">
                        Menu & Catalog
                    </h1>
                    <p className="text-[#9ca3af] mt-2 text-sm font-medium max-w-md">
                        Curate your culinary offerings. Manage availability, pricing, and presentation in real-time.
                    </p>
                    <div className="flex gap-4 mt-4">
                        <div className="px-3 py-1 rounded-full bg-[#4CAF50]/10 border border-[#4CAF50]/20 text-xs font-bold text-[#4CAF50] flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse"></span>
                            {inStockCount} Available
                        </div>
                        <div className="px-3 py-1 rounded-full bg-[#9ca3af]/10 border border-[#9ca3af]/20 text-xs font-bold text-[#9ca3af] flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#9ca3af]"></span>
                            {filteredItems.length - inStockCount} Out of Stock
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleAddClick}
                    className="group relative px-6 py-3 bg-gradient-to-r from-[#FF512F] to-[#F09819] rounded-xl font-bold text-white shadow-[0 0 25px rgba(255, 81, 47, 0.4)] hover:scale-105 transition-all duration-300 overflow-hidden"
                >
                    <span className="relative z-10 flex items-center gap-2">
                        <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                        Add New Item
                    </span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                </button>
            </div>

            {/* Sticky Filter & Search Bar */}
            <div className="sticky top-0 z-30 pb-6 bg-[#050505]/80 backdrop-blur-xl -mx-4 px-4 transition-all duration-300 border-b border-white/5 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search Input */}
                    <div className="relative flex-shrink-0 w-full md:w-72 group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="h-5 w-5 text-[#9ca3af] group-focus-within:text-[#FF512F] transition-colors duration-300" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2.5 border border-white/10 rounded-xl leading-5 bg-white/10 text-white placeholder-white/60 focus:outline-none focus:bg-white/15 focus:border-[#FF512F]/50 focus:ring-1 focus:ring-[#FF512F]/50 sm:text-sm transition-all duration-300"
                            placeholder="Search dishes, tags..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Categories Scroll */}
                    <div className="flex-1 overflow-x-auto custom-scrollbar pb-1">
                        <div className="flex space-x-2">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 border border-transparent ${activeCategory === cat
                                            ? 'bg-white text-black shadow-lg scale-105'
                                            : 'bg-white/5 text-[#9ca3af] hover:bg-white/10 hover:text-white hover:border-white/20'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Animated Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2 pl-1">
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-20">
                        {[...Array(8)].map((_, i) => (
                            <DishSkeleton key={i} />
                        ))}
                    </div>
                ) : error ? (
                    <div className="h-96 flex flex-col items-center justify-center text-center p-4">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                            <XIcon className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Error Loading Menu</h3>
                        <p className="text-red-300 mb-4">{error}</p>
                        <button
                            onClick={fetchMenuItems}
                            className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                            Retry
                        </button>
                        <div className="mt-6 p-4 bg-white/5 rounded-lg text-left max-w-md w-full">
                            <p className="text-sm text-gray-400 mb-2">Debug Information:</p>
                            <pre className="text-xs bg-black/20 p-2 rounded overflow-auto max-h-40">
                                {JSON.stringify({
                                    itemsLength: items.length,
                                    filteredItemsLength: filteredItems.length,
                                    searchQuery,
                                    activeCategory,
                                    timestamp: new Date().toISOString()
                                }, null, 2)}
                            </pre>
                        </div>
                    </div>
                ) : filteredItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-20">
                        {filteredItems.map((dish, index) => (
                            <DishCard key={dish.id} dish={dish} index={index} onEdit={handleEditClick} onDelete={handleDeleteDish} />
                        ))}
                    </div>
                ) : (
                    <div className="h-96 flex flex-col items-center justify-center text-center animate-fade-in-up">
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10 shadow-[0 0 25px rgba(240, 152, 25, 0.4)]">
                            <SearchIcon className="w-10 h-10 text-[#9ca3af/50" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">No dishes found</h3>
                        <p className="text-[#9ca3af] max-w-xs mx-auto">
                            We couldn&apos;t find any items matching &quot;{searchQuery}&quot; in {activeCategory}. Try a different search term.
                        </p>
                        <button
                            onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                            className="mt-6 text-[#FF512F] hover:text-[#F09819] font-bold transition-colors underline decoration-2 underline-offset-4"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MenuManagement;
