const userRepository = require("../repositories/user.repository");
const { hashPassword, comparePassword } = require("../utils/hash");
const { generateToken } = require("../utils/jwt");

const register = async (email, password, firstName, lastName) => {
  // 1. Check if user exists

  const existingUser = await userRepository.findUserByEmail(email);
  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await hashPassword(password);

  const newUser = await userRepository.createUser({
    email,
    password: hashedPassword,
    firstName,
    lastName,
  });

  const token = generateToken(newUser.id);

  return {
    user: newUser,
    token,
  };
};

const login = async (email, password) => {
  const user = await userRepository.findUserByEmail(email);

  const isPasswordValid = user
    ? await comparePassword(password, user.password)
    : false;

  if (!user || !isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  const token = generateToken(user.id);

  // Exclude password from returned user object
  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
  };
};

module.exports = {
  register,
  login,
};
