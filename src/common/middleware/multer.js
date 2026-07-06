import multer from "multer";
// import fs from "node:fs";

// export const localMulter = ({filePath = "General",fileExt = []} = {}) => {
//   const path = `src/DB/uploads/${filePath}`;
//   if (!fs.existsSync(path)) {
//     fs.mkdirSync(path, { recursive: true });
//   }
//   const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, path);
//     },
//     filename: function (req, file, cb) {
//       const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//       cb(null, uniqueSuffix + "-" + file.originalname);
//     },
//   });

//   function fileFilter(req, file, cb) {
//     if (!fileExt.includes(file.mimetype)) {
//       cb(new Error("Invalid File Type"));
//     }
//     cb(null, true);
//   }

//   const upload = multer({ storage, fileFilter });
//   return upload;
// };





export const localMulter = ({ fileExt = [] } = {}) => {
  const storage = multer.memoryStorage();

  function fileFilter(req, file, cb) {
    if (!fileExt.includes(file.mimetype)) {
      return cb(new Error("Invalid File Type"));
    }
    cb(null, true);
  }

  return multer({ storage, fileFilter });
};