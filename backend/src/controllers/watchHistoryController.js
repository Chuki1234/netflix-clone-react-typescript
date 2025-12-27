import WatchHistory from "../models/WatchHistory.js";

// @desc    Get watch history
// @route   GET /api/watch-history
// @access  Private
export const getWatchHistory = async (req, res) => {
  try {
    const watchHistory = await WatchHistory.find({ userId: req.user._id })
      .sort({ lastWatchedAt: -1 })
      .limit(100);

    res.json(watchHistory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get continue watching (not completed, has progress)
// @route   GET /api/watch-history/continue
// @access  Private
export const getContinueWatching = async (req, res) => {
  try {
    const continueWatching = await WatchHistory.find({
      userId: req.user._id,
      progress: { $gt: 0 },
      completed: false,
    })
      .sort({ lastWatchedAt: -1 })
      .limit(20);

    res.json(continueWatching);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get watch history for specific movie
// @route   GET /api/watch-history/:movieId/:mediaType
// @access  Private
export const getMovieWatchHistory = async (req, res) => {
  try {
    const { movieId, mediaType } = req.params;

    const watchHistory = await WatchHistory.findOne({
      userId: req.user._id,
      movieId: parseInt(movieId),
      mediaType,
    });

    if (!watchHistory) {
      return res.json({
        movieId: parseInt(movieId),
        mediaType,
        progress: 0,
        duration: 0,
        completed: false,
      });
    }

    res.json(watchHistory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Save/Update watch history
// @route   POST /api/watch-history
// @access  Private
export const saveWatchHistory = async (req, res) => {
  try {
    const { movieId, mediaType, progress, duration, completed } = req.body;

    if (!movieId || !mediaType) {
      return res.status(400).json({ message: "Please provide movieId and mediaType" });
    }

    if (!["movie", "tv"].includes(mediaType)) {
      return res.status(400).json({ message: "mediaType must be 'movie' or 'tv'" });
    }

    const watchHistory = await WatchHistory.findOneAndUpdate(
      {
        userId: req.user._id,
        movieId,
        mediaType,
      },
      {
        userId: req.user._id,
        movieId,
        mediaType,
        progress: progress || 0,
        duration: duration || 0,
        completed: completed || false,
        lastWatchedAt: new Date(),
      },
      {
        new: true,
        upsert: true, // Create if doesn't exist
      }
    );

    res.json(watchHistory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Mark movie as completed
// @route   PUT /api/watch-history/:movieId/:mediaType/complete
// @access  Private
export const markAsCompleted = async (req, res) => {
  try {
    const { movieId, mediaType } = req.params;

    const watchHistory = await WatchHistory.findOneAndUpdate(
      {
        userId: req.user._id,
        movieId: parseInt(movieId),
        mediaType,
      },
      {
        completed: true,
        lastWatchedAt: new Date(),
      },
      {
        new: true,
        upsert: true,
      }
    );

    res.json(watchHistory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete watch history
// @route   DELETE /api/watch-history/:movieId/:mediaType
// @access  Private
export const deleteWatchHistory = async (req, res) => {
  try {
    const { movieId, mediaType } = req.params;

    await WatchHistory.findOneAndDelete({
      userId: req.user._id,
      movieId: parseInt(movieId),
      mediaType,
    });

    res.json({ message: "Watch history deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

