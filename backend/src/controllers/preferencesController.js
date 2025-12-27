import UserPreferences from "../models/UserPreferences.js";

// @desc    Get user preferences (My List and Likes)
// @route   GET /api/preferences
// @access  Private
export const getPreferences = async (req, res) => {
  try {
    let preferences = await UserPreferences.findOne({ userId: req.user._id });

    if (!preferences) {
      // Create empty preferences if doesn't exist
      preferences = await UserPreferences.create({
        userId: req.user._id,
        myList: [],
        likedMovies: [],
      });
    }

    res.json({
      myList: preferences.myList || [],
      likedMovies: preferences.likedMovies || [],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Toggle movie in My List
// @route   POST /api/preferences/my-list
// @access  Private
export const toggleMyList = async (req, res) => {
  try {
    const { movieId, mediaType } = req.body;

    if (!movieId || !mediaType) {
      return res.status(400).json({ message: "Please provide movieId and mediaType" });
    }

    if (!["movie", "tv"].includes(mediaType)) {
      return res.status(400).json({ message: "mediaType must be 'movie' or 'tv'" });
    }

    let preferences = await UserPreferences.findOne({ userId: req.user._id });

    if (!preferences) {
      preferences = await UserPreferences.create({
        userId: req.user._id,
        myList: [],
        likedMovies: [],
      });
    }

    const existingIndex = preferences.myList.findIndex(
      (item) => item.movieId === movieId && item.mediaType === mediaType
    );

    if (existingIndex >= 0) {
      // Remove from myList
      preferences.myList.splice(existingIndex, 1);
      await preferences.save();
      res.json({
        message: "Removed from My List",
        inMyList: false,
        myList: preferences.myList,
      });
    } else {
      // Add to myList
      preferences.myList.push({
        movieId,
        mediaType,
        addedAt: new Date(),
      });
      await preferences.save();
      res.json({
        message: "Added to My List",
        inMyList: true,
        myList: preferences.myList,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Toggle like movie
// @route   POST /api/preferences/likes
// @access  Private
export const toggleLike = async (req, res) => {
  try {
    const { movieId, mediaType } = req.body;

    if (!movieId || !mediaType) {
      return res.status(400).json({ message: "Please provide movieId and mediaType" });
    }

    if (!["movie", "tv"].includes(mediaType)) {
      return res.status(400).json({ message: "mediaType must be 'movie' or 'tv'" });
    }

    let preferences = await UserPreferences.findOne({ userId: req.user._id });

    if (!preferences) {
      preferences = await UserPreferences.create({
        userId: req.user._id,
        myList: [],
        likedMovies: [],
      });
    }

    const existingIndex = preferences.likedMovies.findIndex(
      (item) => item.movieId === movieId && item.mediaType === mediaType
    );

    if (existingIndex >= 0) {
      // Remove from likes
      preferences.likedMovies.splice(existingIndex, 1);
      await preferences.save();
      res.json({
        message: "Unliked",
        isLiked: false,
        likedMovies: preferences.likedMovies,
      });
    } else {
      // Add to likes
      preferences.likedMovies.push({
        movieId,
        mediaType,
        likedAt: new Date(),
      });
      await preferences.save();
      res.json({
        message: "Liked",
        isLiked: true,
        likedMovies: preferences.likedMovies,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Check if movie is in My List
// @route   GET /api/preferences/my-list/:movieId/:mediaType
// @access  Private
export const checkMyList = async (req, res) => {
  try {
    const { movieId, mediaType } = req.params;

    const preferences = await UserPreferences.findOne({ userId: req.user._id });

    if (!preferences) {
      return res.json({ inMyList: false });
    }

    const inMyList = preferences.myList.some(
      (item) => item.movieId === parseInt(movieId) && item.mediaType === mediaType
    );

    res.json({ inMyList });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Check if movie is liked
// @route   GET /api/preferences/likes/:movieId/:mediaType
// @access  Private
export const checkLike = async (req, res) => {
  try {
    const { movieId, mediaType } = req.params;

    const preferences = await UserPreferences.findOne({ userId: req.user._id });

    if (!preferences) {
      return res.json({ isLiked: false });
    }

    const isLiked = preferences.likedMovies.some(
      (item) => item.movieId === parseInt(movieId) && item.mediaType === mediaType
    );

    res.json({ isLiked });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

