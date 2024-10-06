type User = {
    id: string; // Optional, only if you're using a custom ID
    email: string;
    password: string;
    name?: string; // Optional
    icon?: string; // Optional
    image: string[]; // Array of strings for image paths
}
export default User;

