require("dotenv").config();
const app = require("./api/index");
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Tasteit template running at http://localhost:${port}`);
  console.log(`Admin dashboard: http://localhost:${port}/admin`);
});
