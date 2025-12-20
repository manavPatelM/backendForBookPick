import express from "express";
import cloudinary from "../lib/cloudinary.js";
import authMiddleware from "../middlewere/auth.middlewere.js";
import Book from "../models/Book.js";

const router = express.Router();

router.post("/", authMiddleware, async (requestAnimationFrame, res) => {
  try {
    const { title, caption, rating, coverImage } = req.body;

    const uploadResponse = await cloudinary.uploader.upload(coverImage, {
      folder: "book_covers",
    });

    const newBook = new Book({
      title,
      caption,
      rating,
      coverImage: uploadResponse.secure_url,
      user: req.user._id,
    });

    await newBook.save();
    res.status(201).json(newBook);

  } catch (error) {
    
  }
})

router.get("/", authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const books = await Book.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "userName profileImage");

    const totalBooks = await Book.countDocuments();
    const totalPages = Math.ceil(totalBooks / limit);

    res.status(200).json({
      books,
      pagination: {
        totalBooks, 
        totalPages,
        currentPage: page,
      },
    });
  } catch (error) {
    
  }
})

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const bookId = req.params.id;
    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (book.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    if (book.coverImage && book.coverImage.includes("res.cloudinary.com")) {
      const publicId = book.coverImage.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`book_covers/${publicId}`);
    }

    await book.deleteOne();
    res.status(200).json({ message: "Book deleted successfully" });
  }
  catch (error) {
    res.status(500).json({ message: "Server error" });
  } 
});

export default router;