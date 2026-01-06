const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const ctrl = require('../controllers/moviesController');

router.get('/', ctrl.getMovies);
router.get('/sorted', ctrl.getMoviesSorted);
router.get('/search', ctrl.searchMovies);
router.get('/:id', ctrl.getMovieById);

router.post('/', authMiddleware, requireRole('admin'), ctrl.addMovie);
router.put('/:id', authMiddleware, requireRole('admin'), ctrl.updateMovie);
router.delete('/:id', authMiddleware, requireRole('admin'), ctrl.deleteMovie);

module.exports = router;