import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const ThemeContext = createContext();

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState({
    mode: 'dark',
    primary_color: '#22d3ee',
    secondary_color: '#a855f7',
    accent_color: '#ec4899',
    background_color: '#0a0e27',
    font_family: 'Inter',
    border_radius: '0.5rem',
  });
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUserTheme();
  }, []);

  const loadUserTheme = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Load user's theme
      const userThemes = await base44.entities.UserTheme.filter({ user_id: currentUser.id });
      if (userThemes.length > 0) {
        const userTheme = userThemes[0];
        setTheme({
          mode: userTheme.theme_mode || 'dark',
          primary_color: userTheme.primary_color || '#22d3ee',
          secondary_color: userTheme.secondary_color || '#a855f7',
          accent_color: userTheme.accent_color || '#ec4899',
          background_color: userTheme.background_color || '#0a0e27',
          font_family: userTheme.font_family || 'Inter',
          border_radius: userTheme.border_radius || '0.5rem',
        });
        applyTheme({
          mode: userTheme.theme_mode || 'dark',
          primary_color: userTheme.primary_color || '#22d3ee',
          secondary_color: userTheme.secondary_color || '#a855f7',
          accent_color: userTheme.accent_color || '#ec4899',
          background_color: userTheme.background_color || '#0a0e27',
          font_family: userTheme.font_family || 'Inter',
          border_radius: userTheme.border_radius || '0.5rem',
        });
      } else {
        // Apply default theme
        applyTheme(theme);
      }
    } catch (error) {
      console.log('Not logged in, using default theme');
      applyTheme(theme);
    }
  };

  const applyTheme = (newTheme) => {
    const root = document.documentElement;
    
    // Apply CSS variables
    root.style.setProperty('--primary-color', newTheme.primary_color);
    root.style.setProperty('--secondary-color', newTheme.secondary_color);
    root.style.setProperty('--accent-color', newTheme.accent_color);
    root.style.setProperty('--background-color', newTheme.background_color);
    root.style.setProperty('--font-family', newTheme.font_family);
    root.style.setProperty('--border-radius', newTheme.border_radius);

    // Apply dark/light mode
    if (newTheme.mode === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.setProperty('--bg-primary', '#0a0e27');
      root.style.setProperty('--bg-secondary', '#1a1f3a');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#94a3b8');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      root.style.setProperty('--bg-primary', '#ffffff');
      root.style.setProperty('--bg-secondary', '#f8fafc');
      root.style.setProperty('--text-primary', '#0f172a');
      root.style.setProperty('--text-secondary', '#64748b');
    }
  };

  const updateTheme = async (updates) => {
    const newTheme = { ...theme, ...updates };
    setTheme(newTheme);
    applyTheme(newTheme);

    if (user) {
      try {
        const userThemes = await base44.entities.UserTheme.filter({ user_id: user.id });
        if (userThemes.length > 0) {
          await base44.entities.UserTheme.update(userThemes[0].id, {
            theme_mode: newTheme.mode,
            primary_color: newTheme.primary_color,
            secondary_color: newTheme.secondary_color,
            accent_color: newTheme.accent_color,
            background_color: newTheme.background_color,
            font_family: newTheme.font_family,
            border_radius: newTheme.border_radius,
          });
        } else {
          await base44.entities.UserTheme.create({
            user_id: user.id,
            theme_mode: newTheme.mode,
            primary_color: newTheme.primary_color,
            secondary_color: newTheme.secondary_color,
            accent_color: newTheme.accent_color,
            background_color: newTheme.background_color,
            font_family: newTheme.font_family,
            border_radius: newTheme.border_radius,
          });
        }
      } catch (error) {
        console.error('Failed to save theme:', error);
      }
    }
  };

  const toggleMode = () => {
    updateTheme({ mode: theme.mode === 'dark' ? 'light' : 'dark' });
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}