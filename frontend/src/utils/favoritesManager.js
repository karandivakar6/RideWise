// Favorites Manager for RideWise Web App

const API_URL = 'http://localhost:5000';

export const favoritesManager = {
  /**
   * Get all favorite locations
   */
  async getFavorites(userId) {
    try {
      if (!userId) return [];
      
      const response = await fetch(`${API_URL}/api/users/${userId}/favorites`);
      if (!response.ok) {
        console.error('Failed to fetch favorites');
        return [];
      }
      
      const favorites = await response.json();
      return favorites;
    } catch (error) {
      console.error('Error loading favorites:', error);
      return [];
    }
  },

  /**
   * Add a favorite location
   */
  async addFavorite(userId, label, name, lat, lon, icon = 'location') {
    try {
      if (!userId) return false;
      
      const response = await fetch(`${API_URL}/api/users/${userId}/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, name, lat, lon, icon })
      });
      
      if (!response.ok) {
        console.error('Failed to add favorite');
        return false;
      }
      
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
  async removeFavorite(userId, index) {
    try {
      if (!userId) return false;
      
      const response = await fetch(`${API_URL}/api/users/${userId}/favorites/${index}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        console.error('Failed to remove favorite');
        return false;
      }
      
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
  async getFavoriteByLabel(userId, label) {
    const favorites = await this.getFavorites(userId);
    return favorites.find(fav => fav.label === label);
  },

  /**
   * Check if a label exists
   */
  async hasLabel(userId, label) {
    const favorites = await this.getFavorites(userId);
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
