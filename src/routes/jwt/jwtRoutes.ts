import express from "express";

const router = express.Router();

router.get("/token/verify", (req, res, next) => {
  try {
    res.status(200).json({ success: true });
  } catch (error) {
    console.log("Error in routes: ", error);
    next("An error occurred fetching pox-info.");
  }
});

export { router as jwtRoutes };
