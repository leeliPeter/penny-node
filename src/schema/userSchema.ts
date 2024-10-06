import mongoose, { Schema } from 'mongoose';
import User from "../type/type";

const userSchema = new Schema<User>({
    id: { type: String, required: true, unique: true }, // User's unique identifier
    email: { type: String, required: true, unique: true }, // User's email
    password: { type: String, required: true }, // User's password
    name: { type: String }, // User's name
    icon: { type: String }, // Path to user's icon image
    image: { type: [String],default:[] } // Array of image paths
});

export default mongoose.model('User', userSchema);
