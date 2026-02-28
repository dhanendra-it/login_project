const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
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
});

module.exports = mongoose.models.user || mongoose.model("user", userSchema);