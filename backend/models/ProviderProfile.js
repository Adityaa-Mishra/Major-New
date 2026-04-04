const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const portfolioItemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, default: '', trim: true, maxlength: 500 },
  mediaUrl: { type: String, default: '' },
  mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
  mediaName: { type: String, default: '' },
  mediaSize: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const providerProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  skills: [{ type: String, trim: true }],
  category: {
    type: String,
    enum: ['electrician', 'plumber', 'cleaner', 'carpenter', 'painter', 'ac_repair', 'appliance_repair', 'gardener', 'security', 'other'],
    default: 'other'
  },
  bio: { type: String, default: '', maxlength: 500 },
  hourlyRate: { type: Number, default: 0 },
  location: { type: String, default: '' },
  availability: { type: Boolean, default: true },
  experienceYears: { type: Number, default: 0 },
  reviews: [reviewSchema],
  avgRating: { type: Number, default: 0 },
  totalJobs: { type: Number, default: 0 },
  completedJobs: { type: Number, default: 0 },
  profileImage: { type: String, default: '' },
  certifications: [{ type: String }],
  languages: [{ type: String }],
  portfolio: [portfolioItemSchema]
}, { timestamps: true });

providerProfileSchema.methods.calculateAvgRating = function() {
  if (this.reviews.length === 0) { this.avgRating = 0; return; }
  const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
  this.avgRating = Math.round((sum / this.reviews.length) * 10) / 10;
};

module.exports = mongoose.model('ProviderProfile', providerProfileSchema);
