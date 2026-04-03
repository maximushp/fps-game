const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server,{
  cors:{origin:"*"}
});

const weapons={
  pistol:{damage:20, range:8},
  rifle:{damage:10, range:12}
};

let players={};

function distance(a,b){
  return Math.sqrt(
    (a.x-b.x)**2 +
    (a.y-b.y)**2 +
    (a.z-b.z)**2
  );
}

io.on("connection", socket=>{

  players[socket.id]={
    id:socket.id,
    x:Math.random()*10,
    y:1.6,
    z:Math.random()*10,
    health:100
  };

  socket.on("move",data=>{
    let p=players[socket.id];
    if(!p) return;

    p.x=data.x;
    p.y=data.y;
    p.z=data.z;
  });

  socket.on("shoot",data=>{
    let shooter=players[socket.id];
    if(!shooter) return;

    let w=weapons[data.weapon];
    if(!w) return;

    Object.values(players).forEach(target=>{
      if(target.id===socket.id) return;

      let dist=distance(shooter,target);

      if(dist<w.range){
        target.health -= w.damage;

        io.emit("damage",{
          id:target.id,
          amount:w.damage
        });

        if(target.health<=0){
          target.health=100;
          target.x=Math.random()*10;
          target.z=Math.random()*10;

          io.emit("kill",{
            killer:socket.id,
            victim:target.id
          });
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

const PORT = process.env.PORT || 3000;
server.listen(PORT);
