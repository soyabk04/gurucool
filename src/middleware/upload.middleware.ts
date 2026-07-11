import multer from "multer";

export const upload = multer({
  storage: multer.memoryStorage(),
});
if(!upload){
console.log("err3")
}