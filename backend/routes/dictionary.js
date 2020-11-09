const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');
var yam = require('../yam');
const multer = require('multer');
const upload = multer({dest: './upload'});

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const request = require('request'); 
const { resolve } = require('path');
const { compileFunction } = require('vm');

const mysql = require('mysql');
const _secret = fs.readFileSync('./secret.txt','utf8').split(" ");
const db = mysql.createConnection({
    host:'localhost',
    user:_secret[0],
    password:_secret[1],
    database:'yam'
});
db.connect();

var dictionary = function(roomno, word, order) {//방 번호, 단어, 차례
    //api 주소로 마지막 ko부분을 바꾸면 다른 언어로 호환 가능
    let link = "https://api.dictionaryapi.dev/api/v2/entries/en/";
    let result = false; //정답여부

    //get방식으로 결과를 받고 2초이상 서버의 응답이 없을 경우 타임아웃 에러
    const options = {
        uri: link + word,
        method: "GET",
        timeout: 2000,
        followrRedirect: true,
        maxRedirects: 10,
    };
    
    function f(){
        return new Promise(resolve => {
            request(options,function(err,response,resultset){
                //에러 발생시
                if(err != null){

                }

                //meanings가 없으면 단어가 없는 것이므로 meanings를 찾는다
                let wexist = resultset.indexOf('meanings');
                if(wexist != -1) {
                    console.log("word is exist");
                    result = true;
                }
                else {
                    console.log("word is not exist");
                    result = false;
                }
                resolve(result);
            });
        })
    }

    f().then(function(result){
        console.log(result);
        if(result){
            //중복단어 테이블에 insert
            let sql = `INSERT INTO chatting VALUES(?,?)`;
            let li = [roomno, word];
            db.query(sql, li, (err) => {
                if(err) throw err;
            })
            
            //현재단어 바꾸기, 다음사람 턴 넘기기
            console.log('현재단어: '+yam.nowword[roomno]);
            yam.nowword[roomno] = word;
            let len = yam.roomuserlist[roomno].length;
            yam.roomuseridx[roomno] = (yam.roomuseridx[roomno] + 1) % len;
            console.log('다음단어: '+word);
            console.log('현재 턴: '+order);
            console.log('다음 턴: '+yam.roomuserlist[roomno][yam.roomuseridx[roomno]]);

            //정답 시 돌아가는 시간 중단
            if(yam.L[roomno].length != 0){
                clearInterval(yam.L[roomno][0]);
                yam.L[roomno].shift();
            }
            //맞춘 단어, 다음순서
            yam.io.to(roomno).emit('gameanswer',word, yam.roomuserlist[roomno][yam.roomuseridx[roomno]], 1);
            yam.io.to(roomno).emit('msg',{name:'System',message: '있음'});
            
            setTimeout(() => {
                //2초 쉬고 다시 시간
                yam.T(roomno);
            }, 2010);
        }
        else{
            yam.io.to(roomno).emit('gameanswer',yam.nowword[roomno], order, 0);
            yam.io.to(roomno).emit('msg',{name:'System',message: '없음'});
        }
    });
}
exports.dictionary=dictionary;