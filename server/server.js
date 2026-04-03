const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server,{
  cors:{origin:"*"}
});

const weapons={
  pistol:{damage:20, range:10},
  rifle:{damage:10, range:15}
};

let players={};

function distance(a,b){
  return Math.sqrt(
    (a.x-b.x)**2 +
    (a.y-b.y)**2 +
    (a.z-b.z)**2
  );
}

function respawn(p){
  p.health=100;
  p.x=Math.random()*20-10;
  p.z=Math.random()*20-10;
}

io.on("connection", socket=>{

  players[socket.id]={
    id:socket.id,
    x:Math.random()*10,
    y:1.6,
    z:Math.random()*10,
    health:100
  };

  socket.on("move", data=>{
    let p=players[socket.id];
    if(!p) return;

    p.x=data.x;
    p.y=data.y;
    p.z=data.z;
  });

  socket.on("shoot", data=>{
    let shooter=players[socket.id];
    if(!shooter) return;

    let w=weapons[data.weapon];
    if(!w) return;

    Object.values(players).forEach(target=>{
      if(target.id===socket.id) return;

      let dist=distance(shooter,target);

      if(dist<w.range){
        target.health-=w.damage;

        io.emit("damage",{
          id:target.id,
          amount:w.damage
        });

        if(target.health<=0){
          io.emit("killFeed",{
            killer:socket.id,
            victim:target.id
          });

          respawn(target);
        }
      }
    });
  });

  socket.on("disconnect",()=>{
    delete players[socket.id];
    io.emit("disconnectPlayer", socket.id);
  });

  setInterval(()=>{
    io.emit("state", players);
  },50);
});

server.listen(process.env.PORT || 3000);
