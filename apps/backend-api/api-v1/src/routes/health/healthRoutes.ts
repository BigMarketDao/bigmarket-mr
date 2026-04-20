import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
	res.json({ result: 'hallo' });
});

export { router as healthRoutes };
