const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    res.status(200).json({
      url: req.file.path,
      filename: req.file.originalname,
      type: req.file.mimetype,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { uploadFile };