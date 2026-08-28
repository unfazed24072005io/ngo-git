// config/commissionLevels.js
export const LEVELS = {
  "I": {
    id: "I",
    title: "संत साधन",
    titleEn: "Customer",
    primaryCommission: 25,  // ← Changed from directCommission
    minDonations: 0,
    maxDonations: 9999,
    color: "#9ca3af",
    badge: "🥉",
    description: "Starting level"
  },
  "II": {
    id: "II",
    title: "संत वेतन",
    titleEn: "Executive",
    primaryCommission: 35,  // ← Changed
    minDonations: 10000,
    maxDonations: 24999,
    color: "#3b82f6",
    badge: "🥈",
    description: "₹10,000+ donations"
  },
  "III": {
    id: "III",
    title: "संत प्रयोग",
    titleEn: "Manager",
    primaryCommission: 40,  // ← Changed
    minDonations: 25000,
    maxDonations: 49999,
    color: "#10b981",
    badge: "🥇",
    description: "₹25,000+ donations"
  },
  "IV": {
    id: "IV",
    title: "वैन प्रौद्योगिक",
    titleEn: "Coordinator",
    primaryCommission: 42.5,  // ← Changed
    minDonations: 50000,
    maxDonations: 99999,
    color: "#f59e0b",
    badge: "⭐",
    description: "₹50,000+ donations"
  },
  "V": {
    id: "V",
    title: "वैन मानकित",
    titleEn: "Guide",
    primaryCommission: 43.75,  // ← Changed
    minDonations: 100000,
    maxDonations: 249999,
    color: "#8b5cf6",
    badge: "🌟🌟",
    description: "₹1,00,000+ donations"
  },
  "VI": {
    id: "VI",
    title: "संत संरक्षण",
    titleEn: "Leader",
    primaryCommission: 44.5,  // ← Changed
    minDonations: 250000,
    maxDonations: 499999,
    color: "#ef4444",
    badge: "🌟🌟🌟",
    description: "₹2,50,000+ donations"
  },
  "VII": {
    id: "VII",
    title: "संत व्यापार",
    titleEn: "Crown",
    primaryCommission: 45,  // ← Changed
    minDonations: 500000,
    maxDonations: Infinity,
    color: "#fbbf24",
    badge: "👑",
    description: "₹5,00,000+ donations"
  }
};

// ============ NEW HELPER FUNCTIONS ============

/**
 * Calculate secondary commission for a specific level
 * Secondary = Primary(current) - Primary(previous level)
 */
export const getSecondaryCommission = (currentLevelId) => {
  const levels = Object.keys(LEVELS);
  const currentIndex = levels.indexOf(currentLevelId);
  
  if (currentIndex <= 0) return 0; // Level I has no secondary
  
  const previousLevelId = levels[currentIndex - 1];
  const currentLevel = getLevelDetails(currentLevelId);
  const previousLevel = getLevelDetails(previousLevelId);
  
  return currentLevel.primaryCommission - previousLevel.primaryCommission;
};

/**
 * Get all commission rates for a level (primary + secondary)
 */
export const getCommissionRates = (levelId) => {
  const level = getLevelDetails(levelId);
  return {
    primary: level.primaryCommission,
    secondary: getSecondaryCommission(levelId)
  };
};

/**
 * Get the commission rate for a specific level (primary)
 */
export const getPrimaryCommission = (levelId) => {
  const level = getLevelDetails(levelId);
  return level.primaryCommission || 0;
};

// ============ DEPRECATED (but kept for compatibility) ============
export const getLevelDetails = (levelId) => {
  return LEVELS[levelId] || LEVELS["I"];
};