import { atom } from 'nanostores';

const STORAGE_KEY_SIDEBAR_COLLAPSED = 'sidebar_collapsed';

const getStoredSidebarCollapsed = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SIDEBAR_COLLAPSED);
    return stored === 'true';
  } catch {
    return false;
  }
};

const setStoredSidebarCollapsed = (collapsed: boolean) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_SIDEBAR_COLLAPSED, collapsed ? 'true' : 'false');
  } catch (e) {
    console.error('[Sidebar] Error saving sidebar state to localStorage:', e);
  }
};

// Initialize atom with persisted value
const initialCollapsed = getStoredSidebarCollapsed();
export const $sidebarCollapsed = atom<boolean>(initialCollapsed);

// Subscribe to changes and persist to localStorage
if (typeof window !== 'undefined') {
  $sidebarCollapsed.subscribe((collapsed) => {
    setStoredSidebarCollapsed(collapsed);
    // Update CSS variable for layout
    document.documentElement.style.setProperty('--sidebar-width', collapsed ? '4rem' : '16rem');
  });

  // Set initial CSS variable
  document.documentElement.style.setProperty('--sidebar-width', initialCollapsed ? '4rem' : '16rem');
}

export const toggleSidebar = () => {
  $sidebarCollapsed.set(!$sidebarCollapsed.get());
};
