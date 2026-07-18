import { Router } from 'express';
import { getEvents, getEventById } from '../controllers/events.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(getEvents));
router.get('/:eid', asyncHandler(getEventById));

export default router;
