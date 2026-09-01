import mysql from 'mysql'

const con =mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"8859574934",
    database:"employeems"
})

con.connect(function(err){
    if(err){
        console.log("Connection Error");
    }
    else{
        console.log("Connected");
    }
})

export default con;