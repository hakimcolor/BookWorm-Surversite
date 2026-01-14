
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;
const { ObjectId } = require('mongodb');
app.use(
  cors({
    origin: ['https://bookwarmhakimcolor.netlify.app'],
    credentials: true,
  })
);

app.use(express.json());

// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wcellxl.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();
    console.log('✅ MongoDB Connected');

    const database = client.db('JoBTask');
    const userCollection = database.collection('user');
    const bookCollection = database.collection('book');

    // --- USER APIs ---
    app.post('/users', async (req, res) => {
      try {
        const user = req.body;
        if (!user?.email)
          return res.status(400).send({ message: 'Email required' });

        const existingUser = await userCollection.findOne({
          email: user.email,
        });
        if (existingUser) {
          return res.send({
            success: true,
            message: 'User already exists',
            user: existingUser,
          });
        }

        const result = await userCollection.insertOne(user);
        res.send({ success: true, message: 'User saved to MongoDB', result });
      } catch (error) {
        console.error('MongoDB POST error:', error);
        res.status(500).send({ message: 'Server error' });
      }
    });

    app.get('/role/:email', async (req, res) => {
      try {
        const email = req.params.email;
        if (!email)
          return res.status(400).send({ message: 'Email is required' });

        const user = await userCollection.findOne({ email });
        if (!user) {
          return res
            .status(404)
            .send({ success: false, message: 'User not found' });
        }

        const role = user.role || 'user';
        res.send({
          success: true,
          email: user.email,
          role,
        });
      } catch (error) {
        console.error('MongoDB GET role error:', error);
        res.status(500).send({ success: false, message: 'Server error' });
      }
    });
    // Add new book
    app.post('/books', async (req, res) => {
      try {
        const book = req.body;

        // Basic validation
        if (!book?.name || !book?.image || !book?.pages) {
          return res.status(400).send({
            success: false,
            message: 'Book name, image, and pages are required',
          });
        }

        const result = await bookCollection.insertOne(book);
        res.send({
          success: true,
          message: 'Book added to MongoDB',
          result,
        });
      } catch (error) {
        console.error('MongoDB POST /books error:', error);
        res.status(500).send({ success: false, message: 'Server error' });
      }
    });
    // Get all books
    app.get('/books', async (req, res) => {
      try {
        const books = await bookCollection.find({}).toArray(); 
        res.send(books); 
      } catch (error) {
        console.error('MongoDB GET /books error:', error);
        res.status(500).send({ success: false, message: 'Server error' });
      }
    });
    // Update a book by ID
    app.put('/books/:id', async (req, res) => {
      try {
        const bookId = req.params.id;
        const updatedData = req.body;

        if (!updatedData.name || !updatedData.pages) {
          return res.status(400).send({
            success: false,
            message: 'Book name and pages are required',
          });
        }

        const result = await bookCollection.updateOne(
          { _id: new ObjectId(bookId) }, 
          { $set: updatedData }
        );

        if (result.modifiedCount > 0) {
          res.send({ success: true, message: 'Book updated successfully' });
        } else {
          res.send({
            success: false,
            message: 'No changes made or book not found',
          });
        }
      } catch (error) {
        console.error('MongoDB PUT /books/:id error:', error);
        res.status(500).send({ success: false, message: 'Server error' });
      }
    });

    // Delete a book by ID
    app.delete('/books/:id', async (req, res) => {
      try {
        const bookId = req.params.id;

        const result = await bookCollection.deleteOne({
          _id: new ObjectId(bookId), 
        });

        if (result.deletedCount > 0) {
          res.send({ success: true, message: 'Book deleted successfully' });
        } else {
          res.send({ success: false, message: 'Book not found' });
        }
      } catch (error) {
        console.error('MongoDB DELETE /books/:id error:', error);
        res.status(500).send({ success: false, message: 'Server error' });
      }
    });
  } finally {
    // MongoDB connection stays live
  }
}

run().catch(console.dir);

app.get('/', (req, res) => res.send('🚀 Server running'));

app.listen(port, () =>
  console.log(`🔥 Server running on http://localhost:${port}`)
);
