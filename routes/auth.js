const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
//const { use } = require("react");

//generate_JWT
const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, { expiresIn: '30d'});
};

//register
router.post('/register', async (req, res) => {
    const {name, email, password} = req.body;
    try{
        let user = await User.findOne({email});
        if (user) return res.status(400).json({message:'User already exists'});
        user = new User({name, email, password});
        await user.save();
        res.json({
            _id:user._id,
            name:user.name,
            email:user.email,
            token:generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({message:error.message});
    }
});

//login
router.post('/login', async (req, res) => {
    const {email, password} = req.body;
    try {
        const user = await User.findOne({email});
        if(user && (await user.matchPassword(password))){
            res.json({
                _id:user._id,
                name:user.name,
                email:user.email,
                token:generateToken(user._id)
            });
        }
        else {
            res.status(401).json({message: 'Invalid credentials'});
        }
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

//guest_user_(creates_a_guest_user)
router.post('/guest', async (req, res) =>{
    try {
        const guestEmail = 'guest_${Date.now()}@example.com';
        const guestUser = new User({
            name:'Guest User',
            email:guestEmail,
            password:'guestpassword',
            isGuest:true

        });
        await guestUser.save();
        res.json({
            _id: guestUser._id,
            name: guestUser.name,
            email: guestUser.email,
            token:generateToken(guestUser._id)
        });
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

module.exports = router;