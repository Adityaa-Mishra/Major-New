const express = require('express');
const Booking = require('../models/Booking');
const ProviderProfile = require('../models/ProviderProfile');
const { auth, userOnly, providerOnly } = require('../middleware/auth');
const router = express.Router();

// POST /api/bookings - user creates booking
router.post('/', auth, userOnly, async (req, res) => {
  try {
    const { providerId, service, description, scheduledDate, scheduledTime, address, estimatedHours } = req.body;
    const providerProfile = await ProviderProfile.findOne({ user: providerId });
    const totalPrice = providerProfile ? providerProfile.hourlyRate * (estimatedHours || 1) : 0;
    const booking = await Booking.create({
      user: req.user._id,
      provider: providerId,
      service, description, scheduledDate, scheduledTime, address, estimatedHours, totalPrice
    });
    await booking.populate(['user', 'provider']);
    res.status(201).json({ booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/bookings/my - user's bookings
router.get('/my', auth, async (req, res) => {
  try {
    let query = req.user.role === 'user' ? { user: req.user._id } : { provider: req.user._id };
    const bookings = await Booking.find(query)
      .populate('user', 'name email avatar phone')
      .populate('provider', 'name email avatar phone')
      .sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/bookings/:id/status - provider updates status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    const isProvider = req.user.role === 'provider' && booking.provider.toString() === req.user._id.toString();
    const isUser = req.user.role === 'user' && booking.user.toString() === req.user._id.toString();
    if (!isProvider && !isUser) return res.status(403).json({ message: 'Not authorized' });
    if (isUser && status !== 'cancelled') return res.status(403).json({ message: 'Users can only cancel' });
    booking.status = status;
    if (status === 'completed') {
      await ProviderProfile.findOneAndUpdate({ user: booking.provider }, { $inc: { completedJobs: 1, totalJobs: 1 } });
    }
    await booking.save();
    await booking.populate(['user', 'provider']);
    res.json({ booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
