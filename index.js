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

async function run(){
    try{
        const productCollection = client.db('cam-sec').collection('products');
        const userCollection = client.db('cam-sec').collection('users');
        app.get('/products', async(req, res) => {
            const query = {};
            const products = await productCollection.find(query).toArray();
            res.send(products);
        });
        app.get('/products/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)}
            const product = await productCollection.findOne(query);
            res.send(product);
        });

        app.get('/jwt', async(req, res) => {
            const email = req.query.email;
            const query = {email:email}
            const user = await userCollection.findOne(query);
            if(user){
                const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn: '1h'});
                return res.send({accessToken: token})
            }
            res.status(403).send({Token: ""})
        })
        //  Store user data
        app.post('/users', async(req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user);
            res.send(result);
        })
    }
    finally{

    }
}

run().catch(console.log())

app.get('/', (req, res) => {
    res.send("Cam-sec server successfully running")
})

app.listen(port, () => {
    console.log("Server running on", port);
})