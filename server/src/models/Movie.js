const { Schema, model } = require('mongoose');

const MovieSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    description: { type: String, default: '' },
    rating: { type: Number, default: 0, index: true },
    releaseDate: { type: Date, index: true },
    duration: { type: Number, default: 0, index: true }, // minutes
    director: { type: String, default: '' },
    genres: { type: [String], default: [] },
    posterUrl: { type: String, default: '' }
  },
  { timestamps: true }
);

MovieSchema.index({ name: 'text', description: 'text' }, { weights: { name: 10, description: 5 } });

module.exports = model('Movie', MovieSchema);