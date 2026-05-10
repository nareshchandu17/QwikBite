
import React, { useState, useEffect } from 'react';
import { 
    SecurityIcon, StaffIcon, NotificationIcon, InventoryIcon, 
    WorkflowIcon, DatabaseIcon, DangerIcon, SaveIcon, 
    ClockIcon, LogoutIcon, DownloadIcon, RefreshIcon 
} from './icons';

// --- Reusable Components ---

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }> = ({ checked, onChange, disabled = false }) => (
    <button 
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${checked ? 'bg-[#FF512F] shadow-[0 0 25px rgba(255, 81, 47, 0.4)]' : 'bg-white/10'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1) ${checked ? 'left-7' : 'left-1'}`}></div>
    </button>
);

const Section: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
    <div className="bg-[rgba(20,20,20,0.6)]
  backdrop-blur-[24px] [-webkit-backdrop-filter:blur(24px)]
  border border-[rgba(255,255,255,0.08)]
  shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-6 rounded-3xl border border-white/5 animate-fade-in-up mb-6">
        <div className="mb-6 border-b border-white/5 pb-4">
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <p className="text-sm text-[#9ca3af] mt-1">{description}</p>
        </div>
        <div className="space-y-6">
            {children}
        </div>
    </div>
);

const SettingRow: React.FC<{ label: string; subLabel?: string; children: React.ReactNode }> = ({ label, subLabel, children }) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
        <div className="flex-1">
            <h3 className="font-semibold text-white text-sm">{label}</h3>
            {subLabel && <p className="text-xs text-[#9ca3af] mt-1">{subLabel}</p>}
        </div>
        <div className="flex-shrink-0">
            {children}
        </div>
    </div>
);

// --- Settings Page Component ---

const Settings: React.FC = () => {
    const [activeSection, setActiveSection] = useState('profile');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [sessions, setSessions] = useState<unknown[]>([]);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // --- State Management ---
    const [profile, setProfile] = useState({ name: '', email: '', phone: '', role: '', avatar: '', lastLogin: '' });
    const [workflow, setWorkflow] = useState({ autoMoveToPreparing: false, maxPrepTimeMinutes: 15, autoFlagDelayed: false, allowAdminCancel: false });
    const [inventory, setInventory] = useState({ autoDeductOnOrder: false, lowStockThreshold: 10, autoDisableLowStock: false, allowNegativeStock: false });
    const [staff, setStaff] = useState({ roleBasedAccess: false, allowStaffCancel: false });
    const [notif, setNotif] = useState({ newOrderEmail: false, delayedOrderEmail: false, lowStockEmail: false, paymentFailureEmail: false, pushNotifications: false });
    const [security, setSecurity] = useState({ twoFactorAuth: false, autoLockMinutes: 15, sessionTimeoutMinutes: 60 });
    const [system, setSystem] = useState({ maintenanceMode: false, maxOrdersPerHour: 50, enableAnalytics: false, enableDebugMode: false });
    const [appearance, setAppearance] = useState({ theme: 'dark', primaryColor: '#FF512F', compactMode: false });
    const [backup, setBackup] = useState({ autoBackup: false, backupFrequency: 'daily', retentionDays: 30 });

    // Danger zone state
    const [showDangerModal, setShowDangerModal] = useState(false);
    const [dangerConfirmation, setDangerConfirmation] = useState('');
    const [currentDangerAction, setCurrentDangerAction] = useState('');

    // Load settings from API
    useEffect(() => {
        loadSettings();
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            const response = await fetch('/api/admin/settings/sessions');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setSessions(data.data.sessions || []);
                }
            }
        } catch (err) {
            console.error('Error loading sessions:', err);
        }
    };

    const loadSettings = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/settings');
            if (!response.ok) {
                throw new Error('Failed to load settings');
            }
            const data = await response.json();
            
            if (data.success) {
                setProfile(data.data.profile || {});
                if (data.data.settings) {
                    setWorkflow(data.data.settings.workflow || {});
                    setInventory(data.data.settings.inventory || {});
                    setStaff(data.data.settings.staff || {});
                    setNotif(data.data.settings.notifications || {});
                    setSecurity(data.data.settings.security || {});
                    setSystem(data.data.settings.system || {});
                    setAppearance(data.data.settings.appearance || {});
                    setBackup(data.data.settings.backup || {});
                }
            } else {
                throw new Error(data.error || 'Failed to load settings');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async (section: string, data: unknown) => {
        try {
            setSaving(true);
            const response = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ section, data }),
            });

            if (!response.ok) {
                throw new Error('Failed to save settings');
            }

            const result = await response.json();
            if (result.success) {
                // Reload settings to get latest data
                await loadSettings();
                setError(null); // Clear any previous errors
            } else {
                throw new Error(result.error || 'Failed to save settings');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (passwordForm.newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        try {
            setSaving(true);
            const response = await fetch('/api/admin/settings/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword,
                }),
            });

            const result = await response.json();
            if (result.success) {
                setShowPasswordModal(false);
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setError(null);
            } else {
                throw new Error(result.error || 'Failed to change password');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to change password');
        } finally {
            setSaving(false);
        }
    };

    const handleRevokeSession = async (sessionId: string) => {
        try {
            const response = await fetch('/api/admin/settings/sessions', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sessionId }),
            });

            const result = await response.json();
            if (result.success) {
                await loadSessions(); // Reload sessions
                setError(null);
            } else {
                throw new Error(result.error || 'Failed to revoke session');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to revoke session');
        }
    };

    // Danger zone functions
    const handleDangerAction = (action: string) => {
        setCurrentDangerAction(action);
        setDangerConfirmation('');
        setShowDangerModal(true);
    };

    const getDangerModalContent = () => {
        switch (currentDangerAction) {
            case 'emergencyStop':
                return 'This will immediately pause all incoming orders and refund pending payments. This action cannot be undone.';
            case 'resetAllSettings':
                return 'This will reset all settings to factory defaults. All your custom configurations will be permanently lost.';
            case 'clearAllData':
                return 'This will permanently delete ALL orders, customers, products, and business data. A final backup will be created before deletion. This action cannot be undone.';
            case 'deleteAccount':
                return 'This will permanently delete your admin account and all associated data. You will lose access to this system forever.';
            default:
                return 'Are you sure you want to proceed with this dangerous action?';
        }
    };

    const getDangerButtonText = () => {
        switch (currentDangerAction) {
            case 'emergencyStop':
                return 'STOP SYSTEM';
            case 'resetAllSettings':
                return 'RESET SETTINGS';
            case 'clearAllData':
                return 'DELETE ALL DATA';
            case 'deleteAccount':
                return 'DELETE ACCOUNT';
            default:
                return 'EXECUTE ACTION';
        }
    };

    const executeDangerAction = async () => {
        if (dangerConfirmation !== 'DELETE') return;

        try {
            const response = await fetch('/api/admin/settings/danger', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: currentDangerAction,
                    confirmation: dangerConfirmation
                }),
            });

            const result = await response.json();
            if (result.success) {
                setShowDangerModal(false);
                setDangerConfirmation('');
                setCurrentDangerAction('');
                setError(null);
                // You might want to show a success message or redirect
                console.log('Danger action completed:', result.message);
            } else {
                throw new Error(result.error || 'Failed to execute danger action');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to execute danger action');
        }
    };
    
    const sections = [
        { id: 'profile', label: 'Profile & Account', icon: <div className="w-5 h-5 rounded-full border-2 border-current"></div> },
        { id: 'workflow', label: 'Order Workflow', icon: <WorkflowIcon className="w-5 h-5" /> },
        { id: 'inventory', label: 'Inventory Rules', icon: <InventoryIcon className="w-5 h-5" /> },
        { id: 'staff', label: 'Staff & Access', icon: <StaffIcon className="w-5 h-5" /> },
        { id: 'notifications', label: 'Notifications', icon: <NotificationIcon className="w-5 h-5" /> },
        { id: 'security', label: 'Security', icon: <SecurityIcon className="w-5 h-5" /> },
        { id: 'system', label: 'System Controls', icon: <ClockIcon className="w-5 h-5" /> },
        { id: 'data', label: 'Data & Maintenance', icon: <DatabaseIcon className="w-5 h-5" /> },
        { id: 'danger', label: 'Danger Zone', icon: <DangerIcon className="w-5 h-5" /> },
    ];

    const renderContent = () => {
        switch (activeSection) {
            case 'profile':
                return (
                    <Section title="Profile & Account Management" description="Manage your identity and accountability.">
                        <div className="flex items-center gap-6 mb-8">
                            <div className="relative group cursor-pointer">
                                <img src="https://picsum.photos/id/237/200/200" className="w-24 h-24 rounded-full border-4 border-white/10 object-cover" alt="Profile" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs font-bold text-white">Change</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">{profile.name}</h3>
                                <p className="text-[#FF512F] text-xs font-bold uppercase tracking-widest mt-1">Super Admin</p>
                                <p className="text-[#9ca3af] text-xs mt-1">Last active: Just now</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs font-bold uppercase text-[#9ca3af] tracking-wider mb-2 block">Display Name</label>
                                <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none transition-colors" />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-[#9ca3af] tracking-wider mb-2 block">Contact Email</label>
                                <input type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none transition-colors" />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-[#9ca3af] tracking-wider mb-2 block">Phone Number</label>
                                <input type="text" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[#FF512F] outline-none transition-colors" />
                            </div>
                             <div>
                                <label className="text-xs font-bold uppercase text-[#9ca3af] tracking-wider mb-2 block">Password</label>
                                <button 
                                    onClick={() => setShowPasswordModal(true)}
                                    className="w-full bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl p-3 text-white text-left font-medium transition-colors flex justify-between items-center"
                                >
                                    <span>••••••••••••</span>
                                    <span className="text-xs text-[#FF512F] font-bold">Change</span>
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 border-t border-white/5 pt-6">
                            <h4 className="text-sm font-bold text-white mb-4">Active Sessions</h4>
                            <div className="space-y-3">
                                {sessions.map((session) => (
                                    <div key={session.id} className={`flex justify-between items-center p-3 bg-white/5 rounded-xl ${!session.isActive ? 'opacity-60' : ''}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 ${session.isActive ? 'bg-[#4CAF50] animate-pulse' : 'bg-[#9ca3af]'} rounded-full`}></div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{session.device}</p>
                                                <p className="text-xs text-[#9ca3af]">{session.location} • {session.isCurrent ? 'Current Session' : session.lastActive}</p>
                                            </div>
                                        </div>
                                        {!session.isCurrent && (
                                            <button 
                                                onClick={() => handleRevokeSession(session.id)}
                                                className="text-xs text-[#FF3D00] hover:text-white transition-colors"
                                            >
                                                Revoke
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Section>
                );
            case 'workflow':
                return (
                    <Section title="Order Workflow Settings" description="Control how orders move through the system automatically.">
                        <SettingRow label="Auto-Advance Status" subLabel="Automatically move orders to 'Preparing' after payment confirmation.">
                            <ToggleSwitch checked={workflow.autoMoveToPreparing} onChange={c => setWorkflow({...workflow, autoMoveToPreparing: c})} />
                        </SettingRow>
                        <SettingRow label="Max Preparation Time" subLabel="Time in minutes before an order is flagged as 'Delayed'.">
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number" 
                                    value={workflow.maxPrepTimeMinutes || 15}
                                    onChange={e => {
                                        const value = parseInt(e.target.value, 10);
                                        setWorkflow({...workflow, maxPrepTimeMinutes: isNaN(value) || value < 1 ? 15 : Math.min(120, value)});
                                    }} 
                                    className="w-20 bg-white/5 border border-white/10 rounded-lg p-2 text-center text-white font-mono focus:border-primary outline-none transition-colors"
                                    min="1"
                                    max="120"
                                    step="1"
                                />
                                <span className="text-sm text-[#9ca3af]">min</span>
                                {(workflow.maxPrepTimeMinutes < 5 || workflow.maxPrepTimeMinutes > 60) && (
                                    <span className="text-xs text-yellow-400 ml-2">⚠️ Unusual value</span>
                                )}
                            </div>
                        </SettingRow>
                        <SettingRow label="Auto-Delay Flagging" subLabel="Automatically mark orders as 'Delayed' if prep time is exceeded.">
                            <ToggleSwitch checked={workflow.autoFlagDelayed} onChange={c => setWorkflow({...workflow, autoFlagDelayed: c})} />
                        </SettingRow>
                        <SettingRow label="Strict Cancellation Policy" subLabel="Only Admins can cancel orders once they are in 'Preparing' state.">
                            <ToggleSwitch checked={workflow.allowAdminCancel} onChange={c => setWorkflow({...workflow, allowAdminCancel: c})} />
                        </SettingRow>
                        
                        {/* Workflow Preview */}
                        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                            <h4 className="text-sm font-bold text-white mb-3">Workflow Preview</h4>
                            <div className="space-y-2 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${workflow.autoMoveToPreparing ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                    <span className="text-[#9ca3af]">Payment → {workflow.autoMoveToPreparing ? 'Auto-advance to Preparing' : 'Manual confirmation required'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${workflow.autoFlagDelayed ? 'bg-yellow-500' : 'bg-gray-500'}`}></div>
                                    <span className="text-[#9ca3af]">Delay detection: {workflow.autoFlagDelayed ? `Auto-flag after ${workflow.maxPrepTimeMinutes}min` : 'Manual flagging only'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${workflow.allowAdminCancel ? 'bg-red-500' : 'bg-gray-500'}`}></div>
                                    <span className="text-[#9ca3af]">Cancellation: {workflow.allowAdminCancel ? 'Admin-only in Preparing' : 'Staff can cancel anytime'}</span>
                                </div>
                            </div>
                        </div>
                    </Section>
                );
            case 'inventory':
                return (
                    <Section title="Inventory & Stock Rules" description="Automate stock deduction and availability to prevent overselling.">
                        <SettingRow label="Auto-Deduct Inventory" subLabel="Reduce stock count immediately upon order confirmation.">
                            <ToggleSwitch checked={inventory.autoDeductOnOrder} onChange={c => setInventory({...inventory, autoDeductOnOrder: c})} />
                        </SettingRow>
                        <SettingRow label="Low Stock Threshold" subLabel="Quantity at which a 'Low Stock' alert is triggered.">
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number" 
                                    value={inventory.lowStockThreshold || 10} 
                                    onChange={e => {
                                        const value = parseInt(e.target.value, 10);
                                        setInventory({...inventory, lowStockThreshold: isNaN(value) || value < 0 ? 10 : Math.min(1000, value)});
                                    }} 
                                    className="w-20 bg-white/5 border border-white/10 rounded-lg p-2 text-center text-white font-mono focus:border-primary outline-none transition-colors"
                                    min="0"
                                    max="1000"
                                    step="1"
                                />
                                <span className="text-sm text-[#9ca3af]">units</span>
                                {inventory.lowStockThreshold > 100 && (
                                    <span className="text-xs text-yellow-400 ml-2">⚠️ High threshold</span>
                                )}
                            </div>
                        </SettingRow>
                        <SettingRow label="Auto-Disable Items" subLabel="Hide items from the menu when stock reaches zero.">
                            <ToggleSwitch checked={inventory.autoDisableLowStock} onChange={c => setInventory({...inventory, autoDisableLowStock: c})} />
                        </SettingRow>
                        <SettingRow label="Allow Negative Stock" subLabel="Allow ordering even if stock count is zero (not recommended).">
                            <ToggleSwitch 
                                checked={inventory.allowNegativeStock} 
                                onChange={c => {
                                    // Business rule: can&apos;t allow negative stock if auto-disable is enabled
                                    if (c && inventory.autoDisableLowStock) {
                                        setError('Cannot allow negative stock while auto-disabling low stock items');
                                        return;
                                    }
                                    setInventory({...inventory, allowNegativeStock: c});
                                    setError(null);
                                }} 
                            />
                            {inventory.allowNegativeStock && (
                                <span className="text-xs text-yellow-400 ml-2">⚠️ Risk of overselling</span>
                            )}
                        </SettingRow>
                        
                        {/* Inventory Rules Preview */}
                        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                            <h4 className="text-sm font-bold text-white mb-3">Inventory Rules Preview</h4>
                            <div className="space-y-2 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${inventory.autoDeductOnOrder ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                    <span className="text-[#9ca3af]">Stock deduction: {inventory.autoDeductOnOrder ? 'Automatic on order' : 'Manual tracking'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${inventory.lowStockThreshold > 0 ? 'bg-yellow-500' : 'bg-gray-500'}`}></div>
                                    <span className="text-[#9ca3af]">Low stock alerts: {inventory.lowStockThreshold > 0 ? `Trigger at ${inventory.lowStockThreshold} units` : 'Disabled'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${inventory.autoDisableLowStock ? 'bg-red-500' : 'bg-gray-500'}`}></div>
                                    <span className="text-[#9ca3af]">Item availability: {inventory.autoDisableLowStock ? 'Auto-hide at zero stock' : 'Always visible'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${inventory.allowNegativeStock ? 'bg-orange-500' : 'bg-gray-500'}`}></div>
                                    <span className="text-[#9ca3af]">Overselling protection: {inventory.allowNegativeStock ? 'Disabled (allows negative stock)' : 'Enabled (prevents overselling)'}</span>
                                </div>
                            </div>
                            
                            {/* Conflict Warning */}
                            {inventory.allowNegativeStock && inventory.autoDisableLowStock && (
                                <div className="mt-3 p-2 bg-red-500/20 border border-red-500/50 rounded-lg">
                                    <p className="text-red-500 text-xs">⚠️ Conflict: Cannot allow negative stock while auto-disabling items</p>
                                </div>
                            )}
                        </div>
                    </Section>
                );
             case 'staff':
                return (
                    <Section title="Staff & Access Control" description="Manage permissions and role-based access security.">
                        <div className="bg-[#FF512F]/10 border border-[#FF512F]/20 p-4 rounded-xl mb-6">
                            <p className="text-sm text-[#FF512F] font-medium flex items-center gap-2">
                                <StaffIcon className="w-4 h-4" />
                                Staff management is handled in the dedicated Staff tab. These are global policies.
                            </p>
                        </div>
                        <SettingRow label="Strict Role Enforcement" subLabel="Prevent staff from accessing features outside their role scope.">
                             <ToggleSwitch checked={staff.roleBasedAccess} onChange={c => setStaff({...staff, roleBasedAccess: c})} />
                        </SettingRow>
                         <SettingRow label="Staff Cancellation Rights" subLabel="Allow non-admin staff to cancel active orders.">
                             <ToggleSwitch checked={staff.allowStaffCancel} onChange={c => setStaff({...staff, allowStaffCancel: c})} />
                        </SettingRow>
                         <SettingRow label="Shift-Based Access" subLabel="Automatically lock staff accounts outside their scheduled shift hours.">
                             <ToggleSwitch checked={true} onChange={() => {}} disabled={true} />
                             <span className="text-xs text-[#9ca3af] ml-2">Feature coming soon</span>
                        </SettingRow>
                        
                        {/* Staff Access Preview */}
                        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                            <h4 className="text-sm font-bold text-white mb-3">Staff Access Preview</h4>
                            <div className="space-y-2 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${staff.roleBasedAccess ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                    <span className="text-[#9ca3af]">Role enforcement: {staff.roleBasedAccess ? 'Strict - role-based access only' : 'Flexible - cross-role access allowed'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${staff.allowStaffCancel ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                    <span className="text-[#9ca3af]">Order cancellation: {staff.allowStaffCancel ? 'Staff can cancel orders' : 'Admin-only cancellation'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                    <span className="text-[#9ca3af]">Shift-based access: Enabled (automatic lock outside shifts)</span>
                                </div>
                            </div>
                            
                            {/* Access Matrix */}
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <h5 className="text-xs font-bold text-white mb-2">Permission Matrix</h5>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div className="text-center">
                                        <div className="font-bold text-white mb-1">Cashier</div>
                                        <div className="space-y-1">
                                            <div className={`${staff.roleBasedAccess ? 'text-gray-500' : 'text-green-400'}`}>Orders: {staff.roleBasedAccess ? 'Limited' : 'Full'}</div>
                                            <div className={`${staff.allowStaffCancel ? 'text-green-400' : 'text-red-400'}`}>Cancel: {staff.allowStaffCancel ? 'Allowed' : 'Denied'}</div>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-bold text-white mb-1">Kitchen</div>
                                        <div className="space-y-1">
                                            <div className={`${staff.roleBasedAccess ? 'text-green-400' : 'text-gray-500'}`}>Orders: {staff.roleBasedAccess ? 'Full' : 'Limited'}</div>
                                            <div className={`${staff.allowStaffCancel ? 'text-green-400' : 'text-red-400'}`}>Cancel: {staff.allowStaffCancel ? 'Allowed' : 'Denied'}</div>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-bold text-white mb-1">Admin</div>
                                        <div className="space-y-1">
                                            <div className="text-green-400">Orders: Full</div>
                                            <div className="text-green-400">Cancel: Full</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Section>
                );
            case 'notifications':
                 return (
                    <Section title="Notifications & Alerts" description="Configure which events trigger system alerts.">
                        <SettingRow label="New Order Alert" subLabel="Trigger sound and popup for incoming orders.">
                             <ToggleSwitch checked={notif.newOrderEmail} onChange={c => setNotif({...notif, newOrderEmail: c})} />
                        </SettingRow>
                        <SettingRow label="Delayed Order Alert" subLabel="Notify when an order exceeds prep time.">
                             <ToggleSwitch checked={notif.delayedOrderEmail} onChange={c => setNotif({...notif, delayedOrderEmail: c})} />
                        </SettingRow>
                         <SettingRow label="Low Inventory Warning" subLabel="Notify when items hit the low stock threshold.">
                             <ToggleSwitch checked={notif.lowStockEmail} onChange={c => setNotif({...notif, lowStockEmail: c})} />
                        </SettingRow>
                         <SettingRow label="Payment Failure" subLabel="Alert on failed transactions.">
                             <ToggleSwitch checked={notif.paymentFailureEmail} onChange={c => setNotif({...notif, paymentFailureEmail: c})} />
                        </SettingRow>
                         <div className="h-px bg-white/10 my-4"></div>
                         <SettingRow label="Email Digests" subLabel="Send daily summary reports to admin email.">
                             <ToggleSwitch checked={notif.pushNotifications} onChange={c => setNotif({...notif, pushNotifications: c})} />
                        </SettingRow>
                        
                        {/* Notifications Preview */}
                        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                            <h4 className="text-sm font-bold text-white mb-3">Active Notifications</h4>
                            <div className="space-y-2 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${notif.newOrderEmail ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                    <span className="text-[#9ca3af]">New Orders: {notif.newOrderEmail ? 'Enabled (sound + popup)' : 'Disabled'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${notif.delayedOrderEmail ? 'bg-yellow-500' : 'bg-gray-500'}`}></div>
                                    <span className="text-[#9ca3af]">Delayed Orders: {notif.delayedOrderEmail ? 'Enabled (email alerts)' : 'Disabled'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${notif.lowStockEmail ? 'bg-orange-500' : 'bg-gray-500'}`}></div>
                                    <span className="text-[#9ca3af]">Low Stock: {notif.lowStockEmail ? 'Enabled (instant alerts)' : 'Disabled'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${notif.paymentFailureEmail ? 'bg-red-500' : 'bg-gray-500'}`}></div>
                                    <span className="text-[#9ca3af]">Payment Failures: {notif.paymentFailureEmail ? 'Enabled (critical alerts)' : 'Disabled'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${notif.pushNotifications ? 'bg-blue-500' : 'bg-gray-500'}`}></div>
                                    <span className="text-[#9ca3af]">Email Digests: {notif.pushNotifications ? 'Enabled (daily reports)' : 'Disabled'}</span>
                                </div>
                            </div>
                            
                            {/* Notification Summary */}
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-[#9ca3af]">Total Active Notifications:</span>
                                    <span className="text-xs font-bold text-white">
                                        {Object.values(notif).filter(Boolean).length} / {Object.values(notif).length}
                                    </span>
                                </div>
                                {Object.values(notif).filter(Boolean).length === 0 && (
                                    <div className="mt-2 p-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                                        <p className="text-yellow-500 text-xs">⚠️ No notifications enabled - you may miss important events</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Section>
                );
            case 'security':
                 return (
                    <Section title="Security Basics" description="Protect your admin panel from unauthorized access.">
                         <SettingRow label="Two-Factor Authentication (2FA)" subLabel="Require an OTP code for login.">
                             <ToggleSwitch checked={security.twoFactorAuth} onChange={c => setSecurity({...security, twoFactorAuth: c})} />
                             {security.twoFactorAuth && (
                                <span className="text-xs text-green-400 ml-2">✓ Enhanced security</span>
                             )}
                        </SettingRow>
                         <SettingRow label="Auto-Lock Inactivity" subLabel="Automatically lock the screen after X minutes of inactivity.">
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number" 
                                    value={security.autoLockMinutes !== undefined && security.autoLockMinutes !== null ? security.autoLockMinutes : 15}
                                    onChange={e => {
                                        const value = parseInt(e.target.value, 10);
                                        setSecurity(prev => ({
                                            ...prev, 
                                            autoLockMinutes: isNaN(value) ? 15 : Math.max(1, Math.min(120, value))
                                        }));
                                    }} 
                                    className="w-20 bg-white/5 border border-white/10 rounded-lg p-2 text-center text-white font-mono focus:border-primary outline-none transition-colors"
                                    min="1"
                                    max="120"
                                    step="1"
                                />
                                <span className="text-sm text-[#9ca3af]">min</span>
                                {(security.autoLockMinutes < 5 || security.autoLockMinutes > 60) && (
                                    <span className="text-xs text-yellow-400 ml-2">⚠️ Unusual value</span>
                                )}
                            </div>
                        </SettingRow>
                        <SettingRow label="Session Timeout" subLabel="Automatically logout after X minutes of inactivity.">
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number" 
                                    value={security.sessionTimeoutMinutes !== undefined && security.sessionTimeoutMinutes !== null ? security.sessionTimeoutMinutes : 60}
                                    onChange={e => {
                                        const value = parseInt(e.target.value, 10);
                                        setSecurity(prev => ({
                                            ...prev, 
                                            sessionTimeoutMinutes: isNaN(value) ? 60 : Math.max(5, Math.min(480, value))
                                        }));
                                    }} 
                                    className="w-20 bg-white/5 border border-white/10 rounded-lg p-2 text-center text-white font-mono focus:border-primary outline-none transition-colors"
                                    min="5"
                                    max="480"
                                    step="5"
                                />
                                <span className="text-sm text-[#9ca3af]">min</span>
                            </div>
                        </SettingRow>
                        
                        {/* Security Status */}
                        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                            <h4 className="text-sm font-bold text-white mb-3">Security Status</h4>
                            <div className="space-y-2 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${security.twoFactorAuth ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    <span className="text-[#9ca3af]">2FA Protection: {security.twoFactorAuth ? 'Enabled' : 'Disabled (vulnerable)'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${security.autoLockMinutes <= 15 ? 'bg-green-500' : security.autoLockMinutes <= 30 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                    <span className="text-[#9ca3af]">Auto-Lock: {security.autoLockMinutes}min ({security.autoLockMinutes <= 15 ? 'Secure' : security.autoLockMinutes <= 30 ? 'Moderate' : 'Weak'})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${security.sessionTimeoutMinutes <= 60 ? 'bg-green-500' : security.sessionTimeoutMinutes <= 120 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                    <span className="text-[#9ca3af]">Session Timeout: {security.sessionTimeoutMinutes}min ({security.sessionTimeoutMinutes <= 60 ? 'Secure' : security.sessionTimeoutMinutes <= 120 ? 'Moderate' : 'Extended'})</span>
                                </div>
                            </div>
                            
                            {/* Security Score */}
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-[#9ca3af]">Security Score:</span>
                                    <span className={`text-xs font-bold ${
                                        (security.twoFactorAuth ? 40 : 0) + 
                                        (security.autoLockMinutes <= 15 ? 30 : security.autoLockMinutes <= 30 ? 20 : 10) + 
                                        (security.sessionTimeoutMinutes <= 60 ? 30 : security.sessionTimeoutMinutes <= 120 ? 20 : 10) >= 80 
                                        ? 'text-green-400' 
                                        : 'text-yellow-400'
                                    }`}>
                                        {((security.twoFactorAuth ? 40 : 0) + 
                                          (security.autoLockMinutes <= 15 ? 30 : security.autoLockMinutes <= 30 ? 20 : 10) + 
                                          (security.sessionTimeoutMinutes <= 60 ? 30 : security.sessionTimeoutMinutes <= 120 ? 20 : 10))}/100
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-6">
                            <h4 className="text-sm font-bold text-white mb-4">Login Activity Log</h4>
                            <div className="text-xs text-neutral bg-black/20 p-4 rounded-xl font-mono space-y-2 border border-white/5">
                                <div className="flex justify-between"><span>SUCCESS</span> <span>192.168.1.1</span> <span>Today, 09:00 AM</span></div>
                                <div className="flex justify-between text-red-400"><span>FAILED</span> <span>103.45.22.12</span> <span>Yesterday, 11:45 PM</span></div>
                                <div className="flex justify-between"><span>SUCCESS</span> <span>192.168.1.1</span> <span>Yesterday, 08:30 AM</span></div>
                            </div>
                        </div>
                    </Section>
                );
            case 'system':
                return (
                     <Section title="System Controls" description="Manage operational hours and capacity load.">
                        <SettingRow label="Maintenance Mode" subLabel="Pause all user-facing apps and show 'Under Maintenance' screen.">
                             <ToggleSwitch checked={system.maintenanceMode} onChange={c => setSystem({...system, maintenanceMode: c})} />
                             {system.maintenanceMode && (
                                <span className="text-xs text-red-400 ml-2">⚠️ System in maintenance</span>
                             )}
                        </SettingRow>
                         <SettingRow label="Operating Hours" subLabel="Automatically stop accepting orders outside these hours.">
                             <div className="flex gap-2">
                                <input type="time" defaultValue="09:00" className="bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-primary outline-none transition-colors" />
                                <span className="self-center text-[#9ca3af]">-</span>
                                <input type="time" defaultValue="21:00" className="bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-primary outline-none transition-colors" />
                             </div>
                        </SettingRow>
                        <SettingRow label="Max Orders Per Slot" subLabel="Cap the number of orders per 15-minute slot to prevent overload.">
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number" 
                                    value={system.maxOrdersPerHour !== undefined && system.maxOrdersPerHour !== null ? system.maxOrdersPerHour : 50}
                                    onChange={e => {
                                        const value = parseInt(e.target.value, 10);
                                        setSystem({...system, maxOrdersPerHour: isNaN(value) ? 50 : Math.max(1, Math.min(1000, value))});
                                    }} 
                                    className="w-20 bg-white/5 border border-white/10 rounded-lg p-2 text-center text-white font-mono focus:border-primary outline-none transition-colors"
                                    min="1"
                                    max="1000"
                                    step="1"
                                />
                                <span className="text-sm text-[#9ca3af]">orders</span>
                                {system.maxOrdersPerHour > 200 && (
                                    <span className="text-xs text-yellow-400 ml-2">⚠️ High capacity</span>
                                )}
                            </div>
                        </SettingRow>
                        <SettingRow label="Enable Analytics" subLabel="Track usage patterns and generate insights.">
                             <ToggleSwitch checked={system.enableAnalytics} onChange={c => setSystem({...system, enableAnalytics: c})} />
                             {system.enableAnalytics && (
                                <span className="text-xs text-green-400 ml-2">✓ Analytics active</span>
                             )}
                        </SettingRow>
                        <SettingRow label="Debug Mode" subLabel="Enable detailed logging for troubleshooting (dev only).">
                             <ToggleSwitch checked={system.enableDebugMode} onChange={c => setSystem({...system, enableDebugMode: c})} />
                             {system.enableDebugMode && (
                                <span className="text-xs text-yellow-400 ml-2">⚠️ Debug enabled</span>
                             )}
                        </SettingRow>
                        
                        {/* System Status */}
                        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                            <h4 className="text-sm font-bold text-white mb-3">System Status</h4>
                            <div className="space-y-2 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${system.maintenanceMode ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                    <span className="text-[#9ca3af]">System Status: {system.maintenanceMode ? 'Maintenance Mode' : 'Operational'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full bg-blue-500`}></div>
                                    <span className="text-[#9ca3af]">Operating Hours: 09:00 - 21:00 (12 hours)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${system.maxOrdersPerHour <= 50 ? 'bg-green-500' : system.maxOrdersPerHour <= 100 ? 'bg-yellow-500' : 'bg-orange-500'}`}></div>
                                    <span className="text-[#9ca3af]">Order Capacity: {system.maxOrdersPerHour}/slot ({system.maxOrdersPerHour <= 50 ? 'Low' : system.maxOrdersPerHour <= 100 ? 'Medium' : 'High'})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${system.enableAnalytics ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                    <span className="text-[#9ca3af]">Analytics: {system.enableAnalytics ? 'Enabled (tracking active)' : 'Disabled'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${system.enableDebugMode ? 'bg-yellow-500' : 'bg-gray-500'}`}></div>
                                    <span className="text-[#9ca3af]">Debug Mode: {system.enableDebugMode ? 'Enabled (verbose logging)' : 'Disabled'}</span>
                                </div>
                            </div>
                            
                            {/* System Health */}
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-[#9ca3af]">System Health:</span>
                                    <span className={`text-xs font-bold ${
                                        system.maintenanceMode 
                                        ? 'text-red-400' 
                                        : (system.enableDebugMode ? 'text-yellow-400' : 'text-green-400')
                                    }`}>
                                        {system.maintenanceMode ? 'Maintenance' : (system.enableDebugMode ? 'Debug Mode' : 'Healthy')}
                                    </span>
                                </div>
                            </div>
                        </div>
                     </Section>
                );
            case 'data':
                return (
                     <Section title="Data & Maintenance" description="Manage system logs, backups, and data exports.">
                        <SettingRow label="Auto-Backup" subLabel="Automatically backup system data at scheduled intervals.">
                            <ToggleSwitch checked={backup.autoBackup} onChange={c => setBackup({...backup, autoBackup: c})} />
                        </SettingRow>
                        {backup.autoBackup && (
                            <SettingRow label="Backup Frequency" subLabel="How often to create automatic backups.">
                                <select 
                                    value={backup.backupFrequency}
                                    onChange={e => setBackup({...backup, backupFrequency: e.target.value})}
                                    className="bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-primary outline-none transition-colors"
                                >
                                    <option value="daily" className="bg-gray-800">Daily</option>
                                    <option value="weekly" className="bg-gray-800">Weekly</option>
                                    <option value="monthly" className="bg-gray-800">Monthly</option>
                                </select>
                            </SettingRow>
                        )}
                        <SettingRow label="Data Retention" subLabel="Keep backup files for this many days before deletion.">
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number" 
                                    value={backup.retentionDays !== undefined && backup.retentionDays !== null ? backup.retentionDays : 30}
                                    onChange={e => {
                                        const value = parseInt(e.target.value, 10);
                                        setBackup({...backup, retentionDays: isNaN(value) ? 30 : Math.max(7, Math.min(365, value))});
                                    }} 
                                    className="w-20 bg-white/5 border border-white/10 rounded-lg p-2 text-center text-white font-mono focus:border-primary outline-none transition-colors"
                                    min="7"
                                    max="365"
                                    step="1"
                                />
                                <span className="text-sm text-[#9ca3af]">days</span>
                            </div>
                        </SettingRow>
                        
                        {/* Data Management Actions */}
                        <div className="mt-6">
                            <h4 className="text-sm font-bold text-white mb-4">Data Management</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <button className="flex items-center justify-center gap-2 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors group">
                                    <DownloadIcon className="w-5 h-5 text-[#FF512F] group-hover:scale-110 transition-transform" />
                                    <div className="text-left">
                                        <span className="text-sm font-bold text-white block">Export Orders</span>
                                        <span className="text-xs text-[#9ca3af]">Download CSV file</span>
                                    </div>
                                </button>
                                <button className="flex items-center justify-center gap-2 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors group">
                                    <RefreshIcon className="w-5 h-5 text-[#F09819] group-hover:scale-110 transition-transform" />
                                    <div className="text-left">
                                        <span className="text-sm font-bold text-white block">Clear Cache</span>
                                        <span className="text-xs text-[#9ca3af]">Free up memory</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                        
                        {/* Backup Status */}
                        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                            <h4 className="text-sm font-bold text-white mb-3">Backup Status</h4>
                            <div className="space-y-2 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${backup.autoBackup ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                    <span className="text-[#9ca3af]">Auto-Backup: {backup.autoBackup ? `Enabled (${backup.backupFrequency})` : 'Disabled'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${backup.retentionDays <= 30 ? 'bg-green-500' : backup.retentionDays <= 90 ? 'bg-yellow-500' : 'bg-orange-500'}`}></div>
                                    <span className="text-[#9ca3af]">Retention: {backup.retentionDays} days ({backup.retentionDays <= 30 ? 'Short-term' : backup.retentionDays <= 90 ? 'Medium-term' : 'Long-term'})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                    <span className="text-[#9ca3af]">Last Backup: 2 hours ago</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                                    <span className="text-[#9ca3af]">Storage Used: 2.3 GB / 10 GB</span>
                                </div>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-[#9ca3af]">Next Backup:</span>
                                    <span className="text-xs font-bold text-white">
                                        {backup.autoBackup ? `In ${backup.backupFrequency === 'daily' ? '22' : backup.backupFrequency === 'weekly' ? '6' : '29'} days` : 'Not scheduled'}
                                    </span>
                                </div>
                            </div>
                        </div>
                     </Section>
                );
             case 'danger':
                return (
                     <Section title="Danger Zone" description="Irreversible actions. Proceed with extreme caution.">
                        <div className="border border-[#FF3D00]/30 bg-[#FF3D00]/5 rounded-2xl overflow-hidden">
                             <div className="p-4 border-b border-[#FF3D00]/10 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-white">Emergency Stop</h3>
                                    <p className="text-xs text-[#9ca3af]">Immediately pause all incoming orders and refund pending payments.</p>
                                </div>
                                <button 
                                    onClick={() => handleDangerAction('emergencyStop')}
                                    className="bg-[#FF3D00] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-600 transition-colors"
                                >
                                    PANIC STOP
                                </button>
                             </div>
                             <div className="p-4 border-b border-[#FF3D00]/10 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-white">Reset All Settings</h3>
                                    <p className="text-xs text-[#9ca3af]">Restore all settings to factory defaults. Custom configurations will be lost.</p>
                                </div>
                                <button 
                                    onClick={() => handleDangerAction('resetAllSettings')}
                                    className="border border-[#FF3D00] text-[#FF3D00] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#FF3D00]/10 transition-colors"
                                >
                                    Reset Settings
                                </button>
                             </div>
                             <div className="p-4 border-b border-[#FF3D00]/10 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-white">Clear All Data</h3>
                                    <p className="text-xs text-[#9ca3af]">Permanently delete all orders, customers, and business data. Cannot be undone.</p>
                                </div>
                                <button 
                                    onClick={() => handleDangerAction('clearAllData')}
                                    className="border border-[#FF3D00] text-[#FF3D00] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#FF3D00]/10 transition-colors"
                                >
                                    Clear Data
                                </button>
                             </div>
                             <div className="p-4 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-white">Delete Account</h3>
                                    <p className="text-xs text-[#9ca3af]">Permanently delete your admin account and all associated data.</p>
                                </div>
                                <button 
                                    onClick={() => handleDangerAction('deleteAccount')}
                                    className="border border-red-600 text-red-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-600/10 transition-colors"
                                >
                                    Delete Account
                                </button>
                             </div>
                        </div>
                        
                        {/* Confirmation Modal */}
                        {showDangerModal && (
                            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                                <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <DangerIcon className="w-6 h-6 text-red-500" />
                                        <h3 className="text-xl font-bold text-white">Confirm Dangerous Action</h3>
                                    </div>
                                    <p className="text-sm text-[#9ca3af] mb-6">
                                        {getDangerModalContent()}
                                    </p>
                                    <div className="mb-4">
                                        <label className="text-xs text-[#9ca3af] block mb-2">
                                            Type "DELETE" to confirm this action:
                                        </label>
                                        <input
                                            type="text"
                                            value={dangerConfirmation}
                                            onChange={(e) => setDangerConfirmation(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white font-mono text-sm focus:border-red-500 outline-none transition-colors"
                                            placeholder="DELETE"
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowDangerModal(false)}
                                            className="flex-1 bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-white/20 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={executeDangerAction}
                                            disabled={dangerConfirmation !== 'DELETE'}
                                            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {getDangerButtonText()}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                     </Section>
                );
            default:
                return null;
        }
    };

    return (
        <div className="h-full flex flex-col md:flex-row gap-6 animate-fade-in-up">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 flex-shrink-0">
                <div className="sticky top-0 space-y-1">
                    <h1 className="text-3xl font-black text-white mb-6 px-2">Settings</h1>
                    {sections.map(section => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                                activeSection === section.id 
                                ? 'bg-white text-black shadow-lg scale-[1.02] font-bold' 
                                : 'text-[#9ca3af] hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <span className={activeSection === section.id ? 'text-black' : section.id === 'danger' ? 'text-alert' : 'text-neutral'}>
                                {section.icon}
                            </span>
                            {section.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 pb-10 min-h-[500px]">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-white text-lg">Loading settings...</div>
                    </div>
                ) : error ? (
                    <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-xl mb-6">
                        <p className="text-red-500 font-medium">{error}</p>
                        <button 
                            onClick={loadSettings}
                            className="mt-2 text-red-500 underline text-sm"
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    renderContent()
                )}

                {/* Global Save Button */}
                <div className="fixed bottom-6 right-8 md:absolute md:bottom-auto md:right-0 md:top-0">
                    <button 
                        onClick={() => saveSettings(activeSection, {
                            ...(activeSection === 'profile' && profile),
                            ...(activeSection === 'workflow' && workflow),
                            ...(activeSection === 'inventory' && inventory),
                            ...(activeSection === 'staff' && staff),
                            ...(activeSection === 'notifications' && notif),
                            ...(activeSection === 'security' && security),
                            ...(activeSection === 'system' && system),
                        })}
                        disabled={saving || loading}
                        className="flex items-center gap-2 bg-gradient-to-r from-[#FF512F] to-[#F09819] text-white px-6 py-3 rounded-full shadow-[0_0_25px rgba(255, 81, 47, 0.4)] font-bold hover:scale-105 transition-transform z-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        <SaveIcon className="w-5 h-5" />
                        <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                </div>
            </div>

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[rgba(20,20,20,0.95)] backdrop-blur-[24px] border border-white/10 rounded-2xl p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold text-white mb-4">Change Password</h3>
                        
                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 p-3 rounded-lg mb-4">
                                <p className="text-red-500 text-sm">{error}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-[#9ca3af] tracking-wider mb-2 block">Current Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none transition-colors"
                                    placeholder="Enter current password"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-[#9ca3af] tracking-wider mb-2 block">New Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none transition-colors"
                                    placeholder="Enter new password (min 8 characters)"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-[#9ca3af] tracking-wider mb-2 block">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none transition-colors"
                                    placeholder="Confirm new password"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowPasswordModal(false);
                                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                    setError(null);
                                }}
                                className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleChangePassword}
                                disabled={saving || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                                className="flex-1 px-4 py-2 bg-[#FF512F] text-white rounded-lg hover:bg-[#FF3D00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? 'Changing...' : 'Change Password'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
