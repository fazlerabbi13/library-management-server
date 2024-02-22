const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
require('dotenv').config()

// midleware

app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nruv7rx.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // DB Collections
    const bookcategoryCollections = client.db('BookHub').collection('AllCategoryBooks');
    const bookcategoryCollection = client.db('BookHub').collection('BookCategory');

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
    //  added all books for geeting api
    app.get('/addedbooks', async (req, res) => {
      
      const cursor = bookcategoryCollections.find();
      const result = await cursor.toArray();
      res.send(result);
    })
    // paigination api
    app.get('/addedbooks', async (req, res) => {
      
      const page =parseInt(req.query.page)
      const limit = parseInt(req.query.limit)

      const cursor = bookcategoryCollections.find();
      const result = await cursor.skip(page * limit).limit(limit).toArray();
      res.send(result);
    })
    // categoryBooks api
    app.get('/addedbooks/category/:category', async (req, res) => {
      const category = req.params.category;
      const query =  {category:category}
      const cursor = bookcategoryCollections.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })
    // book details api
    app.get('/addedbooks/bookdetails/:bookName', async (req, res) => {
      const bookName = req.params.bookName;
      const query =  {bookName:bookName}
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

    // paigination api

    app.get('/bookcount' , async(req,res) =>{

      const total = await bookcategoryCollections.estimatedDocumentCount();
      res.send({total});

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
