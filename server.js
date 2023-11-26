import express, {json, request} from "express";
import cors from "cors";
var app = express();
app.use(cors(),express.json(),express.urlencoded({ extended: true }));
var server = app.listen(8080, function () {
    const host = server.address().address
    const port = server.address().port
    console.log("Example app listening at http://%s:%s", host, port)
})


import {MongoClient, ObjectId, ServerApiVersion} from "mongodb";
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
        const login=await query.find({_id: req.body.username,pass:req.body.pass}).project({ pass: 0}) .toArray();
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
        if(req.body._id===undefined||req.body.pass===undefined)
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
app.post('/game_check', async (req, res)=> {
    if(req.body._id===undefined)
        throw new Error("Body is empty");
    try {
        await client.connect();
        const query =client.db("sah").collection("games");
        const lastMove=await query.find({_id :new ObjectId(req.body._id)}).sort({_id:-1}).limit(1).project({last_move: 1}).toArray();
        console.log(lastMove);
        res.json(lastMove);
        res.end();

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
})
app.post('/game_start', async (req, res)=> {
    try {
        if(req.body.p1===undefined || req.body.p2===undefined)
            throw new Error("Body is empty");
        await client.connect();
        var game={p1:req.body.p1,p2:req.body.p2,moves:"",last_move:""};
        await client.db("sah").collection("games").insertOne(game,(err,res)=>{
            if(err)throw err;
        });
        console.log("igra!");
        res.send(game._id);
        res.end();

    } catch (e) {
        console.error(e);
        res.send({message:e.message})
    } finally {
        await client.close();
    }
})
app.post('/game_move', async (req, res)=> {
    try {
        if(req.body._id===undefined || req.body.move===undefined)
            throw new Error("Body is empty");
        await client.connect();
        const query =client.db("sah").collection("games");
        const gameInfo=await query.find({_id :new ObjectId(req.body._id)}).sort({_id:-1}).limit(1).project({last_move: 1,moves:1,_id:0}).toArray();
        let game={moves:gameInfo[0].moves+","+gameInfo[0].last_move,last_move:req.body.move};
        await client.db("sah").collection("games").updateOne({_id :new ObjectId(req.body._id)},{$set: game},(err,res)=>{
            if(err)throw err;
        });
        res.send("moved!");
        res.end();

    } catch (e) {
        console.error(e);
        res.send({message:e.message})
    } finally {
        await client.close();
    }
})
