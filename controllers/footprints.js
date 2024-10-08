const express = require('express');
const verifyToken = require('../middleware/verify-token.js');
const Footprint = require('../models/footprint.js');
const e = require('cors');
const router = express.Router();

// ========== Public Routes ===========

// ========= Protected Routes =========

router.use(verifyToken);

// GET footprints
router.get('/', async (req, res) => {
  try {
    const footprints = await Footprint.find({})
      .populate('author')
      .sort({ createdAt: 'desc' });
    res.status(200).json(footprints);
  } catch (error) {
    res.status(500).json(error);
  }
});

// GET a specific footprint
router.get('/:footprintId', async (req, res) => {
  try {
    const footprint = await Footprint.findById(req.params.footprintId).populate('author');
    res.status(200).json(footprint);
  } catch (error) {
    res.status(500).json(error);
  }
});

// POST a new footprint
router.post('/', async (req, res) => {
  try {
    req.body.author = req.user._id;
    const footprint = await Footprint.create(req.body);
    footprint._doc.author = req.user;
    res.status(201).json(footprint);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

// POST a comment on a specific footprint
router.post('/:footprintId/comments', async (req, res) => {
  try {
    req.body.author = req.user._id;
    const footprint = await Footprint.findById(req.params.footprintId);
    footprint.comments.push(req.body);
    await footprint.save();

    const newComment = footprint.comments[footprint.comments.length - 1];

    newComment._doc.author = req.user;

    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json(error);
  }
});

// PUT to update a footprint
router.put('/:footprintId', async (req, res) => {
  try {
    const footprint = await Footprint.findById(req.params.footprintId);

    if (!footprint.author.equals(req.user._id)) {
      return res.status(403).send("You're not allowed to do that!");
    }

    const updatedFootprint = await Footprint.findByIdAndUpdate(
      req.params.footprintId,
      req.body,
      { new: true }
    );

    updatedFootprint._doc.author = req.user;

    res.status(200).json(updatedFootprint);
  } catch (error) {
    res.status(500).json(error);
  }
});

// PUT to update a comment from a footprint
router.put('/:footprintId/comments/:commentId', async (req, res) => {
  try {
    const footprint = await Footprint.findById(req.params.footprintId);
    const comment = footprint.comments.id(req.params.commentId);
    comment.text = req.body.text;
    await footprint.save();
    res.status(200).json({ message: 'Ok' });
  } catch (err) {
    res.status(500).json(err);
  }
});

// DELETE a footprint
router.delete('/:footprintId', async (req, res) => {
  try {
    const footprint = await Footprint.findById(req.params.footprintId);

    if (!footprint.author.equals(req.user._id)) {
      return res.status(403).send("You're not allowed to do that!");
    }

    const deletedFootprint = await Footprint.findByIdAndDelete(req.params.footprintId);
    res.status(200).json(deletedFootprint);
  } catch (error) {
    res.status(500).json(error);
  }
});

// DELETE a comment from a footprint
router.delete('/:footprintId/comments/:commentId', async (req, res) => {
  try {
    const footprint = await Footprint.findById(req.params.footprintId);
    footprint.comments.remove({ _id: req.params.commentId });
    await footprint.save();
    res.status(200).json({ message: 'Ok' });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;