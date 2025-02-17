import express from 'express';
import { readPythEvents } from './pyth_events_helper';

const router = express.Router();

router.get('/pyth/events', async (req, res) => {
	//const data = await readPythEvents(true);
	res.json({ result: null });
});

export { router as pythRoutes };
