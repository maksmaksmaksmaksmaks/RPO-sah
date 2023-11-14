import express, {json, request} from "express";
import cors from "cors";
var app = express();
app.use(cors(),bodyParser.json());
var server = app.listen(8080, function () {
    const host = server.address().address
    const port = server.address().port
    console.log("Example app listening at http://%s:%s", host, port)
})


import {MongoClient, ServerApiVersion} from "mongodb";
import {getUri} from './module.mjs';
import * as bodyParser from "express";
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
        console.log(req.body);

        //console.log("users",users);
        res.json(users);
        res.end();

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
})


