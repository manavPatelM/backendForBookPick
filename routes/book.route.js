import express from "express";
import cloudinary from "../lib/cloudinary.js";
import authMiddleware from "../middlewere/auth.middlewere.js";
import Book from "../models/Book.js";

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
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

  } } catch (error) {
    console.error("Error creating book:", error); 
    res.status(500).json({ message: "Server error" });
  }
})

router.get("/", authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const books = await Book.find()   
      .skip(skip)
      .limit(limit)
      .populate("user", "userName profileImage");
    const totalBooks = await Book.countDocuments();
    const totalPages = Math.ceil(totalBooks / limit);
    res.status(200).json({ books, pagination: { totalBooks, totalPages, currentPage: page } });
  } catch (error) {
    console.error("Error fetching books:", error);         
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/user/:userId", authMiddleware, async (req, res) => {
  try {
    const books = await Book.find({ user: req.params.userId })
      .sort({ createdAt: -1 })
      .populate("user", "userName profileImage");
    res.status(200).json({ books });
  } catch (error) {
    console.error("Error fetching user books:", error);
    res.status(500).json({ message: "Server error" });
  }
});

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