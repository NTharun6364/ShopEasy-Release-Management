const User = require('../models/User');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch profile' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, phone, address, password } = req.body;

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = { ...user.address.toObject(), ...address };
    if (password) user.password = password;

    await user.save();

    return res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
    });
  } catch (error) {
    return res.status(400).json({ message: 'Unable to update profile', error: error.message });
  }
};

module.exports = { getProfile, updateProfile };
