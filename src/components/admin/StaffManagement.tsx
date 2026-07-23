import React, { useState, useEffect } from 'react';
import { Staff, BaseStaff } from '@/types';
import { XIcon, UploadIcon, SearchIcon, PlusIcon } from './icons';
import { toast } from 'sonner';

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    details?: string;
    message?: string;
}

interface AddStaffCardProps {
    onClick: () => void;
    className?: string;
}

const AddStaffCard: React.FC<AddStaffCardProps> = ({ onClick, className = '' }) => {
    return (
        <div 
            onClick={onClick}
            className={`bg-black/40 backdrop-blur-md border border-white/10 shadow-lg rounded-3xl p-6 flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-[#FF512F]/50 cursor-pointer transition-all group min-h-[360px] hover:shadow-[0_0_25px_rgba(255,81,47,0.25)] ${className}`}
        >
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#FF512F]/20 transition-colors mb-4 border border-white/10 group-hover:border-[#FF512F]/30">
                <svg className="w-8 h-8 text-[#9ca3af] group-hover:text-[#FF512F] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            </div>
            <p className="font-bold text-xl text-[#9ca3af] group-hover:text-white transition-colors">Recruit Staff</p>
            <p className="text-xs text-[#9ca3af]/60 mt-1 uppercase tracking-wider font-medium">Add to team</p>
        </div>
    );
};

// No mock data - we'll fetch from the API

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
    let colorClass = 'bg-[#9ca3af]/10 text-[#9ca3af] border-[#9ca3af]/20';
    if (role === 'Manager') colorClass = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    if (role === 'Chef') colorClass = 'bg-[#FF512F]/10 text-[#FF512F] border-[#FF512F]/20';
    if (role === 'Cashier') colorClass = 'bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/20';
    if (role === 'Server') colorClass = 'bg-[#F09819]/10 text-[#F09819] border-[#F09819]/20';

    return (
        <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider border ${colorClass}`}>
            {role}
        </span>
    );
};

const StatusIndicator: React.FC<{ status: Staff['status'] }> = ({ status }) => {
    let colorClass = 'bg-[9ca3af]';
    let textClass = 'text-[#9ca3af]';
    
    if (status === 'Active') { colorClass = 'bg-[#FF512F]'; textClass = 'text-[#FF512F]'; }
    if (status === 'On Leave') { colorClass = 'bg-[#FF3D00]'; textClass = 'text-[#FF3D00]'; }
    if (status === 'Off Shift') { colorClass = 'bg-[#9ca3af]'; textClass = 'text-[#9ca3af]'; }

    return (
        <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/5`}>
            <div className={`w-1.5 h-1.5 rounded-full ${colorClass} ${status === 'Active' ? 'animate-pulse shadow-[0_0_8px_rgba(76,175,80,0.5)]' : ''}`}></div>
            <span className={`text-[10px] font-bold uppercase tracking-wide ${textClass}`}>
                {status}
            </span>
        </div>
    );
};

interface StaffCardProps {
    staff: Staff;
    onEditShift: (staff: Staff) => void;
    onViewProfile: (staff: Staff) => void;
    onDelete?: (staff: Staff) => void;
}

