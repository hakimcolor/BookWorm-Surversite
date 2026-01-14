const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
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
    await client.connect();
    console.log('✅ MongoDB Connected');

    const database = client.db('JoBTask');
    const userCollection = database.collection('user');

    // নতুন ইউজার যোগ করার API
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
    // API to check user role
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

        // Assuming each user document has a "role" field: "admin" or "user"
        const role = user.role || 'user'; // default role = 'user'

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
  } finally {
    // MongoDB connection live রাখতে চাইলে এখানে কিছু বন্ধ না কর
  }
}

run().catch(console.dir);

app.get('/', (req, res) => res.send('🚀 Server running'));

app.listen(port, () =>
  console.log(`🔥 Server running on http://localhost:${port}`)
);
