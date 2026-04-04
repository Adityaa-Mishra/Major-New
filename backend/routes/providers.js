const express = require('express');
const fs = require('fs');
const path = require('path');
const ProviderProfile = require('../models/ProviderProfile');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { auth, providerOnly } = require('../middleware/auth');
const { uploadWorkMedia } = require('../middleware/uploads');
const router = express.Router();
const toPublicUploadPath = (fullPath) => {
  const normalized = String(fullPath || '').replace(/\\/g, '/');
  const idx = normalized.lastIndexOf('/uploads/');
  return idx >= 0 ? normalized.slice(idx) : '';
};

function runUpload(req, res) {
  return new Promise((resolve, reject) => {
    uploadWorkMedia(req, res, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

// GET /api/providers - list all providers with search
router.get('/', async (req, res) => {
  try {
    const { category, location, search, page = 1, limit = 12 } = req.query;
    let query = {};
    if (category) query.category = category;
    if (location) query.location = { $regex: location, $options: 'i' };

    let profiles = await ProviderProfile.find(query)
      .populate('user', 'name email avatar isOnline location')
      .sort({ avgRating: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    if (search) {
      profiles = profiles.filter(p =>
        p.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.skills?.some(s => s.toLowerCase().includes(search.toLowerCase())) ||
        p.category?.toLowerCase().includes(search.toLowerCase()) ||
        p.bio?.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = await ProviderProfile.countDocuments(query);
    res.json({ providers: profiles, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/providers/:id
router.get('/:id', async (req, res) => {
  try {
    const profile = await ProviderProfile.findOne({ user: req.params.id })
      .populate('user', 'name email avatar isOnline location phone');
    if (!profile) return res.status(404).json({ message: 'Provider not found' });
    res.json({ provider: profile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/providers/profile/me
router.get('/profile/me', auth, providerOnly, async (req, res) => {
  try {
    let profile = await ProviderProfile.findOne({ user: req.user._id })
      .populate('user', 'name email avatar phone location');
    if (!profile) {
      profile = await ProviderProfile.create({ user: req.user._id });
      profile = await profile.populate('user', 'name email avatar phone location');
    }
    res.json({ provider: profile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/providers/profile
router.put('/profile', auth, providerOnly, async (req, res) => {
  try {
    const { skills, category, bio, hourlyRate, location, availability, experienceYears, certifications, languages, profileImage } = req.body;
    const profile = await ProviderProfile.findOneAndUpdate(
      { user: req.user._id },
      { skills, category, bio, hourlyRate, location, availability, experienceYears, certifications, languages, profileImage },
      { new: true, upsert: true }
    ).populate('user', 'name email avatar phone location');
    if (location) await User.findByIdAndUpdate(req.user._id, { location });
    res.json({ provider: profile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/providers/profile/work
router.post('/profile/work', auth, providerOnly, async (req, res) => {
  try {
    await runUpload(req, res);
    const title = (req.body.title || '').trim();
    const description = (req.body.description || '').trim();

    if (!title) return res.status(400).json({ message: 'Work title is required' });
    if (!req.file) return res.status(400).json({ message: 'Please upload an image or video' });

    const mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
    const mediaUrl = toPublicUploadPath(req.file.path);

    const profile = await ProviderProfile.findOneAndUpdate(
      { user: req.user._id },
      {
        $push: {
          portfolio: {
            title,
            description,
            mediaUrl,
            mediaType,
            mediaName: req.file.originalname || '',
            mediaSize: req.file.size || 0
          }
        }
      },
      { new: true, upsert: true }
    ).populate('user', 'name email avatar phone location');

    res.status(201).json({ provider: profile });
  } catch (err) {
    if (err.message?.includes('File too large')) {
      return res.status(400).json({ message: 'Media size must be 25MB or less' });
    }
    if (err.message?.includes('Only image and video files')) {
      return res.status(400).json({ message: 'Only image and video files are allowed' });
    }
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/providers/profile/work/:workId
router.delete('/profile/work/:workId', auth, providerOnly, async (req, res) => {
  try {
    const profile = await ProviderProfile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Provider profile not found' });

    const workItem = profile.portfolio.id(req.params.workId);
    if (!workItem) return res.status(404).json({ message: 'Work post not found' });

    const mediaUrl = workItem.mediaUrl || '';
    workItem.deleteOne();
    await profile.save();

    if (mediaUrl.startsWith('/uploads/')) {
      const relative = mediaUrl.replace(/^\/+/, '');
      const filePath = path.join(__dirname, '..', relative);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.json({ provider: profile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/providers/:id/review
router.post('/:id/review', auth, async (req, res) => {
  try {
    if (req.user.role !== 'user') return res.status(403).json({ message: 'Only users can leave reviews' });
    const { rating, comment, bookingId } = req.body;
    const profile = await ProviderProfile.findOne({ user: req.params.id });
    if (!profile) return res.status(404).json({ message: 'Provider not found' });
    const alreadyReviewed = profile.reviews.find(r => r.user.toString() === req.user._id.toString());
    const bookingFilter = bookingId
      ? { _id: bookingId, user: req.user._id }
      : { user: req.user._id, provider: req.params.id, status: 'completed', userReviewed: false };

    const markReviewed = async () => {
      await Booking.findOneAndUpdate(bookingFilter, { userReviewed: true }, { sort: { createdAt: -1 } });
    };

    if (alreadyReviewed) {
      await markReviewed();
      return res.json({ provider: profile, alreadyReviewed: true });
    }
    profile.reviews.push({ user: req.user._id, userName: req.user.name, rating, comment });
    profile.calculateAvgRating();
    await profile.save();
    await markReviewed();

    res.json({ provider: profile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
