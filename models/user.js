const mongoose = require("mongoose");

mongoose.connect(`mongodb://127.0.0.1:27017/project1`);

const userSchema = mongoose.Schema({
    name: String,
    email: String,
    password: String,
    age: String,
    profile: {
        type: String,
        default: "default.webp"
    },
    post:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "post",
    }]
})

module.exports = mongoose.model("user" , userSchema);