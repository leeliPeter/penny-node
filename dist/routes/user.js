"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const bcrypt_1 = __importDefault(require("bcrypt"));
const userSchema_1 = __importDefault(require("../schema/userSchema"));
const router = express_1.default.Router();
// Middleware for validating user input
const userValidation = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Invalid email format'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .custom((value) => {
        if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
            throw new Error('Password must contain both letters and numbers');
        }
        return true;
    }),
];
// Register new user
router.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, name, icon, image } = req.body; // include name and image
    // Validate input
    if (!email || !password) {
        res.status(400).json({ message: "Email and password are required." });
        return;
    }
    try {
        // Check if the user already exists
        const existingUser = yield userSchema_1.default.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: "Email already in use." });
            return;
        }
        // Hash the password
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        // Generate unique ID
        const uniqueId = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15);
        // Create a new user
        const newUser = new userSchema_1.default({
            id: uniqueId,
            email,
            password: hashedPassword,
            name: '', // Store name if provided
            icon: '', // Store icon if provided
        });
        yield newUser.save();
        console.log("session before login:", req.session.user);
        // Set user data in the session
        req.session.user = {
            id: newUser.id,
            email: newUser.email,
        };
        console.log("session after login:", req.session.user);
        res.status(200).json({ message: 'Login successful', user: req.session.user });
    }
    catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
}));
// Login user
router.post('/login', userValidation, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { email, password } = req.body;
    try {
        const user = yield userSchema_1.default.findOne({ email });
        if (!user) {
            res.status(400).json({ message: 'Invalid email or password' });
            return;
        }
        const isMatch = yield bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ message: 'Invalid email or password' });
            return;
        }
        // Set user data in the session
        req.session.user = {
            id: user.id,
            email: user.email,
        };
        res.status(200).json({ message: 'Login successful', user: req.session.user });
    }
    catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
//if session get user data
router.get('/getData', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.session.user) {
        // Use the custom 'id' field for querying
        const user = yield userSchema_1.default.findOne({ id: req.session.user.id }).select('-password'); // Exclude password for security
        if (user) {
            res.status(200).json({ user });
        }
        else {
            res.status(404).json({ message: 'User not found.' });
        }
    }
    else {
        res.status(401).json({ message: 'Unauthorized' });
    }
}));
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).json({ message: 'Session destroy error' });
            return;
        }
        res.status(200).json({ message: 'Logout successful' });
    });
});
exports.default = router;
