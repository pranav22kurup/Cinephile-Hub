const Movie = require('../models/Movie');
const { enqueueLazyInsert } = require('../queue');

const parsePagination = (req) => {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '12', 10), 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

exports.getMovies = async (req, res, next) => {
  try {
    const { limit, skip } = parsePagination(req);
    const [items, total] = await Promise.all([
      Movie.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Movie.countDocuments({})
    ]);
    res.json({ items, total });
  } catch (err) {
    next(err);
  }
};

exports.getMoviesSorted = async (req, res, next) => {
  try {
    const { limit, skip } = parsePagination(req);
    const by = (req.query.by || 'name').toString();
    const order = (req.query.order || 'asc').toLowerCase() === 'desc' ? -1 : 1;
    const valid = { name: 'name', rating: 'rating', releaseDate: 'releaseDate', duration: 'duration' };
    const sortField = valid[by] || 'name';

    const [items, total] = await Promise.all([
      Movie.find({}).sort({ [sortField]: order }).skip(skip).limit(limit),
      Movie.countDocuments({})
    ]);
    res.json({ items, total });
  } catch (err) {
    next(err);
  }
};

exports.searchMovies = async (req, res, next) => {
  try {
    const q = (req.query.q || '').toString().trim();
    const { limit, skip } = parsePagination(req);

    if (!q) return res.json({ items: [], total: 0 });

    
    try {
      const textQuery = { $text: { $search: q } };
      const [items, total] = await Promise.all([
        Movie.find(textQuery).skip(skip).limit(limit),
        Movie.countDocuments(textQuery)
      ]);
      return res.json({ items, total });
    } catch (textErr) {

      const regexQuery = {
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } }
        ]
      };
      const [items, total] = await Promise.all([
        Movie.find(regexQuery).skip(skip).limit(limit),
        Movie.countDocuments(regexQuery)
      ]);
      return res.json({ items, total });
    }
  } catch (err) {
    next(err);
  }
};

exports.getMovieById = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });
    res.json(movie);
  } catch (err) {
    next(err);
  }
};

exports.addMovie = async (req, res, next) => {
  try {
    const data = req.body || {};
    
    const job = await enqueueLazyInsert(data);
    res.status(202).json({ message: 'Movie queued for insertion', jobId: job.id });
  } catch (err) {
    next(err);
  }
};

exports.updateMovie = async (req, res, next) => {
  try {
    const updated = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Movie not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.deleteMovie = async (req, res, next) => {
  try {
    const deleted = await Movie.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Movie not found' });
    res.json({ message: 'Movie deleted' });
  } catch (err) {
    next(err);
  }
};