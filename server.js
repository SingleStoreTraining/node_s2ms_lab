var express = require("express");
var session = require('express-session');
var mysql = require('mysql');

var app = express();

app.use(express.urlencoded());
app.use(session({secret: 'singlestore'}));

app.set('views', __dirname + '/views'); 
app.set('view engine', 'ejs');

var connection = mysql.createConnection({
    host     : 'get_host_string_from_portal',
    user     : 'admin',
    password : 'GoSingleStore1',
    database : 'singlespacedb'
});



app.get('/', function(req, res) {
    connection.query('SELECT * FROM users;', function (error, results) {
        console.log(results);
        res.render("index", {regerror: false, logerror: false});
    })
})



app.post('/register', function (req, res){
    // *** REGISTRATION 1 ***
    // Check Email To See If It Already Exists - Retrieve a User Using the Provided Email
    
    connection.query('SELECT * FROM users WHERE email = ?', [req.body.Email], function (error, results) {
        if(results.length === 0){
            if(!req.body.Email || !req.body.Password || !req.body.Username){
                var regerror = "Please complete all required fields!"
                res.render("index", {regerror: regerror, logerror: false});
            } else {
                if (req.body.Password != req.body.PasswordConfirmation){
                    var regerror = "Passwords do not match!"
                    res.render("index", {regerror: regerror, logerror: false});
                } else {
                    // *** REGISTRATION 2 ***
                    // Create the New User, Save the New User's ID in session before redirecting to the Dashboard
                    connection.query('INSERT INTO users (username, email, password) VALUES (?,?,?)', [req.body.Username, req.body.Email, req.body.Password] , function(error, results){
                        req.session.CurrUserId = results.insertId;
                        res.redirect("dashboard");
                    })
                }
            }
            
        } else {
            var regerror = "This email currently exists!"
            res.render("index", {regerror: regerror, logerror: false});
        }
    });
});


app.get("/dashboard", function (req, res){
    connection.query('SELECT * FROM users WHERE userId = ?', [req.session.CurrUserId], function (error, userRes) {
        connection.query('SELECT * FROM toDos WHERE userId = ?', [req.session.CurrUserId], function (error, todosRes) {
            res.render('dashboard', {user: userRes, alltoDos: todosRes});
        })
    })
})


app.get("/logout", function (req, res){
    req.session.destroy(function(err) {
        res.redirect("/");
      })
})


app.post('/login', function (req, res){
    // *** LOGIN ***
    // Retrieve user with email
    connection.query('SELECT * FROM users WHERE email = ?', [req.body.Email], function (error, results) {
        if(results.length === 0){
            var logerror = "This email has not been registered. Please register or try again!";
            res.render("index", {logerror: logerror, regerror: false});
        } else {
            if(results[0].password != [req.body.PwToCheck]){
                var logerror = "The password is incorrect - please try again!";
                res.render("index", {logerror: logerror, regerror: false});
            } else {
                req.session.CurrUserId = results[0].userId;
                res.redirect("dashboard");
            }
        }
    })
})


app.post('/addToDo', function (req, res){
    //*** CREATE TODO ***
    // Create New ToDo
    connection.query('INSERT INTO toDos (title, description, userId) VALUES (?,?,?);', [req.body.Title, req.body.Description, req.session.CurrUserId], function (error, results) {
        res.redirect("dashboard");
    })
})


app.get("/delete/:todoid", function (req, res){
    // *** DELETE TODO ***
    // Delete Todo
    connection.query('DELETE FROM toDos WHERE toDosId = ?', [req.params.todoid], function (error, results) {
        res.redirect("/dashboard");
    })
})


app.get("/edit/:todoid", function (req, res){
    // *** EDIT TODO ***
    // Edit Todo
    connection.query('SELECT * FROM toDos WHERE toDosId = ?', [req.params.todoid], function (error, results) {
        res.render("edit", {todo: results});
    })
})


app.post('/EditTodo', function (req, res){
    //*** EDIT TODO 2 ***
    // Update ToDo
    connection.query('UPDATE toDos SET title = ?, description = ? WHERE toDosId = ?;', [req.body.Title, req.body.Description, req.body.TodoId], function (error, results) {
        res.redirect("dashboard");
    })
})



app.listen(8000, function() {
    console.log("listening on port 8000");
})