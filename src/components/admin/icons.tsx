
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

export const OrdersIcon: React.FC<IconProps> = (props) => (
  <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 2H8C4.69 2 2 4.69 2 8V21C2 21.55 2.45 22 3 22H16C19.31 22 22 19.31 22 16V8C22 4.69 19.31 2 16 2Z" stroke="url(#stroke-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 12H8" stroke="url(#stroke-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 16H8" stroke="url(#stroke-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 8H8" stroke="url(#stroke-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <defs>
        <linearGradient id="stroke-grad" x1="0" y1="0" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF512F" />
            <stop offset="100%" stopColor="#F09819" />
        </linearGradient>
    </defs>
  </svg>
);

export const SlotsIcon: React.FC<IconProps> = (props) => (
  <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="url(#stroke-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 6V12L16 14" stroke="url(#stroke-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
     <defs>
        <linearGradient id="stroke-grad" x1="0" y1="0" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF512F" />
            <stop offset="100%" stopColor="#F09819" />
        </linearGradient>
    </defs>
  </svg>
);

export const MenuIcon: React.FC<IconProps> = (props) => (
  <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 2V5" stroke="url(#stroke-grad)" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 2V5" stroke="url(#stroke-grad)" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3.5 9.09H20.5" stroke="url(#stroke-grad)" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="url(#stroke-grad)" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11.9955 13.7H12.0045" stroke="url(#stroke-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8.29431 13.7H8.3033" stroke="url(#stroke-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8.29431 16.7H8.3033" stroke="url(#stroke-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
     <defs>
        <linearGradient id="stroke-grad" x1="0" y1="0" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF512F" />
            <stop offset="100%" stopColor="#F09819" />
        </linearGradient>
    </defs>
  </svg>
);

export const InventoryIcon: React.FC<IconProps> = (props) => (
  <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 7V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V7C3 4 4.5 2 8 2H16C19.5 2 21 4 21 7Z" stroke="url(#stroke-grad)" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 7.5H9C8.17 7.5 7.5 8.17 7.5 9V15C7.5 15.83 8.17 16.5 9 16.5H15C15.83 16.5 16.5 15.83 16.5 15V9C16.5 8.17 15.83 7.5 15 7.5Z" stroke="url(#stroke-grad)" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
     <defs>
        <linearGradient id="stroke-grad" x1="0" y1="0" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF512F" />
            <stop offset="100%" stopColor="#F09819" />
        </linearGradient>
    </defs>
  </svg>
);

export const PaymentsIcon: React.FC<IconProps> = (props) => (
 <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 8.5H12.5" stroke="url(#stroke-grad)" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 16.5H8" stroke="url(#stroke-grad)" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.5 16.5H14.5" stroke="url(#stroke-grad)" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 12.03V15.5C22 18.5 20 20.5 17 20.5H7C4 20.5 2 18.5 2 15.5V8.5C2 5.5 4 3.5 7 3.5H14.5" stroke="url(#stroke-grad)" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16.5 7.5C16.5 9.43 18.07 11 20 11C21.93 11 23.5 9.43 23.5 7.5C23.5 5.57 21.93 4 20 4C18.07 4 16.5 5.57 16.5 7.5Z" stroke="url(#stroke-grad)" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
     <defs>
        <linearGradient id="stroke-grad" x1="0" y1="0" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF512F" />
            <stop offset="100%" stopColor="#F09819" />
        </linearGradient>
    </defs>
  </svg>
);

export const AnalyticsIcon: React.FC<IconProps> = (props) => (
  <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4H10V10H4V4Z" fill="url(#grad1)"/>
    <path d="M14 14H20V20H14V14Z" fill="url(#grad1)"/>
    <path d="M14 4H20V10H14V4Z" fill="url(#grad2)"/>
    <path d="M4 14H10V20H4V14Z" fill="url(#grad2)"/>
    <defs>
        <linearGradient id="grad1" x1="4" y1="4" x2="10" y2="10" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF512F"/>
            <stop offset="1" stopColor="#FF8A65"/>
        </linearGradient>
        <linearGradient id="grad2" x1="14" y1="4" x2="20" y2="10" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F09819"/>
            <stop offset="1" stopColor="#FFE082"/>
        </linearGradient>
    </defs>
  </svg>
);

export const FeedbackIcon: React.FC<IconProps> = (props) => (
  <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.5 19H8C4 19 2 18 2 13V8C2 4 4 2 8 2H16C20 2 22 4 22 8V10" stroke="url(#stroke-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15.9965 16.4999H16.0054" stroke="url(#stroke-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11.9955 16.4999H12.0045" stroke="url(#stroke-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.99451 16.4999H8.00349" stroke="url(#stroke-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.81 22C18.93 22 19.04 21.96 19.15 21.88L21.64 20.04C21.84 19.88 22 19.66 22 19.42V14.5C22 13.12 20.88 12 19.5 12H14.5C13.12 12 12 13.12 12 14.5V19.5C12 20.88 13.12 22 14.5 22H18.81Z" stroke="url(#stroke-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
     <defs>
        <linearGradient id="stroke-grad" x1="0" y1="0" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF512F" />
            <stop offset="100%" stopColor="#F09819" />
        </linearGradient>
    </defs>
  </svg>
);

export const StaffIcon: React.FC<IconProps> = (props) => (
  <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="url(#stroke-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26 15 3.41 18.13 3.41 22" stroke="url(#stroke-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
     <defs>
        <linearGradient id="stroke-grad" x1="0" y1="0" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF512F" />
            <stop offset="100%" stopColor="#F09819" />
        </linearGradient>
    </defs>
  </svg>
);

export const SettingsIcon: React.FC<IconProps> = (props) => (
  <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="url(#stroke-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 12C22 16.4183 18.4183 20 14 20C13.1362 20 12.3023 19.8653 11.5204 19.6154M4 14C4 18.4183 7.58172 22 12 22C12.8638 22 13.6977 21.8653 14.4796 21.6154M2 12C2 7.58172 5.58172 4 10 4C10.8638 4 11.6977 4.13465 12.4796 4.3846M20 10C20 5.58172 16.4183 2 12 2C11.1362 2 10.3023 2.13465 9.52038 2.3846" stroke="url(#stroke-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
     <defs>
        <linearGradient id="stroke-grad" x1="0" y1="0" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF512F" />
            <stop offset="100%" stopColor="#F09819" />
        </linearGradient>
    </defs>
  </svg>
);

export const NotificationIcon: React.FC<IconProps> = (props) => (
  <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 8C19 5.79 16.77 4 14.5 4C12.23 4 10 5.79 10 8C10 9.64 10.84 11.08 12 11.72V15C12 15.26 12.1 15.5 12.29 15.71L13 16.41V17.5C13 18.33 13.67 19 14.5 19C15.33 19 16 18.33 16 17.5V16.41L16.71 15.71C16.9 15.5 17 15.26 17 15V11.72C18.16 11.08 19 9.64 19 8Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round"/>
    <path d="M14.5 22C16.43 22 18 20.43 18 18.5H11C11 20.43 12.57 22 14.5 22Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round"/>
    <path d="M5 8C5 4.69 7.69 2 11 2C11.34 2 11.67 2.02 12 2.05" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round"/>
    <path d="M6 15C6 15.26 6.1 15.5 6.29 15.71L7 16.41V17.5C7 18.33 7.67 19 8.5 19H9" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round"/>
    <path d="M11.38 11.64C10.55 11.05 10 10.08 10 9C10 7.34 11.34 6 13 6C13.25 6 13.49 6.04 13.72 6.1" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round"/>
  </svg>
);

export const PlusIcon: React.FC<IconProps> = (props) => (
  <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ChevronDownIcon: React.FC<IconProps> = (props) => (
  <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const VegIcon: React.FC<IconProps> = (props) => (
    <svg {...props} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1.5" y="1.5" width="13" height="13" rx="2.5" stroke="#3ED174" strokeWidth="2"/>
        <circle cx="8" cy="8" r="3" fill="#3ED174"/>
    </svg>
);

export const NonVegIcon: React.FC<IconProps> = (props) => (
    <svg {...props} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1.5" y="1.5" width="13" height="13" rx="2.5" stroke="#FF6C7A" strokeWidth="2"/>
        <path d="M8 11L4 5H12L8 11Z" fill="#FF6C7A"/>
    </svg>
);

export const SpicyIcon: React.FC<IconProps> = (props) => (
    <svg {...props} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8.00008 1.33331C6.00208 4.22331 4.66675 6.06665 4.66675 8.33331C4.66675 11.2333 6.09675 12.6666 8.00008 12.6666C9.90342 12.6666 11.3334 11.2333 11.3334 8.33331C11.3334 6.06665 9.99808 4.22331 8.00008 1.33331Z" fill="#FFBD4A"/>
        <path d="M8.00008 12.6667C8.66675 13.6267 9.16675 14.6667 8.00008 14.6667C6.83342 14.6667 7.33342 13.6267 8.00008 12.6667Z" fill="#FFBD4A"/>
    </svg>
);

export const StarIcon: React.FC<IconProps> = (props) => (
  <svg {...props} width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 15L3.92598 18.0902L5 11.5L0 7.09017L6.5625 6.4299L10 0L13.4375 6.4299L20 7.09017L15 11.5L16.074 18.0902L10 15Z"/>
  </svg>
);

export const SearchIcon: React.FC<IconProps> = (props) => (
    <svg {...props} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M22 22L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export const FilterIcon: React.FC<IconProps> = (props) => (
    <svg {...props} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export const ArrowLeftIcon: React.FC<IconProps> = (props) => (
  <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const XIcon: React.FC<IconProps> = (props) => (
  <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const UploadIcon: React.FC<IconProps> = (props) => (
  <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const SecurityIcon: React.FC<IconProps> = (props) => (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export const DatabaseIcon: React.FC<IconProps> = (props) => (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 12C21 13.66 16.97 15 12 15C7.03 15 3 13.66 3 12M21 7C21 8.66 16.97 10 12 10C7.03 10 3 8.66 3 7M21 17C21 18.66 16.97 20 12 20C7.03 20 3 18.66 3 17M12 5C16.97 5 21 6.34 21 8V16C21 17.66 16.97 19 12 19C7.03 19 3 17.66 3 16V8C3 6.34 7.03 5 12 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export const WorkflowIcon: React.FC<IconProps> = (props) => (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 11.08V12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C13.59 2 15.11 2.37 16.46 3.02" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export const DangerIcon: React.FC<IconProps> = (props) => (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 9V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 17.01L12.01 16.9989" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10.29 3.86L1.82 18C1.64556 18.3024 1.55299 18.6453 1.55201 18.9945C1.55103 19.3437 1.64169 19.6871 1.81445 19.9905C1.98721 20.2939 2.23586 20.5461 2.53447 20.7207C2.83308 20.8953 3.17056 20.9859 3.513 20.98H20.48C20.8192 20.9803 21.1537 20.8876 21.4504 20.7118C21.7472 20.5361 21.9959 20.2831 22.1714 19.9785C22.3469 19.6739 22.4431 19.3283 22.4499 18.9767C22.4568 18.6251 22.3739 18.2801 22.21 17.975L13.71 3.86C13.5317 3.56611 13.2807 3.32365 12.9832 3.15764C12.6858 2.99163 12.3524 2.90808 12.015 2.91572C11.6776 2.92336 11.3482 3.02192 11.0601 3.20131C10.7719 3.3807 10.5353 3.63442 10.37 3.9L10.29 3.86Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export const SaveIcon: React.FC<IconProps> = (props) => (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 21H5C4.44772 21 4 20.5523 4 20V4C4 3.44772 4.44772 3 5 3H16L21 8V20C21 20.5523 20.5523 21 20 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M17 21V13H7V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 3V8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export const ClockIcon: React.FC<IconProps> = (props) => (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export const LogoutIcon: React.FC<IconProps> = (props) => (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export const DownloadIcon: React.FC<IconProps> = (props) => (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export const RefreshIcon: React.FC<IconProps> = (props) => (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M23 4V10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M1 20V14H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3.51 9C4.01717 7.56678 4.87913 6.2854 6.01547 5.27542C7.1518 4.26544 8.52547 3.55976 10.0083 3.22485C11.4911 2.88994 13.0336 2.93677 14.4939 3.36098C15.9542 3.78519 17.2846 4.57274 18.36 5.65L23 10M1 14L5.64 18.35C6.71543 19.4273 8.04576 20.2148 9.50607 20.639C10.9664 21.0632 12.5089 21.1101 13.9917 20.7752C15.4745 20.4402 16.8482 19.7346 17.9845 18.7246C19.1209 17.7146 19.9828 16.4332 20.49 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
