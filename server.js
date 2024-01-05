import express, {json, request} from "express";
import cors from "cors";
import {MongoClient, ObjectId, ServerApiVersion} from "mongodb";
import {getUri} from './module.mjs';
import axios from "axios";

var app = express();
app.use(cors(),express.json(),express.urlencoded({ extended: true }));

var server = app.listen(8080, function () {
    const host = server.address().address
    const port = server.address().port
    console.log("Example app listening at http://%s:%s", host, port)
})



// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(getUri(), {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

app.post('/user_edit', async (req, res)=> {
    try {
        if(req.body.user===undefined||req.body.change===undefined||req.body.to===undefined)
            throw new Error("Body is empty");
        await client.connect();
        await client.db("sah").collection("users").updateOne({_id: req.body.user},{ $set: { [req.body.change]: req.body.to}},(err,res)=>{
            if(err)throw err;
        });
        console.log("spremenjeno");
        res.json("spremenjeno");
        res.end();

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
})

app.post('/users', async (req, res)=> {
    try {
        await client.connect();
        const query =client.db("sah").collection("users");
        const users=await query.find(req.body).project({ pass: 0}).toArray();
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
        const login=await query.find({_id: req.body._id,pass:req.body.pass}).project({ pass: 0}) .toArray();
        console.log(login);
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
        if(req.body.user===undefined||req.body.pass===undefined)
            throw new Error("Body is empty");
        await client.connect();
        await client.db("sah").collection("users").insertOne({_id: req.body.user,pass:req.body.pass},(err,res)=>{
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
async function getStockfishMove(fen,AI){
    var move= await axios.get("https://stockfish.online/api/stockfish.php?fen="+fen+"&depth="+AI+"&mode=bestmove")
        .catch(err => console.log(err))
    move=move.data;
    if(!move.success)
        throw "fen error";
    move=move.data;
    return move.substring(move.search("bestmove")+9,move.search("ponder")-1);

}

app.post('/game_move_stockfish', async (req, res)=> {
    try {
        if(req.body._id===undefined || req.body.move===undefined || req.body.fen===undefined||req.body.AI===undefined)
            throw new Error("Body is empty");
        let move=await getStockfishMove(req.body.fen,req.body.AI);
        await client.connect();
        const query =client.db("sah").collection("games");
        await client.db("sah").collection("games").updateOne({_id :new ObjectId(req.body._id)},{$set: {last_move:req.body.move},$push:{states:req.body.fen}},(err,res)=>{
            if(err)throw err;
        });
        console.log(move);
        res.send(move);
        res.end();

    } catch (e) {
        console.error(e);
        res.send({message:e.message})
    } finally {
        await client.close();
    }
})


app.post('/game_check', async (req, res)=> {

    try {
        if(req.body.game_id===undefined)
            throw new Error("Body is empty");

        await client.connect();
        const query =client.db("sah").collection("games");
        const lastMove=await query.find({_id :new ObjectId(req.body.game_id)}).project({_id: 0,last_move:1}).toArray();
        console.log(lastMove[0].last_move);
        res.json(lastMove[0].last_move);
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
        var AI=req.body.AI;
        var gameType=req.body.gameType;
        var fen=req.body.fen;
        if(AI===undefined)
            AI=0;
        if(gameType===undefined)
             gameType=0;
        if(fen===undefined)
            fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        await client.connect();
        var game={p1:req.body.p1,p2:req.body.p2,gameType:gameType,AI:AI,states:[fen],last_move:""};
        await client.db("sah").collection("games").insertOne(game,(err,res)=>{
            if(err)throw err;
        });
        console.log("igra",game._id);
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
        if(req.body._id===undefined || req.body.move===undefined||req.body.fen===undefined)
            throw new Error("Body is empty");
        await client.connect();
        const query =client.db("sah").collection("games");
        await client.db("sah").collection("games").updateOne({_id :new ObjectId(req.body._id)},{$set: {last_move:req.body.move},$push:{states:req.body.fen}},(err,res)=>{
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

app.post('/gamelist', async (req, res)=> {
    try {
        await client.connect();
        const query =client.db("sah").collection("gamelist");
        const gamelist=await query.find().project({ _id:0}).toArray();
        console.log("gamelist");
        res.json(gamelist);
        res.end();

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
})

app.post('/gamelist_add', async (req, res)=> {
    try {
        if(req.body.game_id===undefined)
            throw new Error("Game id missing");
        await client.connect();
        await client.db("sah").collection("gamelist").insertOne({game_id:req.body.game_id},(err,res)=>{
            if(err)throw err;
        });
        console.log("game dodana!");
        res.send({message:"game dodana!"});
        res.end();

    } catch (e) {
        console.error(e);
        res.send({message:e.message})
    } finally {
        await client.close();
    }
})

app.post('/gamelist_remove', async (req, res)=> {
    try {
        if(req.body.game_id===undefined)
            throw new Error("Game id missing");
        console.log(req.body.game_id);
        await client.connect();
        await client.db("sah").collection("gamelist").deleteOne({game_id:req.body.game_id},(err,res)=>{
            if(err)throw err;
        });
        console.log("game izbrisan!");
        res.send({message:"game izbrisan!"});
        res.end();

    } catch (e) {
        console.error(e);
        res.send({message:e.message})
    } finally {
        await client.close();
    }
})
