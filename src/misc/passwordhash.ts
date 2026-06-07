import bcrypt from 'bcrypt'

async function hashpass(pass:string){
    const hashedPassword =await bcrypt.hash(pass, 10);
    return hashedPassword;
}
async function comparepass(pass:string, hashedPassword:string){
    const isMatch = await bcrypt.compare(pass, hashedPassword);
    return isMatch;
}

export { hashpass, comparepass };