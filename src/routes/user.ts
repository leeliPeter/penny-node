import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import User from '../schema/userSchema';

const router = express.Router();

// Middleware for validating user input
const userValidation = [
  body('email').isEmail().withMessage('Invalid email format'),
  body('password')
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
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { email, password, name,icon, image } = req.body; // include name and image

  // Validate input
  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required." });
    return;
  }

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "Email already in use." });
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate unique ID
    const uniqueId = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15);

    // Create a new user
    const newUser = new User({ 
      id: uniqueId, 
      email, 
      password: hashedPassword,
      name:'', // Store name if provided
      icon:'', // Store icon if provided

    });
    await newUser.save();

    console.log("session before login:", req.session.user);
    // Set user data in the session
    req.session.user = {
      id: newUser.id,
      email: newUser.email,
    };
    console.log("session after login:", req.session.user);
    res.status(200).json({ message: 'Login successful', user: req.session.user });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});


// Login user
router.post('/login', userValidation, async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ message: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
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
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


//if session get user data
router.get('/getData', async (req, res) => {
  if (req.session.user) {
    // Use the custom 'id' field for querying
    const user = await User.findOne({ id: req.session.user.id }).select('-password'); // Exclude password for security
    
    if (user) {
      res.status(200).json({ user });
    } else {
      res.status(404).json({ message: 'User not found.' });
    }
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
});


router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      res.status(500).json({ message: 'Session destroy error' });
      return;
    }
    res.status(200).json({ message: 'Logout successful' });
  });
}
);


export default router;