const StaffCard: React.FC<StaffCardProps> = ({ staff, onEditShift, onViewProfile, onDelete }) => {
    const isTopPerformer = staff.performance >= 90;

    return (
        <div
  className="
    relative group rounded-3xl p-6 
    backdrop-blur-xl bg-white/10 
    border border-white/10 
    transition-all duration-300 
    overflow-hidden

    hover:border-[#FF512F]/40
    hover:shadow-[0_0_25px_5px_rgba(255,81,47,0.25)]
  "
>

            {/* Top Row: Status & Actions Placeholder */}
            <div className="flex justify-between items-start mb-6 relative z-10">
                 <StatusIndicator status={staff.status} />
                 {isTopPerformer && (
                     <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-full shadow-sm">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Top Talent</span>
                     </div>
                 )}
            </div>

            {/* Avatar & Info */}
            <div className="flex flex-col items-center text-center mb-6 relative z-10">
                <div className="relative mb-4 group-hover:scale-105 transition-transform duration-300">
                    <div className={`absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-300 ${isTopPerformer ? 'bg-amber-400' : 'bg-primary'}`}></div>
                    <img 
                        src={staff.avatar} 
                        alt={staff.name} 
                        className={`w-24 h-24 rounded-full object-cover border-4 relative z-10 ${isTopPerformer ? 'border-amber-500/30' : 'border-white/10'}`} 
                    />
                    {isTopPerformer && (
                        <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-amber-400 to-orange-500 text-white p-1.5 rounded-full border-4 border-[#0F0F0F] shadow-lg z-20">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                        </div>
                    )}
                </div>
                
                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-[#FF512F] transition-colors">{staff.name}</h3>
                <div className="mb-4">
                    <RoleBadge role={staff.role} />
                </div>

                <div className="flex items-center justify-center gap-4 w-full text-sm text-[#9ca3af]/80">
                     <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="text-xs font-medium">{staff.shift}</span>
                    </div>
                     <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        <span className="text-xs font-medium">{staff.contact}</span>
                    </div>
                </div>
            </div>

            {/* Performance Bar */}
            <div className="relative z-10 bg-black/20 rounded-xl p-4 mb-4 border border-white/5">
                <div className="flex justify-between text-xs mb-2">
                    <span className="text-[#9ca3af] font-medium uppercase tracking-wider">Performance</span>
                    <span className={`font-bold ${isTopPerformer ? 'text-amber-400' : 'text-white'}`}>{staff.performance}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div 
                        className={`h-full rounded-full relative transition-all duration-1000 ease-out ${isTopPerformer ? 'bg-gradient-to-r from-amber-400 to-orange-600' : 'bg-gradient-to-r from-secondary to-primary'}`} 
                        style={{ width: `${staff.performance}%` }}
                    >
                         <div className="absolute right-0 top-0 bottom-0 w-full bg-gradient-to-l from-white/20 to-transparent"></div>
                    </div>
                </div>
            </div>

            {/* Hover Actions */}
            <div className="grid grid-cols-3 gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 relative z-10">
                <button 
                    onClick={(e) => { e.stopPropagation(); onEditShift(staff); }}
                    className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white border border-white/10 transition-colors cursor-pointer hover:border-white/30"
                >
                    Edit Shift
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); onViewProfile(staff); }}
                    className="py-2.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-white/90 shadow-lg shadow-white/10 transition-colors cursor-pointer hover:scale-[1.02] transform"
                >
                    View Profile
                </button>
                {onDelete && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(staff); }}
                        className="py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-xs font-bold text-red-400 border border-red-500/20 transition-colors cursor-pointer hover:border-red-500/40"
                    >
                        Remove
                    </button>
                )}
            </div>
        </div>
    );
};

// --- Delete Confirmation Modal ---
interface DeleteConfirmModalProps {
    staff: Staff;
    onClose: () => void;
    onConfirm: (staff: Staff) => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ staff, onClose, onConfirm }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-up">
            <div className="bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl w-full max-w-md rounded-3xl p-6 relative animate-scale-in">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20">
                        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Remove Staff Member</h3>
                    <p className="text-[#9ca3af] text-sm">
                        Are you sure you want to remove <span className="text-white font-semibold">{staff.name}</span>?
                    </p>
                    <p className="text-[#9ca3af]/60 text-xs mt-1">This action cannot be undone.</p>
                </div>
                <div className="flex justify-end gap-3">
                    <button 
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl text-sm font-bold text-white hover:bg-white/10 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type="button"
                        onClick={() => onConfirm(staff)}
                        className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                    >
                        Remove Staff
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Edit Shift Modal ---
interface EditShiftModalProps {
    staff: Staff;
    onClose: () => void;
    onSave: (id: string, newShift: string) => void;
}

