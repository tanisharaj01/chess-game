//initialization
const express = require('express');
const http = require('http');
const socket = require('socket.io');
const path = require('path');
const {Chess}=require('chess.js');

const app = express(); //create express app instance
const server = http.createServer(app); //initialise http server with react app
const io = socket(server);//socket io requires an http server which is based on express app

const chess=new Chess(); //initialize new chess game . this is an instance of chess.js
let players={}; //object to store players
let currentPlayer="w"; //player which will come first will be white
app.get('/',(req,res)=>{
    res.render('index',{title:"chess game"});
})

app.set("view engine","ejs");

app.use(express.static(path.join(__dirname, 'public'))); // Serve static files
//we will be able to access all static files in public folder


io.on('connection', (uniquesocket) => {
    console.log('A user connected:', uniquesocket.id);

    if(!players.white){
        players.white=uniquesocket.id;
        uniquesocket.emit("playerRole","w");
    }
    else if(!players.black){
        players.black=uniquesocket.id;
        uniquesocket.emit("playerRole","b");
    }
    else{
        uniquesocket.emit("spectatorRole");
    }
    uniquesocket.on('disconnect',function(){
        if(uniquesocket.id===players.white){
            delete players.white;
        }
        else if(uniquesocket.id===players.black){
            delete players.black;
        }
    })
    //for moving pieces
    uniquesocket.on("move",(move)=>{
        try{
            //to check if correct color is moving
            if(chess.turn()==="w" && uniquesocket.id!==players.white)return; //if it is turn of white but white is not moved then return to original position
            if(chess.turn()==="b" && uniquesocket.id!==players.black)return;

            //to check if move is valid
            const result=chess.move(move); 
            if(result){
                currentPlayer=chess.turn();
                io.emit("move",move);
                io.emit("boardState",chess.fen()); //this will send the current state of board to all players(frontend)
            }
            else{
                console.log("invalid move",move);
                uniquesocket.emit("invalid Move:",move);
            }

        }
        catch(err){
            console.log(err);
            uniquesocket.emit("invalid Move:",move);

        }
    })
   });


const PORT = 9000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
