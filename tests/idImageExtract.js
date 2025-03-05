const Tesseract = require("tesseract.js");

Tesseract.recognize("./imgs/processed.jpg", "ara", {
  logger: (m) => console.log(m),
})
  .then(({ data: { text } }) => {
    console.log("Extracted Text:", text);
  })
  .catch((error) => {
    console.error("OCR Error:", error);
  });
