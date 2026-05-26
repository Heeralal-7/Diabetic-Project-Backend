const mongoose = require('mongoose');
 
const careProgramContentSchema = new mongoose.Schema({
  // SECTION 1: Hero/Banner Section
  heroSection: {
    mainHeading: { type: String, default: "Treat, Control & Reverse* Diabetes..." },
    subHeading: { type: String, default: "" },
    bannerImage: {
      url: { type: String, default: "/images/banner.gif" },
      altText: { type: String, default: "Banner" }
    },
    isActive: { type: Boolean, default: true }
  },
 
  // SECTION 2: Stats (NO IMAGE, KEEPING IT SIMPLE AS REQUESTED)
  statsSection: {
    title: { type: String, default: "Why Members Choose Us?" },
    stats: [
      {
        value: { type: String, default: "50k+" },
        label: { type: String, default: "Consultation Done" },
        color: { type: String, default: "primary" },
        order: { type: Number, default: 1 }
      }
      // Aur stats add ho sakte hain array me
    ],
    isActive: { type: Boolean, default: true }
  },
 
  // SECTION 3: Doctor Slider (Dynamic Image Object)
  doctorSlider: {
    heading: { type: String, default: "Meet Our Specialist Doctors" },
    doctors: [
      {
        name: { type: String, default: "Dr. Name" },
        testimonial: { type: String, default: "Testimonial text" },
        location: { type: String, default: "Location" },
        // Image ab object hai
        image: {
          url: { type: String, default: "" },
          altText: { type: String, default: "Doctor" }
        },
        bgColor: { type: String, default: "#e7faf8" },
        borderColor: { type: String, default: "success" },
        order: { type: Number, default: 1 }
      }
    ],
    sideImage: {
      url: { type: String, default: "" },
      altText: { type: String, default: "Side Image" },
      height: { type: String, default: "700px" }
    },
    isActive: { type: Boolean, default: true }
  },
 
  // SECTION 4: Features
  programFeatures: {
    title: { type: String, default: "Features" },
    description: { type: String, default: "Desc" },
    features: [
      {
        number: { type: String, default: "1" },
        title: { type: String, default: "Title" },
        description: { type: String, default: "Desc" },
        image: {
            url: { type: String, default: "" },
            altText: { type: String, default: "" }
        },
        bgColor: { type: String, default: "primary" },
        order: { type: Number, default: 1 }
      }
    ],
    isActive: { type: Boolean, default: true }
  },
 
  ctaSection: {
    title: { type: String, default: "Ready?" },
    description: { type: String, default: "Join us" },
    buttonText: { type: String, default: "Start" },
    buttonLink: { type: String, default: "/" },
    isActive: { type: Boolean, default: true }
  },
 
  seo: {
    title: { type: String, default: "SEO Title" },
    description: { type: String, default: "SEO Desc" },
    keywords: { type: [String], default: [] }
  },
 
  pageName: { type: String, default: "CareProgramPage", unique: true },
  isPublished: { type: Boolean, default: true },
  version: { type: Number, default: 1 }
}, { timestamps: true });
 
module.exports = mongoose.model('CareProgramContent', careProgramContentSchema);
 