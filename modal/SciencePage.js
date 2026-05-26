// modal/SciencePage.js
const mongoose = require('mongoose');

const sciencePageSchema = new mongoose.Schema({
  // Hero Section
  heroTitle: {
    type: String,
    default: "Scientific Review Committee"
  },
  heroSubtitle: {
    type: String,
    default: "Review Committee of diabetes experts from across the country"
  },
  heroBackgroundImage: {
    type: String,
    default: ""
  },

  // Impact Section
  impactTitle: {
    type: String,
    default: "Our Impact"
  },
  impactCards: [{
    image: {
      type: String,
      default: ""
    },
    number: {
      type: String,
      default: ""
    },
    description: {
      type: String,
      default: ""
    }
  }],

  // Grant Section
  grantTitle: {
    type: String,
    default: "we grant up to $75,000 to support each research project"
  },
  grantSubtitle: {
    type: String,
    default: "#InnovativeDiabetesResearch"
  },
  grantBackgroundImage: {
    type: String,
    default: ""
  },

  // Team Section
  teamCards: [{
    name: {
      type: String,
      default: ""
    },
    designation: {
      type: String,
      default: ""
    },
    institution: {
      type: String,
      default: ""
    }
  }],

  // Research Section
  researchTitle: {
    type: String,
    default: "DRC has distributed Approximately $3M to research"
  },
  researchDescription: {
    type: String,
    default: "This funding has enabled key discoveries and advancements, showcasing our commitment to driving forward the research necessary to understand, manage, and ultimately cure this challenging condition."
  },
  researchImages: [{
    type: String,
    default: ""
  }],

  // Statistics Section
  statsTitle: {
    type: String,
    default: "Clinically proven health impact published in top medical institutions around the world"
  },
  statistics: [{
    percentage: {
      type: String,
      default: ""
    },
    description: {
      type: String,
      default: ""
    },
    source: {
      type: String,
      default: ""
    }
  }],

  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SciencePage', sciencePageSchema);