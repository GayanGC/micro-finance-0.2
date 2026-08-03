import Holiday from '../models/Holiday.js';

// @desc    Create / register a new Holiday or Skip Day
// @route   POST /api/holidays
// @access  Private (Admin, super_admin)
export const createHoliday = async (req, res) => {
  try {
    const { date, name, type, routeId } = req.body;

    if (!date || !name) {
      return res.status(400).json({ message: 'Date and name are required.' });
    }

    // Normalise to midnight UTC so comparisons are date-only
    const normalisedDate = new Date(date);
    normalisedDate.setUTCHours(0, 0, 0, 0);

    const exists = await Holiday.findOne({ date: normalisedDate });
    if (exists) {
      return res
        .status(400)
        .json({ message: `A holiday/skip day already exists for ${normalisedDate.toISOString().split('T')[0]}.` });
    }

    const holiday = await Holiday.create({
      date: normalisedDate,
      name,
      type: type || 'Holiday',
      routeId: routeId || '',
    });

    return res.status(201).json({
      message: 'Holiday registered successfully!',
      holiday,
    });
  } catch (error) {
    console.error('Error creating holiday:', error);
    return res.status(500).json({ message: 'Failed to create holiday', error: error.message });
  }
};

// @desc    Get all Holidays / Skip Days
// @route   GET /api/holidays
// @access  Private
export const getHolidays = async (req, res) => {
  try {
    const { type, year } = req.query;
    const filter = {};

    if (type) filter.type = type;

    if (year) {
      filter.date = {
        $gte: new Date(`${year}-01-01`),
        $lte: new Date(`${year}-12-31`),
      };
    }

    const holidays = await Holiday.find(filter).sort({ date: 1 });
    return res.json(holidays);
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return res.status(500).json({ message: 'Failed to fetch holidays', error: error.message });
  }
};

// @desc    Delete a Holiday by ID
// @route   DELETE /api/holidays/:id
// @access  Private (Admin, super_admin)
export const deleteHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.id);
    if (!holiday) {
      return res.status(404).json({ message: 'Holiday not found.' });
    }
    return res.json({ message: 'Holiday deleted successfully.', holiday });
  } catch (error) {
    console.error('Error deleting holiday:', error);
    return res.status(500).json({ message: 'Failed to delete holiday', error: error.message });
  }
};