const EditShiftModal: React.FC<EditShiftModalProps> = ({ staff, onClose, onSave }) => {
    const [shift, setShift] = useState(staff.shift);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-up">
            <div className="bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl w-full max-w-md rounded-3xl p-6 relative animate-scale-in">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Edit Shift</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><XIcon className="w-5 h-5" /></button>
                </div>
                <div className="mb-6">
                    <p className="text-sm text-[#9ca3af] mb-2">Staff Member</p>
                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl mb-4">
                        <img src={staff.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                        <span className="font-bold">{staff.name}</span>
                    </div>
                    <label className="text-xs font-bold uppercase text-[#9ca3af] tracking-wider mb-2 block">New Shift Timing</label>
                    <input 
                        type="text" 
                        value={shift}
                        onChange={(e) => setShift(e.target.value)}
                        className="w-full border border-gray-600 focus:border-[#FF512F] rounded-xl p-3 outline-none transition-all"
                        style={{ 
                            color: '#fff', 
                            backgroundColor: '#000',
                            WebkitTextFillColor: '#fff',
                            caretColor: '#fff'
                        }}
                        autoFocus
                    />
                </div>
                <div className="flex justify-end gap-3">
                    <button 
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl text-sm font-bold text-white hover:bg-white/10 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        disabled={!shift}
                        className={`px-8 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#FF512F] to-[#F09819] shadow-glow-[#FF512F] transition-transform ${
                            shift ? 'hover:scale-105' : 'opacity-50 cursor-not-allowed'
                        }`}
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- View Profile Modal ---
interface ViewProfileModalProps {
    staff: Staff;
    onClose: () => void;
}

const ViewProfileModal: React.FC<ViewProfileModalProps> = ({ staff, onClose }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-up">
            <div className="bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl w-full max-w-lg rounded-3xl overflow-hidden relative animate-scale-in">
                {/* Profile Header */}
                <div className="h-32 bg-gradient-to-r from-[#FF512F]/20 to-[#F09819]/20 relative">
                     <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors text-white backdrop-blur-md"><XIcon className="w-5 h-5" /></button>
                </div>
                <div className="px-8 pb-8 -mt-12">
                    <div className="flex justify-between items-end mb-6">
                         <img src={staff.avatar} className="w-24 h-24 rounded-full border-4 border-[#0F0F0F] bg-[#0F0F0F] object-cover" alt="" />
                         <div className="flex gap-2 mb-2">
                             <StatusIndicator status={staff.status} />
                             <RoleBadge role={staff.role} />
                         </div>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-white mb-1">{staff.name}</h2>
                    <p className="text-[#9ca3af] text-sm mb-6">ID: #{staff._id} • Joined Oct 2023</p>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <p className="text-xs text-[#9ca3af] uppercase font-bold mb-1">Contact</p>
                            <p className="font-semibold text-sm">{staff.contact}</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                             <p className="text-xs text-[#9ca3af] uppercase font-bold mb-1">Current Shift</p>
                             <p className="font-semibold text-sm">{staff.shift}</p>
                        </div>
                    </div>
                    
                    <div>
                         <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-bold text-white">Performance Score</span>
                            <span className="text-2xl font-bold text-[#FF512F]">{staff.performance}%</span>
                         </div>
                         <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#F09819] to-[##FF512F]" style={{ width: `${staff.performance}%` }}></div>
                         </div>
                         <p className="text-xs text-[#9ca3af] mt-2 text-center pt-2">Based on attendance, speed, and customer feedback.</p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
                        <button className="text-[#FF512F] text-sm font-bold hover:text-white transition-colors">View Full History &rarr;</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Add Staff Modal ---
interface AddStaffModalProps {
    onClose: () => void;
    onAdd: (staff: Omit<BaseStaff, '_id'>) => Promise<boolean>;
}

const AddStaffModal: React.FC<AddStaffModalProps> = ({ onClose, onAdd }) => {
    const [formData, setFormData] = useState<Omit<BaseStaff, '_id'>>({
        name: '',
        email: '',
        role: 'Server',
        avatar: '',
        status: 'Active',
        shift: '09:00 AM - 05:00 PM',
        contact: '',
        performance: 100,
        createdAt: new Date(),
        updatedAt: new Date()
    });

    // Field validation states
    const [fieldStates, setFieldStates] = useState({
        name: { touched: false, valid: false, error: '' },
        email: { touched: false, valid: false, error: '' },
        contact: { touched: false, valid: false, error: '' },
        role: { touched: false, valid: true, error: '' },
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Define valid roles that match the API expectations
    const roles: BaseStaff['role'][] = ['Manager', 'Chef', 'Server', 'Cashier', 'Cleaner'];

    // Validation functions
    const validateName = (value: string) => {
        if (!value.trim()) return 'Name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        if (value.trim().length > 50) return 'Name must be less than 50 characters';
        if (!/^[a-zA-Z\s]+$/.test(value.trim())) return 'Name can only contain letters and spaces';
        return '';
    };

    const validateEmail = (value: string) => {
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim().toLowerCase())) return 'Please enter a valid email address';
        return '';
    };

    const validateContact = (value: string) => {
        if (!value.trim()) return 'Contact number is required';
        const phoneRegex = /^[0-9+\-\s()]{10,20}$/;
        if (!phoneRegex.test(value.trim())) return 'Please enter a valid phone number (10-20 digits)';
        return '';
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        setFormData(prev => ({
            ...prev,
            [name]: value,
            updatedAt: new Date()
        }));

        // Validate field on change
        let error = '';
        let valid = false;
        
        if (name === 'name') {
            error = validateName(value);
            valid = !error;
        } else if (name === 'email') {
            error = validateEmail(value);
            valid = !error;
        } else if (name === 'contact') {
            error = validateContact(value);
            valid = !error;
        }

        setFieldStates(prev => ({
            ...prev,
            [name]: { touched: true, valid, error }
        }));
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        let error = '';
        let valid = false;
        
        if (name === 'name') {
            error = validateName(value);
            valid = !error;
        } else if (name === 'email') {
            error = validateEmail(value);
            valid = !error;
        } else if (name === 'contact') {
            error = validateContact(value);
            valid = !error;
        }

        setFieldStates(prev => ({
            ...prev,
            [name]: { touched: true, valid, error }
        }));
    };

    const isFormValid = () => {
        return fieldStates.name.valid && 
               fieldStates.email.valid && 
               fieldStates.contact.valid &&
               fieldStates.role.valid;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        // Validate all fields before submission
        const nameError = validateName(formData.name);
        const emailError = validateEmail(formData.email);
        const contactError = validateContact(formData.contact);
        
        setFieldStates(prev => ({
            ...prev,
            name: { touched: true, valid: !nameError, error: nameError },
            email: { touched: true, valid: !emailError, error: emailError },
            contact: { touched: true, valid: !contactError, error: contactError },
        }));

        if (nameError || emailError || contactError) {
            toast.error('Please fix the form errors before submitting');
            return;
        }
        
        setIsSubmitting(true);
        
        // Prepare the staff data - let parent handle API call
        const newStaff = {
            ...formData,
            name: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            contact: formData.contact.trim(),
            status: 'Active' as const,
            performance: 100,
            avatar: formData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name.trim())}&background=random`,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        // Call onAdd to let parent handle the API call
        const success = await onAdd(newStaff);
        
        if (success) {
            setIsSubmitting(false);
            onClose();
        } else {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-up">
            <div className="bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl w-full max-w-2xl overflow-hidden rounded-3xl flex flex-col relative animate-scale-in">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
                    <h2 className="text-xl font-bold text-white tracking-wide">Recruit New Staff</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors text-[#9ca3af] hover:text-white">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-8">
                    <div className="space-y-6">
                        {/* Name Field */}
                        <div>
                            <label className="text-xs font-bold uppercase text-[#9ca3af] tracking-wider mb-2 block">
                                Name <span className="text-red-500">*</span>
                            </label>
                            <input 
                                type="text" 
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="John Doe" 
                                className={`w-full border rounded-xl p-3 outline-none transition-all ${
                                    fieldStates.name.touched 
                                        ? fieldStates.name.valid 
                                            ? 'border-green-500 focus:border-green-500 bg-green-500/5' 
                                            : 'border-red-500 focus:border-red-500 bg-red-500/5'
                                        : 'border-gray-600 focus:border-[#FF512F]'
                                }`}
                                style={{ 
                                    color: '#fff', 
                                    backgroundColor: '#000',
                                    WebkitTextFillColor: '#fff',
                                    caretColor: '#fff'
                                }}
                                required
                            />
                            {fieldStates.name.touched && fieldStates.name.error && (
                                <p className="text-red-500 text-xs mt-1">{fieldStates.name.error}</p>
                            )}
                            {fieldStates.name.touched && fieldStates.name.valid && (
                                <p className="text-green-500 text-xs mt-1">✓ Valid name</p>
                            )}
                        </div>

                        {/* Email Field */}
                        <div>
                            <label className="text-xs font-bold uppercase text-[#9ca3af] tracking-wider mb-2 block">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input 
                                type="email" 
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="john@example.com" 
                                className={`w-full border rounded-xl p-3 outline-none transition-all ${
                                    fieldStates.email.touched 
                                        ? fieldStates.email.valid 
                                            ? 'border-green-500 focus:border-green-500 bg-green-500/5' 
                                            : 'border-red-500 focus:border-red-500 bg-red-500/5'
                                        : 'border-gray-600 focus:border-[#FF512F]'
                                }`}
                                style={{ 
                                    color: '#fff', 
                                    backgroundColor: '#000',
                                    WebkitTextFillColor: '#fff',
                                    caretColor: '#fff'
                                }}
                                required
                            />
                            {fieldStates.email.touched && fieldStates.email.error && (
                                <p className="text-red-500 text-xs mt-1">{fieldStates.email.error}</p>
                            )}
                            {fieldStates.email.touched && fieldStates.email.valid && (
                                <p className="text-green-500 text-xs mt-1">✓ Valid email</p>
                            )}
                        </div>

                        {/* Contact Number Field */}
                        <div>
                            <label className="text-xs font-bold uppercase text-[#9ca3af] tracking-wider mb-2 block">
                                Contact Number <span className="text-red-500">*</span>
                            </label>
                            <input 
                                type="tel" 
                                name="contact"
                                value={formData.contact}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="+1 (555) 123-4567" 
                                className={`w-full border rounded-xl p-3 outline-none transition-all ${
                                    fieldStates.contact.touched 
                                        ? fieldStates.contact.valid 
                                            ? 'border-green-500 focus:border-green-500 bg-green-500/5' 
                                            : 'border-red-500 focus:border-red-500 bg-red-500/5'
                                        : 'border-gray-600 focus:border-[#FF512F]'
                                }`}
                                style={{ 
                                    color: '#fff', 
                                    backgroundColor: '#000',
                                    WebkitTextFillColor: '#fff',
                                    caretColor: '#fff'
                                }}
                                required
                                pattern="[0-9+\-\s()]+"
                                title="Please enter a valid phone number"
                            />
                            {fieldStates.contact.touched && fieldStates.contact.error && (
                                <p className="text-red-500 text-xs mt-1">{fieldStates.contact.error}</p>
                            )}
                            {fieldStates.contact.touched && fieldStates.contact.valid && (
                                <p className="text-green-500 text-xs mt-1">✓ Valid phone number</p>
                            )}
                        </div>

                        {/* Role Selection */}
                        <div>
                            <label className="text-xs font-bold uppercase text-[#9ca3af] tracking-wider mb-2 block">
                                Role <span className="text-red-500">*</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {roles.map(role => (
                                    <button
                                        key={role}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, role }))}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                                            formData.role === role 
                                            ? 'bg-[#FF512F] text-white border-[#FF512F] shadow-[0_0_25px_rgba(255,81,47,0.4)]' 
                                            : 'bg-white/5 text-[#9ca3af] border-white/10 hover:bg-white/10'
                                        }`}
                                    >
                                        {role}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Avatar URL */}
                        <div>
                            <label className="text-xs font-bold uppercase text-[#9ca3af] tracking-wider mb-2 block">
                                Avatar URL
                            </label>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/10 relative group">
                                    <img 
                                        src={formData.avatar || `https://ui-avatars.com/api/?name=${formData.name || 'New Staff'}&background=random`} 
                                        alt="Preview" 
                                        className="w-full h-full object-cover" 
                                    />
                                </div>
                                <input 
                                    type="text" 
                                    name="avatar" 
                                    value={formData.avatar}
                                    onChange={handleChange}
                                    placeholder="https://..."
                                    className="flex-1 border border-gray-600 focus:border-[#FF512F] rounded-xl px-4 py-2 text-sm outline-none transition-colors"
                                    style={{ 
                                        color: '#fff', 
                                        backgroundColor: '#000',
                                        WebkitTextFillColor: '#fff',
                                        caretColor: '#fff'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4 flex justify-end gap-4">
                            <button 
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="px-6 py-3 rounded-xl text-sm font-bold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                disabled={!isFormValid() || isSubmitting}
                                className={`px-8 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#FF512F] to-[#F09819] shadow-[0_0_25px_rgba(255,81,47,0.4)] transition-transform ${
                                    isFormValid() && !isSubmitting
                                        ? 'hover:scale-105 cursor-pointer' 
                                        : 'opacity-50 cursor-not-allowed'
                                }`}
                            >
                                {isSubmitting ? 'Adding Staff...' : 'Add Staff Member'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

const StaffManagement: React.FC = () => {
    const [staff, setStaff] = useState<Staff[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch staff from API
    useEffect(() => {
        const fetchStaff = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('/api/staff');
                const data = await response.json();
                if (data.success) {
                    // Map the data to ensure it matches our Staff type
                    const formattedStaff = data.data.map((s: any) => ({
                        ...s,
                        id: s._id, // For backward compatibility
                        avatar: s.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random`
                    }));
                    setStaff(formattedStaff);
                } else {
                    throw new Error(data.error || 'Failed to fetch staff');
                }
            } catch (error) {
                console.error('Error fetching staff:', error);
                toast.error('Failed to load staff data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchStaff();
    }, []);

    const handleAddStaff = async (newStaff: Omit<BaseStaff, '_id'>) => {
        const loadingToast = toast.loading('Adding staff member...');
        
        try {
            // Prepare the staff data with all required fields
            const staffData = {
                ...newStaff,
                name: newStaff.name.trim(),
                email: newStaff.email.toLowerCase().trim(),
                contact: newStaff.contact.trim(),
                role: newStaff.role || 'Server',
                status: 'Active',
                shift: newStaff.shift || '09:00 AM - 05:00 PM',
                performance: 100,
                avatar: newStaff.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(newStaff.name)}&background=random`
            };

            const response = await fetch('/api/staff', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(staffData),
            });
            
            // Parse response safely
            const data: ApiResponse<Staff> = await response.json().catch(() => ({} as ApiResponse<Staff>));

            // Handle error responses
            if (!response.ok) {
                const errorMessage = data?.error || 
                                   data?.message || 
                                   'Failed to add staff';
                throw new Error(errorMessage);
            }

            // Handle success
            if (data.success && data.data) {
                setStaff(prevStaff => [data.data as Staff, ...prevStaff]);
                toast.success(data.message || 'Staff added successfully!', { id: loadingToast });
                setShowAddModal(false);
                return true;
            }

            // If we get here, the response format is unexpected
            throw new Error('Invalid response from server');

        } catch (error) {
            console.error('Error adding staff:', error);
            let errorMessage = 'Failed to add staff';
            
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            
            toast.error(errorMessage, { id: loadingToast });
            return false;
        }
    };



    const handleSaveShift = async (id: string, newShift: string) => {
        try {
            const response = await fetch(`/api/staff/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ shift: newShift }),
            });
            
            const data = await response.json();
            
            if (data.success) {
                setStaff(prevStaff => 
                    prevStaff.map(staff => 
                        staff.id === id ? { ...staff, shift: newShift } : staff
                    )
                );
                toast.success('Shift updated successfully!');
                setSelectedStaff(null);
                setIsEditShiftOpen(false);
            } else {
                throw new Error(data.error || 'Failed to update shift');
            }
        } catch (error) {
            console.error('Error updating shift:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            toast.error(`Failed to update shift: ${errorMessage}`);
        }
    };



    const handleDeleteStaff = async (staffToDelete: Staff) => {
        const loadingToast = toast.loading('Removing staff member...');
        
        try {
            const response = await fetch(`/api/staff/${staffToDelete._id}`, {
                method: 'DELETE',
            });
            
            const data = await response.json();
            
            if (data.success) {
                setStaff(prevStaff => prevStaff.filter(s => s._id !== staffToDelete._id));
                toast.success('Staff member removed successfully!', { id: loadingToast });
                setIsDeleteModalOpen(false);
                setSelectedStaff(null);
            } else {
                throw new Error(data.error || 'Failed to delete staff');
            }
        } catch (error: unknown) {
            console.error('Error deleting staff:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            toast.error(`Failed to delete staff: ${errorMessage}`, { id: loadingToast });
        }
    };

    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
    const [isEditShiftOpen, setIsEditShiftOpen] = useState(false);
    const [isViewProfileOpen, setIsViewProfileOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const openEditShift = (staff: Staff) => {
        setSelectedStaff(staff);
        setIsEditShiftOpen(true);
    };

    const openViewProfile = (staff: Staff) => {
        setSelectedStaff(staff);
        setIsViewProfileOpen(true);
    };

    const openDeleteModal = (staff: Staff) => {
        setSelectedStaff(staff);
        setIsDeleteModalOpen(true);
    };

    return (
        <div>
             {showAddModal && (
        <AddStaffModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddStaff}
        />
      )}
      
      {isEditShiftOpen && selectedStaff && (
        <EditShiftModal
          staff={selectedStaff}
          onClose={() => {
            setSelectedStaff(null);
            setIsEditShiftOpen(false);
          }}
          onSave={handleSaveShift}
        />
      )}
      
      {isViewProfileOpen && selectedStaff && (
        <ViewProfileModal
          staff={selectedStaff}
          onClose={() => {
            setSelectedStaff(null);
            setIsViewProfileOpen(false);
          }}
        />
      )}
      
      {isDeleteModalOpen && selectedStaff && (
        <DeleteConfirmModal
          staff={selectedStaff}
          onClose={() => {
            setSelectedStaff(null);
            setIsDeleteModalOpen(false);
          }}
          onConfirm={handleDeleteStaff}
        />
      )}
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Staff Management</h1>
                    <p className="text-[#9ca3af] mt-1">Manage your canteen staff and their schedules</p>
                </div>
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-[#FF512F] to-[#F09819] text-white rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-[#FF512F]/20 cursor-pointer"
                >
                    <PlusIcon className="w-5 h-5" />
                    Add New Staff
                </button>
             </div>

             {/* Stats Row */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                 <div

  className="bg-black/40 backdrop-blur-md border border-white/10 shadow-lg p-4 rounded-xl transition-all duration-500 hover:-translate-y-[3px] hover:scale-[1.015] hover:shadow-[0_12px_40px_rgba(255,81,47,0.25),0_0_30px_rgba(240,152,25,0.2)] hover:border-[rgba(255,81,47,0.35)]"
>
  <p className="text-[#9ca3af] text-xs font-bold uppercase">
    Total Staff
  </p>
  <p className="text-2xl font-bold text-white mt-1">
    {staff.length}
  </p>
</div>

                 <div className="bg-black/40 backdrop-blur-md border border-white/10 shadow-lg p-4 rounded-xl transition-all duration-500 hover:-translate-y-[3px] hover:scale-[1.015] hover:shadow-[0_12px_40px_rgba(255,81,47,0.25),0_0_30px_rgba(240,152,25,0.2)] hover:border-[rgba(255,81,47,0.35)]">
                     <p className="text-[#9ca3af] text-xs font-bold uppercase">Active Now</p>
                     <p className="text-2xl font-bold text-[#4CAF50] mt-1">{staff.filter(s => s.status === 'Active').length}</p>
                 </div>
                 <div className="bg-black/40 backdrop-blur-md border border-white/10 shadow-lg p-4 rounded-xl transition-all duration-500 hover:-translate-y-[3px] hover:scale-[1.015] hover:shadow-[0_12px_40px_rgba(255,81,47,0.25),0_0_30px_rgba(240,152,25,0.2)] hover:border-[rgba(255,81,47,0.35)]">
                     <p className="text-[#9ca3af] text-xs font-bold uppercase">On Leave</p>
                     <p className="text-2xl font-bold text-[#FF3D00] mt-1">{staff.filter(s => s.status === 'On Leave').length}</p>
                 </div>
                 <div className="bg-black/40 backdrop-blur-md border border-white/10 shadow-lg p-4 rounded-xl transition-all duration-500 hover:-translate-y-[3px] hover:scale-[1.015] hover:shadow-[0_12px_40px_rgba(255,81,47,0.25),0_0_30px_rgba(240,152,25,0.2)] hover:border-[rgba(255,81,47,0.35)]">
                     <p className="text-[#9ca3af] text-xs font-bold uppercase">Avg Performance</p>
                     <p className="text-2xl font-bold text-[#F09819] mt-1">
                        {staff.length > 0 
                            ? `${Math.round(staff.reduce((sum, s) => sum + (s.performance || 0), 0) / staff.length)}%`
                            : '0%'}
                    </p>
                 </div>
             </div>

             {/* Staff Grid */}
             {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="bg-white/5 rounded-2xl p-4 animate-pulse">
                <div className="w-full h-40 bg-gray-200/20 rounded-xl mb-4"></div>
                <div className="h-4 bg-gray-200/20 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200/20 rounded w-1/2 mb-3"></div>
                <div className="h-3 bg-gray-200/20 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : staff.length === 0 ? (
          <div className="text-center py-16 bg-white/5 rounded-xl border border-white/10">
            <p className="text-[#9ca3af]-400 mb-4">No staff members found</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2 bg-[#FF512F]/10 text-[#FF512F] rounded-lg hover:bg-[#FF512F]/20 transition-colors"
            >
              Add Your First Staff Member
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {staff.map((staffMember) => (
              <StaffCard
                key={staffMember._id}
                staff={staffMember}
                onEditShift={openEditShift}
                onViewProfile={openViewProfile}
                onDelete={openDeleteModal}
              />
            ))}
            <AddStaffCard 
              onClick={() => setShowAddModal(true)}
              className="hover:bg-white/5 transition-all duration-300 hover:shadow-lg hover:shadow-[#FF512F]/10 hover:border-[#FF512F]/30"
            />
          </div>
        )}
    </div>
);
};

export default StaffManagement;







