const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
require('dotenv').config()

// midleware

app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nruv7rx.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


// const verifyToken = (req, res, next) => {
//   const token = req?.cookies?.token;
//   console.log(token)
//   // console.log('token in the middleware', token);
//   // no token available 
//   if (!token) {
//     return res.status(401).send({ message: 'unauthorized access' })
//   }
//   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
//     if (err) {
//       return res.status(401).send({ message: 'unauthorized access' })
//     }
//     req.user = decoded;
//     next();
//   })
// }

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
    if (error) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // DB Collections
    const bookcategoryCollections = client.db('BookHub').collection('AllCategoryBooks');
    const bookcategoryCollection = client.db('BookHub').collection('BookCategory');
    const borrowedBooks = client.db('BookHub').collection('BorrowedBooks');



    // auth related api
    // app.post('/jwt', async (req, res) => {
    //   const user = req.body;
    //   console.log('user for token', user);
    //   const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    //   console.log(token)
    //   res.cookie('token', token, {
    //     httpOnly: true,
    //     secure: true,
    //     sameSite: 'none'
    //   })
    //     .send({ success: true });
    // })

    // app.post('/logout', async (req, res) => {
    //   const user = req.body;
    //   console.log('logging out', user);
    //   res.clearCookie('token', { maxAge: 0 }).send({ success: true })
    // })

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.ACCESS_TOKEN_SECRET === "production",
          sameSite: process.env.ACCESS_TOKEN_SECRET === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });
    app.post("/logout", async (req, res) => {
      res
        .clearCookie("token", {
          maxAge: 0,
          secure: process.env.ACCESS_TOKEN_SECRET === "production" ? true : false,
          sameSite: process.env.ACCESS_TOKEN_SECRET === "production" ? "none" : "strict",
        })
        .send({ status: true });
    });


    // book category api

    app.get('/bookcategory', async (req, res) => {
      const cursor = bookcategoryCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    // addbooks api
    app.post('/addbooks', async (req, res) => {
      const newBook = req.body;
      const result = await bookcategoryCollections.insertOne(newBook);
      res.send(result);
    })
    //  borrowed book api
    app.post('/borrowedbooks', async (req, res) => {

      const borrowedBook = req.body;
      const result = await borrowedBooks.insertOne(borrowedBook);
      res.send(result)
    })

    app.get('/borrowedbooks', verifyToken, async (req, res) => {
       console.log(req.query.email);
       console.log(req.user.email);
      const queryEmail = req?.query?.email;

      if (req?.user?.email !== queryEmail) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      let query = {};
      if (queryEmail) {
        query = { userEmail: queryEmail }
      }
     const result=await borrowedBooks.find(query).toArray();
      res.send(result)
    })
    // getting all data and paigination api
    app.get('/addedbooks', async (req, res) => {

      // filter
      const queryObj = {};
      const category = req.query.category;

      if (category) {
        queryObj.category = category;
      }


      const cursor = bookcategoryCollections.find(queryObj);
      const result = await cursor.toArray();
      res.send(result);
    })
    // categoryBooks api
    app.get('/addedbooks/category/:category', async (req, res) => {
      const category = req.params.category;
      const query = { category: category }
      const cursor = bookcategoryCollections.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })
    // book details api
    app.get('/addedbooks/bookdetails/:bookName', async (req, res) => {
      const bookName = req.params.bookName;
      const query = { bookName: bookName }
      const result = await bookcategoryCollections.findOne(query);
      res.send(result);
    })
    // update book api
    app.get('/addedbooks/update/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id)
      const query = { _id: new ObjectId(id) };
      const result = await bookcategoryCollections.findOne(query);
      res.send(result);
    })

    app.put('/addedbooks/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id)
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateBook = req.body
      const product = {
        $set: {
          image: updateBook.image,
          bookName: updateBook.bookName,
          quantityBook: updateBook.quantityBook,
          authorName: updateBook.authorName,
          category: updateBook.category,
          short: updateBook.short,
          rating: updateBook.rating
        }
      }
      const result = await bookcategoryCollections.updateOne(filter, product, options)
      res.send(result)
    })

    // paigination testenig data api

    app.get('/bookcount', async (req, res) => {

      const total = await bookcategoryCollections.estimatedDocumentCount();
      res.send({ total });

    })
    // return book
    app.delete('/borrowedbooks/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await borrowedBooks.deleteOne(query);
      res.send(result);
    })

    // testing the server
    app.get('/', (req, res) => {
      res.send('library management server is running')
    })


    app.listen(port, () => {
      console.log(`library management server is running on port ${port}`)
    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
