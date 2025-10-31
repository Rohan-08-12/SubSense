const bcrypt = require('bcrypt');


// Function to hash a passwor
const hashPassword = async (password) => {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
};

// Function to compare a plain password with a hashed password
const comparePassword=async(password,hashedPassword)=>{
    return await bcrypt.compare(password,hashedPassword);
};

module.exports={hashPassword,comparePassword};


