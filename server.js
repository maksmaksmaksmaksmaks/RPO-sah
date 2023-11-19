import express, {json, request} from "express";
import cors from "cors";
var app = express();
app.use(cors(),express.json(),express.urlencoded({ extended: true }));
var server = app.listen(8080, function () {
    const host = server.address().address
    const port = server.address().port
    console.log("Example app listening at http://%s:%s", host, port)
})


import {MongoClient, ServerApiVersion} from "mongodb";
import {getUri} from './module.mjs';
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(getUri(), {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

app.post('/users', async (req, res)=> {
    try {
        await client.connect();
        const query =client.db("sah").collection("users");
        const users=await query.find(req.body).toArray();
        console.log("users",users);
        res.json(users);
        res.end();

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
})
app.post('/login', async (req, res)=> {
    try {
        await client.connect();
        const query =client.db("sah").collection("users");
        const login=await query.find(req.body).project({ pass: 0}) .toArray();
        console.log("users",login);
        res.json(login);
        res.end();

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
})

app.post('/register', async (req, res)=> {
    try {
        if(req.body._id===undefined)
            throw new Error("Body is empty");
        await client.connect();
        await client.db("sah").collection("users").insertOne(req.body,(err,res)=>{
            if(err)throw err;
        });
        console.log("uporabnik dodan!");
        res.send({message:"uporabnik dodan!"});
        res.end();

    } catch (e) {
        console.error(e);
        res.send({message:e.message})
    } finally {
        await client.close();
    }
})


