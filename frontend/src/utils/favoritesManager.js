// Favorites Manager for RideWise Web App

const FAVORITES_KEY = 'favoriteLocations';

export const favoritesManager = {
  /**
   * Get all favorite locations
   */
  getFavorites() {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading favorites:', error);
      return [];
    }
  },

  /**
   * Add a favorite location
   */
  addFavorite(label, name, lat, lon, icon = 'location') {
    try {
      const favorites = this.getFavorites();
      
      // Check if label already exists
      const existingIndex = favorites.findIndex(fav => fav.label === label);
      
      const newFavorite = { label, name, lat, lon, icon };
      
      if (existingIndex >= 0) {
        // Update existing favorite
        favorites[existingIndex] = newFavorite;
      } else {
        // Add new favorite
        favorites.push(newFavorite);
      }
      
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('favoritesUpdated'));
      
      return true;
    } catch (error) {
      console.error('Error adding favorite:', error);
      return false;
    }
  },

  /**
   * Remove a favorite location
   */
  removeFavorite(label) {
    try {
      const favorites = this.getFavorites();
      const filtered = favorites.filter(fav => fav.label !== label);
      
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('favoritesUpdated'));
      
      return true;
    } catch (error) {
      console.error('Error removing favorite:', error);
      return false;
    }
  },

  /**
   * Get a specific favorite by label
   */
  getFavoriteByLabel(label) {
    const favorites = this.getFavorites();
    return favorites.find(fav => fav.label === label);
  },

  /**
   * Check if a label exists
   */
  hasLabel(label) {
    const favorites = this.getFavorites();
    return favorites.some(fav => fav.label === label);
  },

  /**
   * Get suggested icon for common labels
   */
  getSuggestedIcon(label) {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('home')) return 'home';
    if (lowerLabel.includes('work') || lowerLabel.includes('office')) return 'work';
    if (lowerLabel.includes('gym') || lowerLabel.includes('fitness')) return 'fitness';
    if (lowerLabel.includes('school') || lowerLabel.includes('college')) return 'school';
    if (lowerLabel.includes('hospital')) return 'hospital';
    if (lowerLabel.includes('airport')) return 'flight';
    if (lowerLabel.includes('mall') || lowerLabel.includes('shop')) return 'shopping';
    if (lowerLabel.includes('restaurant') || lowerLabel.includes('cafe')) return 'restaurant';
    return 'location';
  }
};
