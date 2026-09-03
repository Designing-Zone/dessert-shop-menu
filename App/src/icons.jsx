import React from 'react';

const I = ({ children, size = 22, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    {children}
  </svg>
);

export const IconHome = (p) => (
  <I {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h5v-6h4v6h5V9.5" />
  </I>
);

export const IconMenu = (p) => (
  <I {...p}>
    <path d="M3 5h18" />
    <path d="M3 12h18" />
    <path d="M3 19h18" />
  </I>
);

export const IconBag = (p) => (
  <I {...p}>
    <path d="M6 8h12l1 13H5L6 8Z" />
    <path d="M9 10V6a3 3 0 0 1 6 0v4" />
  </I>
);

export const IconReceipt = (p) => (
  <I {...p}>
    <path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21V3Z" />
    <path d="M9 8h6M9 12h6" />
  </I>
);

export const IconUser = (p) => (
  <I {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
  </I>
);

export const IconUsers = (p) => (
  <I {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c1.3-3 3.7-4.5 6.5-4.5s5.2 1.5 6.5 4.5" />
    <path d="M16 5a3.5 3.5 0 0 1 0 7" />
    <path d="M18 15.5c1.8.6 3 1.9 3.8 3.9" />
  </I>
);

export const IconPlus = (p) => (
  <I {...p}>
    <path d="M12 5v14M5 12h14" />
  </I>
);

export const IconMinus = (p) => (
  <I {...p}>
    <path d="M5 12h14" />
  </I>
);

export const IconX = (p) => (
  <I {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </I>
);

export const IconTrash = (p) => (
  <I {...p}>
    <path d="M4 7h16" />
    <path d="M9 7V4h6v3" />
    <path d="M6.5 7 7.5 21h9L17.5 7" />
    <path d="M10 11v6M14 11v6" />
  </I>
);

export const IconEdit = (p) => (
  <I {...p}>
    <path d="M4 20h4L20 8l-4-4L4 16v4Z" />
    <path d="m13.5 6.5 4 4" />
  </I>
);

export const IconChevronLeft = (p) => (
  <I {...p}>
    <path d="m14 6-6 6 6 6" />
  </I>
);

export const IconChevronRight = (p) => (
  <I {...p}>
    <path d="m10 6 6 6-6 6" />
  </I>
);

export const IconLogout = (p) => (
  <I {...p}>
    <path d="M14 4H6v16h8" />
    <path d="M10 12h11" />
    <path d="m17 8 4 4-4 4" />
  </I>
);

export const IconGear = (p) => (
  <I {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.8v2.4M12 18.8v2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M2.8 12h2.4M18.8 12h2.4M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7" />
  </I>
);

export const IconTag = (p) => (
  <I {...p}>
    <path d="M3 11V3h8l10 10-8 8L3 11Z" />
    <circle cx="7.5" cy="7.5" r="1.4" />
  </I>
);

export const IconGrid = (p) => (
  <I {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </I>
);

export const IconBox = (p) => (
  <I {...p}>
    <path d="M12 3 3 7.5v9L12 21l9-4.5v-9L12 3Z" />
    <path d="M3 7.5 12 12l9-4.5" />
    <path d="M12 12v9" />
  </I>
);

export const IconClock = (p) => (
  <I {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </I>
);

export const IconCheck = (p) => (
  <I {...p}>
    <path d="m5 13 4 4L19 7" />
  </I>
);

export const IconSearch = (p) => (
  <I {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-3.8-3.8" />
  </I>
);

export const IconCamera = (p) => (
  <I {...p}>
    <path d="M4 8h3l2-2.5h6L17 8h3v12H4V8Z" />
    <circle cx="12" cy="13.5" r="3.5" />
  </I>
);

export const IconPhone = (p) => (
  <I {...p}>
    <path d="M5 4h4l1.5 4.5-2.2 1.6a12 12 0 0 0 5.6 5.6l1.6-2.2L20 15v4a1.8 1.8 0 0 1-2 1.8A16.5 16.5 0 0 1 3.2 6 1.8 1.8 0 0 1 5 4Z" />
  </I>
);

export const IconPin = (p) => (
  <I {...p}>
    <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </I>
);

export const IconFlame = (p) => (
  <I {...p}>
    <path d="M12 3c1 3-3 4.5-3 8a4.5 4.5 0 0 0 9 .5C18 8 15 6.5 14 4c-.5 1.5-2 2-2 2" />
    <path d="M12 21a6 6 0 0 1-6-6c0-2 1-3.5 1.8-4.6" />
  </I>
);

export const IconImage = (p) => (
  <I {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="m5 18 5-5 3 3 3-3 4 4" />
  </I>
);

export const IconAlert = (p) => (
  <I {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5" />
    <path d="M12 16.5v.01" />
  </I>
);

export const IconStar = (p) => (
  <I {...p}>
    <path d="m12 3.5 2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.7l5.9-.9L12 3.5Z" />
  </I>
);

export const IconArrowLeft = IconChevronLeft;

/** Brand mark: flame inside a rounded gradient tile. */
export function Logo({ size = 44 }) {
  return (
    <div className="logo" style={{ width: size, height: size }}>
      <IconFlame size={size * 0.55} strokeWidth={2} />
    </div>
  );
}
