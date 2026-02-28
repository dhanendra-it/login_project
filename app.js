const express = require("express");
const app = express();
const userModel = require("./models/user")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")
const cookie_parser = require("cookie-parser");
const postSchema = require("./models/post");
const user = require("./models/user");
const path = require("path");
const multer = require("multer");
const upload = require("./models/profilePic");
const connectDB = require("./db");
connectDB();

app.set("view engine" , "ejs")
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookie_parser());
app.use(express.static(path.join(__dirname , "public")));



app.get("/" , (req,res)=>{
    res.render("index");
})

app.post("/create", async (req, res) => {
    let { name, email, password, age } = req.body;

    let existingUser = await userModel.findOne({ email });
    if (existingUser) {
        return res.send("User already has an account");
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    let newUser = await userModel.create({
        name,
        email,
        password: hash,
        age,
    });

    let token = jwt.sign(
        { email: email, userid: newUser._id },
        process.env.JWT_SECRET
    );

    res.cookie("token", token);
    res.redirect("/login");
});

app.get("/login" , (req,res) =>{
    res.render("login")
})

app.post("/login" , async (req,res)=>{

    let {email,password} = req.body;
    let user = await userModel.findOne({email}) 
    if(!user) res.send("something went wrong");

    bcrypt.compare(password , user.password, (err,result)=>{

        let token = jwt.sign({email: email , userid: user._id } , "shh")
            res.cookie("token" , token);

        if(err) res.send("something went wrong");  
        res.redirect("/profile"); 
    })

})
app.get("/logout", (req,res)=>{
    res.cookie("token" , "");
    res.redirect("/login")
})

app.get("/profile" , isLogIN , async (req,res)=>{
    let user = await userModel.findOne({email: req.user.email}).populate("post");
    res.render("profile" , {user})
})
app.get("/profile/delete/:id" , isLogIN , async (req,res)=>{
    await postSchema.findOneAndDelete({_id : req.params.id });
    res.redirect("/profile")
})
app.get("/profile/like/:id" , isLogIN , async (req,res)=>{
    let post = await postSchema.findOne({_id : req.params.id });
    if( post.like.indexOf(req.user.userid) === -1){
    post.like.push(req.user.userid);
    }
    else{
        post.like.splice(post.like.indexOf(req.user.userid), 1);
    }
    await post.save();
    res.redirect("/profile")
})
app.get("/profile/edit/:id" , isLogIN , async (req,res)=>{
    let post = await postSchema.findOne({_id : req.params.id });

    res.render("edit" , {post})
})
app.post("/update/posts" , isLogIN , async (req,res)=>{
    await postSchema.findOneAndUpdate({user : req.user.userid } , {content : req.body.newContent } , {new: true}); 
    res.redirect("/profile");
})

app.post("/posts", isLogIN , async (req,res)=>{
    let {content} = req.body;
    let user = await userModel.findOne({email: req.user.email}) 
    let post =  await postSchema.create({
        user: user._id,
        content,
    })
    user.post.push(post._id);
    await user.save();
    res.redirect("/profile")
})

app.get("/edit/profile/:id", isLogIN, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email });
    res.render("profilePic", { user });
});

app.post("/upload", isLogIN , upload.single("image"), async (req, res) => {

    await userModel.findOneAndUpdate({email: req.user.email} , {profile: req.file.filename } , {new: true});  
   res.redirect("/profile");
});

function isLogIN(req,res,next){
    if(req.cookies.token === "") res.redirect('/login');
    else{
        let data = jwt.verify(req.cookies.token, "shh");
        req.user = data;
        next();
    }
}

module.exports = app;