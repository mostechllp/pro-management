const User = require('../models/User');

// @desc    Get current user's settings (profile + preferences)
// @route   GET /api/settings
// @access  Private
exports.getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update profile (name, email, phone, avatar)
// @route   PUT /api/settings/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone, avatar } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required',
      });
    }

    // Prevent duplicate emails across accounts
    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'That email is already in use by another account',
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        name,
        email,
        phone: phone ?? '',
        ...(avatar !== undefined ? { avatar } : {}),
      },
      { new: true, runValidators: true },
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Change password
// @route   PUT /api/settings/password
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your current and new password',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save(); // pre-save hook hashes the new password

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update notification / display preferences
// @route   PUT /api/settings/preferences
// @access  Private
exports.updatePreferences = async (req, res) => {
  try {
    const { emailNotifications, expiryReminderDays, dateFormat, itemsPerPage } = req.body;

    const update = {};
    if (emailNotifications !== undefined) update['preferences.emailNotifications'] = emailNotifications;
    if (expiryReminderDays !== undefined) update['preferences.expiryReminderDays'] = expiryReminderDays;
    if (dateFormat !== undefined) update['preferences.dateFormat'] = dateFormat;
    if (itemsPerPage !== undefined) update['preferences.itemsPerPage'] = itemsPerPage;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: update },
      { new: true, runValidators: true },
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: user.preferences,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};