const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { protect } = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;

//configure_cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

//create_event
router.post('/', protect, async (req, res) => {
    const { title, descritpion, date, image } = req.body;
    try {
        let imageUrl = '';
        if(image) {
            const uploadedResponse = await cloudinary.uploader.upload(image, {
                folder: 'events'
            });
            imageUrl = uploadedResponse.secure_url;
        }
        const event = new Event({
            title,
            descritpion,
            date,
            imageUrl,
            createdBy: req.user._id
        });
        await event.save();
        res.json(event);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

//get_all_events_(with_optional_date_filters)
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = {};
        if ( startDate && endDate ) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };

        }
        const events = await Event.find(query).populate('createdBy', 'name email');
        res.json(events);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

//get_a_single_event
router.get('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('createdBy', 'name email');
        if(!event) return res.status(400).json({message: 'Event not found'});
        res.json(event);
    } catch (error) {
        res.status(500).json({message: error.message});

    }
});

//update_event_only_owner_allowed
router.put('/:id', protect, async (req, res) => {
    try {
        let event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({message: 'Event not found'});
        if (event.createdBy.toString()!==req.user._id.toString()){
            return res.status(401).json({message: 'Not authorized to update this event'});
        }
        const {title, descritpion, date, image} = req.body;
        if(image) {
            const uploadedResponse = await cloudinary.uploader.upload(image, {folder: 'events'});
            event.imageUrl = uploadedResponse.secure_url;
        }
        event.title = title || event.title;
        event.descritpion = descritpion || event.descritpion;
        event.date = date || event.date;
        await event.save();
        res.json(event);

    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

//delete_event_(only_owner_allowed)
router.delete('/:id', protect, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if(!event) return res.status(404).json({message: 'Event not found'});
        if(event.createdBy.toString()!==req.user._id.toString()){
            return res.status(401).json({message: 'Not authorized to delete this event'});
        }
        await event.remove();
        res.json({message: 'Event removed'});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

//attend_an_event_(simulate_joining)
router.post('/:id/attend', protect, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if(!event) return res.status(404).json({message: 'Event not found'});
        //prevent_duplicate_attendance
        if(event.attendees.includes(req.user._id)){
            return res.status(400).json({message: 'Already attending'});
        }
        event.attendees.push(req.user._id);
        await event.save();
        //real_time_update_via_socket.IO
        if(req.io){
            req.io.emit('attendeeUpdated', {eventId: event._id, attendeesCount: event.attendees.length});
        }
        res.json({message: 'Successfully joined the event', attendeesCount: event.attendees.length});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

module.exports = router;