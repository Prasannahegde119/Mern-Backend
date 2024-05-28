import { User } from "../../server.js";
import bcrypt from "bcryptjs";
import JWT from "jsonwebtoken";

export class AuthenticateController {
  async register(req) {
    const { username, email, password } = req;

    console.log(username, email, password);
    // Check if the username or email already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username or email already exists" });
    }

    // Create a new user
    const newUser = new User({
      username,
      email,
      password: await this.hashpassword(password),
    });
    await newUser.save();
  }
  async login(req, res) {
    const { email, password } = req;
    // Check if the user exists with the provided email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Check if the password is correct
    const checkPassword = await bcrypt.compare(password, user.password);
    if (!checkPassword) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const secretKey = process.env.JWT_SECRET_KEY;
    const token = JWT.sign({ userId: user.id }, secretKey, {
      expiresIn: "1hr",
    });

    // Include user's name in the response data
    res.cookie("token", token);
    return res
      .status(200)
      .send({ message: "Login successful", token, name: user.username });
  }

  async users(req, res) {
    const users = await User.find();
    return users;
  }

  async hashpassword(password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    return hashedPassword;
  }
}
