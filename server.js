const express = require('express');
const https = require('https');
const bcrypt = require('bcryptjs');

const app = express();

app.use(express.urlencoded({extended: false}));
app.use(express.json());


let db = [
  {
    id: 1,
    username: "wesowx",
    name: "wes",
    password: "wes",
    p: new Date(2020,1,16).getTime(),
    m: new Date().getTime(),
    o: new Date().getTime(),
    fap: 1,
    joined: new Date(),
    rank: 'Fapper'
  }
]

app.get('/', (req,res) => console.log('hi'));


app.post(
  '/signin',
  (req,res) => {
    let passwordValidation = bcrypt.compareSync(req.body.password, db[db.length-1].password);
    if (req.body.username === db[db.length-1].username && passwordValidation) {
      res.json(db[db.length-1]);
    } else {
      res.status(404).json('no such user');
    }
  }
);


app.post('/register', (req,res) => {
  if (!req.body.name.length || !req.body.username.length || !req.body.password.length) {
    res.status(404).json("Incorrect credentials");
  } else {
    let hashedPassword = bcrypt.hashSync(req.body.password, 8);

    console.log(hashedPassword);

    db.push({
      id: db[db.length-1].id + 1,
      username: req.body.username,
      name: req.body.name,
      password: hashedPassword,
      p: new Date().getTime(),
      m: new Date().getTime(),
      o: new Date().getTime(),
      fap: 0,
      joined: new Date(),
      rank: 'Fapper'
    });
    res.json(db[db.length-1]);
  }
})


app.post('/reset', (req,res) => {
  if (req.body.p) {
    db[0].p = new Date().getTime();
  }
  if (req.body.m) {
    db[0].m = new Date().getTime();
  }
  if (req.body.o) {
    db[0].o = new Date().getTime();
    db[0].fap++
  }

  res.json(db[0]);
})


app.listen(process.env.PORT || 8080, () => {
  console.log(`app is running on port ${process.env.PORT}`)
}
)
