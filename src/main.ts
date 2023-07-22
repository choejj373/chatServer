import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';

import 'dotenv/config'

const app = express();
const httpServer = http.createServer( app );
const io = new Server(httpServer,{
    cors:{
        origin:"http://localhost:3000",
        allowedHeaders: ["guildid"],
        credentials: true
    }
});


app.set('io', io);

// import { io } from "socket.io-client";

// const socket = io({
//   extraHeaders: {
//     "accessToken": "1234",
//      "guildI" : "111"
//   }
// });
import { token , TOKEN_EXPIRED, TOKEN_INVALID } from './modules/jwt.js'

//const guildChat = io.of('/gulidchat');

const socketMap = new Map();

io.of('/guildchat').on('connection', (socket)=>{

    // 메인 서버에서 길드 ID를 조회하여 채팅 서버에 접속해야 한다.
    // 대소문자 주의
    const guildId = socket.handshake.headers["guildid"];
    console.log(guildId);

    const accessToken = socket.handshake.auth.token;
    console.log(accessToken);

    // //await??
    const userInfo : any = token.verify( accessToken );

    if( userInfo == TOKEN_EXPIRED ){
        console.log("token expired")
        socket.disconnect();
        return;
    }
 
    if( userInfo == TOKEN_INVALID){
        console.log("token invalid")
        socket.disconnect();
        return;
    }

    if( userInfo.userId === undefined ){
         console.log("token payload invalid")
         socket.disconnect();
         return;
    }

    if( guildId === undefined ){
        socket.disconnect();
        return;
    }else{
        socket.join( guildId );
        socketMap.set( socket.id, guildId );
    }

    socket.on('disconnect',(reason)=>{
        console.log( reason );

        const roomId = socketMap.get( socket.id);
        console.log( roomId );
        socket.leave( roomId );
    });

    socket.on('chat', (arg)=>{
        console.log(arg);

        const roomId = socketMap.get( socket.id );
        console.log( roomId );
        io.of('/guildchat').to( roomId ).emit('chat', arg);
    })
})

const port = process.env.PORT ?? "3100";

httpServer.listen( port, () =>{
    console.log("서버 가동 : ", port);
});