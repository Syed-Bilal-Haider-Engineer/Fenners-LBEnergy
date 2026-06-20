const dotenv = require("dotenv");
const app = require("./src/app");

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, (error) => {
  if (!error) {
    console.log(`Server running on port ${PORT}`);
  } else {
    console.log("Error starting server:", error);
  }
});