const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6hyeg.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}

async function run() {
    try {
        const productCollection = client.db('cam-sec').collection('products');
        const userCollection = client.db('cam-sec').collection('users');
        const ordersCollection = client.db('cam-sec').collection('orders');

        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            res.send(result);
        })
        app.get('/orders',verifyJWT,  async (req, res) => {
            const email = req.query.email;
            
            const decodedEmail = req.decoded.email;
            if(email !== decodedEmail){
                return res.status(403).send({message: 'Forbidden Access'})
            }
            const query = { email: email };
            const orders = await ordersCollection.find(query).toArray();
            console.log(orders);
            res.send(orders)
        })

        // app.get('/orders/:id', async (req, res) => {
        //     const id = req.params.id;
        //     console.log(id);
        //     const query = { _id: ObjectId(id) };
        //     const order = await ordersCollection.findOne(query);
        //     res.send(order);
        // })
        app.get('/products', async (req, res) => {
            const query = {};
            const products = await productCollection.find(query).toArray();
            res.send(products);
        });
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const product = await productCollection.findOne(query);
            res.send(product);
        });

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const user = await userCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '7d' });
                return res.send({ accessToken: token })
            }
            res.status(403).send({ Token: "" })
        })
         //   Get all user data from database
        app.get('/users', async(req, res) => {
            const query = {};
            const users = await userCollection.find(query).toArray();
            res.send(users)
        })
          //  Store user data
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user);
            res.send(result);
        })

        //  Make Admin
        app.put('/users/admin/:id', verifyJWT, async(req, res) => {
            const decodedEmail = req.decoded.email;
            const query = {email : decodedEmail};
            const user = await userCollection.findOne(query);
            if(user?.role !== 'admin'){
                return res.status(403).send({message: `you can't make any admin.It is a forbidden access`})
            }
            const id = req.params.id;
            const filter = {_id : ObjectId(id)};
            const options = {upsert: true}
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc, options);
            res.send(result)
        })
    }
    finally {

    }
}

run().catch(console.log())

app.get('/', (req, res) => {
    res.send("Cam-sec server successfully running")
})

app.listen(port, () => {
    console.log("Server running on", port);
})