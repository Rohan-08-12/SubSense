const jwt=require('jsonwebtoken');


// Function to generate JWT
const generateToken=(userId)=>{
    const token=jwt.sign({userId},
        process.env.JWT_SECRET,
        {expiresIn: process.env.JWT_EXPIRES_IN || '7d'});
    return token;
};

// Function to verify JWT
const verifyToken=(token)=>{
    try{
        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        return decoded;
    }catch(err){
        throw new Error('Invalid Token');
    }
};

module.exports={generateToken,verifyToken};