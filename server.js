const express = require('express');
const https = require('https');
const bcrypt = require('bcryptjs');
const knex = require('knex');
const pg = require('pg');

const app = express();

app.use(express.urlencoded({extended: false}));
app.use(express.json());


const db = knex({
  client:'pg',
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: true
  }
})

// let db = [
//   {
//     id: 1,
//     username: "wesowx",
//     name: "wes",
//     password: "wes",
//     p: new Date(2020,1,16).getTime(),
//     m: new Date().getTime(),
//     o: new Date().getTime(),
//     fap: 1,
//     joined: new Date(),
//     rank: 'Fapper'
//   }
// ]

app.get('/', (req,res) => console.log('hi'));


app.post(
  '/signin',
  (req,res) => {
    const {username,password} = req.body;
    db('users')
    .where('username',username)
    .then(user => {
      const passwordValidation = bcrypt.compareSync(password, user[0].password);
      if (passwordValidation) {
        res.json(user[0]);
      } else {
        res.status(404).json('no such user');
      }
    })
    .catch(err => res.status(400).json(err))


    // OLD CODE

    // let passwordValidation = bcrypt.compareSync(req.body.password, db[db.length-1].password);
    // if (req.body.username === db[db.length-1].username && passwordValidation) {
    //   res.json(db[db.length-1]);
    // } else {
    //   res.status(404).json('no such user');
    // }
  }
);


app.post('/register', (req,res) => {
  const {name,username,password} = req.body;

  if (!name.length || !username.length || !password.length) {
    res.status(404).json("Do not leave blanks")
  } else {
    let hashedPassword = bcrypt.hashSync(password,8);
    db('users')
    .returning('*')
    .insert({
      username: username,
      name: name,
      password: hashedPassword,
      p: new Date(),
      m: new Date(),
      o: new Date(),
      joined: new Date()
    })
    .then(user => res.json(user[0]))
    .catch(err => res.status(404).json(err))
  }


  // OLD CODE

  // if (!req.body.name.length || !req.body.username.length || !req.body.password.length) {
  //   res.status(404).json("Incorrect credentials");
  // } else {
  //   let hashedPassword = bcrypt.hashSync(req.body.password, 8);
  //
  //   console.log(hashedPassword);
  //
  //   db.push({
  //     id: db[db.length-1].id + 1,
  //     username: req.body.username,
  //     name: req.body.name,
  //     password: hashedPassword,
  //     p: new Date().getTime(),
  //     m: new Date().getTime(),
  //     o: new Date().getTime(),
  //     fap: 0,
  //     joined: new Date(),
  //     rank: 'Fapper'
  //   });
  //   res.json(db[db.length-1]);
  // }
})


app.post('/reset', (req,res) => {
  const {p,m,o,username} = req.body;

  if (p === true) {
    db('users')
    .where('username',username)
    .returning('*')
    .update({
      p: new Date()
    })
  }

  if (m === true) {
    db('users')
    .where('username',username)
    .returning('*')
    .update({
      m: new Date()
    })
  }

  if (o === true) {
    db('users')
    .where('username',username)
    .returning('*')
    .update({
      o: new Date()
    })
  }

  db('users')
  .where('username',username)
  .then(user => res.json(user[0]))
  .catch(err => res.status(404).json(err))

  //
  // if (req.body.p) {
  //   db[length-1].p = new Date().getTime();
  // }
  // if (req.body.m) {
  //   db[length-1].m = new Date().getTime();
  // }
  // if (req.body.o) {
  //   db[length-1].o = new Date().getTime();
  //   db[length-1].fap++
  // }
  //
  // res.json(db[length-1]);
})


app.put('/updaterank', (req,res) => {
  const {rank,username} = req.body;

  db('users')
  .where('username',username)
  .update({
    rank: rank
  })

  db('users')
  .where('username',username)
  .then(user => res.json(user[0]))
  .catch(err => res.status(404).json(err))
  // db[length-1].rank = req.body.rank;
  // res.json(db[length-1]);
})


app.listen(process.env.PORT || 8080, () => {
  console.log(`app is running on port ${process.env.PORT}`)
}
)
