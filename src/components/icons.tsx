import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export const DashboardIcon: React.FC<IconProps> = (props) => (
  <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="6" height="6" rx="1" fill="url(#grad1)"/>
    <rect x="4" y="14" width="6" height="6" rx="1" fill="url(#grad2)"/>
    <rect x="14" y="4" width="6" height="6" rx="1" fill="url(#grad2)"/>
    <rect x="14" y="14" width="6" height="6" rx="1" fill="url(#grad1)"/>
    <defs>
      <linearGradient id="grad1" x1="4" y1="4" x2="10" y2="10" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF512F"/>
        <stop offset="1" stopColor="#FF8A65"/>
      </linearGradient>
      <linearGradient id="grad2" x1="4" y1="14" x2="10" y2="20" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F09819"/>
        <stop offset="1" stopColor="#FFE082"/>
      </linearGradient>
    </defs>
  </svg>
);

export const InventoryIcon: React.FC<IconProps> = (props) => (
  <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 7V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V7C3 4 4.5 2 8 2H16C19.5 2 21 4 21 7Z" stroke="url(#stroke-grad-inventory)" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 7.5H9C8.17 7.5 7.5 8.17 7.5 9V15C7.5 15.83 8.17 16.5 9 16.5H15C15.83 16.5 16.5 15.83 16.5 15V9C16.5 8.17 15.83 7.5 15 7.5Z" stroke="url(#stroke-grad-inventory)" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <defs>
      <linearGradient id="stroke-grad-inventory" x1="0" y1="0" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF512F" />
        <stop offset="100%" stopColor="#F09819" />
      </linearGradient>
    </defs>
  </svg>
);

export const PaymentsIcon: React.FC<IconProps> = (props) => (
  <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 8.5H12.5" stroke="url(#stroke-grad-payments)" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 16.5H8" stroke="url(#stroke-grad-payments)" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.5 16.5H14.5" stroke="url(#stroke-grad-payments)" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 12.03V15.5C22 18.5 20 20.5 17 20.5H7C4 20.5 2 18.5 2 15.5V8.5C2 5.5 4 3.5 7 3.5H14.5" stroke="url(#stroke-grad-payments)" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16.5 7.5C16.5 9.43 18.07 11 20 11C21.93 11 23.5 9.43 23.5 7.5C23.5 5.57 21.93 4 20 4C18.07 4 16.5 5.57 16.5 7.5Z" stroke="url(#stroke-grad-payments)" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <defs>
      <linearGradient id="stroke-grad-payments" x1="0" y1="0" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF512F" />
        <stop offset="100%" stopColor="#F09819" />
      </linearGradient>
    </defs>
  </svg>
);

export const OrdersIcon: React.FC<IconProps> = (props) => (
  <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 2H8C4.69 2 2 4.69 2 8V21C2 21.55 2.45 22 3 22H16C19.31 22 22 19.31 22 16V8C22 4.69 19.31 2 16 2Z" stroke="url(#stroke-grad-orders)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 12H8" stroke="url(#stroke-grad-orders)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 16H8" stroke="url(#stroke-grad-orders)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 8H8" stroke="url(#stroke-grad-orders)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <defs>
      <linearGradient id="stroke-grad-orders" x1="0" y1="0" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF512F" />
        <stop offset="100%" stopColor="#F09819" />
      </linearGradient>
    </defs>
  </svg>
);

export const SlotsIcon: React.FC<IconProps> = (props) => (
  <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="url(#stroke-grad-slots)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 6V12L16 14" stroke="url(#stroke-grad-slots)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <defs>
      <linearGradient id="stroke-grad-slots" x1="0" y1="0" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF512F" />
        <stop offset="100%" stopColor="#F09819" />
      </linearGradient>
    </defs>
  </svg>
);

export const MenuIcon: React.FC<IconProps> = (props) => (
  <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 2V5" stroke="url(#stroke-grad-menu)" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 2V5" stroke="url(#stroke-grad-menu)" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3.5 9.09H20.5" stroke="url(#stroke-grad-menu)" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="url(#stroke-grad-menu)" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11.9955 13.7H12.0045" stroke="url(#stroke-grad-menu)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8.29431 13.7H8.3033" stroke="url(#stroke-grad-menu)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8.29431 16.7H8.3033" stroke="url(#stroke-grad-menu)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <defs>
      <linearGradient id="stroke-grad-menu" x1="0" y1="0" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF512F" />
        <stop offset="100%" stopColor="#F09819" />
      </linearGradient>
    </defs>
  </svg>
);

export const XIcon: React.FC<IconProps> = (props) => (
  <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const AnalyticsIcon: React.FC<IconProps> = (props) => (
  <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 21H3V3" stroke="url(#stroke-grad-analytics)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 17L12 12L16 16L21 7" stroke="url(#stroke-grad-analytics)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <defs>
      <linearGradient id="stroke-grad-analytics" x1="0" y1="0" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF512F" />
        <stop offset="100%" stopColor="#F09819" />
      </linearGradient>
    </defs>
  </svg>
);

export const FeedbackIcon: React.FC<IconProps> = (props) => (
  <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7117 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92176 4.42061 8.37485 5.22071 7.03258C6.02081 5.69031 7.17934 4.60491 8.57 3.9C9.74812 3.30493 11.0501 2.99656 12.37 3H12.5C14.5847 3.11466 16.553 3.99476 18.0321 5.46786C19.5112 6.94095 20.4004 8.9136 20.54 11" stroke="url(#stroke-grad-feedback)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 11H16M8 15H12" stroke="url(#stroke-grad-feedback)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <defs>
      <linearGradient id="stroke-grad-feedback" x1="0" y1="0" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF512F" />
        <stop offset="100%" stopColor="#F09819" />
      </linearGradient>
    </defs>
  </svg>
);

export const SettingsIcon: React.FC<IconProps> = (props) => (
  <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="url(#stroke-grad-settings)" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12.88V11.12C2 10.08 2.85 9.22 3.9 9.05C5.31 8.82 6.19 7.5 5.9 6.13C5.57 4.58 6.57 3.06 8.14 2.75C9.5 2.48 10.82 3.35 11.06 4.73C11.18 5.4 11.59 5.97 12.16 6.27C12.75 6.59 13.25 7.01 13.64 7.5C14.02 7.98 14.5 8.28 15.05 8.4C16.41 8.7 17.2 10 16.96 11.25C16.86 11.82 16.5 12.3 16 12.58C15.5 12.86 15.11 13.3 14.91 13.83C14.6 14.66 14.69 15.57 15.15 16.32C15.6 17.06 16.37 17.55 17.25 17.63C18.82 17.78 20 19.05 20 20.5V22" stroke="url(#stroke-grad-settings)" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 12.88V11.12C21.97 9.99 21.06 9.07 19.9 9.05C18.5 8.82 17.62 7.5 17.9 6.13C18.23 4.58 17.23 3.06 15.66 2.75C14.3 2.48 12.98 3.35 12.74 4.73C12.62 5.4 12.21 5.97 11.64 6.27C11.05 6.59 10.55 7.01 10.16 7.5C9.78 7.98 9.3 8.28 8.75 8.4C7.39 8.7 6.6 10 6.84 11.25C6.94 11.82 7.3 12.3 7.8 12.58C8.3 12.86 8.69 13.3 8.89 13.83C9.2 14.66 9.11 15.57 8.65 16.32C8.2 17.06 7.43 17.55 6.55 17.63C4.98 17.78 3.8 19.05 3.8 20.5V22" stroke="url(#stroke-grad-settings)" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <defs>
      <linearGradient id="stroke-grad-settings" x1="0" y1="0" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF512F" />
        <stop offset="100%" stopColor="#F09819" />
      </linearGradient>
    </defs>
  </svg>
);

export const StaffIcon: React.FC<IconProps> = (props) => (
  <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="url(#stroke-grad-staff)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="url(#stroke-grad-staff)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="url(#stroke-grad-staff)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 3.13C16.8604 3.3503 17.623 3.8507 18.1676 4.55231C18.7121 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7121 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="url(#stroke-grad-staff)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <defs>
      <linearGradient id="stroke-grad-staff" x1="0" y1="0" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF512F" />
        <stop offset="100%" stopColor="#F09819" />
      </linearGradient>
    </defs>
  </svg>
);
